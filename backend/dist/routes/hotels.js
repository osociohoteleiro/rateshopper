"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
/**
 * GET /api/hotels
 * Lista todos os hotéis com paginação
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const search = req.query.search;
        const offset = (page - 1) * perPage;
        // Construir filtros
        const whereClause = {};
        if (search) {
            whereClause[sequelize_1.Op.or] = [
                { nome: { [sequelize_1.Op.like]: `%${search}%` } },
                { localizacao: { [sequelize_1.Op.like]: `%${search}%` } }
            ];
        }
        const { count, rows } = await models_1.Hotel.findAndCountAll({
            where: whereClause,
            limit: perPage,
            offset: offset,
            order: [['nome', 'ASC']],
            include: [
                {
                    model: models_1.Hotel,
                    as: 'concorrentes',
                    attributes: ['id', 'nome']
                },
                {
                    model: models_1.Tarifa,
                    as: 'tarifas',
                    attributes: [],
                    required: false
                }
            ],
            distinct: true
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
        console.error('Erro ao listar hotéis:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /api/hotels/:id
 * Busca um hotel específico
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await models_1.Hotel.findByPk(id, {
            include: [
                {
                    model: models_1.Hotel,
                    as: 'concorrentes',
                    attributes: ['id', 'nome', 'localizacao']
                }
            ]
        });
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        const response = {
            success: true,
            data: hotel
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * POST /api/hotels
 * Cria um novo hotel
 */
router.post('/', async (req, res) => {
    try {
        const { nome, url_booking, localizacao } = req.body;
        // Validações
        if (!nome || nome.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Nome do hotel é obrigatório'
            });
        }
        // Verificar se já existe hotel com o mesmo nome
        const hotelExistente = await models_1.Hotel.findOne({
            where: { nome: nome.trim() }
        });
        if (hotelExistente) {
            return res.status(409).json({
                success: false,
                error: 'Já existe um hotel com este nome'
            });
        }
        const novoHotel = await models_1.Hotel.create({
            nome: nome.trim(),
            url_booking: url_booking?.trim() || null,
            localizacao: localizacao?.trim() || null
        });
        const response = {
            success: true,
            data: novoHotel,
            message: 'Hotel criado com sucesso'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Erro ao criar hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * PUT /api/hotels/:id
 * Atualiza um hotel existente
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, url_booking, localizacao } = req.body;
        const hotel = await models_1.Hotel.findByPk(id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        // Validações
        if (!nome || nome.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Nome do hotel é obrigatório'
            });
        }
        // Verificar se já existe outro hotel com o mesmo nome
        const hotelExistente = await models_1.Hotel.findOne({
            where: {
                nome: nome.trim(),
                id: { [sequelize_1.Op.ne]: id }
            }
        });
        if (hotelExistente) {
            return res.status(409).json({
                success: false,
                error: 'Já existe outro hotel com este nome'
            });
        }
        await hotel.update({
            nome: nome.trim(),
            url_booking: url_booking?.trim() || null,
            localizacao: localizacao?.trim() || null
        });
        const response = {
            success: true,
            data: hotel,
            message: 'Hotel atualizado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao atualizar hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * DELETE /api/hotels/:id
 * Remove um hotel
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await models_1.Hotel.findByPk(id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        // Verificar se há tarifas associadas
        const totalTarifas = await models_1.Tarifa.count({
            where: { hotel_id: id }
        });
        if (totalTarifas > 0) {
            return res.status(409).json({
                success: false,
                error: `Não é possível excluir o hotel. Existem ${totalTarifas} tarifas associadas.`
            });
        }
        await hotel.destroy();
        const response = {
            success: true,
            message: 'Hotel removido com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao remover hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /api/hotels/:id/concorrentes
 * Lista concorrentes de um hotel
 */
router.get('/:id/concorrentes', async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await models_1.Hotel.findByPk(id, {
            include: [{
                    model: models_1.Hotel,
                    as: 'concorrentes',
                    attributes: ['id', 'nome', 'localizacao']
                }]
        });
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        const response = {
            success: true,
            data: hotel.concorrentes || []
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao listar concorrentes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * POST /api/hotels/:id/concorrentes
 * Adiciona um concorrente a um hotel
 */
router.post('/:id/concorrentes', async (req, res) => {
    try {
        const { id } = req.params;
        const { concorrente_id } = req.body;
        if (!concorrente_id) {
            return res.status(400).json({
                success: false,
                error: 'ID do concorrente é obrigatório'
            });
        }
        if (id === concorrente_id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Um hotel não pode ser concorrente de si mesmo'
            });
        }
        const [hotel, concorrente] = await Promise.all([
            models_1.Hotel.findByPk(id),
            models_1.Hotel.findByPk(concorrente_id)
        ]);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        if (!concorrente) {
            return res.status(404).json({
                success: false,
                error: 'Concorrente não encontrado'
            });
        }
        // Adicionar concorrente
        await hotel.addConcorrente(concorrente);
        const response = {
            success: true,
            message: 'Concorrente adicionado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao adicionar concorrente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * DELETE /api/hotels/:id/concorrentes/:concorrente_id
 * Remove um concorrente de um hotel
 */
router.delete('/:id/concorrentes/:concorrente_id', async (req, res) => {
    try {
        const { id, concorrente_id } = req.params;
        const [hotel, concorrente] = await Promise.all([
            models_1.Hotel.findByPk(id),
            models_1.Hotel.findByPk(concorrente_id)
        ]);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }
        if (!concorrente) {
            return res.status(404).json({
                success: false,
                error: 'Concorrente não encontrado'
            });
        }
        // Remover concorrente
        await hotel.removeConcorrente(concorrente);
        const response = {
            success: true,
            message: 'Concorrente removido com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao remover concorrente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
