const express = require('express');
const router = express.Router();
const { Hotel, Tarifa } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Análise comparativa
router.get('/comparativo', async (req, res) => {
  try {
    const { hotel_id, data_inicio, data_fim } = req.query;
    
    if (!hotel_id || !data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID, data início e data fim são obrigatórios'
      });
    }
    
    const hotel = await Hotel.findByPk(hotel_id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }
    
    // Buscar tarifas do hotel no período
    const tarifasHotel = await Tarifa.findAll({
      where: {
        hotel_id: parseInt(hotel_id),
        data_checkin: {
          [Op.gte]: data_inicio,
          [Op.lte]: data_fim
        }
      },
      order: [['data_checkin', 'ASC']]
    });
    
    // Calcular preço médio
    const precoMedio = tarifasHotel.length > 0 
      ? tarifasHotel.reduce((acc, t) => acc + t.preco, 0) / tarifasHotel.length 
      : 0;
    
    // Preparar análise
    const analise = {
      hotel_foco: {
        id: hotel.id,
        nome: hotel.nome
      },
      periodo: {
        inicio: data_inicio,
        fim: data_fim
      },
      preco_medio_hotel: precoMedio,
      total_tarifas: tarifasHotel.length,
      total_concorrentes: hotel.concorrentes?.length || 0,
      comparativo_concorrentes: [],
      tabela_precos: {},
      dados_grafico: {
        datas: [],
        series: []
      },
      insights: [
        `Foram analisadas ${tarifasHotel.length} tarifas no período selecionado`,
        `Preço médio do ${hotel.nome}: R$ ${precoMedio.toFixed(2)}`
      ]
    };
    
    // Preparar dados para a tabela e gráfico
    const todasDatas = new Set();
    const dadosPorHotel = {};
    
    // Adicionar dados do hotel principal
    dadosPorHotel[hotel.id] = {
      id: hotel.id,
      nome: hotel.nome,
      tarifas: {},
      precoMedio: precoMedio
    };
    
    // Mapear tarifas do hotel principal por data
    tarifasHotel.forEach(tarifa => {
      const dataFormatada = new Date(tarifa.data_checkin).toISOString().split('T')[0];
      todasDatas.add(dataFormatada);
      
      if (!dadosPorHotel[hotel.id].tarifas[dataFormatada]) {
        dadosPorHotel[hotel.id].tarifas[dataFormatada] = tarifa.preco;
      }
    });
    
    // Se houver concorrentes, buscar suas tarifas
    if (hotel.concorrentes && hotel.concorrentes.length > 0) {
      // Buscar tarifas dos concorrentes
      for (const concorrente of hotel.concorrentes) {
        const hotelConcorrente = await Hotel.findByPk(concorrente.id);
        
        if (hotelConcorrente) {
          const tarifasConcorrente = await Tarifa.findAll({
            where: {
              hotel_id: concorrente.id,
              data_checkin: {
                [Op.gte]: data_inicio,
                [Op.lte]: data_fim
              }
            },
            order: [['data_checkin', 'ASC']]
          });
          
          const precoMedioConcorrente = tarifasConcorrente.length > 0 
            ? tarifasConcorrente.reduce((acc, t) => acc + t.preco, 0) / tarifasConcorrente.length 
            : 0;
          
          // Adicionar ao comparativo
          analise.comparativo_concorrentes.push({
            id: concorrente.id,
            nome_concorrente: hotelConcorrente.nome,
            preco_medio: precoMedioConcorrente,
            total_tarifas: tarifasConcorrente.length,
            variacao_percentual: precoMedio > 0 
              ? ((precoMedioConcorrente - precoMedio) / precoMedio * 100)
              : 0,
            diferenca_preco: precoMedioConcorrente - precoMedio
          });
          
          // Adicionar dados do concorrente para a tabela e gráfico
          dadosPorHotel[concorrente.id] = {
            id: concorrente.id,
            nome: hotelConcorrente.nome,
            tarifas: {},
            precoMedio: precoMedioConcorrente
          };
          
          // Mapear tarifas do concorrente por data
          tarifasConcorrente.forEach(tarifa => {
            const dataFormatada = new Date(tarifa.data_checkin).toISOString().split('T')[0];
            todasDatas.add(dataFormatada);
            
            if (!dadosPorHotel[concorrente.id].tarifas[dataFormatada]) {
              dadosPorHotel[concorrente.id].tarifas[dataFormatada] = tarifa.preco;
            }
          });
          
          // Adicionar insight sobre o concorrente
          if (precoMedioConcorrente > 0) {
            const comparacao = precoMedioConcorrente > precoMedio 
              ? `${((precoMedioConcorrente - precoMedio) / precoMedio * 100).toFixed(2)}% mais caro` 
              : `${((precoMedio - precoMedioConcorrente) / precoMedio * 100).toFixed(2)}% mais barato`;
            
            analise.insights.push(`${hotelConcorrente.nome} está ${comparacao} que ${hotel.nome}`);
          }
        }
      }
      
      // Adicionar insight sobre posicionamento geral
      if (analise.comparativo_concorrentes.length > 0) {
        const concorrentesMaisCaros = analise.comparativo_concorrentes.filter(c => 
          c.variacao_percentual > 0
        ).length;
        
        const percentualMaisCaros = (concorrentesMaisCaros / analise.comparativo_concorrentes.length * 100).toFixed(0);
        
        analise.insights.push(
          `${hotel.nome} está mais barato que ${percentualMaisCaros}% dos concorrentes analisados`
        );
      }
    } else {
      analise.insights.push('Configure concorrentes para este hotel para ver análise comparativa detalhada');
    }
    
    // Ordenar as datas para a tabela e gráfico
    const datasOrdenadas = Array.from(todasDatas).sort();
    
    // Montar a tabela de preços
    analise.tabela_precos = {
      datas: datasOrdenadas,
      hoteis: [
        {
          id: hotel.id,
          nome: hotel.nome,
          precos: datasOrdenadas.map(data => dadosPorHotel[hotel.id].tarifas[data] || null)
        },
        ...Object.values(dadosPorHotel)
          .filter(h => h.id !== parseInt(hotel_id))
          .map(hotelData => ({
            id: hotelData.id,
            nome: hotelData.nome,
            precos: datasOrdenadas.map(data => hotelData.tarifas[data] || null)
          }))
      ]
    };
    
    // Montar os dados para o gráfico
    analise.dados_grafico = {
      datas: datasOrdenadas,
      series: [
        {
          id: hotel.id,
          nome: hotel.nome,
          valores: datasOrdenadas.map(data => dadosPorHotel[hotel.id].tarifas[data] || null)
        },
        ...Object.values(dadosPorHotel)
          .filter(h => h.id !== parseInt(hotel_id))
          .map(hotelData => ({
            id: hotelData.id,
            nome: hotelData.nome,
            valores: datasOrdenadas.map(data => hotelData.tarifas[data] || null)
          }))
      ]
    };
    
    res.json({
      success: true,
      data: analise
    });
  } catch (error) {
    console.error('Erro na análise:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

