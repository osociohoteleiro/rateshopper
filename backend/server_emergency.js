// Servidor de Emergência Ultra-Simples
// Apenas para garantir que o EasyPanel consiga inicializar

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚨 SERVIDOR DE EMERGÊNCIA INICIANDO...');
console.log('📊 PORT:', PORT);
console.log('📊 NODE_ENV:', process.env.NODE_ENV);

// Middleware mínimo
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  console.log('✅ Rota / acessada');
  res.json({
    message: 'SERVIDOR DE EMERGÊNCIA FUNCIONANDO!',
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Health check
app.get('/api/status', (req, res) => {
  console.log('✅ Health check acessado');
  res.json({
    status: 'ok',
    message: 'Servidor de emergência funcionando',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de teste
app.get('/test', (req, res) => {
  console.log('✅ Rota /test acessada');
  res.send('TESTE OK - SERVIDOR FUNCIONANDO!');
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 SERVIDOR DE EMERGÊNCIA RODANDO NA PORTA', PORT);
  console.log('✅ SUCESSO! Servidor iniciado sem erros');
  console.log('🔗 Teste: http://localhost:' + PORT);
  console.log('🔗 Health: http://localhost:' + PORT + '/api/status');
});

console.log('📝 Servidor de emergência carregado com sucesso!');

