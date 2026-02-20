const express = require('express');
const { Op } = require('sequelize');
const { LogSistema, User } = require('../../models');
const { isGlobalAdmin } = require('../../middlewares/auth');

const router = express.Router();

const parsePositiveInt = (value, fallback, max = null) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  if (max !== null) {
    return Math.min(parsed, max);
  }

  return parsed;
};

const parseDateParam = (value) => {
  if (!value) return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
};

router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      modulo,
      acao,
      usuario_id,
      entidade,
      entidade_id,
      ip,
      tenant_id,
      busca,
      data_inicio,
      data_fim
    } = req.query;

    const where = {};

    if (modulo) where.modulo = modulo;
    if (acao) where.acao = acao;
    if (entidade) where.entidade = entidade;
    if (entidade_id) where.entidade_id = entidade_id;
    if (usuario_id) where.usuario_id = usuario_id;
    if (ip) where.ip = ip;

    if (tenant_id) {
      where.dados_depois = {
        [Op.contains]: {
          tenant_id: String(tenant_id)
        }
      };
    }

    if (busca) {
      where[Op.or] = [
        { descricao: { [Op.iLike]: `%${busca}%` } },
        { modulo: { [Op.iLike]: `%${busca}%` } },
        { acao: { [Op.iLike]: `%${busca}%` } },
        { entidade: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    if (data_inicio || data_fim) {
      const dataInicio = parseDateParam(data_inicio);
      const dataFim = parseDateParam(data_fim);

      if (data_inicio && dataInicio === undefined) {
        return res.status(400).json({ error: 'data_inicio inválida' });
      }

      if (data_fim && dataFim === undefined) {
        return res.status(400).json({ error: 'data_fim inválida' });
      }

      where.created_at = {};
      if (dataInicio) where.created_at[Op.gte] = dataInicio;
      if (dataFim) where.created_at[Op.lte] = dataFim;
    }

    const globalAdmin = isGlobalAdmin(req.user);

    if (!globalAdmin) {
      where.usuario_id = req.user.id;
    }

    const pageNumber = parsePositiveInt(page, 1);
    const pageSize = parsePositiveInt(limit, 50, 200);

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
      limit: pageSize,
      totalPages: Math.ceil(count / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
