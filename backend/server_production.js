const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const { testConnection, executeQuery, initializeTables } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações de segurança para produção
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Configuração de CORS para produção
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://rate-shopper.d32pnk.easypanel.host', 'https://rateshopper.osociohoteleiro.com.br']
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging para produção
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use apenas Excel (.xlsx) ou CSV.'));
    }
  }
});

// Variável para controlar se o banco está disponível
let dbAvailable = false;

// Inicializar banco de dados
async function initializeDatabase() {
  console.log('🔄 Inicializando conexão com banco de dados...');
  
  try {
    const connected = await testConnection();
    if (connected) {
      const tablesCreated = await initializeTables();
      if (tablesCreated) {
        dbAvailable = true;
        console.log('✅ Banco de dados inicializado com sucesso');
        return true;
      }
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
  }
  
  console.log('⚠️  Banco de dados não disponível, usando dados em memória');
  dbAvailable = false;
  return false;
}

// Arrays em memória como fallback
let hoteis = [
  { id: 1, nome: 'Eco Encanto Pousada', url_booking: 'https://www.booking.com/hotel/br/eco-encanto-pousada.html', localizacao: 'Ubatuba', ativo: true, concorrentes: ['Pousada Vila Da Lagoa', 'Chalés Mirante da Lagoinha'] },
  { id: 2, nome: 'Pousada Vila Da Lagoa', url_booking: 'https://www.booking.com/hotel/br/pousada-vila-da-lagoa.html', localizacao: 'Ubatuba', ativo: true, concorrentes: [] },
  { id: 3, nome: 'Chalés Mirante da Lagoinha', url_booking: 'https://www.booking.com/hotel/br/chales-mirante-da-lagoinha.html', localizacao: 'Ubatuba', ativo: true, concorrentes: [] },
  { id: 4, nome: 'Pousada Ilha da Vitória', url_booking: 'https://www.booking.com/hotel/br/pousada-ilha-da-vitoria.html', localizacao: 'Ubatuba', ativo: true, concorrentes: [] }
];

let tarifas = [];
let planilhasImportadas = [];

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro:', err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
};

