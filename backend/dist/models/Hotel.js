"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Hotel extends sequelize_1.Model {
}
Hotel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    url_booking: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    localizacao: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    }
}, {
    sequelize: database_1.default,
    modelName: 'Hotel',
    tableName: 'hotels',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['nome']
        },
        {
            fields: ['localizacao']
        }
    ]
});
exports.default = Hotel;
