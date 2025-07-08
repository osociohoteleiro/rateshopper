const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Dados mock para hotéis
const hoteis = [
  {
    id: 1,
    nome: 'Eco Encanto Pousada',
    url_booking: 'https://www.booking.com/hotel/br/eco-encanto-pousada.html',
    localizacao: 'Ubatuba',
    ativo: true,
    concorrentes: ['Pousada Vila Da Lagoa']
  },
  {
    id: 2,
    nome: 'Pousada Vila Da Lagoa',
    url_booking: 'https://www.booking.com/hotel/br/pousada-vila-da-lagoa.html',
    localizacao: 'Ubatuba',
    ativo: true,
    concorrentes: ['Chalés Mirante da Lagoinha']
  },
  {
    id: 3,
    nome: 'Chalés Mirante da Lagoinha',
    url_booking: 'https://www.booking.com/hotel/br/chales-mirante-da-lagoinha.html',
    localizacao: 'Ubatuba',
    ativo: true,
    concorrentes: ['Eco Encanto Pousada']
  }
];

// Dados mock para tarifas (inicialmente vazio)
const tarifas = [];

// Array para armazenar informações das planilhas importadas
const planilhasImportadas = [];

// Rotas da API
app.get('/api/hotels', (req, res) => {
  res.json({
    success: true,
    data: hoteis
  });
});

// Rota alternativa para compatibilidade
app.get('/api/hoteis', (req, res) => {
  res.json({
    success: true,
    data: hoteis
  });
});

app.post('/api/hotels', (req, res) => {
  const { nome, url_booking, localizacao } = req.body;
  const novoHotel = {
    id: hoteis.length + 1,
    nome,
    url_booking: url_booking || '',
    localizacao: localizacao || '',
    ativo: true,
    concorrentes: []
  };
  hoteis.push(novoHotel);
  res.json({
    success: true,
    data: novoHotel
  });
});

app.delete('/api/hotels/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = hoteis.findIndex(h => h.id === id);
  if (index !== -1) {
    hoteis.splice(index, 1);
    res.json({ message: 'Hotel excluído com sucesso' });
  } else {
    res.status(404).json({ error: 'Hotel não encontrado' });
  }
});

// Rota para adicionar concorrente
app.post('/api/hotels/:id/concorrentes', (req, res) => {
  const hotelId = parseInt(req.params.id);
  const { concorrenteId, concorrente_id } = req.body;
  
  // Aceitar ambos os formatos para compatibilidade
  const concorrenteIdFinal = concorrenteId || concorrente_id;
  
  const hotel = hoteis.find(h => h.id === hotelId);
  const concorrente = hoteis.find(h => h.id === parseInt(concorrenteIdFinal));
  
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel não encontrado' });
  }
  
  if (!concorrente) {
    return res.status(404).json({ error: 'Hotel concorrente não encontrado' });
  }
  
  // Adicionar concorrente se não existir
  if (!hotel.concorrentes.includes(concorrente.nome)) {
    hotel.concorrentes.push(concorrente.nome);
  }
  
  res.json({
    success: true,
    data: hotel
  });
});

// Rota para remover concorrente
app.delete('/api/hotels/:id/concorrentes/:concorrenteNome', (req, res) => {
  const hotelId = parseInt(req.params.id);
  const concorrenteNome = req.params.concorrenteNome;
  
  const hotel = hoteis.find(h => h.id === hotelId);
  
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel não encontrado' });
  }
  
  const index = hotel.concorrentes.indexOf(concorrenteNome);
  if (index !== -1) {
    hotel.concorrentes.splice(index, 1);
  }
  
  res.json({
    success: true,
    data: hotel
  });
});

app.get('/api/tarifas', (req, res) => {
  res.json({
    tarifas: tarifas,
    total: tarifas.length,
    page: 1,
    totalPages: 1
  });
});

app.get('/api/estatisticas', (req, res) => {
  res.json({
    totalTarifas: tarifas.length,
    precoMedio: 308.76,
    hoteisAtivos: hoteis.filter(h => h.ativo).length,
    canais: 0
  });
});

