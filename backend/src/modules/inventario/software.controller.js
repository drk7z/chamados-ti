const { Op } = require('sequelize');
const { Software, SoftwareCategoria, TipoLicenca } = require('../../models');
const { auditLog } = require('../../utils/audit');

const parsePositiveInt = (value, fallback, max = null) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  if (max !== null) return Math.min(parsed, max);
  return parsed;
};

const parseBooleanFilter = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
};

const ensureSoftwareCatalogSeed = async () => {
  const categorias = [
    { nome: 'Produtividade', descricao: 'Pacote office e colaboração' },
    { nome: 'Segurança', descricao: 'Ferramentas de proteção e monitoramento' },
    { nome: 'Desenvolvimento', descricao: 'IDEs, SDKs e ferramentas de build' }
  ];

  const tiposLicenca = [
    { nome: 'Perpétua', descricao: 'Licença sem recorrência' },
    { nome: 'Assinatura', descricao: 'Licença com renovação periódica' },
    { nome: 'Trial', descricao: 'Licença de avaliação temporária' }
  ];

  const ensureByNome = async (Model, records) => {
    for (const record of records) {
      const existing = await Model.findOne({ where: { nome: record.nome }, paranoid: false });
      if (!existing) {
        await Model.create({ ...record, ativo: true });
        continue;
      }

      if (existing.deletedAt) await existing.restore();
      await existing.update({ descricao: record.descricao, ativo: true });
    }
  };

  await ensureByNome(SoftwareCategoria, categorias);
  await ensureByNome(TipoLicenca, tiposLicenca);
};

const validateSoftwarePayload = async ({ payload, isUpdate = false }) => {
  const errors = [];

  if (!isUpdate && !String(payload.nome || '').trim()) {
    errors.push('nome é obrigatório');
  }

  if (payload.nome !== undefined && !String(payload.nome || '').trim()) {
    errors.push('nome não pode ser vazio');
  }

  if (payload.categoria_id) {
    const categoria = await SoftwareCategoria.findOne({ where: { id: payload.categoria_id, ativo: true } });
    if (!categoria) errors.push('categoria_id inválido ou inativo');
  }

  if (payload.tipo_licenca_id) {
    const tipoLicenca = await TipoLicenca.findOne({ where: { id: payload.tipo_licenca_id, ativo: true } });
    if (!tipoLicenca) errors.push('tipo_licenca_id inválido ou inativo');
  }

  return errors;
};

class SoftwareController {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, busca, categoria_id, tipo_licenca_id, ativo } = req.query;
      const where = {};

      if (categoria_id) where.categoria_id = categoria_id;
      if (tipo_licenca_id) where.tipo_licenca_id = tipo_licenca_id;

      const ativoFilter = parseBooleanFilter(ativo);
      if (ativoFilter === undefined) {
        return res.status(400).json({ error: 'Filtro ativo inválido. Use true ou false.' });
      }
      if (ativoFilter !== null) where.ativo = ativoFilter;

      if (busca) {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${busca}%` } },
          { fabricante: { [Op.iLike]: `%${busca}%` } },
          { versao: { [Op.iLike]: `%${busca}%` } }
        ];
      }

      const pageNumber = parsePositiveInt(page, 1);
      const pageSize = parsePositiveInt(limit, 20, 100);

      const { count, rows } = await Software.findAndCountAll({
        where,
        include: [
          { model: SoftwareCategoria, as: 'categoria', required: false },
          { model: TipoLicenca, as: 'tipo_licenca', required: false }
        ],
        order: [['nome', 'ASC']],
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize
      });

      res.json({ softwares: rows, total: count, page: pageNumber, limit: pageSize, totalPages: Math.ceil(count / pageSize) });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const software = await Software.findByPk(req.params.id, {
        include: [
          { model: SoftwareCategoria, as: 'categoria', required: false },
          { model: TipoLicenca, as: 'tipo_licenca', required: false }
        ]
      });

      if (!software) return res.status(404).json({ error: 'Software não encontrado' });
      res.json(software);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        nome: req.body.nome ? String(req.body.nome).trim() : req.body.nome,
        fabricante: req.body.fabricante ? String(req.body.fabricante).trim() : null,
        versao: req.body.versao ? String(req.body.versao).trim() : null,
      };

      const validationErrors = await validateSoftwarePayload({ payload, isUpdate: false });
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: validationErrors });
      }

      const software = await Software.create({
        nome: payload.nome,
        fabricante: payload.fabricante,
        versao: payload.versao,
        categoria_id: payload.categoria_id || null,
        tipo_licenca_id: payload.tipo_licenca_id || null,
        descricao: payload.descricao || null,
        ativo: payload.ativo !== undefined ? Boolean(payload.ativo) : true,
      });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'create',
        entidade: 'software',
        entidadeId: software.id,
        descricao: `Software criado: ${software.nome}`,
        dadosDepois: software.toJSON()
      });

      res.status(201).json(software);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const software = await Software.findByPk(req.params.id);
      if (!software) return res.status(404).json({ error: 'Software não encontrado' });

      const payload = {
        ...req.body,
        nome: req.body.nome !== undefined ? String(req.body.nome || '').trim() : req.body.nome,
        fabricante: req.body.fabricante !== undefined ? (req.body.fabricante ? String(req.body.fabricante).trim() : null) : req.body.fabricante,
        versao: req.body.versao !== undefined ? (req.body.versao ? String(req.body.versao).trim() : null) : req.body.versao,
      };

      const validationErrors = await validateSoftwarePayload({ payload, isUpdate: true });
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: validationErrors });
      }

      const dadosAntes = software.toJSON();

      await software.update({
        nome: payload.nome !== undefined ? payload.nome : software.nome,
        fabricante: payload.fabricante !== undefined ? payload.fabricante : software.fabricante,
        versao: payload.versao !== undefined ? payload.versao : software.versao,
        categoria_id: payload.categoria_id !== undefined ? (payload.categoria_id || null) : software.categoria_id,
        tipo_licenca_id: payload.tipo_licenca_id !== undefined ? (payload.tipo_licenca_id || null) : software.tipo_licenca_id,
        descricao: payload.descricao !== undefined ? (payload.descricao || null) : software.descricao,
        ativo: payload.ativo !== undefined ? Boolean(payload.ativo) : software.ativo,
      });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'update',
        entidade: 'software',
        entidadeId: software.id,
        descricao: `Software atualizado: ${software.nome}`,
        dadosAntes,
        dadosDepois: software.toJSON()
      });

      res.json(software);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const software = await Software.findByPk(req.params.id);
      if (!software) return res.status(404).json({ error: 'Software não encontrado' });
      if (!software.ativo) return res.status(409).json({ error: 'Software já está inativo' });

      const dadosAntes = software.toJSON();
      await software.update({ ativo: false });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'inactivate',
        entidade: 'software',
        entidadeId: software.id,
        descricao: `Software inativado: ${software.nome}`,
        dadosAntes,
        dadosDepois: software.toJSON()
      });

      res.json({ message: 'Software inativado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async getCategorias(req, res, next) {
    try {
      await ensureSoftwareCatalogSeed();
      const categorias = await SoftwareCategoria.findAll({ where: { ativo: true }, order: [['nome', 'ASC']] });
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  }

  async getTiposLicenca(req, res, next) {
    try {
      await ensureSoftwareCatalogSeed();
      const tipos = await TipoLicenca.findAll({ where: { ativo: true }, order: [['nome', 'ASC']] });
      res.json(tipos);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SoftwareController();
