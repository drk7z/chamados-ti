const express = require('express');
const { Op } = require('sequelize');
const {
  GrupoTecnico,
  GrupoTecnicoUsuario,
  User,
  AreaAtendimento
} = require('../../models');
const { isGlobalAdmin } = require('../../middlewares/auth');
const { auditLog } = require('../../utils/audit');

const router = express.Router();

const canWriteGroups = (req) => {
  if (process.env.MULTIEMPRESA !== 'true') {
    return true;
  }

  return isGlobalAdmin(req.user);
};

const normalizeNome = (value) => String(value || '').trim();

const resolveUserScopeWhere = (req, userId) => {
  const where = { id: userId, ativo: true };

  if (!isGlobalAdmin(req.user) && req.tenantId) {
    where.entidade_id = req.tenantId;
  }

  return where;
};

const validateAreaIfProvided = async (areaId) => {
  if (!areaId) {
    return null;
  }

  const area = await AreaAtendimento.findOne({ where: { id: areaId, ativo: true } });
  return area;
};

const validateUserIfProvided = async (req, userId) => {
  if (!userId) {
    return null;
  }

  const user = await User.findOne({
    where: resolveUserScopeWhere(req, userId),
    attributes: ['id', 'nome', 'email', 'entidade_id']
  });

  return user;
};

const includeGrupoBase = [
  { model: AreaAtendimento, as: 'area', attributes: ['id', 'nome', 'email'], required: false },
  { model: User, as: 'responsavel', attributes: ['id', 'nome', 'email'], required: false },
  {
    model: User,
    as: 'usuarios',
    attributes: ['id', 'nome', 'email', 'entidade_id'],
    through: { attributes: ['coordenador'], paranoid: false },
    required: false
  }
];

