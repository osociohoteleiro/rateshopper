"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
/**
 * GET /api/estatisticas
 * Retorna estatísticas gerais do sistema
 */
router.get('/', async (req, res) => {
    try {
        // Buscar estatísticas básicas
        const [totalTarifas, totalHoteis, ultimaImportacao] = await Promise.all([
            models_1.Tarifa.count(),
            models_1.Hotel.count(),
            models_1.ImportacaoLog.findOne({
                order: [['created_at', 'DESC']],
                include: [{
                        model: models_1.Hotel,
                        as: 'hotel',
                        attributes: ['nome']
                    }]
            })
        ]);
        // Calcular total de concorrentes
        let totalConcorrentes = 0;
        try {
            const hoteis = await models_1.Hotel.findAll({
                include: [{
                        model: models_1.Hotel,
                        as: 'concorrentes',
                        attributes: ['id']
                    }]
            });
            totalConcorrentes = hoteis.reduce((total, hotel) => {
                return total + (hotel.concorrentes ? hotel.concorrentes.length : 0);
            }, 0);
        }
        catch (error) {
            console.warn('Erro ao calcular concorrentes:', error);
            totalConcorrentes = 0;
        }
        const estatisticas = {
            total_tarifas: totalTarifas,
            total_hoteis: totalHoteis,
            total_concorrentes: totalConcorrentes,
            ultima_importacao: ultimaImportacao ? {
                id: ultimaImportacao.id,
                hotel_id: ultimaImportacao.hotel_id,
                arquivo_nome: ultimaImportacao.arquivo_nome,
                total_registros: ultimaImportacao.total_registros,
                registros_sucesso: ultimaImportacao.registros_sucesso,
                registros_erro: ultimaImportacao.registros_erro,
                status: ultimaImportacao.status,
                created_at: ultimaImportacao.created_at,
                updated_at: ultimaImportacao.updated_at
            } : null
        };
        const response = {
            success: true,
            data: estatisticas
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        // Retornar dados padrão em caso de erro para evitar quebra do frontend
        const estatisticasPadrao = {
            total_tarifas: 0,
            total_hoteis: 0,
            total_concorrentes: 0,
            ultima_importacao: null
        };
        const response = {
            success: false,
            data: estatisticasPadrao,
            error: 'Erro ao buscar estatísticas'
        };
        res.status(200).json(response); // Status 200 para evitar erro no frontend
    }
});
exports.default = router;
