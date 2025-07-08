import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import { IHotel } from '../types';

class Hotel extends Model<IHotel> implements IHotel {
  public id!: number;
  public nome!: string;
  public url_booking?: string;
  public localizacao?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associações
  public static associations: {
    tarifas: Association<Hotel, any>;
    concorrentes: Association<Hotel, Hotel>;
    concorrentesDe: Association<Hotel, Hotel>;
  };
}

Hotel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    url_booking: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    localizacao: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
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
  }
);

export default Hotel;

