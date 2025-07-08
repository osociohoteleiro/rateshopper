const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Dados mock para hotéis
const hoteis = [
  {
    id: 1,
    nome: 'Eco Encanto Pousada',
    url_booking: 'https://www.booking.com/hotel/br/eco-encanto-pousada.html',
    localizacao: 'Ubatuba',
    ativo: true,
    concorrentes: ['Pousada Vila Da Lagoa']
  },
  {
    id: 2,
    nome: 'Pousada Vila Da Lagoa',
    url_booking: 'https://www.booking.com/hotel/br/pousada-vila-da-lagoa.html',
    localizacao: 'Ubatuba',
    ativo: true,
    concorrentes: ['Chalés Mirante da Lagoinha']
  },
  {
    id: 3,
    nome: 'Chalés Mirante da Lagoinha',
    url_booking: 'https://www.booking.com/hotel/br/chales-mirante-da-lagoinha.html',
    localizacao: 'Ubatuba',
    ativo: true,
    concorrentes: ['Eco Encanto Pousada']
  }
];

// Dados mock para tarifas
const tarifas = [
  { id: 1, hotel_id: 1, data: '2025-07-08', preco: 228.29, tipo_quarto: 'Standard' },
  { id: 2, hotel_id: 2, data: '2025-07-08', preco: 322.00, tipo_quarto: 'Standard' },
  { id: 3, hotel_id: 3, data: '2025-07-08', preco: 376.00, tipo_quarto: 'Standard' }
];

// Rotas da API
app.get('/api/hotels', (req, res) => {
  res.json(hoteis);
});

app.post('/api/hotels', (req, res) => {
  const { nome, url_booking, localizacao } = req.body;
  const novoHotel = {
    id: hoteis.length + 1,
    nome,
    url_booking: url_booking || '',
    localizacao: localizacao || '',
    ativo: true,
    concorrentes: []
  };
  hoteis.push(novoHotel);
  res.json(novoHotel);
});

app.delete('/api/hotels/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = hoteis.findIndex(h => h.id === id);
  if (index !== -1) {
    hoteis.splice(index, 1);
    res.json({ message: 'Hotel excluído com sucesso' });
  } else {
    res.status(404).json({ error: 'Hotel não encontrado' });
  }
});

app.get('/api/tarifas', (req, res) => {
  res.json({
    tarifas: tarifas,
    total: tarifas.length,
    page: 1,
    totalPages: 1
  });
});

app.get('/api/estatisticas', (req, res) => {
  res.json({
    totalTarifas: tarifas.length,
    precoMedio: 308.76,
    hoteisAtivos: hoteis.filter(h => h.ativo).length,
    canais: 0
  });
});

app.get('/api/analise', (req, res) => {
  res.json({
    periodo: '30/06/2025 - 30/07/2025',
    precoMedio: 228.29,
    concorrentes: 1,
    tarifasAnalisadas: 30,
    insights: [
      'Foram analisadas 30 tarifas no período selecionado',
      'Preço médio do Eco Encanto Pousada: R$ 228,29',
      'Chalés Mirante da Lagoinha está 71,36% mais caro que Eco Encanto Pousada',
      'Eco Encanto Pousada está mais barato que 100% dos concorrentes analisados'
    ]
  });
});

// Rota para verificar se o servidor está rodando
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// Todas as outras rotas servem o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

