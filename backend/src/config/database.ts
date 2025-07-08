import { Sequelize } from 'sequelize';
import path from 'path';

// Configuração do banco SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database/rate_shopper.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Função para conectar e sincronizar o banco
export async function connectDatabase(): Promise<void> {
  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com SQLite estabelecida com sucesso');

    // Sincronizar modelos (criar tabelas se não existirem)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados com o banco de dados');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    throw error;
  }
}

// Função para fechar conexão
export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
    console.log('✅ Conexão com o banco fechada');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
    throw error;
  }
}

export default sequelize;

