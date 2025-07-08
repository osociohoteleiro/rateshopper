const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { testConnection, executeQuery, initializeTables } = require('./database');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Variável para controlar se o banco está disponível
let dbAvailable = false;

// Inicializar banco de dados
async function initializeDatabase() {
  console.log('🔄 Inicializando conexão com banco de dados...');
  
  const connected = await testConnection();
  if (connected) {
    const tablesCreated = await initializeTables();
    if (tablesCreated) {
      dbAvailable = true;
      console.log('✅ Banco de dados inicializado com sucesso');
    }
  } else {
    console.log('⚠️  Banco de dados não disponível, usando dados em memória');
    dbAvailable = false;
  }
}

// Arrays em memória como fallback
let hoteis = [
  { id: 1, nome: 'Eco Encanto Pousada', url_booking: 'https://www.booking.com/hotel/br/eco-encanto-pousada.html', localizacao: 'Ubatuba', ativo: true, concorrentes: ['Pousada Vila Da Lagoa', 'Chalés Mirante da Lagoinha'] },
  { id: 2, nome: 'Pousada Vila Da Lagoa', url_booking: 'https://www.booking.com/hotel/br/pousada-vila-da-lagoa.html', localizacao: 'Ubatuba', ativo: true, concorrentes: [] },
  { id: 3, nome: 'Chalés Mirante da Lagoinha', url_booking: 'https://www.booking.com/hotel/br/chales-mirante-lagoinha.html', localizacao: 'Ubatuba', ativo: true, concorrentes: [] },
  { id: 4, nome: 'Pousada Ilha da Vitória', url_booking: 'https://www.booking.com/hotel/br/pousada-ilha-vitoria.html', localizacao: 'Ubatuba', ativo: true, concorrentes: [] }
];

let tarifas = [];
let planilhasImportadas = [];

// Funções para banco de dados
async function getHotelsFromDB() {
  if (!dbAvailable) return hoteis;
  
  try {
    const hotels = await executeQuery('SELECT * FROM hoteis WHERE ativo = TRUE');
    
    // Buscar concorrentes para cada hotel
    for (let hotel of hotels) {
      const concorrentes = await executeQuery(`
        SELECT h.nome 
        FROM concorrentes c 
        JOIN hoteis h ON c.concorrente_id = h.id 
        WHERE c.hotel_id = ?
      `, [hotel.id]);
      
      hotel.concorrentes = concorrentes.map(c => c.nome);
    }
    
    return hotels;
  } catch (error) {
    console.error('Erro ao buscar hotéis do banco:', error.message);
    return hoteis;
  }
}

async function createHotelInDB(hotelData) {
  if (!dbAvailable) {
    // Fallback para memória
    const newId = Math.max(...hoteis.map(h => h.id), 0) + 1;
    const newHotel = { id: newId, ...hotelData, ativo: true, concorrentes: [] };
    hoteis.push(newHotel);
    return newHotel;
  }
  
  try {
    const result = await executeQuery(
      'INSERT INTO hoteis (nome, url_booking, localizacao, ativo) VALUES (?, ?, ?, TRUE)',
      [hotelData.nome, hotelData.url_booking, hotelData.localizacao]
    );
    
    return {
      id: result.insertId,
      ...hotelData,
      ativo: true,
      concorrentes: []
    };
  } catch (error) {
    console.error('Erro ao criar hotel no banco:', error.message);
    throw error;
  }
}

// Rotas da API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: dbAvailable ? 'connected' : 'memory_fallback',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/hoteis', async (req, res) => {
  try {
    const hotels = await getHotelsFromDB();
    res.json({
      success: true,
      data: hotels
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar hotéis' });
  }
});

app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await getHotelsFromDB();
    res.json({
      success: true,
      data: hotels
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar hotéis' });
  }
});

app.post('/api/hotels', async (req, res) => {
  try {
    const { nome, url_booking, localizacao } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome do hotel é obrigatório' });
    }
    
    const newHotel = await createHotelInDB({ nome, url_booking, localizacao });
    
    res.json({
      success: true,
      data: newHotel
    });
  } catch (error) {
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Inicializar servidor
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Status do banco: ${dbAvailable ? 'Conectado' : 'Memória (fallback)'}`);
  });
}

startServer();

