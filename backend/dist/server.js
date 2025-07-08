"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
// Carrega variáveis de ambiente
dotenv_1.default.config();
// Inicializa o app Express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Servir arquivos estáticos do frontend
app.use(express_1.default.static(path_1.default.join(__dirname, '../../frontend/dist')));
// Configuração do banco de dados
const sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: path_1.default.join(__dirname, '../database/database.sqlite'),
    logging: false
});
// Teste de conexão com o banco de dados
sequelize.authenticate()
    .then(() => {
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
})
    .catch(err => {
    console.error('❌ Erro ao conectar com o banco de dados:', err);
});
// Dados em memória (temporário até implementar os modelos)
let hotels = [
    {
        id: 1,
        nome: 'Hotel Exemplo',
        url_booking: 'https://booking.com/hotel-exemplo',
        ativo: true,
        concorrentes: []
    }
];
let tarifas = [
    {
        id: 1,
        hotel_id: 1,
        data_checkin: '2025-01-15',
        data_checkout: '2025-01-16',
        preco: 250.00,
        moeda: 'BRL',
        data_importacao: new Date().toISOString()
    },
    {
        id: 2,
        hotel_id: 1,
        data_checkin: '2025-01-16',
        data_checkout: '2025-01-17',
        preco: 280.00,
        moeda: 'BRL',
        data_importacao: new Date().toISOString()
    }
];
let importacoes = [
    {
        id: 1,
        hotel_id: 1,
        arquivo: 'exemplo.xlsx',
        registros_importados: 2,
        data_importacao: new Date().toISOString(),
        status: 'sucesso'
    }
];
// API Routes
// Estatísticas
app.get('/api/estatisticas', (req, res) => {
    try {
        const stats = {
            total_tarifas: tarifas.length,
            total_hoteis: hotels.filter(h => h.ativo).length,
            total_concorrentes: hotels.reduce((acc, hotel) => acc + (hotel.concorrentes?.length || 0), 0),
            ultima_importacao: importacoes.length > 0 ? importacoes[importacoes.length - 1].data_importacao : null
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// Hotéis
app.get('/api/hotels', (req, res) => {
    try {
        res.json({
            success: true,
            data: hotels.filter(h => h.ativo)
        });
    }
    catch (error) {
        console.error('Erro ao buscar hotéis:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
app.post('/api/hotels', (req, res) => {
    try {
        const { nome, url_booking } = req.body;
        if (!nome || !url_booking) {
            return res.status(400).json({
                success: false,
                error: 'Nome e URL da Booking são obrigatórios'
            });
        }
        const novoHotel = {
            id: hotels.length + 1,
            nome,
            url_booking,
            ativo: true,
            concorrentes: []
        };
        hotels.push(novoHotel);
        res.json({
            success: true,
            data: novoHotel
        });
    }
    catch (error) {
        console.error('Erro ao criar hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// Tarifas
app.get('/api/tarifas', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const hotelId = req.query.hotel_id;
        let filteredTarifas = tarifas;
        if (hotelId) {
            filteredTarifas = tarifas.filter(t => t.hotel_id === parseInt(hotelId));
        }
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedTarifas = filteredTarifas.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: paginatedTarifas,
            pagination: {
                page,
                per_page: perPage,
                total: filteredTarifas.length,
                total_pages: Math.ceil(filteredTarifas.length / perPage)
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar tarifas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// Upload de planilhas
app.post('/api/upload', (req, res) => {
    try {
        const { hotel_id, dados } = req.body;
        if (!hotel_id || !dados || !Array.isArray(dados)) {
            return res.status(400).json({
                success: false,
                error: 'Hotel ID e dados são obrigatórios'
            });
        }
        const hotel = hotels.find(h => h.id === parseInt(hotel_id));
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        const novasTarifas = dados.map((linha, index) => ({
            id: tarifas.length + index + 1,
            hotel_id: parseInt(hotel_id),
            data_checkin: linha.data_checkin,
            data_checkout: linha.data_checkout,
            preco: parseFloat(linha.preco),
            moeda: 'BRL',
            data_importacao: new Date().toISOString()
        }));
        tarifas.push(...novasTarifas);
        const importacao = {
            id: importacoes.length + 1,
            hotel_id: parseInt(hotel_id),
            arquivo: 'planilha.xlsx',
            registros_importados: novasTarifas.length,
            data_importacao: new Date().toISOString(),
            status: 'sucesso'
        };
        importacoes.push(importacao);
        res.json({
            success: true,
            data: {
                registros_importados: novasTarifas.length,
                importacao_id: importacao.id
            }
        });
    }
    catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// Análise comparativa
app.get('/api/analise/comparativo', (req, res) => {
    try {
        const { hotel_id, data_inicio, data_fim } = req.query;
        if (!hotel_id || !data_inicio || !data_fim) {
            return res.status(400).json({
                success: false,
                error: 'Hotel ID, data início e data fim são obrigatórios'
            });
        }
        const hotel = hotels.find(h => h.id === parseInt(hotel_id));
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        const tarifasHotel = tarifas.filter(t => t.hotel_id === parseInt(hotel_id) &&
            t.data_checkin >= data_inicio &&
            t.data_checkout <= data_fim);
        const precoMedio = tarifasHotel.length > 0
            ? tarifasHotel.reduce((acc, t) => acc + t.preco, 0) / tarifasHotel.length
            : 0;
        const analise = {
            hotel_foco: hotel.nome,
            periodo: {
                inicio: data_inicio,
                fim: data_fim
            },
            preco_medio_hotel: precoMedio,
            total_tarifas: tarifasHotel.length,
            total_concorrentes: hotel.concorrentes?.length || 0,
            comparativo_concorrentes: [],
            insights: [
                `Foram analisadas ${tarifasHotel.length} tarifas no período selecionado`,
                `Preço médio do ${hotel.nome}: R$ ${precoMedio.toFixed(2)}`,
                'Configure concorrentes para este hotel para ver análise comparativa detalhada'
            ]
        };
        res.json({
            success: true,
            data: analise
        });
    }
    catch (error) {
        console.error('Erro na análise:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// Rota catch-all para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../frontend/dist/index.html'));
});
// Iniciar servidor
const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Servidor Rate Shopper rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});
exports.default = app;
