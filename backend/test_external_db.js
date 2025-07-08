const mysql = require('mysql2/promise');

// Diferentes configurações para testar
const testConfigs = [
  {
    name: 'Host Original',
    host: 'osh-apps_mariaddb-rateshopper',
    port: 3306,
    user: 'rateshopper',
    password: 'OSH4040()Xx!..nn',
    database: 'rateshopper'
  },
  {
    name: 'Host com Domínio Completo',
    host: 'osh-apps_mariaddb-rateshopper.d32pnk.easypanel.host',
    port: 3306,
    user: 'rateshopper',
    password: 'OSH4040()Xx!..nn',
    database: 'rateshopper'
  },
  {
    name: 'Host Alternativo 1',
    host: 'osh-apps-mariaddb-rateshopper.d32pnk.easypanel.host',
    port: 3306,
    user: 'rateshopper',
    password: 'OSH4040()Xx!..nn',
    database: 'rateshopper'
  },
  {
    name: 'Host phpMyAdmin',
    host: 'osh-apps-mariaddb-rateshopper-phpmyadmin.d32pnk.easypanel.host',
    port: 3306,
    user: 'rateshopper',
    password: 'OSH4040()Xx!..nn',
    database: 'rateshopper'
  }
];

async function testConnections() {
  console.log('🔄 Testando diferentes configurações de conexão...\n');
  
  for (const config of testConfigs) {
    try {
      console.log(`🔄 Testando: ${config.name} (${config.host})`);
      
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
      });
      
      // Testar query simples
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log(`✅ SUCESSO! Conectado com ${config.name}`);
      
      // Testar se as tabelas existem
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`📋 Tabelas encontradas: ${tables.length}`);
      tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
      
      // Testar dados
      const [hotelCount] = await connection.execute('SELECT COUNT(*) as count FROM hoteis');
      console.log(`🏨 Hotéis cadastrados: ${hotelCount[0].count}`);
      
      await connection.end();
      console.log(`✅ Conexão com ${config.name} funcionando perfeitamente!\n`);
      
      // Se chegou até aqui, encontrou uma configuração que funciona
      return config;
      
    } catch (error) {
      console.log(`❌ Falha com ${config.name}: ${error.message}\n`);
      continue;
    }
  }
  
  console.log('❌ Nenhuma configuração funcionou');
  return null;
}

testConnections().then(workingConfig => {
  if (workingConfig) {
    console.log('🎉 CONFIGURAÇÃO FUNCIONANDO ENCONTRADA:');
    console.log(`Host: ${workingConfig.host}`);
    console.log(`Porta: ${workingConfig.port}`);
    console.log('✅ Pronto para usar no servidor principal!');
  }
  process.exit(0);
});

