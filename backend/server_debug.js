// Servidor de Debug Simplificado para Troubleshooting
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Iniciando servidor de debug...');
console.log('📊 Variáveis de ambiente:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_NAME:', process.env.DB_NAME);

// Middleware básico
app.use(cors());
app.use(express.json());

// Health check simples
app.get('/api/status', (req, res) => {
  console.log('✅ Health check acessado');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    message: 'Servidor de debug funcionando!'
  });
});

// Rota de teste
app.get('/', (req, res) => {
  console.log('✅ Rota raiz acessada');
  res.json({
    message: 'Rate Shopper Debug Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para banco
app.get('/api/test-db', (req, res) => {
  console.log('🔍 Testando configurações do banco...');
  res.json({
    db_config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password_set: !!process.env.DB_PASSWORD
    }
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(500).json({
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de debug rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/status`);
  console.log('✅ Servidor iniciado com sucesso!');
});

// Tratamento de sinais
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});

