import { Router, Request, Response } from 'express';
import { Hotel, Tarifa } from '../models';
import { IHotel, IApiResponse, IPaginatedResponse, IPaginacao } from '../types';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/hotels
 * Lista todos os hotéis com paginação
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 10;
    const search = req.query.search as string;

    const offset = (page - 1) * perPage;
    
    // Construir filtros
    const whereClause: any = {};
    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { localizacao: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Hotel.findAndCountAll({
      where: whereClause,
      limit: perPage,
      offset: offset,
      order: [['nome', 'ASC']],
      include: [
        {
          model: Hotel,
          as: 'concorrentes',
          attributes: ['id', 'nome']
        },
        {
          model: Tarifa,
          as: 'tarifas',
          attributes: [],
          required: false
        }
      ],
      distinct: true
    });

    const pagination: IPaginacao = {
      page,
      per_page: perPage,
      total: count,
      pages: Math.ceil(count / perPage)
    };

    const response: IPaginatedResponse<IHotel[]> = {
      success: true,
      data: rows,
      pagination
    };

    res.json(response);
  } catch (error) {
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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hotel = await Hotel.findByPk(id, {
      include: [
        {
          model: Hotel,
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

    const response: IApiResponse<IHotel> = {
      success: true,
      data: hotel
    };

    res.json(response);
  } catch (error) {
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
router.post('/', async (req: Request, res: Response) => {
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
    const hotelExistente = await Hotel.findOne({
      where: { nome: nome.trim() }
    });

    if (hotelExistente) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um hotel com este nome'
      });
    }

    const novoHotel = await Hotel.create({
      nome: nome.trim(),
      url_booking: url_booking?.trim() || null,
      localizacao: localizacao?.trim() || null
    });

    const response: IApiResponse<IHotel> = {
      success: true,
      data: novoHotel,
      message: 'Hotel criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, url_booking, localizacao } = req.body;

    const hotel = await Hotel.findByPk(id);
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
    const hotelExistente = await Hotel.findOne({
      where: { 
        nome: nome.trim(),
        id: { [Op.ne]: id }
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

    const response: IApiResponse<IHotel> = {
      success: true,
      data: hotel,
      message: 'Hotel atualizado com sucesso'
    };

    res.json(response);
  } catch (error) {
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }

    // Verificar se há tarifas associadas
    const totalTarifas = await Tarifa.count({
      where: { hotel_id: id }
    });

    if (totalTarifas > 0) {
      return res.status(409).json({
        success: false,
        error: `Não é possível excluir o hotel. Existem ${totalTarifas} tarifas associadas.`
      });
    }

    await hotel.destroy();

    const response: IApiResponse = {
      success: true,
      message: 'Hotel removido com sucesso'
    };

    res.json(response);
  } catch (error) {
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
router.get('/:id/concorrentes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hotel = await Hotel.findByPk(id, {
      include: [{
        model: Hotel,
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

    const response: IApiResponse<IHotel[]> = {
      success: true,
      data: (hotel as any).concorrentes || []
    };

    res.json(response);
  } catch (error) {
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
router.post('/:id/concorrentes', async (req: Request, res: Response) => {
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
      Hotel.findByPk(id),
      Hotel.findByPk(concorrente_id)
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
    await (hotel as any).addConcorrente(concorrente);

    const response: IApiResponse = {
      success: true,
      message: 'Concorrente adicionado com sucesso'
    };

    res.json(response);
  } catch (error) {
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
router.delete('/:id/concorrentes/:concorrente_id', async (req: Request, res: Response) => {
  try {
    const { id, concorrente_id } = req.params;

    const [hotel, concorrente] = await Promise.all([
      Hotel.findByPk(id),
      Hotel.findByPk(concorrente_id)
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
    await (hotel as any).removeConcorrente(concorrente);

    const response: IApiResponse = {
      success: true,
      message: 'Concorrente removido com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao remover concorrente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;

