const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { Hotel, Tarifa, ImportacaoLog } = require('../models');

// Configuração do upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Aceitar qualquer arquivo com extensão .xlsx ou .xls
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      return cb(null, true);
    }
    
    cb(new Error('Apenas arquivos Excel (.xlsx, .xls) são permitidos'));
  }
});

// Download do modelo de planilha
router.get('/modelo', (req, res) => {
  try {
    // Criar um novo workbook
    const wb = xlsx.utils.book_new();
    
    // Criar dados de exemplo (formato simples: data_checkin, data_checkout, preco)
    const exampleData = [
      ['17/06/2025', '18/06/2025', '174,15'],
      ['18/06/2025', '19/06/2025', '174,15'],
      ['19/06/2025', '20/06/2025', '306,99'],
      ['20/06/2025', '21/06/2025', '306,99'],
      ['21/06/2025', '22/06/2025', '240,57']
    ];
    
    // Criar a planilha com os dados de exemplo
    const ws = xlsx.utils.aoa_to_sheet(exampleData);
    
    // Adicionar a planilha ao workbook
    xlsx.utils.book_append_sheet(wb, ws, 'Prices');
    
    // Criar diretório temporário se não existir
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Caminho do arquivo
    const filePath = path.join(tempDir, 'modelo_tarifas.xlsx');
    
    // Escrever o arquivo
    xlsx.writeFile(wb, filePath);
    
    // Enviar o arquivo
    res.download(filePath, 'modelo_tarifas.xlsx', (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
      }
      
      // Remover o arquivo temporário após o download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Erro ao remover arquivo temporário:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Erro ao gerar modelo de planilha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar modelo de planilha'
    });
  }
});

// Upload de planilha
router.post('/planilha', (req, res) => {
  // Usar o middleware multer diretamente na rota para melhor tratamento de erros
  upload.single('arquivo')(req, res, async function(err) {
    if (err) {
      console.error('Erro no upload do arquivo:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Erro no upload do arquivo'
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }
      
      const { hotel_id } = req.body;
      
      if (!hotel_id) {
        return res.status(400).json({
          success: false,
          error: 'Hotel ID é obrigatório'
        });
      }
      
      const hotel = await Hotel.findByPk(hotel_id);
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: 'Hotel não encontrado'
        });
      }
      
      // Criar log de importação
      const importacao = await ImportacaoLog.create({
        hotel_id: parseInt(hotel_id),
        arquivo: req.file.filename,
        status: 'processando'
      });
      
      // Processar planilha
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, {header: 1});
      
      if (!data || data.length === 0) {
        await importacao.update({
          status: 'erro',
          erro: 'Planilha vazia ou formato inválido'
        });
        
        return res.status(400).json({
          success: false,
          error: 'Planilha vazia ou formato inválido'
        });
      }
      
      // Validar e processar dados
      const tarifas = [];
      const erros = [];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Verificar se a linha tem pelo menos 3 colunas (data_checkin, data_checkout, preco)
        if (!row || row.length < 3 || !row[0] || !row[1] || !row[2]) {
          erros.push(`Linha ${i + 1}: Formato inválido. Esperado: data_checkin, data_checkout, preco`);
          continue;
        }
        
        let dataCheckin = row[0];
        let dataCheckout = row[1];
        let preco = row[2];
        
        // Converter preço se estiver em formato de string com vírgula
        if (typeof preco === 'string') {
          preco = preco.replace(',', '.');
        }
        
        // Converter datas para o formato ISO se necessário
        if (typeof dataCheckin === 'string' && dataCheckin.includes('/')) {
          const parts = dataCheckin.split('/');
          if (parts.length === 3) {
            dataCheckin = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        
        if (typeof dataCheckout === 'string' && dataCheckout.includes('/')) {
          const parts = dataCheckout.split('/');
          if (parts.length === 3) {
            dataCheckout = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        
        // Adicionar à lista de tarifas
        tarifas.push({
          hotel_id: parseInt(hotel_id),
          data_checkin: dataCheckin,
          data_checkout: dataCheckout,
          preco: parseFloat(preco),
          moeda: 'BRL'
        });
      }
      
      // Salvar tarifas no banco
      if (tarifas.length > 0) {
        await Tarifa.bulkCreate(tarifas);
        
        // Atualizar log de importação
        await importacao.update({
          registros_importados: tarifas.length,
          status: erros.length > 0 ? 'parcial' : 'sucesso',
          erro: erros.length > 0 ? JSON.stringify(erros) : null
        });
        
        res.json({
          success: true,
          data: {
            total_registros: data.length,
            registros_sucesso: tarifas.length,
            registros_erro: erros.length,
            importacao_id: importacao.id,
            arquivo: req.file.filename,
            erros: erros
          }
        });
      } else {
        await importacao.update({
          status: 'erro',
          erro: 'Nenhum registro válido encontrado'
        });
        
        res.status(400).json({
          success: false,
          error: 'Nenhum registro válido encontrado',
          erros
        });
      }
    } catch (error) {
      console.error('Erro no upload de planilha:', error);
      
      // Atualizar log de importação em caso de erro
      if (req.file && req.body.hotel_id) {
        try {
          const importacao = await ImportacaoLog.findOne({
            where: {
              hotel_id: parseInt(req.body.hotel_id),
              arquivo: req.file.filename
            },
            order: [['createdAt', 'DESC']]
          });
          
          if (importacao) {
            await importacao.update({
              status: 'erro',
              erro: error.message
            });
          }
        } catch (logError) {
          console.error('Erro ao atualizar log de importação:', logError);
        }
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor: ' + error.message
      });
    }
  });
});

