import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import { IImportacaoLog } from '../types';
import Hotel from './Hotel';

class ImportacaoLog extends Model<IImportacaoLog> implements IImportacaoLog {
  public id!: number;
  public hotel_id!: number;
  public arquivo_nome!: string;
  public total_registros!: number;
  public registros_sucesso!: number;
  public registros_erro!: number;
  public status!: 'processando' | 'sucesso' | 'erro' | 'sucesso_com_erros';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associações
  public static associations: {
    hotel: Association<ImportacaoLog, Hotel>;
  };
}

ImportacaoLog.init(
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
    arquivo_nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    total_registros: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    registros_sucesso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    registros_erro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('processando', 'sucesso', 'erro', 'sucesso_com_erros'),
      allowNull: false,
      defaultValue: 'processando'
    }
  },
  {
    sequelize,
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
  }
);

export default ImportacaoLog;

