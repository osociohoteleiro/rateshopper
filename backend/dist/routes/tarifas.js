"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
/**
 * GET /api/tarifas
 * Lista tarifas com paginação e filtros
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        // Filtros
        const filtros = {
            hotel_id: req.query.hotel_id ? parseInt(req.query.hotel_id) : undefined,
            data_inicio: req.query.data_inicio ? new Date(req.query.data_inicio) : undefined,
            data_fim: req.query.data_fim ? new Date(req.query.data_fim) : undefined,
            preco_min: req.query.preco_min ? parseFloat(req.query.preco_min) : undefined,
            preco_max: req.query.preco_max ? parseFloat(req.query.preco_max) : undefined,
            canal: req.query.canal,
            tipo_quarto: req.query.tipo_quarto
        };
        const offset = (page - 1) * perPage;
        // Construir filtros WHERE
        const whereClause = {};
        if (filtros.hotel_id) {
            whereClause.hotel_id = filtros.hotel_id;
        }
        if (filtros.data_inicio && filtros.data_fim) {
            whereClause.data_checkin = {
                [sequelize_1.Op.between]: [filtros.data_inicio, filtros.data_fim]
            };
        }
        else if (filtros.data_inicio) {
            whereClause.data_checkin = {
                [sequelize_1.Op.gte]: filtros.data_inicio
            };
        }
        else if (filtros.data_fim) {
            whereClause.data_checkin = {
                [sequelize_1.Op.lte]: filtros.data_fim
            };
        }
        if (filtros.preco_min !== undefined && filtros.preco_max !== undefined) {
            whereClause.preco = {
                [sequelize_1.Op.between]: [filtros.preco_min, filtros.preco_max]
            };
        }
        else if (filtros.preco_min !== undefined) {
            whereClause.preco = {
                [sequelize_1.Op.gte]: filtros.preco_min
            };
        }
        else if (filtros.preco_max !== undefined) {
            whereClause.preco = {
                [sequelize_1.Op.lte]: filtros.preco_max
            };
        }
        if (filtros.canal) {
            whereClause.canal = {
                [sequelize_1.Op.like]: `%${filtros.canal}%`
            };
        }
        if (filtros.tipo_quarto) {
            whereClause.tipo_quarto = {
                [sequelize_1.Op.like]: `%${filtros.tipo_quarto}%`
            };
        }
        const { count, rows } = await models_1.Tarifa.findAndCountAll({
            where: whereClause,
            limit: perPage,
            offset: offset,
            order: [['created_at', 'DESC']],
            include: [{
                    model: models_1.Hotel,
                    as: 'hotel',
                    attributes: ['id', 'nome', 'localizacao']
                }]
        });
        const pagination = {
            page,
            per_page: perPage,
            total: count,
            pages: Math.ceil(count / perPage)
        };
        const response = {
            success: true,
            data: rows,
            pagination
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao listar tarifas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /api/tarifas/:id
 * Busca uma tarifa específica
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tarifa = await models_1.Tarifa.findByPk(id, {
            include: [{
                    model: models_1.Hotel,
                    as: 'hotel',
                    attributes: ['id', 'nome', 'localizacao']
                }]
        });
        if (!tarifa) {
            return res.status(404).json({
                success: false,
                error: 'Tarifa não encontrada'
            });
        }
        const response = {
            success: true,
            data: tarifa
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar tarifa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * POST /api/tarifas
 * Cria uma nova tarifa
 */
router.post('/', async (req, res) => {
    try {
        const { hotel_id, data_checkin, data_checkout, preco, moeda, canal, tipo_quarto } = req.body;
        // Validações
        if (!hotel_id || !data_checkin || !data_checkout || preco === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: hotel_id, data_checkin, data_checkout, preco'
            });
        }
        // Verificar se hotel existe
        const hotel = await models_1.Hotel.findByPk(hotel_id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        // Validar datas
        const checkin = new Date(data_checkin);
        const checkout = new Date(data_checkout);
        if (checkout <= checkin) {
            return res.status(400).json({
                success: false,
                error: 'Data de checkout deve ser posterior à data de checkin'
            });
        }
        // Validar preço
        if (preco < 0) {
            return res.status(400).json({
                success: false,
                error: 'Preço deve ser maior ou igual a zero'
            });
        }
        const novaTarifa = await models_1.Tarifa.create({
            hotel_id,
            data_checkin: checkin,
            data_checkout: checkout,
            preco: parseFloat(preco),
            moeda: moeda || 'BRL',
            canal: canal || null,
            tipo_quarto: tipo_quarto || null
        });
        const tarifaCompleta = await models_1.Tarifa.findByPk(novaTarifa.id, {
            include: [{
                    model: models_1.Hotel,
                    as: 'hotel',
                    attributes: ['id', 'nome', 'localizacao']
                }]
        });
        const response = {
            success: true,
            data: tarifaCompleta,
            message: 'Tarifa criada com sucesso'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Erro ao criar tarifa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * PUT /api/tarifas/:id
 * Atualiza uma tarifa existente
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { hotel_id, data_checkin, data_checkout, preco, moeda, canal, tipo_quarto } = req.body;
        const tarifa = await models_1.Tarifa.findByPk(id);
        if (!tarifa) {
            return res.status(404).json({
                success: false,
                error: 'Tarifa não encontrada'
            });
        }
        // Validações
        if (!hotel_id || !data_checkin || !data_checkout || preco === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: hotel_id, data_checkin, data_checkout, preco'
            });
        }
        // Verificar se hotel existe
        const hotel = await models_1.Hotel.findByPk(hotel_id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        // Validar datas
        const checkin = new Date(data_checkin);
        const checkout = new Date(data_checkout);
        if (checkout <= checkin) {
            return res.status(400).json({
                success: false,
                error: 'Data de checkout deve ser posterior à data de checkin'
            });
        }
        // Validar preço
        if (preco < 0) {
            return res.status(400).json({
                success: false,
                error: 'Preço deve ser maior ou igual a zero'
            });
        }
        await tarifa.update({
            hotel_id,
            data_checkin: checkin,
            data_checkout: checkout,
            preco: parseFloat(preco),
            moeda: moeda || 'BRL',
            canal: canal || null,
            tipo_quarto: tipo_quarto || null
        });
        const tarifaAtualizada = await models_1.Tarifa.findByPk(id, {
            include: [{
                    model: models_1.Hotel,
                    as: 'hotel',
                    attributes: ['id', 'nome', 'localizacao']
                }]
        });
        const response = {
            success: true,
            data: tarifaAtualizada,
            message: 'Tarifa atualizada com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao atualizar tarifa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * DELETE /api/tarifas/:id
 * Remove uma tarifa
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tarifa = await models_1.Tarifa.findByPk(id);
        if (!tarifa) {
            return res.status(404).json({
                success: false,
                error: 'Tarifa não encontrada'
            });
        }
        await tarifa.destroy();
        const response = {
            success: true,
            message: 'Tarifa removida com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao remover tarifa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
