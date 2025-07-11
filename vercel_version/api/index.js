const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco SQLite
const dbPath = '/tmp/rateshopper.db';
let db;

// Inicializar banco de dados
function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar SQLite:', err);
        reject(err);
        return;
      }
      
      console.log('✅ SQLite conectado com sucesso');
      
      // Criar tabelas
      const createTables = `
        CREATE TABLE IF NOT EXISTS hoteis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          url_booking TEXT,
          localizacao TEXT,
          ativo BOOLEAN DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS tarifas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hotel_id INTEGER,
          planilha_id TEXT,
          data DATE,
          preco REAL,
          tipo_quarto TEXT DEFAULT 'Standard',
          FOREIGN KEY (hotel_id) REFERENCES hoteis(id)
        );

        CREATE TABLE IF NOT EXISTS planilhas_importadas (
          id TEXT PRIMARY KEY,
          nome_arquivo TEXT,
          hotel_id INTEGER,
          data_importacao DATETIME,
          tarifas_importadas INTEGER DEFAULT 0,
          FOREIGN KEY (hotel_id) REFERENCES hoteis(id)
        );

        CREATE TABLE IF NOT EXISTS concorrentes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hotel_id INTEGER,
          concorrente_id INTEGER,
          FOREIGN KEY (hotel_id) REFERENCES hoteis(id),
          FOREIGN KEY (concorrente_id) REFERENCES hoteis(id)
        );
      `;

      db.exec(createTables, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabelas:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Tabelas criadas com sucesso');
        
        // Inserir dados de exemplo
        insertSampleData().then(() => {
          console.log('✅ Dados de exemplo inseridos');
          resolve();
        }).catch(reject);
      });
    });
  });
}

// Inserir dados de exemplo
function insertSampleData() {
  return new Promise((resolve, reject) => {
    const sampleHotels = [
      { nome: 'Hotel Copacabana Palace', localizacao: 'Copacabana, Rio de Janeiro', url_booking: 'https://booking.com/hotel1' },
      { nome: 'Hotel Fasano São Paulo', localizacao: 'Jardins, São Paulo', url_booking: 'https://booking.com/hotel2' },
      { nome: 'Pousada Maravilha', localizacao: 'Fernando de Noronha', url_booking: 'https://booking.com/hotel3' },
      { nome: 'Hotel Santa Teresa', localizacao: 'Santa Teresa, Rio de Janeiro', url_booking: 'https://booking.com/hotel4' },
      { nome: 'Unique Garden Hotel', localizacao: 'Jardins, São Paulo', url_booking: 'https://booking.com/hotel5' }
    ];

    // Verificar se já existem hotéis
    db.get('SELECT COUNT(*) as count FROM hoteis', (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        resolve(); // Já existem dados
        return;
      }

      // Inserir hotéis de exemplo
      const stmt = db.prepare('INSERT INTO hoteis (nome, localizacao, url_booking) VALUES (?, ?, ?)');
      
      sampleHotels.forEach(hotel => {
        stmt.run(hotel.nome, hotel.localizacao, hotel.url_booking);
      });
      
      stmt.finalize((err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Inserir tarifas de exemplo
        insertSampleRates().then(resolve).catch(reject);
      });
    });
  });
}

// Inserir tarifas de exemplo
function insertSampleRates() {
  return new Promise((resolve, reject) => {
    const today = new Date();
    const stmt = db.prepare('INSERT INTO tarifas (hotel_id, planilha_id, data, preco, tipo_quarto) VALUES (?, ?, ?, ?, ?)');
    
    // Gerar tarifas para os próximos 30 dias
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Para cada hotel (IDs 1-5)
      for (let hotelId = 1; hotelId <= 5; hotelId++) {
        const basePrice = 200 + (hotelId * 50);
        const variation = Math.random() * 100 - 50; // Variação de -50 a +50
        const price = Math.round((basePrice + variation) * 100) / 100;
        
        stmt.run(hotelId, 'sample-data', dateStr, price, 'Standard');
      }
    }
    
    stmt.finalize(resolve);
  });
}

// Configuração do multer para upload
const upload = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Rotas da API

// Health check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Rate Shopper Vercel funcionando!',
    database: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// Listar hotéis