// Health check endpoint
app.get('/api/status', async (req, res) => {
  try {
    const dbStatus = dbAvailable ? 'connected' : 'memory_fallback';
    
    res.json({
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.get('/api/hoteis', async (req, res) => {
  try {
    if (dbAvailable) {
      const result = await executeQuery('SELECT * FROM hoteis WHERE ativo = 1 ORDER BY nome');
      res.json({ success: true, data: result });
    } else {
      res.json({ success: true, data: hoteis.filter(h => h.ativo) });
    }
  } catch (error) {
    console.error('Erro ao buscar hotéis:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar hotéis' });
  }
});

app.post('/api/hotels', async (req, res) => {
  try {
    const { nome, url_booking, localizacao } = req.body;
    
    if (!nome || !localizacao) {
      return res.status(400).json({
        success: false,
        message: 'Nome e localização são obrigatórios'
      });
    }
    
    if (dbAvailable) {
      const result = await executeQuery(
        'INSERT INTO hoteis (nome, url_booking, localizacao, ativo) VALUES (?, ?, ?, 1)',
        [nome, url_booking || '', localizacao]
      );
      
      const novoHotel = {
        id: result.insertId,
        nome,
        url_booking: url_booking || '',
        localizacao,
        ativo: true
      };
      
      res.json({ success: true, data: novoHotel });
    } else {
      const novoId = Math.max(...hoteis.map(h => h.id), 0) + 1;
      const novoHotel = {
        id: novoId,
        nome,
        url_booking: url_booking || '',
        localizacao,
        ativo: true,
        concorrentes: []
      };
      
      hoteis.push(novoHotel);
      res.json({ success: true, data: novoHotel });
    }
  } catch (error) {
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar hotel' });
  }
});

// Rota para upload de planilhas
app.post('/api/upload', upload.single('planilha'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const { hotel_id } = req.body;
    
    if (!hotel_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do hotel é obrigatório'
      });
    }

    // Processar arquivo Excel
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let tarifasImportadas = 0;
    const planilhaId = Date.now().toString();

    // Processar cada linha da planilha
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.length < 3) continue;
      
      const [dataInicio, dataFim, preco] = row;
      
      if (!dataInicio || !dataFim || !preco) continue;
      
      // Converter data para formato YYYY-MM-DD
      let dataFormatada;
      if (typeof dataInicio === 'string' && dataInicio.includes('/')) {
        const [dia, mes, ano] = dataInicio.split('/');
        dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } else {
        continue;
      }
      
      // Converter preço
      let precoNumerico;
      if (typeof preco === 'string') {
        precoNumerico = parseFloat(preco.replace(',', '.'));
      } else {
        precoNumerico = parseFloat(preco);
      }
      
      if (isNaN(precoNumerico)) continue;

      // Salvar tarifa
      if (dbAvailable) {
        await executeQuery(
          'INSERT INTO tarifas (hotel_id, planilha_id, data, preco, tipo_quarto) VALUES (?, ?, ?, ?, ?)',
          [hotel_id, planilhaId, dataFormatada, precoNumerico, 'Standard']
        );
      } else {
        tarifas.push({
          id: Date.now() + Math.random(),
          hotel_id: parseInt(hotel_id),
          planilha_id: planilhaId,
          data: dataFormatada,
          preco: precoNumerico,
          tipo_quarto: 'Standard'
        });
      }
      
      tarifasImportadas++;
    }

    // Registrar planilha importada
    const planilhaInfo = {
      id: planilhaId,
      nome_arquivo: req.file.originalname,
      hotel_id: parseInt(hotel_id),
      data_importacao: new Date().toISOString(),
      tarifas_importadas: tarifasImportadas
    };

    if (dbAvailable) {
      await executeQuery(
        'INSERT INTO planilhas_importadas (id, nome_arquivo, hotel_id, data_importacao, tarifas_importadas) VALUES (?, ?, ?, ?, ?)',
        [planilhaId, req.file.originalname, hotel_id, new Date(), tarifasImportadas]
      );
    } else {
      planilhasImportadas.push(planilhaInfo);
    }

    // Remover arquivo temporário
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Arquivo ${req.file.originalname} processado com sucesso`,
      tarifasImportadas,
      planilha_id: planilhaId
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    
    // Remover arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao processar arquivo: ' + error.message
    });
  }
});

// Rota para listar planilhas
app.get('/api/planilhas', async (req, res) => {
  try {
    if (dbAvailable) {
      const result = await executeQuery(`
        SELECT p.*, h.nome as hotel_nome 
        FROM planilhas_importadas p 
        LEFT JOIN hoteis h ON p.hotel_id = h.id 
        ORDER BY p.data_importacao DESC
      `);
      res.json({ success: true, data: result });
    } else {
      const planilhasComHotel = planilhasImportadas.map(p => {
        const hotel = hoteis.find(h => h.id === p.hotel_id);
        return {
          ...p,
          hotel_nome: hotel ? hotel.nome : 'Hotel não encontrado'
        };
      });
      res.json({ success: true, data: planilhasComHotel });
    }
  } catch (error) {
    console.error('Erro ao buscar planilhas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar planilhas' });
  }
});

// Rota para excluir planilha
app.delete('/api/planilhas/:id', async (req, res) => {
  try {
    const planilhaId = req.params.id;
    
    if (dbAvailable) {
      // Excluir tarifas da planilha
      await executeQuery('DELETE FROM tarifas WHERE planilha_id = ?', [planilhaId]);
      
      // Excluir registro da planilha
      await executeQuery('DELETE FROM planilhas_importadas WHERE id = ?', [planilhaId]);
    } else {
      // Remover tarifas da memória
      tarifas = tarifas.filter(t => t.planilha_id !== planilhaId);
      
      // Remover planilha da memória
      const index = planilhasImportadas.findIndex(p => p.id === planilhaId);
      if (index > -1) {
        planilhasImportadas.splice(index, 1);
      }
    }
    
    res.json({ success: true, message: 'Planilha excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir planilha:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir planilha' });
  }
});

// Rota para análise comparativa
app.get('/api/analise/comparativo', async (req, res) => {
  try {
    const { hotel_id, data_inicio, data_fim } = req.query;
    
    if (!hotel_id || !data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros obrigatórios: hotel_id, data_inicio, data_fim'
      });
    }

    let hotelPrincipal, concorrentes, tarifasHotel, tarifasConcorrentes;

    if (dbAvailable) {
      // Buscar hotel principal
      const hotelResult = await executeQuery('SELECT * FROM hoteis WHERE id = ?', [hotel_id]);
      if (hotelResult.length === 0) {
        return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
      }
      hotelPrincipal = hotelResult[0];

      // Buscar concorrentes
      const concorrentesResult = await executeQuery(`
        SELECT h.* FROM hoteis h 
        INNER JOIN concorrentes c ON h.id = c.concorrente_id 
        WHERE c.hotel_id = ? AND h.ativo = 1
      `, [hotel_id]);
      concorrentes = concorrentesResult;

      // Buscar tarifas do hotel principal
      const tarifasHotelResult = await executeQuery(`
        SELECT * FROM tarifas 
        WHERE hotel_id = ? AND data BETWEEN ? AND ?
        ORDER BY data
      `, [hotel_id, data_inicio, data_fim]);
      tarifasHotel = tarifasHotelResult;

      // Buscar tarifas dos concorrentes
      if (concorrentes.length > 0) {
        const concorrenteIds = concorrentes.map(c => c.id);
        const placeholders = concorrenteIds.map(() => '?').join(',');
        const tarifasConcorrentesResult = await executeQuery(`
          SELECT t.*, h.nome as hotel_nome FROM tarifas t
          INNER JOIN hoteis h ON t.hotel_id = h.id
          WHERE t.hotel_id IN (${placeholders}) AND t.data BETWEEN ? AND ?
          ORDER BY t.data, h.nome
        `, [...concorrenteIds, data_inicio, data_fim]);
        tarifasConcorrentes = tarifasConcorrentesResult;
      } else {
        tarifasConcorrentes = [];
      }
    } else {
      // Usar dados em memória
      hotelPrincipal = hoteis.find(h => h.id === parseInt(hotel_id));
      if (!hotelPrincipal) {
        return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
      }

      concorrentes = hoteis.filter(h => 
        hotelPrincipal.concorrentes && hotelPrincipal.concorrentes.includes(h.nome)
      );

      tarifasHotel = tarifas.filter(t => 
        t.hotel_id === parseInt(hotel_id) && 
        t.data >= data_inicio && 
        t.data <= data_fim
      ).sort((a, b) => a.data.localeCompare(b.data));

      tarifasConcorrentes = tarifas.filter(t => 
        concorrentes.some(c => c.id === t.hotel_id) &&
        t.data >= data_inicio && 
        t.data <= data_fim
      ).map(t => {
        const hotel = hoteis.find(h => h.id === t.hotel_id);
        return { ...t, hotel_nome: hotel ? hotel.nome : 'Desconhecido' };
      }).sort((a, b) => a.data.localeCompare(b.data));
    }

    // Processar dados para análise
    const analise = {
      hotel_principal: hotelPrincipal.nome,
      periodo: { inicio: data_inicio, fim: data_fim },
      concorrentes_analisados: concorrentes.map(c => c.nome),
      tabela_comparativa: [],
      grafico_evolucao: [],
      resumo: {
        preco_medio_hotel: 0,
        preco_medio_concorrentes: {},
        diferenca_percentual: {},
        dias_com_dados: 0
      }
    };

    // Agrupar tarifas por data
    const tarifasPorData = {};
    
    // Adicionar tarifas do hotel principal
    tarifasHotel.forEach(tarifa => {
      if (!tarifasPorData[tarifa.data]) {
        tarifasPorData[tarifa.data] = {};
      }
      tarifasPorData[tarifa.data][hotelPrincipal.nome] = tarifa.preco;
    });

    // Adicionar tarifas dos concorrentes
    tarifasConcorrentes.forEach(tarifa => {
      if (!tarifasPorData[tarifa.data]) {
        tarifasPorData[tarifa.data] = {};
      }
      tarifasPorData[tarifa.data][tarifa.hotel_nome] = tarifa.preco;
    });

    // Gerar tabela comparativa e gráfico
    const datasOrdenadas = Object.keys(tarifasPorData).sort();
    let somaPrecoHotel = 0;
    let diasComDados = 0;

    datasOrdenadas.forEach(data => {
      const tarifasData = tarifasPorData[data];
      const precoHotel = tarifasData[hotelPrincipal.nome];
      
      if (precoHotel) {
        diasComDados++;
        somaPrecoHotel += precoHotel;

        // Tabela comparativa
        const linhaTabelaComparativa = {
          data: new Date(data).toLocaleDateString('pt-BR'),
          [hotelPrincipal.nome]: precoHotel
        };

        // Gráfico de evolução
        const pontoGrafico = {
          data: new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          [hotelPrincipal.nome]: precoHotel
        };

        concorrentes.forEach(concorrente => {
          const precoConcorrente = tarifasData[concorrente.nome];
          if (precoConcorrente) {
            linhaTabelaComparativa[concorrente.nome] = precoConcorrente;
            pontoGrafico[concorrente.nome] = precoConcorrente;
          }
        });

        analise.tabela_comparativa.push(linhaTabelaComparativa);
        analise.grafico_evolucao.push(pontoGrafico);
      }
    });

    // Calcular resumo
    if (diasComDados > 0) {
      analise.resumo.preco_medio_hotel = somaPrecoHotel / diasComDados;
      analise.resumo.dias_com_dados = diasComDados;

      // Calcular preços médios dos concorrentes
      concorrentes.forEach(concorrente => {
        const tarifasConcorrente = tarifasConcorrentes.filter(t => t.hotel_nome === concorrente.nome);
        if (tarifasConcorrente.length > 0) {
          const somaPreco = tarifasConcorrente.reduce((sum, t) => sum + t.preco, 0);
          const precoMedio = somaPreco / tarifasConcorrente.length;
          analise.resumo.preco_medio_concorrentes[concorrente.nome] = precoMedio;
          
          // Calcular diferença percentual
          const diferenca = ((precoMedio - analise.resumo.preco_medio_hotel) / analise.resumo.preco_medio_hotel) * 100;
          analise.resumo.diferenca_percentual[concorrente.nome] = diferenca;
        }
      });
    }

    res.json({ success: true, data: analise });

  } catch (error) {
    console.error('Erro na análise comparativa:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar análise comparativa' });
  }
});

// Servir frontend para todas as rotas não-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initializeDatabase();
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor Rate Shopper rodando na porta ${PORT}`);
      console.log(`📊 Banco de dados: ${dbAvailable ? 'Conectado' : 'Modo fallback (memória)'}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();

