const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  host: 'osh-apps_mariaddb-rateshopper',
  port: 3306,
  user: 'rateshopper',
  password: 'OSH4040()Xx!..nn',
  database: 'rateshopper'
};

// Simular dados existentes (que estariam em memória)
const dadosExistentes = {
  hoteis: [
    { id: 1, nome: 'Eco Encanto Pousada', url_booking: 'https://www.booking.com/hotel/br/eco-encanto-pousada.html', localizacao: 'Ubatuba', ativo: true },
    { id: 2, nome: 'Pousada Vila Da Lagoa', url_booking: 'https://www.booking.com/hotel/br/pousada-vila-da-lagoa.html', localizacao: 'Ubatuba', ativo: true },
    { id: 3, nome: 'Chalés Mirante da Lagoinha', url_booking: 'https://www.booking.com/hotel/br/chales-mirante-lagoinha.html', localizacao: 'Ubatuba', ativo: true },
    { id: 4, nome: 'Pousada Ilha da Vitória', url_booking: 'https://www.booking.com/hotel/br/pousada-ilha-vitoria.html', localizacao: 'Ubatuba', ativo: true }
  ],
  
  planilhas: [
    {
      id: "1751980078097",
      nome_arquivo: "ECOENCANTO_2025-06-16T21-36-43-831Z_from_2025-06-17_to_2026-03-31.xlsx",
      hotel_id: 1,
      hotel_nome: "Eco Encanto Pousada",
      data_importacao: "2025-07-08T13:07:58.000Z",
      arquivo_salvo: "1751980078093-ECOENCANTO_2025-06-16T21-36-43-831Z_from_2025-06-17_to_2026-03-31.xlsx",
      quantidade_tarifas: 229
    }
  ],
  
  concorrentes: [
    { hotel_id: 1, concorrente_id: 2 },
    { hotel_id: 1, concorrente_id: 3 }
  ]
};

async function migrateToDatabase() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se as tabelas existem
    const [tables] = await connection.execute("SHOW TABLES LIKE 'hoteis'");
    if (tables.length === 0) {
      console.log('❌ Tabelas não encontradas. Execute primeiro: node deploy_database.js');
      return;
    }
    
    console.log('🔄 Iniciando migração de dados...');
    
    // Migrar hotéis
    console.log('🔄 Migrando hotéis...');
    for (const hotel of dadosExistentes.hoteis) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO hoteis (id, nome, url_booking, localizacao, ativo) VALUES (?, ?, ?, ?, ?)',
          [hotel.id, hotel.nome, hotel.url_booking, hotel.localizacao, hotel.ativo]
        );
        console.log(`✅ Hotel migrado: ${hotel.nome}`);
      } catch (error) {
        console.log(`⚠️  Hotel já existe: ${hotel.nome}`);
      }
    }
    
    // Migrar concorrentes
    console.log('🔄 Migrando concorrentes...');
    for (const concorrente of dadosExistentes.concorrentes) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO concorrentes (hotel_id, concorrente_id) VALUES (?, ?)',
          [concorrente.hotel_id, concorrente.concorrente_id]
        );
        console.log(`✅ Concorrente migrado: Hotel ${concorrente.hotel_id} -> Hotel ${concorrente.concorrente_id}`);
      } catch (error) {
        console.log(`⚠️  Concorrente já existe: Hotel ${concorrente.hotel_id} -> Hotel ${concorrente.concorrente_id}`);
      }
    }
    
    // Migrar planilhas
    console.log('🔄 Migrando planilhas...');
    for (const planilha of dadosExistentes.planilhas) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO planilhas_importadas (id, nome_arquivo, hotel_id, hotel_nome, data_importacao, arquivo_salvo, quantidade_tarifas) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [planilha.id, planilha.nome_arquivo, planilha.hotel_id, planilha.hotel_nome, planilha.data_importacao, planilha.arquivo_salvo, planilha.quantidade_tarifas]
        );
        console.log(`✅ Planilha migrada: ${planilha.nome_arquivo}`);
      } catch (error) {
        console.log(`⚠️  Planilha já existe: ${planilha.nome_arquivo}`);
      }
    }
    
    // Verificar se há arquivos de planilhas para processar
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));
      
      if (files.length > 0) {
        console.log(`🔄 Encontrados ${files.length} arquivos Excel para processar...`);
        
        const XLSX = require('xlsx');
        
        for (const file of files) {
          try {
            console.log(`🔄 Processando arquivo: ${file}`);
            
            const filePath = path.join(uploadsDir, file);
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Determinar hotel_id baseado no nome do arquivo
            let hotel_id = 1; // Default
            if (file.includes('VILA')) hotel_id = 2;
            else if (file.includes('MIRANTE') || file.includes('LAGOINHA')) hotel_id = 3;
            else if (file.includes('VITORIA')) hotel_id = 4;
            
            const planilha_id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
            
            let tarifasProcessadas = 0;
            
            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              
              if (!row || row.length < 3) continue;
              
              try {
                const dataInicio = row[0];
                const preco = parseFloat(String(row[2]).replace(',', '.'));
                
                if (!dataInicio || !preco || isNaN(preco)) continue;
                
                // Converter data
                let dataFormatada;
                if (typeof dataInicio === 'string') {
                  const partesData = dataInicio.split('/');
                  if (partesData.length === 3) {
                    const dia = partesData[0].padStart(2, '0');
                    const mes = partesData[1].padStart(2, '0');
                    const ano = partesData[2];
                    dataFormatada = `${ano}-${mes}-${dia}`;
                  } else {
                    continue;
                  }
                } else {
                  continue;
                }
                
                // Inserir tarifa
                await connection.execute(
                  'INSERT IGNORE INTO tarifas (hotel_id, planilha_id, data, preco, tipo_quarto) VALUES (?, ?, ?, ?, ?)',
                  [hotel_id, planilha_id, dataFormatada, preco, 'Standard']
                );
                
                tarifasProcessadas++;
                
              } catch (error) {
                continue;
              }
            }
            
            // Registrar planilha
            const hotelNome = dadosExistentes.hoteis.find(h => h.id === hotel_id)?.nome || 'Hotel Desconhecido';
            await connection.execute(
              'INSERT IGNORE INTO planilhas_importadas (id, nome_arquivo, hotel_id, hotel_nome, data_importacao, arquivo_salvo, quantidade_tarifas) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
              [planilha_id, file, hotel_id, hotelNome, file, tarifasProcessadas]
            );
            
            console.log(`✅ Arquivo processado: ${file} (${tarifasProcessadas} tarifas)`);
            
          } catch (error) {
            console.log(`❌ Erro ao processar ${file}: ${error.message}`);
          }
        }
      }
    }
    
    // Verificar dados finais
    console.log('🔄 Verificando dados migrados...');
    
    const [hotelCount] = await connection.execute('SELECT COUNT(*) as count FROM hoteis');
    const [tarifaCount] = await connection.execute('SELECT COUNT(*) as count FROM tarifas');
    const [planilhaCount] = await connection.execute('SELECT COUNT(*) as count FROM planilhas_importadas');
    const [concorrenteCount] = await connection.execute('SELECT COUNT(*) as count FROM concorrentes');
    
    console.log('\n📊 Resumo da migração:');
    console.log(`  - Hotéis: ${hotelCount[0].count}`);
    console.log(`  - Tarifas: ${tarifaCount[0].count}`);
    console.log(`  - Planilhas: ${planilhaCount[0].count}`);
    console.log(`  - Concorrentes: ${concorrenteCount[0].count}`);
    
    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

migrateToDatabase();

