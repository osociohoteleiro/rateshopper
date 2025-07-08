const mysql = require('mysql2/promise');

// Configuração do banco de dados de produção
const dbConfig = {
  host: 'osh-apps_mariaddb-rateshopper',
  port: 3306,
  user: 'rateshopper',
  password: 'OSH4040()Xx!..nn',
  database: 'rateshopper',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Dados iniciais para migração
const hoteisIniciais = [
  { id: 1, nome: 'Eco Encanto Pousada', url_booking: 'https://www.booking.com/hotel/br/eco-encanto-pousada.html', localizacao: 'Ubatuba', ativo: true },
  { id: 2, nome: 'Pousada Vila Da Lagoa', url_booking: 'https://www.booking.com/hotel/br/pousada-vila-da-lagoa.html', localizacao: 'Ubatuba', ativo: true },
  { id: 3, nome: 'Chalés Mirante da Lagoinha', url_booking: 'https://www.booking.com/hotel/br/chales-mirante-lagoinha.html', localizacao: 'Ubatuba', ativo: true },
  { id: 4, nome: 'Pousada Ilha da Vitória', url_booking: 'https://www.booking.com/hotel/br/pousada-ilha-vitoria.html', localizacao: 'Ubatuba', ativo: true }
];

const concorrentesIniciais = [
  { hotel_id: 1, concorrente_id: 2 }, // Eco Encanto -> Vila Da Lagoa
  { hotel_id: 1, concorrente_id: 3 }  // Eco Encanto -> Chalés Mirante
];

async function deployDatabase() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados de produção...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // Criar tabelas
    console.log('🔄 Criando tabelas...');
    
    // Tabela de hotéis
    await connection.execute(`
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
    console.log('✅ Tabela hoteis criada');

    // Tabela de planilhas importadas
    await connection.execute(`
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
    console.log('✅ Tabela planilhas_importadas criada');

    // Tabela de tarifas
    await connection.execute(`
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
    console.log('✅ Tabela tarifas criada');

    // Tabela de concorrentes
    await connection.execute(`
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
    console.log('✅ Tabela concorrentes criada');

    // Verificar se já existem dados
    const [existingHotels] = await connection.execute('SELECT COUNT(*) as count FROM hoteis');
    
    if (existingHotels[0].count === 0) {
      console.log('🔄 Inserindo dados iniciais...');
      
      // Inserir hotéis
      for (const hotel of hoteisIniciais) {
        await connection.execute(
          'INSERT INTO hoteis (id, nome, url_booking, localizacao, ativo) VALUES (?, ?, ?, ?, ?)',
          [hotel.id, hotel.nome, hotel.url_booking, hotel.localizacao, hotel.ativo]
        );
        console.log(`✅ Hotel inserido: ${hotel.nome}`);
      }
      
      // Inserir concorrentes
      for (const concorrente of concorrentesIniciais) {
        await connection.execute(
          'INSERT INTO concorrentes (hotel_id, concorrente_id) VALUES (?, ?)',
          [concorrente.hotel_id, concorrente.concorrente_id]
        );
        console.log(`✅ Concorrente inserido: Hotel ${concorrente.hotel_id} -> Hotel ${concorrente.concorrente_id}`);
      }
      
      console.log('✅ Dados iniciais inseridos com sucesso');
    } else {
      console.log('ℹ️  Dados já existem no banco, pulando inserção inicial');
    }
    
    // Verificar estrutura final
    console.log('🔄 Verificando estrutura final...');
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tabelas criadas:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    const [hotelCount] = await connection.execute('SELECT COUNT(*) as count FROM hoteis');
    const [tarifaCount] = await connection.execute('SELECT COUNT(*) as count FROM tarifas');
    const [planilhaCount] = await connection.execute('SELECT COUNT(*) as count FROM planilhas_importadas');
    const [concorrenteCount] = await connection.execute('SELECT COUNT(*) as count FROM concorrentes');
    
    console.log('\n📊 Resumo dos dados:');
    console.log(`  - Hotéis: ${hotelCount[0].count}`);
    console.log(`  - Tarifas: ${tarifaCount[0].count}`);
    console.log(`  - Planilhas: ${planilhaCount[0].count}`);
    console.log(`  - Concorrentes: ${concorrenteCount[0].count}`);
    
    console.log('\n✅ Banco de dados implantado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a implantação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar implantação
deployDatabase();

