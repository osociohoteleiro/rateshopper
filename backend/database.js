const mysql = require('mysql2/promise');

// Configuração do banco de dados com fallbacks
const dbConfigs = [
  {
    name: 'Produção OSH',
    host: 'osh-apps_mariaddb-rateshopper',
    port: 3306,
    user: 'rateshopper',
    password: 'OSH4040()Xx!..nn',
    database: 'rateshopper'
  },
  {
    name: 'Localhost',
    host: 'localhost',
    port: 3306,
    user: 'rateshopper',
    password: 'OSH4040()Xx!..nn',
    database: 'rateshopper'
  },
  {
    name: '127.0.0.1',
    host: '127.0.0.1',
    port: 3306,
    user: 'rateshopper',
    password: 'OSH4040()Xx!..nn',
    database: 'rateshopper'
  }
];

let pool = null;
let currentConfig = null;

// Função para tentar conectar com diferentes configurações
async function createConnection() {
  for (const config of dbConfigs) {
    try {
      console.log(`🔄 Tentando conectar com ${config.name}...`);
      
      const testPool = mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 5000,
        timeout: 5000
      });
      
      // Testar conexão
      const connection = await testPool.getConnection();
      await connection.execute('SELECT 1 as test');
      connection.release();
      
      console.log(`✅ Conectado com sucesso usando ${config.name}`);
      pool = testPool;
      currentConfig = config;
      return true;
      
    } catch (error) {
      console.log(`❌ Falha ao conectar com ${config.name}: ${error.message}`);
      continue;
    }
  }
  
  console.log('❌ Não foi possível conectar com nenhuma configuração');
  return false;
}

// Função para testar conexão
async function testConnection() {
  try {
    if (!pool) {
      const connected = await createConnection();
      if (!connected) {
        return false;
      }
    }
    
    const connection = await pool.getConnection();
    console.log(`✅ Conectado ao banco de dados MariaDB (${currentConfig.name})`);
    
    // Testar uma query simples
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Teste de query executado com sucesso');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
}

// Função para executar queries
async function executeQuery(sql, params = []) {
  try {
    if (!pool) {
      const connected = await createConnection();
      if (!connected) {
        throw new Error('Não foi possível conectar ao banco de dados');
      }
    }
    
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erro ao executar query:', error.message);
    throw error;
  }
}

// Função para criar tabelas se não existirem
async function initializeTables() {
  try {
    // Tabela de hotéis
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS hoteis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        url_booking TEXT,
        localizacao VARCHAR(255),
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabela de concorrentes
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS concorrentes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        concorrente_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE,
        FOREIGN KEY (concorrente_id) REFERENCES hoteis(id) ON DELETE CASCADE,
        UNIQUE KEY unique_concorrente (hotel_id, concorrente_id)
      )
    `);

    // Tabela de planilhas importadas
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS planilhas_importadas (
        id VARCHAR(50) PRIMARY KEY,
        nome_arquivo VARCHAR(255) NOT NULL,
        hotel_id INT NOT NULL,
        hotel_nome VARCHAR(255),
        data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        arquivo_salvo VARCHAR(255),
        quantidade_tarifas INT DEFAULT 0,
        FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE
      )
    `);

    // Tabela de tarifas
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS tarifas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        planilha_id VARCHAR(50),
        data DATE NOT NULL,
        preco DECIMAL(10,2) NOT NULL,
        tipo_quarto VARCHAR(100) DEFAULT 'Standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE,
        FOREIGN KEY (planilha_id) REFERENCES planilhas_importadas(id) ON DELETE CASCADE,
        INDEX idx_hotel_data (hotel_id, data),
        INDEX idx_planilha (planilha_id)
      )
    `);

    console.log('✅ Tabelas criadas/verificadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    return false;
  }
}

module.exports = {
  pool: () => pool,
  testConnection,
  executeQuery,
  initializeTables,
  createConnection,
  getCurrentConfig: () => currentConfig
};

