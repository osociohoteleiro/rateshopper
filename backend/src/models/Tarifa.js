const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tarifa = sequelize.define('Tarifa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  data_checkin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  data_checkout: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  preco: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  moeda: {
    type: DataTypes.STRING,
    defaultValue: 'BRL'
  },
  canal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tipo_quarto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  data_importacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tarifas',
  timestamps: true
});

module.exports = Tarifa;

