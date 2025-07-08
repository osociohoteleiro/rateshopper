"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Hotel_1 = __importDefault(require("./Hotel"));
class Tarifa extends sequelize_1.Model {
}
Tarifa.init({
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
    data_checkin: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true,
            notEmpty: true
        }
    },
    data_checkout: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true,
            notEmpty: true,
            isAfterCheckin(value) {
                if (this.data_checkin && new Date(value) <= new Date(this.data_checkin)) {
                    throw new Error('Data de checkout deve ser posterior à data de checkin');
                }
            }
        }
    },
    preco: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    moeda: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'BRL',
        validate: {
            len: [3, 3],
            isUppercase: true
        }
    },
    canal: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true
    },
    tipo_quarto: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    }
}, {
    sequelize: database_1.default,
    modelName: 'Tarifa',
    tableName: 'tarifas',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['hotel_id']
        },
        {
            fields: ['data_checkin']
        },
        {
            fields: ['data_checkout']
        },
        {
            fields: ['preco']
        },
        {
            fields: ['canal']
        },
        {
            fields: ['hotel_id', 'data_checkin', 'data_checkout']
        }
    ]
});
exports.default = Tarifa;
