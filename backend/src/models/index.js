const sequelize = require('../config/database');
const Hotel = require('./Hotel');
const Tarifa = require('./Tarifa');
const ImportacaoLog = require('./ImportacaoLog');

// Definir associações
Hotel.hasMany(Tarifa, { foreignKey: 'hotel_id', as: 'tarifas' });
Tarifa.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

Hotel.hasMany(ImportacaoLog, { foreignKey: 'hotel_id', as: 'logs' });
ImportacaoLog.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// Associações para concorrentes
Hotel.belongsToMany(Hotel, { 
  through: 'hotel_concorrentes',
  as: 'hoteis_concorrentes',
  foreignKey: 'hotel_id',
  otherKey: 'concorrente_id'
});

// Sincronizar modelos com o banco de dados
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados com o banco de dados');
  } catch (error) {
    console.error('Erro ao sincronizar modelos:', error);
  }
};

module.exports = {
  sequelize,
  Hotel,
  Tarifa,
  ImportacaoLog,
  syncModels
};

