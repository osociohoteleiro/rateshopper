"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.closeDatabase = closeDatabase;
const sequelize_1 = require("sequelize");
const path_1 = __importDefault(require("path"));
// Configuração do banco SQLite
const sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: path_1.default.join(__dirname, '../../database/rate_shopper.db'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
// Função para conectar e sincronizar o banco
async function connectDatabase() {
    try {
        // Testar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com SQLite estabelecida com sucesso');
        // Sincronizar modelos (criar tabelas se não existirem)
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados com o banco de dados');
    }
    catch (error) {
        console.error('❌ Erro ao conectar com o banco de dados:', error);
        throw error;
    }
}
// Função para fechar conexão
async function closeDatabase() {
    try {
        await sequelize.close();
        console.log('✅ Conexão com o banco fechada');
    }
    catch (error) {
        console.error('❌ Erro ao fechar conexão:', error);
        throw error;
    }
}
exports.default = sequelize;
