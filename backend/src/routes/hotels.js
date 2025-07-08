const express = require('express');
const router = express.Router();
const { Hotel } = require('../models');

// Listar hotéis
router.get('/', async (req, res) => {
  try {
    const hoteis = await Hotel.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']]
    });
    
    res.json({
      success: true,
      data: hoteis
    });
  } catch (error) {
    console.error('Erro ao buscar hotéis:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Criar novo hotel
router.post('/', async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);
    
    const { nome, url_booking, localizacao } = req.body;
    
    if (!nome) {
      return res.status(400).json({
        success: false,
        error: 'Nome do hotel é obrigatório'
      });
    }
    
    // Criar hotel com os campos disponíveis
    const hotelData = {
      nome,
      url_booking: url_booking || '',
      localizacao: localizacao || null,
      ativo: true,
      concorrentes: []
    };
    
    console.log('Dados para criação:', hotelData);
    
    const novoHotel = await Hotel.create(hotelData);
    
    console.log('Hotel criado:', novoHotel.id);
    
    res.json({
      success: true,
      data: novoHotel
    });
  } catch (error) {
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    });
  }
});

// Obter hotel por ID
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('Erro ao buscar hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar hotel
router.put('/:id', async (req, res) => {
  try {
    console.log('Dados para atualização:', req.body);
    
    const { nome, url_booking, localizacao, concorrentes } = req.body;
    
    const hotel = await Hotel.findByPk(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    const updateData = {
      nome: nome || hotel.nome,
      url_booking: url_booking || hotel.url_booking,
      localizacao: localizacao !== undefined ? localizacao : hotel.localizacao,
      concorrentes: concorrentes !== undefined ? concorrentes : hotel.concorrentes
    };
    
    console.log('Dados de atualização:', updateData);
    
    await hotel.update(updateData);
    
    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('Erro ao atualizar hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar hotel (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    await hotel.update({ ativo: false });
    
    res.json({
      success: true,
      message: 'Hotel removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Adicionar concorrente
router.post('/:id/concorrentes', async (req, res) => {
  try {
    const { concorrente_id } = req.body;
    
    if (!concorrente_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do concorrente é obrigatório'
      });
    }
    
    const hotel = await Hotel.findByPk(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    const concorrente = await Hotel.findByPk(concorrente_id);
    
    if (!concorrente) {
      return res.status(404).json({
        success: false,
        error: 'Hotel concorrente não encontrado'
      });
    }
    
    // Verificar se já é concorrente
    const concorrentes = hotel.concorrentes || [];
    if (concorrentes.some(c => c.id === parseInt(concorrente_id))) {
      return res.status(400).json({
        success: false,
        error: 'Este hotel já é um concorrente'
      });
    }
    
    // Adicionar concorrente
    concorrentes.push({
      id: parseInt(concorrente_id),
      nome: concorrente.nome
    });
    
    await hotel.update({ concorrentes });
    
    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('Erro ao adicionar concorrente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Remover concorrente
router.delete('/:id/concorrentes/:concorrente_id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    // Remover concorrente
    const concorrentes = hotel.concorrentes || [];
    const concorrenteId = parseInt(req.params.concorrente_id);
    
    const novosConcorrentes = concorrentes.filter(c => c.id !== concorrenteId);
    
    if (concorrentes.length === novosConcorrentes.length) {
      return res.status(404).json({
        success: false,
        error: 'Concorrente não encontrado'
      });
    }
    
    await hotel.update({ concorrentes: novosConcorrentes });
    
    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('Erro ao remover concorrente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Listar concorrentes de um hotel
router.get('/:id/concorrentes', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: hotel.concorrentes || []
    });
  } catch (error) {
    console.error('Erro ao listar concorrentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

