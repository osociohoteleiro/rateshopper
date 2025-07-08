const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hotel = sequelize.define('Hotel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url_booking: {
    type: DataTypes.STRING,
    allowNull: false
  },
  localizacao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  concorrentes: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('concorrentes');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('concorrentes', JSON.stringify(value || []));
    },
    defaultValue: '[]'
  }
}, {
  tableName: 'hoteis',
  timestamps: true
});

module.exports = Hotel;