app.get('/api/hoteis', (req, res) => {
  db.all('SELECT * FROM hoteis WHERE ativo = 1 ORDER BY nome', (err, rows) => {
    if (err) {
      console.error('Erro ao buscar hotéis:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    res.json(rows);
  });
});

// Criar hotel
app.post('/api/hotels', (req, res) => {
  const { nome, localizacao, url_booking } = req.body;
  
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const stmt = db.prepare('INSERT INTO hoteis (nome, localizacao, url_booking) VALUES (?, ?, ?)');
  stmt.run(nome, localizacao || '', url_booking || '', function(err) {
    if (err) {
      console.error('Erro ao criar hotel:', err);
      return res.status(500).json({ error: 'Erro ao criar hotel' });
    }
    
    res.status(201).json({
      id: this.lastID,
      nome,
      localizacao,
      url_booking,
      message: 'Hotel criado com sucesso'
    });
  });
});

// Upload de planilha
app.post('/api/upload', upload.single('planilha'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const { hotel_id } = req.body;
  if (!hotel_id) {
    return res.status(400).json({ error: 'ID do hotel é obrigatório' });
  }

  try {
    // Ler arquivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Planilha vazia ou formato inválido' });
    }

    const planilhaId = `upload_${Date.now()}_${hotel_id}`;
    let tarifasImportadas = 0;

    // Preparar statement para inserção
    const stmt = db.prepare('INSERT INTO tarifas (hotel_id, planilha_id, data, preco, tipo_quarto) VALUES (?, ?, ?, ?, ?)');

    // Processar cada linha
    data.forEach(row => {
      const data = row.Data || row.data || row.DATE || row.Date;
      const preco = row.Preco || row.preco || row.PRICE || row.Price || row.Tarifa || row.tarifa;
      const tipoQuarto = row.TipoQuarto || row.tipo_quarto || row.ROOM_TYPE || row.RoomType || 'Standard';

      if (data && preco && !isNaN(parseFloat(preco))) {
        let dataFormatada;
        
        // Tentar diferentes formatos de data
        if (typeof data === 'number') {
          // Data do Excel (número serial)
          const excelDate = new Date((data - 25569) * 86400 * 1000);
          dataFormatada = excelDate.toISOString().split('T')[0];
        } else {
          // String de data
          const parsedDate = new Date(data);
          if (!isNaN(parsedDate.getTime())) {
            dataFormatada = parsedDate.toISOString().split('T')[0];
          }
        }

        if (dataFormatada) {
          stmt.run(hotel_id, planilhaId, dataFormatada, parseFloat(preco), tipoQuarto);
          tarifasImportadas++;
        }
      }
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Erro ao inserir tarifas:', err);
        return res.status(500).json({ error: 'Erro ao processar planilha' });
      }

      // Registrar planilha importada
      const stmtPlanilha = db.prepare('INSERT INTO planilhas_importadas (id, nome_arquivo, hotel_id, data_importacao, tarifas_importadas) VALUES (?, ?, ?, ?, ?)');
      stmtPlanilha.run(planilhaId, req.file.originalname, hotel_id, new Date().toISOString(), tarifasImportadas, (err) => {
        if (err) {
          console.error('Erro ao registrar planilha:', err);
        }

        // Limpar arquivo temporário
        fs.unlink(req.file.path, () => {});

        res.json({
          message: 'Planilha processada com sucesso',
          planilha_id: planilhaId,
          tarifas_importadas: tarifasImportadas,
          nome_arquivo: req.file.originalname
        });
      });
    });

  } catch (error) {
    console.error('Erro ao processar planilha:', error);
    res.status(500).json({ error: 'Erro ao processar planilha' });
  }
});

// Listar planilhas
app.get('/api/planilhas', (req, res) => {
  const query = `
    SELECT p.*, h.nome as hotel_nome 
    FROM planilhas_importadas p 
    JOIN hoteis h ON p.hotel_id = h.id 
    ORDER BY p.data_importacao DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar planilhas:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    res.json(rows);
  });
});

// Análise comparativa
app.get('/api/analise/comparativo', (req, res) => {
  const { data_inicio, data_fim, hotel_ids } = req.query;
  
  if (!data_inicio || !data_fim) {
    return res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
  }

  let whereClause = 'WHERE t.data BETWEEN ? AND ?';
  let params = [data_inicio, data_fim];
  
  if (hotel_ids) {
    const ids = hotel_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (ids.length > 0) {
      whereClause += ` AND t.hotel_id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }
  }

  const query = `
    SELECT 
      h.nome as hotel_nome,
      t.data,
      AVG(t.preco) as preco_medio,
      MIN(t.preco) as preco_minimo,
      MAX(t.preco) as preco_maximo,
      COUNT(t.id) as total_tarifas
    FROM tarifas t
    JOIN hoteis h ON t.hotel_id = h.id
    ${whereClause}
    GROUP BY h.id, h.nome, t.data
    ORDER BY t.data, h.nome
  `;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Erro na análise comparativa:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Organizar dados por data
    const dadosPorData = {};
    rows.forEach(row => {
      if (!dadosPorData[row.data]) {
        dadosPorData[row.data] = [];
      }
      dadosPorData[row.data].push({
        hotel: row.hotel_nome,
        preco_medio: parseFloat(row.preco_medio).toFixed(2),
        preco_minimo: parseFloat(row.preco_minimo).toFixed(2),
        preco_maximo: parseFloat(row.preco_maximo).toFixed(2),
        total_tarifas: row.total_tarifas
      });
    });

    res.json({
      periodo: { inicio: data_inicio, fim: data_fim },
      dados: dadosPorData,
      total_registros: rows.length
    });
  });
});

// Servir arquivos estáticos (se necessário)
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: 'Rate Shopper - Versão Vercel',
    status: 'funcionando',
    database: 'SQLite',
    endpoints: [
      'GET /api/status',
      'GET /api/hoteis',
      'POST /api/hotels',
      'POST /api/upload',
      'GET /api/planilhas',
      'GET /api/analise/comparativo'
    ]
  });
});

// Inicializar banco e exportar para Vercel
let dbInitialized = false;

module.exports = async (req, res) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
      console.log('🚀 Rate Shopper Vercel inicializado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inicializar:', error);
      return res.status(500).json({ error: 'Erro ao inicializar aplicação' });
    }
  }
  
  return app(req, res);
};

