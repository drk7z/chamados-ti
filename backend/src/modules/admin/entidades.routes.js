const express = require('express');
const router = express.Router();
const { Entidade } = require('../../models');
const { isGlobalAdmin } = require('../../middlewares/auth');
const { auditLog } = require('../../utils/audit');

router.get('/', async (req, res, next) => {
  try {
    const where = { ativo: true };
    const globalAdmin = isGlobalAdmin(req.user);

    if (!globalAdmin && req.tenantId) {
      where.id = req.tenantId;
    }

    const entidades = await Entidade.findAll({
      where,
      order: [['nome', 'ASC']]
    });

    res.json(entidades);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    const globalAdmin = isGlobalAdmin(req.user);

    if (!globalAdmin && req.tenantId) {
      where.id = req.tenantId;
    }

    const entidade = await Entidade.findOne({ where });

    if (!entidade) {
      return res.status(404).json({ error: 'Entidade não encontrada' });
    }

    res.json(entidade);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!isGlobalAdmin(req.user)) {
      return res.status(403).json({ error: 'Apenas administrador global pode criar entidades' });
    }

    const entidade = await Entidade.create({
      ...req.body,
      ativo: req.body.ativo ?? true
    });

    await auditLog(req, {
      modulo: 'admin',
      acao: 'create',
      entidade: 'entidade',
      entidadeId: entidade.id,
      descricao: `Entidade criada: ${entidade.nome}`,
      dadosDepois: entidade.toJSON()
    });

    res.status(201).json(entidade);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const globalAdmin = isGlobalAdmin(req.user);
    const where = { id: req.params.id };

    if (!globalAdmin && req.tenantId) {
      where.id = req.tenantId;
    }

    const entidade = await Entidade.findOne({ where });

    if (!entidade) {
      return res.status(404).json({ error: 'Entidade não encontrada' });
    }

    const dadosAntes = entidade.toJSON();
    await entidade.update(req.body);

    await auditLog(req, {
      modulo: 'admin',
      acao: 'update',
      entidade: 'entidade',
      entidadeId: entidade.id,
      descricao: `Entidade atualizada: ${entidade.nome}`,
      dadosAntes,
      dadosDepois: entidade.toJSON()
    });

    res.json(entidade);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isGlobalAdmin(req.user)) {
      return res.status(403).json({ error: 'Apenas administrador global pode inativar entidades' });
    }

    const entidade = await Entidade.findByPk(req.params.id);

    if (!entidade) {
      return res.status(404).json({ error: 'Entidade não encontrada' });
    }

    if (!entidade.ativo) {
      return res.status(409).json({ error: 'Entidade já está inativa' });
    }

    const dadosAntes = entidade.toJSON();
    await entidade.update({ ativo: false });

    await auditLog(req, {
      modulo: 'admin',
      acao: 'inactivate',
      entidade: 'entidade',
      entidadeId: entidade.id,
      descricao: `Entidade inativada: ${entidade.nome}`,
      dadosAntes,
      dadosDepois: entidade.toJSON()
    });

    res.json({ message: 'Entidade inativada com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