app.get('/api/analise', (req, res) => {
  res.json({
    periodo: '30/06/2025 - 30/07/2025',
    precoMedio: 228.29,
    concorrentes: 1,
    tarifasAnalisadas: 30,
    insights: [
      'Foram analisadas 30 tarifas no período selecionado',
      'Preço médio do Eco Encanto Pousada: R$ 228,29',
      'Chalés Mirante da Lagoinha está 71,36% mais caro que Eco Encanto Pousada',
      'Eco Encanto Pousada está mais barato que 100% dos concorrentes analisados'
    ]
  });
});

// Rota para upload de tarifas
app.post('/api/upload', upload.single('arquivo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const { hotelId } = req.body;
    
    if (!hotelId) {
      return res.status(400).json({ error: 'Hotel de destino não especificado' });
    }

    const hotel = hoteis.find(h => h.id === parseInt(hotelId));
    if (!hotel) {
      return res.status(400).json({ error: 'Hotel não encontrado' });
    }

    // Criar registro da planilha importada
    const planilhaId = Date.now().toString();
    const planilhaInfo = {
      id: planilhaId,
      nome_arquivo: req.file.originalname,
      hotel_id: parseInt(hotelId),
      hotel_nome: hotel.nome,
      data_importacao: new Date().toISOString(),
      arquivo_salvo: req.file.filename
    };

    // Processar o arquivo Excel real
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const novasTarifas = [];
    let tarifaId = tarifas.length + 1;

    // Processar cada linha da planilha (assumindo que a primeira linha pode ser cabeçalho)
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Pular linhas vazias
      if (!row || row.length < 3) continue;
      
      try {
        // Assumindo formato: [data_inicio, data_fim, preco]
        const dataInicio = row[0];
        const dataFim = row[1];
        const preco = parseFloat(String(row[2]).replace(',', '.'));
        
        // Validar se os dados são válidos
        if (!dataInicio || !preco || isNaN(preco)) continue;
        
        // Converter data para formato ISO se necessário
        let dataFormatada;
        if (dataInicio instanceof Date) {
          dataFormatada = dataInicio.toISOString().split('T')[0];
        } else if (typeof dataInicio === 'string') {
          // Tentar converter string de data
          const partesData = dataInicio.split('/');
          if (partesData.length === 3) {
            // Formato DD/MM/YYYY
            const dia = partesData[0].padStart(2, '0');
            const mes = partesData[1].padStart(2, '0');
            const ano = partesData[2];
            dataFormatada = `${ano}-${mes}-${dia}`;
          } else {
            // Tentar parsing direto
            const dataObj = new Date(dataInicio);
            if (!isNaN(dataObj.getTime())) {
              dataFormatada = dataObj.toISOString().split('T')[0];
            } else {
              continue; // Pular linha com data inválida
            }
          }
        } else {
          continue; // Pular linha com data inválida
        }
        
        // Criar tarifa
        const novaTarifa = {
          id: tarifaId++,
          hotel_id: parseInt(hotelId),
          planilha_id: planilhaId,
          data: dataFormatada,
          preco: preco,
          tipo_quarto: 'Standard'
        };
        
        novasTarifas.push(novaTarifa);
        
      } catch (error) {
        console.warn(`Erro ao processar linha ${i + 1}:`, error.message);
        continue; // Pular linha com erro
      }
    }

    // Adicionar informações da quantidade de tarifas à planilha
    planilhaInfo.quantidade_tarifas = novasTarifas.length;

    // Adicionar as novas tarifas ao array
    tarifas.push(...novasTarifas);
    
    // Adicionar informações da planilha ao array
    planilhasImportadas.push(planilhaInfo);

    res.json({
      success: true,
      message: `Arquivo ${req.file.originalname} processado com sucesso`,
      tarifasImportadas: novasTarifas.length,
      arquivo: req.file.filename,
      planilha_id: planilhaId
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar planilhas importadas
app.get('/api/planilhas', (req, res) => {
  const { hotel_id } = req.query;
  
  let planilhasFiltradas = planilhasImportadas;
  
  if (hotel_id) {
    planilhasFiltradas = planilhasImportadas.filter(p => p.hotel_id === parseInt(hotel_id));
  }
  
  res.json({
    success: true,
    data: planilhasFiltradas
  });
});

// Rota para excluir tarifas por planilha
app.delete('/api/planilhas/:planilha_id', (req, res) => {
  try {
    const { planilha_id } = req.params;
    
    // Encontrar a planilha
    const planilhaIndex = planilhasImportadas.findIndex(p => p.id === planilha_id);
    if (planilhaIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Planilha não encontrada' 
      });
    }
    
    const planilha = planilhasImportadas[planilhaIndex];
    
    // Contar quantas tarifas serão removidas
    const tarifasParaRemover = tarifas.filter(t => t.planilha_id === planilha_id);
    const quantidadeRemovida = tarifasParaRemover.length;
    
    // Remover todas as tarifas associadas à planilha
    for (let i = tarifas.length - 1; i >= 0; i--) {
      if (tarifas[i].planilha_id === planilha_id) {
        tarifas.splice(i, 1);
      }
    }
    
    // Remover a planilha da lista
    planilhasImportadas.splice(planilhaIndex, 1);
    
    // Tentar remover o arquivo físico (opcional)
    try {
      const fs = require('fs');
      const path = require('path');
      const arquivoPath = path.join(__dirname, '../uploads', planilha.arquivo_salvo);
      if (fs.existsSync(arquivoPath)) {
        fs.unlinkSync(arquivoPath);
      }
    } catch (fileError) {
      console.warn('Não foi possível remover o arquivo físico:', fileError.message);
    }
    
    res.json({
      success: true,
      message: `Planilha "${planilha.nome_arquivo}" removida com sucesso`,
      tarifas_removidas: quantidadeRemovida,
      hotel_nome: planilha.hotel_nome
    });
    
  } catch (error) {
    console.error('Erro ao excluir planilha:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota para análise comparativa
app.get('/api/analise/comparativo', (req, res) => {
  const { hotel_id, data_inicio, data_fim } = req.query;
  
  if (!hotel_id || !data_inicio || !data_fim) {
    return res.status(400).json({ 
      success: false, 
      error: 'Parâmetros obrigatórios: hotel_id, data_inicio, data_fim' 
    });
  }

  const hotel = hoteis.find(h => h.id === parseInt(hotel_id));
  if (!hotel) {
    return res.status(404).json({ 
      success: false, 
      error: 'Hotel não encontrado' 
    });
  }

  // Filtrar tarifas do hotel principal no período
  const tarifasHotelPrincipal = tarifas.filter(t => 
    t.hotel_id === parseInt(hotel_id) &&
    new Date(t.data) >= new Date(data_inicio) &&
    new Date(t.data) <= new Date(data_fim)
  );

  // Calcular preço médio do hotel principal
  const precoMedioHotelPrincipal = tarifasHotelPrincipal.length > 0 
    ? tarifasHotelPrincipal.reduce((sum, t) => sum + t.preco, 0) / tarifasHotelPrincipal.length
    : 0;

  // Buscar dados dos concorrentes
  const concorrentesData = hotel.concorrentes.map((concorrenteNome) => {
    const concorrenteHotel = hoteis.find(h => h.nome === concorrenteNome);
    const concorrenteId = concorrenteHotel ? concorrenteHotel.id : null;
    
    // Filtrar tarifas do concorrente no período
    const tarifasConcorrente = concorrenteId 
      ? tarifas.filter(t => 
          t.hotel_id === concorrenteId &&
          new Date(t.data) >= new Date(data_inicio) &&
          new Date(t.data) <= new Date(data_fim)
        )
      : [];

    // Calcular preço médio se houver tarifas, senão usar preço médio geral
    let precoMedioConcorrente;
    if (tarifasConcorrente.length > 0) {
      precoMedioConcorrente = tarifasConcorrente.reduce((sum, t) => sum + t.preco, 0) / tarifasConcorrente.length;
    } else {
      // Se não há tarifas no período, buscar tarifas gerais do concorrente
      const todasTarifasConcorrente = concorrenteId 
        ? tarifas.filter(t => t.hotel_id === concorrenteId)
        : [];
      precoMedioConcorrente = todasTarifasConcorrente.length > 0
        ? todasTarifasConcorrente.reduce((sum, t) => sum + t.preco, 0) / todasTarifasConcorrente.length
        : null;
    }

    // Incluir concorrente se houver pelo menos alguma tarifa cadastrada
    if (precoMedioConcorrente === null) {
      return null;
    }

    return {
      id: concorrenteId,
      nome: concorrenteNome,
      preco_medio: precoMedioConcorrente,
      total_tarifas: tarifasConcorrente.length,
      diferenca_percentual: precoMedioHotelPrincipal > 0 
        ? ((precoMedioConcorrente - precoMedioHotelPrincipal) / precoMedioHotelPrincipal * 100)
        : 0
    };
  }).filter(concorrente => concorrente !== null); // Remover concorrentes sem tarifas

  // Gerar dados do gráfico baseados nas tarifas reais cadastradas
  const datasUnicas = [...new Set(tarifasHotelPrincipal.map(t => t.data))].sort();
  const graficoEvolucao = [];
  
  // Incluir todas as datas onde há tarifas do hotel principal
  datasUnicas.forEach(data => {
    const dataFormatada = new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    // Preço do hotel principal nesta data
    const tarifaHotelData = tarifasHotelPrincipal.find(t => t.data === data);
    if (!tarifaHotelData) return;
    
    // Preços dos concorrentes nesta data (incluir null se não houver tarifa)
    const precosConcorrentes = {};
    
    concorrentesData.forEach(concorrente => {
      const tarifaConcorrenteData = tarifas.find(t => 
        t.hotel_id === concorrente.id && t.data === data
      );
      
      // Incluir preço se existir, senão incluir null
      precosConcorrentes[concorrente.nome] = tarifaConcorrenteData 
        ? tarifaConcorrenteData.preco 
        : null;
    });
    
    // Sempre adicionar ao gráfico se há tarifa do hotel principal
    graficoEvolucao.push({
      data: dataFormatada,
      [hotel.nome]: tarifaHotelData.preco,
      ...precosConcorrentes
    });
  });

  // Se não há dados de evolução, criar dados sintéticos para demonstração
  if (graficoEvolucao.length === 0 && tarifasHotelPrincipal.length > 0) {
    // Criar dados baseados nas tarifas existentes
    tarifasHotelPrincipal.forEach(tarifa => {
      const dataFormatada = new Date(tarifa.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const precosConcorrentes = {};
      concorrentesData.forEach(concorrente => {
        // Usar preço médio do concorrente como base
        precosConcorrentes[concorrente.nome] = concorrente.preco_medio;
      });
      
      graficoEvolucao.push({
        data: dataFormatada,
        [hotel.nome]: tarifa.preco,
        ...precosConcorrentes
      });
    });
  }

  const dadosComparativos = {
    hotel_principal: {
      id: hotel.id,
      nome: hotel.nome,
      preco_medio: precoMedioHotelPrincipal,
      total_tarifas: tarifasHotelPrincipal.length
    },
    concorrentes: concorrentesData,
    periodo: {
      inicio: data_inicio,
      fim: data_fim
    },
    resumo: {
      total_hoteis_analisados: 1 + concorrentesData.length,
      preco_medio_mercado: concorrentesData.length > 0 
        ? (precoMedioHotelPrincipal + concorrentesData.reduce((sum, c) => sum + c.preco_medio, 0)) / (concorrentesData.length + 1)
        : precoMedioHotelPrincipal,
      posicao_ranking: 1,
      economia_media: concorrentesData.length > 0
        ? concorrentesData.reduce((sum, c) => sum + Math.max(0, c.preco_medio - precoMedioHotelPrincipal), 0) / concorrentesData.length
        : 0
    },
    grafico_evolucao: graficoEvolucao,
    insights: [
      `Foram analisadas ${tarifasHotelPrincipal.length} tarifas do ${hotel.nome} no período selecionado`,
      `Preço médio do ${hotel.nome}: R$ ${precoMedioHotelPrincipal.toFixed(2)}`,
      ...concorrentesData.map(concorrente => 
        `${concorrente.nome} está ${concorrente.diferenca_percentual.toFixed(2)}% ${concorrente.diferenca_percentual >= 0 ? 'mais caro' : 'mais barato'} que ${hotel.nome}`
      ),
      `${hotel.nome} está ${concorrentesData.filter(c => c.preco_medio > precoMedioHotelPrincipal).length > 0 ? 'mais barato que ' + Math.round((concorrentesData.filter(c => c.preco_medio > precoMedioHotelPrincipal).length / concorrentesData.length) * 100) + '%' : 'com preços similares aos'} dos concorrentes analisados`
    ]
  };

  res.json({
    success: true,
    data: dadosComparativos
  });
});

// Rota para verificar se o servidor está rodando
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// Todas as outras rotas servem o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

