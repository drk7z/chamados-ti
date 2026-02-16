const express = require('express');
const { Op } = require('sequelize');
const { LogSistema, User } = require('../../models');
const { isGlobalAdmin } = require('../../middlewares/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      modulo,
      acao,
      usuario_id,
      entidade,
      busca,
      data_inicio,
      data_fim
    } = req.query;

    const where = {};

    if (modulo) where.modulo = modulo;
    if (acao) where.acao = acao;
    if (entidade) where.entidade = entidade;
    if (usuario_id) where.usuario_id = usuario_id;

    if (busca) {
      where[Op.or] = [
        { descricao: { [Op.iLike]: `%${busca}%` } },
        { modulo: { [Op.iLike]: `%${busca}%` } },
        { acao: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    if (data_inicio || data_fim) {
      where.created_at = {};
      if (data_inicio) where.created_at[Op.gte] = new Date(data_inicio);
      if (data_fim) where.created_at[Op.lte] = new Date(data_fim);
    }

    const globalAdmin = isGlobalAdmin(req.user);

    if (!globalAdmin) {
      where.usuario_id = req.user.id;
    }

    const pageNumber = parseInt(page);
    const pageSize = Math.min(parseInt(limit), 200);

    const { count, rows } = await LogSistema.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize
    });

    res.json({
      logs: rows,
      total: count,
      page: pageNumber,
      totalPages: Math.ceil(count / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
