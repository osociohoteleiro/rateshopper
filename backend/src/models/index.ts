import Hotel from './Hotel';
import Tarifa from './Tarifa';
import ImportacaoLog from './ImportacaoLog';

// Definir associações entre modelos

// Hotel -> Tarifas (1:N)
Hotel.hasMany(Tarifa, {
  foreignKey: 'hotel_id',
  as: 'tarifas'
});

Tarifa.belongsTo(Hotel, {
  foreignKey: 'hotel_id',
  as: 'hotel'
});

// Hotel -> ImportacaoLogs (1:N)
Hotel.hasMany(ImportacaoLog, {
  foreignKey: 'hotel_id',
  as: 'importacoes'
});

ImportacaoLog.belongsTo(Hotel, {
  foreignKey: 'hotel_id',
  as: 'hotel'
});

// Hotel -> Concorrentes (N:N)
// Tabela de junção para relacionamento many-to-many
Hotel.belongsToMany(Hotel, {
  through: 'hotel_concorrentes',
  as: 'concorrentes',
  foreignKey: 'hotel_id',
  otherKey: 'concorrente_id'
});

Hotel.belongsToMany(Hotel, {
  through: 'hotel_concorrentes',
  as: 'concorrentesDe',
  foreignKey: 'concorrente_id',
  otherKey: 'hotel_id'
});

// Exportar todos os modelos
export {
  Hotel,
  Tarifa,
  ImportacaoLog
};

export default {
  Hotel,
  Tarifa,
  ImportacaoLog
};

