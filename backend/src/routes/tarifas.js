const express = require('express');
const router = express.Router();
const { Tarifa, Hotel } = require('../models');
const { Op } = require('sequelize');

// Listar tarifas com paginação
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const hotelId = req.query.hotel_id;
    
    const whereClause = {};
    
    if (hotelId) {
      whereClause.hotel_id = parseInt(hotelId);
    }
    
    const { count, rows } = await Tarifa.findAndCountAll({
      where: whereClause,
      order: [['data_checkin', 'ASC']],
      limit: perPage,
      offset: (page - 1) * perPage,
      include: [
        {
          model: Hotel,
          attributes: ['nome']
        }
      ]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        per_page: perPage,
        total: count,
        total_pages: Math.ceil(count / perPage)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar tarifas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova tarifa
router.post('/', async (req, res) => {
  try {
    const { hotel_id, data_checkin, data_checkout, preco, moeda } = req.body;
    
    if (!hotel_id || !data_checkin || !data_checkout || !preco) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID, data de check-in, data de check-out e preço são obrigatórios'
      });
    }
    
    const hotel = await Hotel.findByPk(hotel_id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    const novaTarifa = await Tarifa.create({
      hotel_id,
      data_checkin,
      data_checkout,
      preco: parseFloat(preco),
      moeda: moeda || 'BRL'
    });
    
    res.json({
      success: true,
      data: novaTarifa
    });
  } catch (error) {
    console.error('Erro ao criar tarifa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Obter tarifa por ID
router.get('/:id', async (req, res) => {
  try {
    const tarifa = await Tarifa.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          attributes: ['nome']
        }
      ]
    });
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        error: 'Tarifa não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: tarifa
    });
  } catch (error) {
    console.error('Erro ao buscar tarifa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar tarifa
router.put('/:id', async (req, res) => {
  try {
    const { data_checkin, data_checkout, preco, moeda } = req.body;
    
    const tarifa = await Tarifa.findByPk(req.params.id);
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        error: 'Tarifa não encontrada'
      });
    }
    
    await tarifa.update({
      data_checkin: data_checkin || tarifa.data_checkin,
      data_checkout: data_checkout || tarifa.data_checkout,
      preco: preco ? parseFloat(preco) : tarifa.preco,
      moeda: moeda || tarifa.moeda
    });
    
    res.json({
      success: true,
      data: tarifa
    });
  } catch (error) {
    console.error('Erro ao atualizar tarifa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar tarifa
router.delete('/:id', async (req, res) => {
  try {
    const tarifa = await Tarifa.findByPk(req.params.id);
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        error: 'Tarifa não encontrada'
      });
    }
    
    await tarifa.destroy();
    
    res.json({
      success: true,
      message: 'Tarifa removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover tarifa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

