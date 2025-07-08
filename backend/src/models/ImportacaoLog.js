const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportacaoLog = sequelize.define('ImportacaoLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  arquivo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  registros_importados: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  data_importacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pendente'
  },
  erro: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'importacoes_log',
  timestamps: true
});

module.exports = ImportacaoLog;

