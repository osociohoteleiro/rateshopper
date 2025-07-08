import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { Hotel, Tarifa, ImportacaoLog } from '../models';
import { IUploadResult, IApiResponse, IDadosExcel } from '../types';

const router = Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xlsx, .xls) são permitidos'));
    }
  }
});

/**
 * POST /api/upload/planilha
 * Upload e processamento de planilha de tarifas
 */
router.post('/planilha', upload.single('arquivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
    }

    const { hotel_id } = req.body;
    
    if (!hotel_id) {
      // Remover arquivo se hotel_id não foi fornecido
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'ID do hotel é obrigatório'
      });
    }

    // Verificar se hotel existe
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }

    // Criar log de importação
    const logImportacao = await ImportacaoLog.create({
      hotel_id: parseInt(hotel_id),
      arquivo_nome: req.file.originalname,
      total_registros: 0,
      registros_sucesso: 0,
      registros_erro: 0,
      status: 'processando'
    });

    try {
      // Ler arquivo Excel
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const dadosExcel: IDadosExcel[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
      }).slice(1) // Pular cabeçalho
      .map((row: unknown) => {
        const r = row as any[];
        return {
          data_checkin: r[0],
          data_checkout: r[1],
          preco: r[2],
          canal: r[3] || 'Booking.com',
          tipo_quarto: r[4] || 'Standard'
        };
      })
      .filter(row => row.data_checkin && row.data_checkout && row.preco); // Filtrar linhas vazias

      const totalRegistros = dadosExcel.length;
      let registrosSucesso = 0;
      let registrosErro = 0;
      const erros: string[] = [];

      // Processar cada linha
      for (let i = 0; i < dadosExcel.length; i++) {
        try {
          const linha = dadosExcel[i];
          
          // Validar e converter datas
          const dataCheckin = new Date(linha.data_checkin);
          const dataCheckout = new Date(linha.data_checkout);
          
          if (isNaN(dataCheckin.getTime()) || isNaN(dataCheckout.getTime())) {
            throw new Error(`Linha ${i + 2}: Datas inválidas`);
          }
          
          if (dataCheckout <= dataCheckin) {
            throw new Error(`Linha ${i + 2}: Data de checkout deve ser posterior à data de checkin`);
          }
          
          // Validar preço
          const preco = parseFloat(linha.preco.toString().replace(',', '.'));
          if (isNaN(preco) || preco < 0) {
            throw new Error(`Linha ${i + 2}: Preço inválido`);
          }
          
          // Criar tarifa
          await Tarifa.create({
            hotel_id: parseInt(hotel_id),
            data_checkin: dataCheckin,
            data_checkout: dataCheckout,
            preco: preco,
            moeda: 'BRL',
            canal: linha.canal || 'Booking.com',
            tipo_quarto: linha.tipo_quarto || 'Standard'
          });
          
          registrosSucesso++;
        } catch (error) {
          registrosErro++;
          erros.push((error as Error).message);
        }
      }

      // Atualizar log de importação
      const status = registrosErro === 0 ? 'sucesso' : 
                   registrosSucesso === 0 ? 'erro' : 'sucesso_com_erros';

      await logImportacao.update({
        total_registros: totalRegistros,
        registros_sucesso: registrosSucesso,
        registros_erro: registrosErro,
        status: status
      });

      // Remover arquivo após processamento
      fs.unlinkSync(req.file.path);

      const resultado: IUploadResult = {
        success: registrosSucesso > 0,
        message: `Processamento concluído. ${registrosSucesso} registros importados com sucesso, ${registrosErro} com erro.`,
        total_registros: totalRegistros,
        registros_sucesso: registrosSucesso,
        registros_erro: registrosErro,
        erros: erros.slice(0, 10) // Limitar a 10 erros para não sobrecarregar a resposta
      };

      const response: IApiResponse<IUploadResult> = {
        success: true,
        data: resultado
      };

      res.json(response);
    } catch (error) {
      // Atualizar log com erro
      await logImportacao.update({
        status: 'erro'
      });

      // Remover arquivo em caso de erro
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      throw error;
    }
  } catch (error) {
    console.error('Erro no upload:', error);
    
    // Remover arquivo se ainda existir
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/upload/modelo
 * Download do modelo de planilha Excel
 */
router.get('/modelo', (req: Request, res: Response) => {
  try {
    // Criar dados de exemplo
    const dadosExemplo = [
      ['Data Check-in', 'Data Check-out', 'Preço', 'Canal', 'Tipo de Quarto'],
      ['2024-01-15', '2024-01-17', '250.00', 'Booking.com', 'Standard'],
      ['2024-01-20', '2024-01-22', '280.50', 'Expedia', 'Deluxe'],
      ['2024-01-25', '2024-01-27', '320.00', 'Airbnb', 'Suite']
    ];

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(dadosExemplo);
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarifas');
    
    // Gerar buffer do arquivo
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Configurar headers para download
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_tarifas.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao gerar modelo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar modelo de planilha'
    });
  }
});

/**
 * GET /api/upload/logs
 * Lista logs de importação
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 10;
    const offset = (page - 1) * perPage;

    const { count, rows } = await ImportacaoLog.findAndCountAll({
      limit: perPage,
      offset: offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'nome']
      }]
    });

    const response: IApiResponse = {
      success: true,
      data: {
        logs: rows,
        pagination: {
          page,
          per_page: perPage,
          total: count,
          pages: Math.ceil(count / perPage)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;

