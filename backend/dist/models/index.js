"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportacaoLog = exports.Tarifa = exports.Hotel = void 0;
const Hotel_1 = __importDefault(require("./Hotel"));
exports.Hotel = Hotel_1.default;
const Tarifa_1 = __importDefault(require("./Tarifa"));
exports.Tarifa = Tarifa_1.default;
const ImportacaoLog_1 = __importDefault(require("./ImportacaoLog"));
exports.ImportacaoLog = ImportacaoLog_1.default;
// Definir associações entre modelos
// Hotel -> Tarifas (1:N)
Hotel_1.default.hasMany(Tarifa_1.default, {
    foreignKey: 'hotel_id',
    as: 'tarifas'
});
Tarifa_1.default.belongsTo(Hotel_1.default, {
    foreignKey: 'hotel_id',
    as: 'hotel'
});
// Hotel -> ImportacaoLogs (1:N)
Hotel_1.default.hasMany(ImportacaoLog_1.default, {
    foreignKey: 'hotel_id',
    as: 'importacoes'
});
ImportacaoLog_1.default.belongsTo(Hotel_1.default, {
    foreignKey: 'hotel_id',
    as: 'hotel'
});
// Hotel -> Concorrentes (N:N)
// Tabela de junção para relacionamento many-to-many
Hotel_1.default.belongsToMany(Hotel_1.default, {
    through: 'hotel_concorrentes',
    as: 'concorrentes',
    foreignKey: 'hotel_id',
    otherKey: 'concorrente_id'
});
Hotel_1.default.belongsToMany(Hotel_1.default, {
    through: 'hotel_concorrentes',
    as: 'concorrentesDe',
    foreignKey: 'concorrente_id',
    otherKey: 'hotel_id'
});
exports.default = {
    Hotel: Hotel_1.default,
    Tarifa: Tarifa_1.default,
    ImportacaoLog: ImportacaoLog_1.default
};
