"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const XLSX = __importStar(require("xlsx"));
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Configuração do multer para upload de arquivos
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls'];
        const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos Excel (.xlsx, .xls) são permitidos'));
        }
    }
});
/**
 * POST /api/upload/planilha
 * Upload e processamento de planilha de tarifas
 */
router.post('/planilha', upload.single('arquivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum arquivo foi enviado'
            });
        }
        const { hotel_id } = req.body;
        if (!hotel_id) {
            // Remover arquivo se hotel_id não foi fornecido
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'ID do hotel é obrigatório'
            });
        }
        // Verificar se hotel existe
        const hotel = await models_1.Hotel.findByPk(hotel_id);
        if (!hotel) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        // Criar log de importação
        const logImportacao = await models_1.ImportacaoLog.create({
            hotel_id: parseInt(hotel_id),
            arquivo_nome: req.file.originalname,
            total_registros: 0,
            registros_sucesso: 0,
            registros_erro: 0,
            status: 'processando'
        });
        try {
            // Ler arquivo Excel
            const workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Converter para JSON
            const dadosExcel = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: ''
            }).slice(1) // Pular cabeçalho
                .map((row) => {
                const r = row;
                return {
                    data_checkin: r[0],
                    data_checkout: r[1],
                    preco: r[2],
                    canal: r[3] || 'Booking.com',
                    tipo_quarto: r[4] || 'Standard'
                };
            })
                .filter(row => row.data_checkin && row.data_checkout && row.preco); // Filtrar linhas vazias
            const totalRegistros = dadosExcel.length;
            let registrosSucesso = 0;
            let registrosErro = 0;
            const erros = [];
            // Processar cada linha
            for (let i = 0; i < dadosExcel.length; i++) {
                try {
                    const linha = dadosExcel[i];
                    // Validar e converter datas
                    const dataCheckin = new Date(linha.data_checkin);
                    const dataCheckout = new Date(linha.data_checkout);
                    if (isNaN(dataCheckin.getTime()) || isNaN(dataCheckout.getTime())) {
                        throw new Error(`Linha ${i + 2}: Datas inválidas`);
                    }
                    if (dataCheckout <= dataCheckin) {
                        throw new Error(`Linha ${i + 2}: Data de checkout deve ser posterior à data de checkin`);
                    }
                    // Validar preço
                    const preco = parseFloat(linha.preco.toString().replace(',', '.'));
                    if (isNaN(preco) || preco < 0) {
                        throw new Error(`Linha ${i + 2}: Preço inválido`);
                    }
                    // Criar tarifa
                    await models_1.Tarifa.create({
                        hotel_id: parseInt(hotel_id),
                        data_checkin: dataCheckin,
                        data_checkout: dataCheckout,
                        preco: preco,
                        moeda: 'BRL',
                        canal: linha.canal || 'Booking.com',
                        tipo_quarto: linha.tipo_quarto || 'Standard'
                    });
                    registrosSucesso++;
                }
                catch (error) {
                    registrosErro++;
                    erros.push(error.message);
                }
            }
            // Atualizar log de importação
            const status = registrosErro === 0 ? 'sucesso' :
                registrosSucesso === 0 ? 'erro' : 'sucesso_com_erros';
            await logImportacao.update({
                total_registros: totalRegistros,
                registros_sucesso: registrosSucesso,
                registros_erro: registrosErro,
                status: status
            });
            // Remover arquivo após processamento
            fs_1.default.unlinkSync(req.file.path);
            const resultado = {
                success: registrosSucesso > 0,
                message: `Processamento concluído. ${registrosSucesso} registros importados com sucesso, ${registrosErro} com erro.`,
                total_registros: totalRegistros,
                registros_sucesso: registrosSucesso,
                registros_erro: registrosErro,
                erros: erros.slice(0, 10) // Limitar a 10 erros para não sobrecarregar a resposta
            };
            const response = {
                success: true,
                data: resultado
            };
            res.json(response);
        }
        catch (error) {
            // Atualizar log com erro
            await logImportacao.update({
                status: 'erro'
            });
            // Remover arquivo em caso de erro
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            throw error;
        }
    }
    catch (error) {
        console.error('Erro no upload:', error);
        // Remover arquivo se ainda existir
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno do servidor'
        });
    }
});
/**
 * GET /api/upload/modelo
 * Download do modelo de planilha Excel
 */
router.get('/modelo', (req, res) => {
    try {
        // Criar dados de exemplo
        const dadosExemplo = [
            ['Data Check-in', 'Data Check-out', 'Preço', 'Canal', 'Tipo de Quarto'],
            ['2024-01-15', '2024-01-17', '250.00', 'Booking.com', 'Standard'],
            ['2024-01-20', '2024-01-22', '280.50', 'Expedia', 'Deluxe'],
            ['2024-01-25', '2024-01-27', '320.00', 'Airbnb', 'Suite']
        ];
        // Criar workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(dadosExemplo);
        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarifas');
        // Gerar buffer do arquivo
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        // Configurar headers para download
        res.setHeader('Content-Disposition', 'attachment; filename="modelo_tarifas.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error('Erro ao gerar modelo:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar modelo de planilha'
        });
    }
});
/**
 * GET /api/upload/logs
 * Lista logs de importação
 */
router.get('/logs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const offset = (page - 1) * perPage;
        const { count, rows } = await models_1.ImportacaoLog.findAndCountAll({
            limit: perPage,
            offset: offset,
            order: [['created_at', 'DESC']],
            include: [{
                    model: models_1.Hotel,
                    as: 'hotel',
                    attributes: ['id', 'nome']
                }]
        });
        const response = {
            success: true,
            data: {
                logs: rows,
                pagination: {
                    page,
                    per_page: perPage,
                    total: count,
                    pages: Math.ceil(count / perPage)
                }
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao listar logs:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