router.get('/', async (req, res, next) => {
  try {
    const { ativo = 'true', busca, area_id } = req.query;

    const where = {};

    if (ativo === 'true') where.ativo = true;
    if (ativo === 'false') where.ativo = false;
    if (area_id) where.area_id = area_id;

    if (busca) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${busca}%` } },
        { descricao: { [Op.iLike]: `%${busca}%` } },
        { email: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    const grupos = await GrupoTecnico.findAll({
      where,
      include: includeGrupoBase,
      order: [['nome', 'ASC']]
    });

    res.json(grupos);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const grupo = await GrupoTecnico.findByPk(req.params.id, {
      include: includeGrupoBase
    });

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo técnico não encontrado' });
    }

    res.json(grupo);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!canWriteGroups(req)) {
      return res.status(403).json({ error: 'Apenas administrador global pode criar grupos técnicos em ambiente multi-tenant' });
    }

    const nome = normalizeNome(req.body.nome);
    const email = req.body.email ? String(req.body.email).trim() : null;

    if (!nome) {
      return res.status(400).json({ error: 'Campo nome é obrigatório' });
    }

    const existente = await GrupoTecnico.findOne({
      where: {
        nome: { [Op.iLike]: nome }
      }
    });

    if (existente) {
      return res.status(409).json({ error: 'Já existe um grupo técnico com este nome' });
    }

    const area = await validateAreaIfProvided(req.body.area_id || null);
    if (req.body.area_id && !area) {
      return res.status(400).json({ error: 'area_id inválido ou inativo' });
    }

    const responsavel = await validateUserIfProvided(req, req.body.responsavel_id || null);
    if (req.body.responsavel_id && !responsavel) {
      return res.status(400).json({ error: 'responsavel_id inválido, inativo ou fora do escopo permitido' });
    }

    const grupo = await GrupoTecnico.create({
      nome,
      descricao: req.body.descricao || null,
      area_id: area?.id || null,
      responsavel_id: responsavel?.id || null,
      email,
      ativo: req.body.ativo ?? true
    });

    await auditLog(req, {
      modulo: 'admin',
      acao: 'create',
      entidade: 'grupo_tecnico',
      entidadeId: grupo.id,
      descricao: `Grupo técnico criado: ${grupo.nome}`,
      dadosDepois: grupo.toJSON()
    });

    const grupoCompleto = await GrupoTecnico.findByPk(grupo.id, { include: includeGrupoBase });
    res.status(201).json(grupoCompleto);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!canWriteGroups(req)) {
      return res.status(403).json({ error: 'Apenas administrador global pode atualizar grupos técnicos em ambiente multi-tenant' });
    }

    const grupo = await GrupoTecnico.findByPk(req.params.id);

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo técnico não encontrado' });
    }

    const nome = req.body.nome !== undefined ? normalizeNome(req.body.nome) : grupo.nome;
    if (!nome) {
      return res.status(400).json({ error: 'Campo nome é obrigatório' });
    }

    const conflito = await GrupoTecnico.findOne({
      where: {
        id: { [Op.ne]: grupo.id },
        nome: { [Op.iLike]: nome }
      }
    });

    if (conflito) {
      return res.status(409).json({ error: 'Já existe um grupo técnico com este nome' });
    }

    let areaId = grupo.area_id;
    if (req.body.area_id !== undefined) {
      if (req.body.area_id === null || req.body.area_id === '') {
        areaId = null;
      } else {
        const area = await validateAreaIfProvided(req.body.area_id);
        if (!area) {
          return res.status(400).json({ error: 'area_id inválido ou inativo' });
        }
        areaId = area.id;
      }
    }

    let responsavelId = grupo.responsavel_id;
    if (req.body.responsavel_id !== undefined) {
      if (req.body.responsavel_id === null || req.body.responsavel_id === '') {
        responsavelId = null;
      } else {
        const responsavel = await validateUserIfProvided(req, req.body.responsavel_id);
        if (!responsavel) {
          return res.status(400).json({ error: 'responsavel_id inválido, inativo ou fora do escopo permitido' });
        }
        responsavelId = responsavel.id;
      }
    }

    const dadosAntes = grupo.toJSON();

    await grupo.update({
      nome,
      descricao: req.body.descricao !== undefined ? req.body.descricao : grupo.descricao,
      area_id: areaId,
      responsavel_id: responsavelId,
      email: req.body.email !== undefined ? (req.body.email ? String(req.body.email).trim() : null) : grupo.email,
      ativo: req.body.ativo !== undefined ? Boolean(req.body.ativo) : grupo.ativo
    });

    await auditLog(req, {
      modulo: 'admin',
      acao: 'update',
      entidade: 'grupo_tecnico',
      entidadeId: grupo.id,
      descricao: `Grupo técnico atualizado: ${grupo.nome}`,
      dadosAntes,
      dadosDepois: grupo.toJSON()
    });

    const grupoCompleto = await GrupoTecnico.findByPk(grupo.id, { include: includeGrupoBase });
    res.json(grupoCompleto);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!canWriteGroups(req)) {
      return res.status(403).json({ error: 'Apenas administrador global pode inativar grupos técnicos em ambiente multi-tenant' });
    }

    const grupo = await GrupoTecnico.findByPk(req.params.id);

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo técnico não encontrado' });
    }

    if (!grupo.ativo) {
      return res.status(409).json({ error: 'Grupo técnico já está inativo' });
    }

    const dadosAntes = grupo.toJSON();
    await grupo.update({ ativo: false });

    await auditLog(req, {
      modulo: 'admin',
      acao: 'inactivate',
      entidade: 'grupo_tecnico',
      entidadeId: grupo.id,
      descricao: `Grupo técnico inativado: ${grupo.nome}`,
      dadosAntes,
      dadosDepois: grupo.toJSON()
    });

    res.json({ message: 'Grupo técnico inativado com sucesso' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/usuarios', async (req, res, next) => {
  try {
    if (!canWriteGroups(req)) {
      return res.status(403).json({ error: 'Apenas administrador global pode vincular usuários em ambiente multi-tenant' });
    }

    const { usuario_id, coordenador = false } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ error: 'usuario_id é obrigatório' });
    }

    const grupo = await GrupoTecnico.findByPk(req.params.id);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo técnico não encontrado' });
    }

    const usuario = await validateUserIfProvided(req, usuario_id);
    if (!usuario) {
      return res.status(400).json({ error: 'Usuário inválido, inativo ou fora do escopo permitido' });
    }

    const existente = await GrupoTecnicoUsuario.findOne({
      where: {
        grupo_id: grupo.id,
        usuario_id: usuario.id
      }
    });

    if (existente) {
      return res.status(409).json({ error: 'Usuário já está vinculado ao grupo' });
    }

    const vinculo = await GrupoTecnicoUsuario.create({
      grupo_id: grupo.id,
      usuario_id: usuario.id,
      coordenador: Boolean(coordenador)
    });

    await auditLog(req, {
      modulo: 'admin',
      acao: 'link-user',
      entidade: 'grupo_tecnico_usuario',
      entidadeId: vinculo.id,
      descricao: `Usuário ${usuario.nome} vinculado ao grupo ${grupo.nome}`,
      dadosDepois: vinculo.toJSON()
    });

    res.status(201).json(vinculo);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/usuarios/:usuarioId', async (req, res, next) => {
  try {
    if (!canWriteGroups(req)) {
      return res.status(403).json({ error: 'Apenas administrador global pode atualizar vínculos em ambiente multi-tenant' });
    }

    const grupo = await GrupoTecnico.findByPk(req.params.id);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo técnico não encontrado' });
    }

    const vinculo = await GrupoTecnicoUsuario.findOne({
      where: {
        grupo_id: grupo.id,
        usuario_id: req.params.usuarioId
      }
    });

    if (!vinculo) {
      return res.status(404).json({ error: 'Vínculo usuário-grupo não encontrado' });
    }

    if (req.body.coordenador === undefined) {
      return res.status(400).json({ error: 'Campo coordenador é obrigatório' });
    }

    const dadosAntes = vinculo.toJSON();
    await vinculo.update({ coordenador: Boolean(req.body.coordenador) });

    await auditLog(req, {
      modulo: 'admin',
      acao: 'update-link',
      entidade: 'grupo_tecnico_usuario',
      entidadeId: vinculo.id,
      descricao: `Vínculo atualizado no grupo ${grupo.nome}`,
      dadosAntes,
      dadosDepois: vinculo.toJSON()
    });

    res.json(vinculo);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/usuarios/:usuarioId', async (req, res, next) => {
  try {
    if (!canWriteGroups(req)) {
      return res.status(403).json({ error: 'Apenas administrador global pode desvincular usuários em ambiente multi-tenant' });
    }

    const grupo = await GrupoTecnico.findByPk(req.params.id);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo técnico não encontrado' });
    }

    const vinculo = await GrupoTecnicoUsuario.findOne({
      where: {
        grupo_id: grupo.id,
        usuario_id: req.params.usuarioId
      }
    });

    if (!vinculo) {
      return res.status(404).json({ error: 'Vínculo usuário-grupo não encontrado' });
    }

    const dadosAntes = vinculo.toJSON();
    await vinculo.destroy();

    await auditLog(req, {
      modulo: 'admin',
      acao: 'unlink-user',
      entidade: 'grupo_tecnico_usuario',
      entidadeId: vinculo.id,
      descricao: `Usuário desvinculado do grupo ${grupo.nome}`,
      dadosAntes,
      dadosDepois: { removido: true }
    });

    res.json({ message: 'Usuário desvinculado do grupo com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
