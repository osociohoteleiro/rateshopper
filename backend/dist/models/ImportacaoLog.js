"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Hotel_1 = __importDefault(require("./Hotel"));
class ImportacaoLog extends sequelize_1.Model {
}
ImportacaoLog.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    hotel_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Hotel_1.default,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    arquivo_nome: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    total_registros: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    registros_sucesso: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    registros_erro: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('processando', 'sucesso', 'erro', 'sucesso_com_erros'),
        allowNull: false,
        defaultValue: 'processando'
    }
}, {
    sequelize: database_1.default,
    modelName: 'ImportacaoLog',
    tableName: 'importacao_logs',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['hotel_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ]
});
exports.default = ImportacaoLog;
