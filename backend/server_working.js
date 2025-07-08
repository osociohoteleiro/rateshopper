const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

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
  res.json({
    success: true,
    data: hoteis
  });
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
  res.json({
    success: true,
    data: novoHotel
  });
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

// Rota para adicionar concorrente
app.post('/api/hotels/:id/concorrentes', (req, res) => {
  const hotelId = parseInt(req.params.id);
  const { concorrenteId, concorrente_id } = req.body;
  
  // Aceitar ambos os formatos para compatibilidade
  const concorrenteIdFinal = concorrenteId || concorrente_id;
  
  const hotel = hoteis.find(h => h.id === hotelId);
  const concorrente = hoteis.find(h => h.id === parseInt(concorrenteIdFinal));
  
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel não encontrado' });
  }
  
  if (!concorrente) {
    return res.status(404).json({ error: 'Hotel concorrente não encontrado' });
  }
  
  // Adicionar concorrente se não existir
  if (!hotel.concorrentes.includes(concorrente.nome)) {
    hotel.concorrentes.push(concorrente.nome);
  }
  
  res.json({
    success: true,
    data: hotel
  });
});

// Rota para remover concorrente
app.delete('/api/hotels/:id/concorrentes/:concorrenteNome', (req, res) => {
  const hotelId = parseInt(req.params.id);
  const concorrenteNome = req.params.concorrenteNome;
  
  const hotel = hoteis.find(h => h.id === hotelId);
  
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel não encontrado' });
  }
  
  const index = hotel.concorrentes.indexOf(concorrenteNome);
  if (index !== -1) {
    hotel.concorrentes.splice(index, 1);
  }
  
  res.json({
    success: true,
    data: hotel
  });
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

// Rota para upload de tarifas
app.post('/api/upload', upload.single('arquivo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const { hotelId } = req.body;
    
    if (!hotelId) {
      return res.status(400).json({ error: 'Hotel de destino não especificado' });
    }

    // Simular processamento do arquivo
    const novasTarifas = [
      { id: tarifas.length + 1, hotel_id: parseInt(hotelId), data: '2025-07-08', preco: 250.00, tipo_quarto: 'Standard' },
      { id: tarifas.length + 2, hotel_id: parseInt(hotelId), data: '2025-07-09', preco: 275.00, tipo_quarto: 'Standard' },
      { id: tarifas.length + 3, hotel_id: parseInt(hotelId), data: '2025-07-10', preco: 300.00, tipo_quarto: 'Standard' }
    ];

    // Adicionar as novas tarifas ao array
    tarifas.push(...novasTarifas);

    res.json({
      success: true,
      message: `Arquivo ${req.file.originalname} processado com sucesso`,
      tarifasImportadas: novasTarifas.length,
      arquivo: req.file.filename
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
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

