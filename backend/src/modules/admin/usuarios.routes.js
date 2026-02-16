const express = require('express');
const router = express.Router();
const { User, Role, Entidade } = require('../../models');
const { isGlobalAdmin } = require('../../middlewares/auth');

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    const globalAdmin = isGlobalAdmin(req.user);

    if (!globalAdmin && req.tenantId) {
      where.entidade_id = req.tenantId;
    }

    const users = await User.findAll({
      where,
      include: [
        { model: Role, as: 'roles', through: { attributes: [], paranoid: false } },
        { model: Entidade, as: 'entidade' }
      ],
      order: [['nome', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const globalAdmin = isGlobalAdmin(req.user);
    const entidadeId = globalAdmin
      ? (req.body.entidade_id || null)
      : (req.tenantId || null);

    if (!globalAdmin && process.env.MULTIEMPRESA === 'true' && !entidadeId) {
      return res.status(403).json({ error: 'Administrador local sem entidade vinculada' });
    }

    const user = await User.create({
      ...req.body,
      entidade_id: entidadeId,
      criado_por: req.user.id
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const globalAdmin = isGlobalAdmin(req.user);
    const where = { id: req.params.id };

    if (!globalAdmin && req.tenantId) {
      where.entidade_id = req.tenantId;
    }

    const user = await User.findOne({ where });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const payload = { ...req.body };
    if (!globalAdmin) {
      delete payload.entidade_id;
      payload.entidade_id = req.tenantId || user.entidade_id || null;
    }

    await user.update({
      ...payload,
      atualizado_por: req.user.id
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