// Upload de dados via JSON
router.post('/', async (req, res) => {
  try {
    const { hotel_id, dados } = req.body;
    
    if (!hotel_id || !dados || !Array.isArray(dados)) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID e dados são obrigatórios'
      });
    }
    
    const hotel = await Hotel.findByPk(hotel_id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    // Criar log de importação
    const importacao = await ImportacaoLog.create({
      hotel_id: parseInt(hotel_id),
      arquivo: 'importacao-json',
      status: 'processando'
    });
    
    // Validar e processar dados
    const tarifas = [];
    const erros = [];
    
    for (let i = 0; i < dados.length; i++) {
      const item = dados[i];
      
      // Verificar campos obrigatórios
      if (!item.data_checkin || !item.data_checkout || !item.preco) {
        erros.push(`Item ${i + 1}: Campos obrigatórios ausentes`);
        continue;
      }
      
      // Adicionar à lista de tarifas
      tarifas.push({
        hotel_id: parseInt(hotel_id),
        data_checkin: item.data_checkin,
        data_checkout: item.data_checkout,
        preco: parseFloat(item.preco),
        moeda: item.moeda || 'BRL'
      });
    }
    
    // Salvar tarifas no banco
    if (tarifas.length > 0) {
      await Tarifa.bulkCreate(tarifas);
      
      // Atualizar log de importação
      await importacao.update({
        registros_importados: tarifas.length,
        status: erros.length > 0 ? 'parcial' : 'sucesso',
        erro: erros.length > 0 ? JSON.stringify(erros) : null
      });
      
      res.json({
        success: true,
        data: {
          registros_importados: tarifas.length,
          erros: erros.length,
          importacao_id: importacao.id
        }
      });
    } else {
      await importacao.update({
        status: 'erro',
        erro: 'Nenhum registro válido encontrado'
      });
      
      res.status(400).json({
        success: false,
        error: 'Nenhum registro válido encontrado',
        erros
      });
    }
  } catch (error) {
    console.error('Erro no upload de dados:', error);
    
    // Atualizar log de importação em caso de erro
    if (req.body.hotel_id) {
      try {
        const importacao = await ImportacaoLog.findOne({
          where: {
            hotel_id: parseInt(req.body.hotel_id),
            arquivo: 'importacao-json'
          },
          order: [['createdAt', 'DESC']]
        });
        
        if (importacao) {
          await importacao.update({
            status: 'erro',
            erro: error.message
          });
        }
      } catch (logError) {
        console.error('Erro ao atualizar log de importação:', logError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

