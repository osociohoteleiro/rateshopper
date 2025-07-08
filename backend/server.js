const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { syncModels } = require('./src/models');

// Importar rotas
const estatisticasRoutes = require('./src/routes/estatisticas');
const hotelsRoutes = require('./src/routes/hotels');
const tarifasRoutes = require('./src/routes/tarifas');
const uploadRoutes = require('./src/routes/upload');
const analiseRoutes = require('./src/routes/analise');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Rotas da API
app.use('/api/estatisticas', estatisticasRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/tarifas', tarifasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analise', analiseRoutes);

// Rota para verificar se o servidor está rodando
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// Rota para todas as outras requisições (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Sincronizar modelos com o banco de dados
    await syncModels();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
  }
};

startServer();

