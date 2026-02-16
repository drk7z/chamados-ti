const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Cliente, Unidade, Departamento, CentroCusto } = require('../../models');
const { authorize, isGlobalAdmin } = require('../../middlewares/auth');
const { auditLog } = require('../../utils/audit');

const resolveWriteTenant = (req, requestedTenantId = null) => {
  if (isGlobalAdmin(req.user)) {
    return requestedTenantId || req.tenantId || null;
  }
  return req.tenantId || null;
};

const findClienteScoped = async (req, clienteId) => {
  const where = { id: clienteId };
  if (req.tenantId) where.entidade_id = req.tenantId;
  return Cliente.findOne({ where });
};

const findUnidadeScoped = async (req, unidadeId) => {
  const unidade = await Unidade.findByPk(unidadeId, {
    include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'entidade_id'] }]
  });

  if (!unidade) return null;
  if (req.tenantId && unidade.cliente?.entidade_id !== req.tenantId) return null;

  return unidade;
};

const findDepartamentoScoped = async (req, departamentoId) => {
  const departamento = await Departamento.findByPk(departamentoId, {
    include: [{
      model: Unidade,
      as: 'unidade',
      attributes: ['id', 'cliente_id'],
      include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'entidade_id'] }]
    }]
  });

  if (!departamento) return null;
  if (req.tenantId && departamento.unidade?.cliente?.entidade_id !== req.tenantId) return null;

  return departamento;
};

