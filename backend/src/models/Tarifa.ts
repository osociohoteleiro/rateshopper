import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import { ITarifa } from '../types';
import Hotel from './Hotel';

class Tarifa extends Model<ITarifa> implements ITarifa {
  public id!: number;
  public hotel_id!: number;
  public data_checkin!: Date;
  public data_checkout!: Date;
  public preco!: number;
  public moeda?: string;
  public canal?: string;
  public tipo_quarto?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associações
  public static associations: {
    hotel: Association<Tarifa, Hotel>;
  };
}

Tarifa.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Hotel,
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    data_checkin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true
      }
    },
    data_checkout: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
        isAfterCheckin(value: string) {
          if (this.data_checkin && new Date(value) <= new Date(this.data_checkin)) {
            throw new Error('Data de checkout deve ser posterior à data de checkin');
          }
        }
      }
    },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0
      }
    },
    moeda: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'BRL',
      validate: {
        len: [3, 3],
        isUppercase: true
      }
    },
    canal: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tipo_quarto: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
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
  }
);

export default Tarifa;

