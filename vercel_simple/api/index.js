const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

const app = express();

// Configuração de CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'mysql-osh-ia.alwaysdata.net',
  user: process.env.DB_USER || '378222_oshia',
  password: process.env.DB_PASSWORD || 'oshia2024!',
  database: process.env.DB_NAME || 'osh-ia_rateshopper',
  port: process.env.DB_PORT || 3306,
  ssl: false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

// Função para conectar ao banco
async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Erro ao conectar com o banco:', error);
    throw error;
  }
}

// Configuração do multer para upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Rota de status
app.get('/api/status', async (req, res) => {
  try {
    const connection = await getConnection();
    await connection.execute('SELECT 1');
    await connection.end();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro de conexão com banco de dados',
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para listar hotéis
app.get('/api/hoteis', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM hoteis ORDER BY nome');
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar hotéis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para cadastrar hotel
app.post('/api/hoteis', async (req, res) => {
  try {
    const { nome, url_booking, localizacao } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome do hotel é obrigatório' });
    }
    
    const connection = await getConnection();
    const [result] = await connection.execute(
      'INSERT INTO hoteis (nome, url_booking, localizacao, data_cadastro) VALUES (?, ?, ?, NOW())',
      [nome, url_booking || null, localizacao || null]
    );
    await connection.end();
    
    res.status(201).json({
      id: result.insertId,
      nome,
      url_booking,
      localizacao,
      message: 'Hotel cadastrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cadastrar hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para upload de planilhas
app.post('/api/upload', upload.single('planilha'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Planilha vazia' });
    }

    const connection = await getConnection();
    
    // Registrar a planilha
    const [planilhaResult] = await connection.execute(
      'INSERT INTO planilhas (nome_arquivo, data_upload, total_registros) VALUES (?, NOW(), ?)',
      [req.file.originalname, data.length]
    );
    
    const planilhaId = planilhaResult.insertId;
    let processados = 0;
    let erros = 0;

    // Processar cada linha
    for (const row of data) {
      try {
        const hotel = row['Hotel'] || row['hotel'] || row['HOTEL'];
        const data_checkin = row['Data Check-in'] || row['data_checkin'] || row['DATA_CHECKIN'];
        const tarifa = parseFloat(row['Tarifa'] || row['tarifa'] || row['TARIFA'] || 0);
        
        if (hotel && data_checkin && tarifa > 0) {
          // Buscar ou criar hotel
          let [hotelRows] = await connection.execute(
            'SELECT id FROM hoteis WHERE nome = ?',
            [hotel]
          );
          
          let hotelId;
          if (hotelRows.length === 0) {
            const [hotelResult] = await connection.execute(
              'INSERT INTO hoteis (nome, data_cadastro) VALUES (?, NOW())',
              [hotel]
            );
            hotelId = hotelResult.insertId;
          } else {
            hotelId = hotelRows[0].id;
          }
          
          // Inserir tarifa
          await connection.execute(
            'INSERT INTO tarifas (hotel_id, planilha_id, data_checkin, valor, data_registro) VALUES (?, ?, ?, ?, NOW())',
            [hotelId, planilhaId, data_checkin, tarifa]
          );
          
          processados++;
        } else {
          erros++;
        }
      } catch (error) {
        console.error('Erro ao processar linha:', error);
        erros++;
      }
    }

    await connection.end();

    res.json({
      message: 'Planilha processada com sucesso',
      planilha_id: planilhaId,
      total_linhas: data.length,
      processados,
      erros
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para análise comparativa
app.get('/api/analise/comparativo', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
    }
    
    const connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        h.nome as hotel,
        DATE(t.data_checkin) as data,
        AVG(t.valor) as tarifa_media,
        MIN(t.valor) as tarifa_minima,
        MAX(t.valor) as tarifa_maxima,
        COUNT(t.id) as total_registros
      FROM tarifas t
      JOIN hoteis h ON t.hotel_id = h.id
      WHERE t.data_checkin BETWEEN ? AND ?
      GROUP BY h.id, DATE(t.data_checkin)
      ORDER BY data, h.nome
    `, [data_inicio, data_fim]);
    
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Erro na análise comparativa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar planilhas
app.get('/api/planilhas', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        id,
        nome_arquivo,
        data_upload,
        total_registros,
        DATE_FORMAT(data_upload, '%d/%m/%Y %H:%i') as data_formatada
      FROM planilhas 
      ORDER BY data_upload DESC
    `);
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar planilhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Export para Vercel
module.exports = app;

