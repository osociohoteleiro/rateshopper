const { Sequelize } = require('sequelize');
const path = require('path');

// Configuração do banco de dados SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database/database.sqlite'),
  logging: false,
  define: {
    timestamps: true,
    underscored: false
  }
});

// Testar conexão
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados:', err);
  });

module.exports = sequelize;