// Clientes
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, busca, ativo } = req.query;
    const where = {};

    if (ativo === 'false') {
      where.ativo = false;
    } else {
      where.ativo = true;
    }

    if (req.tenantId) where.entidade_id = req.tenantId;

    if (busca) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${busca}%` } },
        { razao_social: { [Op.iLike]: `%${busca}%` } },
        { cnpj: { [Op.iLike]: `%${busca}%` } },
        { email: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    const hasPagination = !!(page || limit || busca);

    if (!hasPagination) {
      const clientes = await Cliente.findAll({
        where,
        order: [['nome', 'ASC']]
      });
      return res.json(clientes);
    }

    const pageNumber = Math.max(parseInt(page || 1, 10), 1);
    const pageSize = Math.min(Math.max(parseInt(limit || 20, 10), 1), 100);

    const { count, rows } = await Cliente.findAndCountAll({
      where,
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
      order: [['nome', 'ASC']]
    });

    res.json({
      clientes: rows,
      total: count,
      page: pageNumber,
      totalPages: Math.ceil(count / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.tenantId) where.entidade_id = req.tenantId;

    const cliente = await Cliente.findOne({
      where,
      include: [{ model: Unidade, as: 'unidades' }]
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('clientes', 'clientes', 'create'), async (req, res, next) => {
  try {
    const entidadeId = resolveWriteTenant(req, req.body.entidade_id || null);

    if (process.env.MULTIEMPRESA === 'true' && !entidadeId) {
      return res.status(403).json({ error: 'Tenant não resolvido para criação de cliente' });
    }

    const cliente = await Cliente.create({
      ...req.body,
      entidade_id: entidadeId,
      criado_por: req.user.id
    });

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'create',
      entidade: 'cliente',
      entidadeId: cliente.id,
      descricao: `Cliente criado: ${cliente.nome}`,
      dadosDepois: cliente.toJSON()
    });

    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize('clientes', 'clientes', 'update'), async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (!isGlobalAdmin(req.user) && req.tenantId) {
      where.entidade_id = req.tenantId;
    }

    const cliente = await Cliente.findOne({ where });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const dadosAntes = cliente.toJSON();
    const payload = { ...req.body };

    if (!isGlobalAdmin(req.user)) {
      delete payload.entidade_id;
      payload.entidade_id = req.tenantId || cliente.entidade_id || null;
    }

    await cliente.update({
      ...payload,
      atualizado_por: req.user.id
    });

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'update',
      entidade: 'cliente',
      entidadeId: cliente.id,
      descricao: `Cliente atualizado: ${cliente.nome}`,
      dadosAntes,
      dadosDepois: cliente.toJSON()
    });

    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorize('clientes', 'clientes', 'delete'), async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (!isGlobalAdmin(req.user) && req.tenantId) {
      where.entidade_id = req.tenantId;
    }

    const cliente = await Cliente.findOne({ where });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const dadosAntes = cliente.toJSON();
    await cliente.destroy();

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'delete',
      entidade: 'cliente',
      entidadeId: cliente.id,
      descricao: `Cliente removido: ${cliente.nome}`,
      dadosAntes,
      dadosDepois: { removido: true }
    });

    res.json({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Unidades
router.get('/:clienteId/unidades', async (req, res, next) => {
  try {
    const cliente = await findClienteScoped(req, req.params.clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const unidades = await Unidade.findAll({
      where: { cliente_id: req.params.clienteId, ativo: true }
    });
    res.json(unidades);
  } catch (error) {
    next(error);
  }
});

router.post('/:clienteId/unidades', authorize('clientes', 'unidades', 'create'), async (req, res, next) => {
  try {
    const cliente = await findClienteScoped(req, req.params.clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const unidade = await Unidade.create({
      ...req.body,
      cliente_id: cliente.id,
      ativo: req.body.ativo ?? true
    });

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'create',
      entidade: 'unidade',
      entidadeId: unidade.id,
      descricao: `Unidade criada: ${unidade.nome}`,
      dadosDepois: unidade.toJSON()
    });

    res.status(201).json(unidade);
  } catch (error) {
    next(error);
  }
});

router.get('/unidades/:unidadeId', async (req, res, next) => {
  try {
    const unidade = await findUnidadeScoped(req, req.params.unidadeId);
    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    res.json(unidade);
  } catch (error) {
    next(error);
  }
});

router.put('/unidades/:unidadeId', authorize('clientes', 'unidades', 'update'), async (req, res, next) => {
  try {
    const unidade = await findUnidadeScoped(req, req.params.unidadeId);
    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    const dadosAntes = unidade.toJSON();
    await unidade.update(req.body);

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'update',
      entidade: 'unidade',
      entidadeId: unidade.id,
      descricao: `Unidade atualizada: ${unidade.nome}`,
      dadosAntes,
      dadosDepois: unidade.toJSON()
    });

    res.json(unidade);
  } catch (error) {
    next(error);
  }
});

router.delete('/unidades/:unidadeId', authorize('clientes', 'unidades', 'delete'), async (req, res, next) => {
  try {
    const unidade = await findUnidadeScoped(req, req.params.unidadeId);
    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    const dadosAntes = unidade.toJSON();
    await unidade.destroy();

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'delete',
      entidade: 'unidade',
      entidadeId: unidade.id,
      descricao: `Unidade removida: ${unidade.nome}`,
      dadosAntes,
      dadosDepois: { removido: true }
    });

    res.json({ message: 'Unidade removida com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Departamentos
router.get('/unidades/:unidadeId/departamentos', async (req, res, next) => {
  try {
    const unidade = await findUnidadeScoped(req, req.params.unidadeId);
    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    const departamentos = await Departamento.findAll({
      where: { unidade_id: req.params.unidadeId, ativo: true }
    });
    res.json(departamentos);
  } catch (error) {
    next(error);
  }
});

router.post('/unidades/:unidadeId/departamentos', authorize('clientes', 'departamentos', 'create'), async (req, res, next) => {
  try {
    const unidade = await findUnidadeScoped(req, req.params.unidadeId);
    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    const departamento = await Departamento.create({
      ...req.body,
      unidade_id: unidade.id,
      ativo: req.body.ativo ?? true
    });

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'create',
      entidade: 'departamento',
      entidadeId: departamento.id,
      descricao: `Departamento criado: ${departamento.nome}`,
      dadosDepois: departamento.toJSON()
    });

    res.status(201).json(departamento);
  } catch (error) {
    next(error);
  }
});

router.put('/departamentos/:departamentoId', authorize('clientes', 'departamentos', 'update'), async (req, res, next) => {
  try {
    const departamento = await findDepartamentoScoped(req, req.params.departamentoId);
    if (!departamento) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    const dadosAntes = departamento.toJSON();
    await departamento.update(req.body);

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'update',
      entidade: 'departamento',
      entidadeId: departamento.id,
      descricao: `Departamento atualizado: ${departamento.nome}`,
      dadosAntes,
      dadosDepois: departamento.toJSON()
    });

    res.json(departamento);
  } catch (error) {
    next(error);
  }
});

router.delete('/departamentos/:departamentoId', authorize('clientes', 'departamentos', 'delete'), async (req, res, next) => {
  try {
    const departamento = await findDepartamentoScoped(req, req.params.departamentoId);
    if (!departamento) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    const dadosAntes = departamento.toJSON();
    await departamento.destroy();

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'delete',
      entidade: 'departamento',
      entidadeId: departamento.id,
      descricao: `Departamento removido: ${departamento.nome}`,
      dadosAntes,
      dadosDepois: { removido: true }
    });

    res.json({ message: 'Departamento removido com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Centros de Custo
router.get('/departamentos/:departamentoId/centros-custo', async (req, res, next) => {
  try {
    const departamento = await findDepartamentoScoped(req, req.params.departamentoId);
    if (!departamento) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    const centrosCusto = await CentroCusto.findAll({
      where: { departamento_id: departamento.id, ativo: true },
      order: [['nome', 'ASC']]
    });

    res.json(centrosCusto);
  } catch (error) {
    next(error);
  }
});

router.post('/departamentos/:departamentoId/centros-custo', authorize('clientes', 'centros_custo', 'create'), async (req, res, next) => {
  try {
    const departamento = await findDepartamentoScoped(req, req.params.departamentoId);
    if (!departamento) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    const centroCusto = await CentroCusto.create({
      ...req.body,
      departamento_id: departamento.id,
      ativo: req.body.ativo ?? true
    });

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'create',
      entidade: 'centro_custo',
      entidadeId: centroCusto.id,
      descricao: `Centro de custo criado: ${centroCusto.nome}`,
      dadosDepois: centroCusto.toJSON()
    });

    res.status(201).json(centroCusto);
  } catch (error) {
    next(error);
  }
});

router.put('/centros-custo/:centroCustoId', authorize('clientes', 'centros_custo', 'update'), async (req, res, next) => {
  try {
    const centroCusto = await CentroCusto.findByPk(req.params.centroCustoId, {
      include: [{
        model: Departamento,
        as: 'departamento',
        include: [{
          model: Unidade,
          as: 'unidade',
          include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'entidade_id'] }]
        }]
      }]
    });

    if (!centroCusto) {
      return res.status(404).json({ error: 'Centro de custo não encontrado' });
    }

    if (req.tenantId && centroCusto.departamento?.unidade?.cliente?.entidade_id !== req.tenantId) {
      return res.status(404).json({ error: 'Centro de custo não encontrado' });
    }

    const dadosAntes = centroCusto.toJSON();
    await centroCusto.update(req.body);

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'update',
      entidade: 'centro_custo',
      entidadeId: centroCusto.id,
      descricao: `Centro de custo atualizado: ${centroCusto.nome}`,
      dadosAntes,
      dadosDepois: centroCusto.toJSON()
    });

    res.json(centroCusto);
  } catch (error) {
    next(error);
  }
});

router.delete('/centros-custo/:centroCustoId', authorize('clientes', 'centros_custo', 'delete'), async (req, res, next) => {
  try {
    const centroCusto = await CentroCusto.findByPk(req.params.centroCustoId, {
      include: [{
        model: Departamento,
        as: 'departamento',
        include: [{
          model: Unidade,
          as: 'unidade',
          include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'entidade_id'] }]
        }]
      }]
    });

    if (!centroCusto) {
      return res.status(404).json({ error: 'Centro de custo não encontrado' });
    }

    if (req.tenantId && centroCusto.departamento?.unidade?.cliente?.entidade_id !== req.tenantId) {
      return res.status(404).json({ error: 'Centro de custo não encontrado' });
    }

    const dadosAntes = centroCusto.toJSON();
    await centroCusto.destroy();

    await auditLog(req, {
      modulo: 'clientes',
      acao: 'delete',
      entidade: 'centro_custo',
      entidadeId: centroCusto.id,
      descricao: `Centro de custo removido: ${centroCusto.nome}`,
      dadosAntes,
      dadosDepois: { removido: true }
    });

    res.json({ message: 'Centro de custo removido com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
