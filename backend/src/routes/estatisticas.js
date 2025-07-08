const express = require('express');
const router = express.Router();
const { Hotel, Tarifa, ImportacaoLog } = require('../models');
const { Op } = require('sequelize');

// Rota para obter estatísticas gerais
router.get('/', async (req, res) => {
  try {
    // Contagem de tarifas
    const totalTarifas = await Tarifa.count();
    
    // Contagem de hotéis ativos
    const totalHoteis = await Hotel.count({
      where: { ativo: true }
    });
    
    // Contagem de concorrentes
    const hoteis = await Hotel.findAll({
      attributes: ['concorrentes']
    });
    
    const totalConcorrentes = hoteis.reduce((acc, hotel) => {
      return acc + (hotel.concorrentes?.length || 0);
    }, 0);
    
    // Última importação
    const ultimaImportacao = await ImportacaoLog.findOne({
      order: [['data_importacao', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        total_tarifas: totalTarifas,
        total_hoteis: totalHoteis,
        total_concorrentes: totalConcorrentes,
        ultima_importacao: ultimaImportacao ? ultimaImportacao.data_importacao : null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

