import express from 'express';
import cors from 'cors';
import path from 'path';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa o app Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/database.sqlite'),
  logging: false
});

// Teste de conexão com o banco de dados
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar com o banco de dados:', err);
  });

// Dados em memória (temporário até implementar os modelos)
let hotels = [
  {
    id: 1,
    nome: 'Hotel Exemplo',
    url_booking: 'https://booking.com/hotel-exemplo',
    ativo: true,
    concorrentes: []
  }
];

let tarifas = [
  {
    id: 1,
    hotel_id: 1,
    data_checkin: '2025-01-15',
    data_checkout: '2025-01-16',
    preco: 250.00,
    moeda: 'BRL',
    data_importacao: new Date().toISOString()
  },
  {
    id: 2,
    hotel_id: 1,
    data_checkin: '2025-01-16',
    data_checkout: '2025-01-17',
    preco: 280.00,
    moeda: 'BRL',
    data_importacao: new Date().toISOString()
  }
];

let importacoes = [
  {
    id: 1,
    hotel_id: 1,
    arquivo: 'exemplo.xlsx',
    registros_importados: 2,
    data_importacao: new Date().toISOString(),
    status: 'sucesso'
  }
];

// API Routes

// Estatísticas
app.get('/api/estatisticas', (req, res) => {
  try {
    const stats = {
      total_tarifas: tarifas.length,
      total_hoteis: hotels.filter(h => h.ativo).length,
      total_concorrentes: hotels.reduce((acc, hotel) => acc + (hotel.concorrentes?.length || 0), 0),
      ultima_importacao: importacoes.length > 0 ? importacoes[importacoes.length - 1].data_importacao : null
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Hotéis
app.get('/api/hotels', (req, res) => {
  try {
    res.json({
      success: true,
      data: hotels.filter(h => h.ativo)
    });
  } catch (error) {
    console.error('Erro ao buscar hotéis:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

app.post('/api/hotels', (req, res) => {
  try {
    const { nome, url_booking } = req.body;
    
    if (!nome || !url_booking) {
      return res.status(400).json({
        success: false,
        error: 'Nome e URL da Booking são obrigatórios'
      });
    }
    
    const novoHotel = {
      id: hotels.length + 1,
      nome,
      url_booking,
      ativo: true,
      concorrentes: []
    };
    
    hotels.push(novoHotel);
    
    res.json({
      success: true,
      data: novoHotel
    });
  } catch (error) {
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Tarifas
app.get('/api/tarifas', (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 10;
    const hotelId = req.query.hotel_id;
    
    let filteredTarifas = tarifas;
    
    if (hotelId) {
      filteredTarifas = tarifas.filter(t => t.hotel_id === parseInt(hotelId as string));
    }
    
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedTarifas = filteredTarifas.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedTarifas,
      pagination: {
        page,
        per_page: perPage,
        total: filteredTarifas.length,
        total_pages: Math.ceil(filteredTarifas.length / perPage)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar tarifas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Upload de planilhas
app.post('/api/upload', (req, res) => {
  try {
    const { hotel_id, dados } = req.body;
    
    if (!hotel_id || !dados || !Array.isArray(dados)) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID e dados são obrigatórios'
      });
    }
    
    const hotel = hotels.find(h => h.id === parseInt(hotel_id));
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    const novasTarifas = dados.map((linha, index) => ({
      id: tarifas.length + index + 1,
      hotel_id: parseInt(hotel_id),
      data_checkin: linha.data_checkin,
      data_checkout: linha.data_checkout,
      preco: parseFloat(linha.preco),
      moeda: 'BRL',
      data_importacao: new Date().toISOString()
    }));
    
    tarifas.push(...novasTarifas);
    
    const importacao = {
      id: importacoes.length + 1,
      hotel_id: parseInt(hotel_id),
      arquivo: 'planilha.xlsx',
      registros_importados: novasTarifas.length,
      data_importacao: new Date().toISOString(),
      status: 'sucesso'
    };
    
    importacoes.push(importacao);
    
    res.json({
      success: true,
      data: {
        registros_importados: novasTarifas.length,
        importacao_id: importacao.id
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Análise comparativa
app.get('/api/analise/comparativo', (req, res) => {
  try {
    const { hotel_id, data_inicio, data_fim } = req.query;
    
    if (!hotel_id || !data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID, data início e data fim são obrigatórios'
      });
    }
    
    const hotel = hotels.find(h => h.id === parseInt(hotel_id as string));
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    const tarifasHotel = tarifas.filter(t => 
      t.hotel_id === parseInt(hotel_id as string) &&
      t.data_checkin >= (data_inicio as string) &&
      t.data_checkout <= (data_fim as string)
    );
    
    const precoMedio = tarifasHotel.length > 0 
      ? tarifasHotel.reduce((acc, t) => acc + t.preco, 0) / tarifasHotel.length 
      : 0;
    
    const analise = {
      hotel_foco: hotel.nome,
      periodo: {
        inicio: data_inicio,
        fim: data_fim
      },
      preco_medio_hotel: precoMedio,
      total_tarifas: tarifasHotel.length,
      total_concorrentes: hotel.concorrentes?.length || 0,
      comparativo_concorrentes: [],
      insights: [
        `Foram analisadas ${tarifasHotel.length} tarifas no período selecionado`,
        `Preço médio do ${hotel.nome}: R$ ${precoMedio.toFixed(2)}`,
        'Configure concorrentes para este hotel para ver análise comparativa detalhada'
      ]
    };
    
    res.json({
      success: true,
      data: analise
    });
  } catch (error) {
    console.error('Erro na análise:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota catch-all para servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Iniciar servidor
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor Rate Shopper rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

export default app;

