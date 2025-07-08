const { testConnection, initializeTables, executeQuery } = require('./database');

async function testDatabase() {
  console.log('🔄 Testando conexão com o banco de dados...');
  
  // Testar conexão
  const connected = await testConnection();
  
  if (connected) {
    console.log('🔄 Inicializando tabelas...');
    const tablesCreated = await initializeTables();
    
    if (tablesCreated) {
      console.log('🔄 Verificando tabelas criadas...');
      try {
        const tables = await executeQuery('SHOW TABLES');
        console.log('📋 Tabelas no banco de dados:');
        tables.forEach(table => {
          console.log(`  - ${Object.values(table)[0]}`);
        });
        
        // Verificar estrutura das tabelas
        console.log('\n🔄 Verificando estrutura das tabelas...');
        
        const hotelStructure = await executeQuery('DESCRIBE hoteis');
        console.log('\n📋 Estrutura da tabela hoteis:');
        hotelStructure.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        const tarifasStructure = await executeQuery('DESCRIBE tarifas');
        console.log('\n📋 Estrutura da tabela tarifas:');
        tarifasStructure.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        console.log('\n✅ Banco de dados configurado e funcionando!');
        
      } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error.message);
      }
    }
  }
  
  process.exit(0);
}

testDatabase();

