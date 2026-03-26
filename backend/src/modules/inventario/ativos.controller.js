const { Ativo, AtivoTipo, AtivoStatus, AtivoHistoricoLocalizacao, AtivoCategoria, User, Unidade, Role } = require('../../models');
const { Op } = require('sequelize');
const { auditLog } = require('../../utils/audit');

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

const parseBooleanFilter = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
};

const ensureAtivoCatalogSeed = async () => {
  const defaultTipos = [
    { nome: 'Notebook', descricao: 'Computadores portáteis corporativos' },
    { nome: 'Desktop', descricao: 'Estações de trabalho fixas' },
    { nome: 'Celular', descricao: 'Smartphones e dispositivos móveis corporativos' },
    { nome: 'Coletor', descricao: 'Coletores de dados e leitores de código de barras' },
  ];

  const defaultStatus = [
    { nome: 'Disponível', tipo: 'disponivel', cor: '#2e7d32' },
    { nome: 'Em Uso', tipo: 'em_uso', cor: '#1976d2' },
    { nome: 'Manutenção', tipo: 'manutencao', cor: '#ed6c02' }
  ];

  const defaultCategorias = [
    { nome: 'Hardware', descricao: 'Equipamentos físicos de TI' },
    { nome: 'Periféricos', descricao: 'Acessórios e componentes auxiliares' }
  ];

  const ensureByNome = async (Model, records) => {
    for (const record of records) {
      const [instance, created] = await Model.findOrCreate({
        where: { nome: record.nome },
        defaults: { ...record, ativo: true },
        paranoid: false
      });

      if (!created) {
        const updatePayload = { ativo: true };
        if (record.descricao !== undefined) updatePayload.descricao = record.descricao;
        if (record.cor !== undefined) updatePayload.cor = record.cor;
        if (record.tipo !== undefined) updatePayload.tipo = record.tipo;

        if (instance.deletedAt) await instance.restore();
        await instance.update(updatePayload);
      }
    }
  };

  await ensureByNome(AtivoTipo, defaultTipos);
  await ensureByNome(AtivoStatus, defaultStatus);
  await ensureByNome(AtivoCategoria, defaultCategorias);
};

const validateAssetPayload = async ({ payload, tenantId, isUpdate = false }) => {
  const errors = [];

  const requiredFields = ['codigo', 'nome', 'tipo_id', 'status_id'];

  if (!isUpdate) {
    requiredFields.forEach((field) => {
      if (!String(payload[field] || '').trim()) {
        errors.push(`${field} é obrigatório`);
      }
    });
  }

  if (payload.codigo !== undefined && !String(payload.codigo || '').trim()) {
    errors.push('codigo não pode ser vazio');
  }

  if (payload.nome !== undefined && !String(payload.nome || '').trim()) {
    errors.push('nome não pode ser vazio');
  }

  if (payload.tipo_id !== undefined && payload.tipo_id) {
    const tipo = await AtivoTipo.findOne({ where: { id: payload.tipo_id, ativo: true } });
    if (!tipo) {
      errors.push('tipo_id inválido ou inativo');
    }
  }

  if (payload.status_id !== undefined && payload.status_id) {
    const status = await AtivoStatus.findOne({ where: { id: payload.status_id, ativo: true } });
    if (!status) {
      errors.push('status_id inválido ou inativo');
    }
  }

  if (payload.categoria_id !== undefined && payload.categoria_id) {
    const categoria = await AtivoCategoria.findOne({ where: { id: payload.categoria_id, ativo: true } });
    if (!categoria) {
      errors.push('categoria_id inválido ou inativo');
    }
  }

  if (payload.responsavel_id !== undefined && payload.responsavel_id) {
    const whereResponsavel = { id: payload.responsavel_id, ativo: true };
    if (tenantId) whereResponsavel.entidade_id = tenantId;

    const responsavel = await User.findOne({ where: whereResponsavel, attributes: ['id'] });
    if (!responsavel) {
      errors.push('responsavel_id inválido, inativo ou fora do escopo do tenant');
    }
  }

  if (payload.localizacao_atual_id !== undefined && payload.localizacao_atual_id) {
    const unidade = await Unidade.findOne({ where: { id: payload.localizacao_atual_id } });
    if (!unidade) {
      errors.push('localizacao_atual_id inválido');
    }
  }

  return errors;
};

class AtivoController {
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        tipo,
        status,
        categoria,
        responsavel_id,
        cliente_id,
        busca,
        ativo,
        descontinuado
      } = req.query;
      
      const where = {};
      if (req.tenantId) where.entidade_id = req.tenantId;
      if (tipo) where.tipo_id = tipo;
      if (status) where.status_id = status;
      if (categoria) where.categoria_id = categoria;
      if (responsavel_id) where.responsavel_id = responsavel_id;
      if (cliente_id) where.cliente_id = cliente_id;

      const ativoFilter = parseBooleanFilter(ativo);
      const descontinuadoFilter = parseBooleanFilter(descontinuado);

      if (ativoFilter === undefined) {
        return res.status(400).json({ error: 'Filtro ativo inválido. Use true ou false.' });
      }

      if (descontinuadoFilter === undefined) {
        return res.status(400).json({ error: 'Filtro descontinuado inválido. Use true ou false.' });
      }

      if (ativoFilter !== null) where.ativo = ativoFilter;
      if (descontinuadoFilter !== null) where.descontinuado = descontinuadoFilter;
      
      if (busca) {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${busca}%` } },
          { codigo: { [Op.iLike]: `%${busca}%` } },
          { numero_serie: { [Op.iLike]: `%${busca}%` } },
          { numero_patrimonio: { [Op.iLike]: `%${busca}%` } }
        ];
      }

      const pageNumber = parsePositiveInt(page, 1);
      const pageSize = parsePositiveInt(limit, 20, 100);

      const { count, rows } = await Ativo.findAndCountAll({
        where,
        include: [
          { model: AtivoTipo, as: 'tipo' },
          { model: AtivoStatus, as: 'status' },
          { model: AtivoCategoria, as: 'categoria' },
          { model: User, as: 'responsavel', attributes: ['id', 'nome', 'email'], required: false }
        ],
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
        order: [['created_at', 'DESC']]
      });

      res.json({
        ativos: rows,
        total: count,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize)
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const ativo = await Ativo.findOne({
        where,
        include: [
          { model: AtivoTipo, as: 'tipo' },
          { model: AtivoStatus, as: 'status' },
          { model: AtivoCategoria, as: 'categoria' },
          { model: User, as: 'responsavel', attributes: ['id', 'nome', 'email'], required: false },
          { model: Unidade, as: 'localizacao_atual', attributes: ['id', 'nome'], required: false }
        ]
      });

      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      res.json(ativo);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        codigo: req.body.codigo ? String(req.body.codigo).trim() : req.body.codigo,
        nome: req.body.nome ? String(req.body.nome).trim() : req.body.nome,
      };

      const validationErrors = await validateAssetPayload({
        payload,
        tenantId: req.tenantId,
        isUpdate: false
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: validationErrors });
      }

      const ativo = await Ativo.create({
        ...payload,
        entidade_id: req.tenantId || req.body.entidade_id || null,
        criado_por: req.user.id
      });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'create',
        entidade: 'ativo',
        entidadeId: ativo.id,
        descricao: `Ativo criado: ${ativo.nome}`,
        dadosDepois: ativo.toJSON()
      });

      res.status(201).json(ativo);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;
      const ativo = await Ativo.findOne({ where });
      
      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      const payload = {
        ...req.body,
        codigo: req.body.codigo !== undefined ? String(req.body.codigo || '').trim() : req.body.codigo,
        nome: req.body.nome !== undefined ? String(req.body.nome || '').trim() : req.body.nome,
      };

      const validationErrors = await validateAssetPayload({
        payload,
        tenantId: req.tenantId,
        isUpdate: true
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: validationErrors });
      }

      const dadosAntes = ativo.toJSON();

      await ativo.update({
        ...payload,
        atualizado_por: req.user.id
      });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'update',
        entidade: 'ativo',
        entidadeId: ativo.id,
        descricao: `Ativo atualizado: ${ativo.nome}`,
        dadosAntes,
        dadosDepois: ativo.toJSON()
      });

      res.json(ativo);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;
      const ativo = await Ativo.findOne({ where });
      
      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      const dadosAntes = ativo.toJSON();

      await ativo.destroy();

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'delete',
        entidade: 'ativo',
        entidadeId: ativo.id,
        descricao: `Ativo removido: ${ativo.nome}`,
        dadosAntes,
        dadosDepois: { removido: true }
      });

      res.json({ message: 'Ativo excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async movimentar(req, res, next) {
    try {
      const { localizacao_nova_id, responsavel_novo_id, motivo } = req.body;

      if (!localizacao_nova_id) {
        return res.status(400).json({ error: 'Campo localizacao_nova_id é obrigatório para movimentação' });
      }

      if (!motivo || !String(motivo).trim()) {
        return res.status(400).json({ error: 'Campo motivo é obrigatório para movimentação' });
      }

      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;
      const ativo = await Ativo.findOne({ where });

      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      if (localizacao_nova_id) {
        const unidade = await Unidade.findOne({ where: { id: localizacao_nova_id } });
        if (!unidade) {
          return res.status(400).json({ error: 'localizacao_nova_id inválido' });
        }
      }

      if (responsavel_novo_id) {
        const whereResponsavel = { id: responsavel_novo_id, ativo: true };
        if (req.tenantId) whereResponsavel.entidade_id = req.tenantId;

        const responsavel = await User.findOne({ where: whereResponsavel, attributes: ['id'] });
        if (!responsavel) {
          return res.status(400).json({ error: 'responsavel_novo_id inválido, inativo ou fora do escopo do tenant' });
        }
      }

      const localizacaoNovaEfetiva = localizacao_nova_id;
      const responsavelNovoEfetivo = responsavel_novo_id || ativo.responsavel_id;

      await Ativo.sequelize.transaction(async (transaction) => {
        await AtivoHistoricoLocalizacao.create({
          ativo_id: ativo.id,
          localizacao_anterior_id: ativo.localizacao_atual_id,
          localizacao_nova_id: localizacaoNovaEfetiva,
          responsavel_anterior_id: ativo.responsavel_id,
          responsavel_novo_id: responsavelNovoEfetivo,
          motivo,
          realizado_por_id: req.user.id
        }, { transaction });

        await ativo.update({
          localizacao_anterior_id: ativo.localizacao_atual_id,
          localizacao_atual_id: localizacaoNovaEfetiva,
          responsavel_id: responsavelNovoEfetivo,
          atualizado_por: req.user.id
        }, { transaction });
      });

      await ativo.reload();

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'move',
        entidade: 'ativo',
        entidadeId: ativo.id,
        descricao: `Movimentação de ativo: ${ativo.nome}`,
        dadosDepois: {
          localizacao_anterior_id: ativo.localizacao_anterior_id,
          localizacao_atual_id: ativo.localizacao_atual_id,
          responsavel_id: ativo.responsavel_id,
          motivo: motivo || null
        }
      });

      res.json(ativo);
    } catch (error) {
      next(error);
    }
  }

  async getHistorico(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;
      const ativo = await Ativo.findOne({ where });

      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      const historico = await AtivoHistoricoLocalizacao.findAll({
        where: { ativo_id: req.params.id },
        include: [
          { model: Unidade, as: 'localizacao_anterior', attributes: ['id', 'nome'], required: false },
          { model: Unidade, as: 'localizacao_nova', attributes: ['id', 'nome'], required: false },
          { model: User, as: 'responsavel_anterior', attributes: ['id', 'nome', 'email'], required: false },
          { model: User, as: 'responsavel_novo', attributes: ['id', 'nome', 'email'], required: false },
          { model: User, as: 'realizado_por', attributes: ['id', 'nome', 'email'], required: false }
        ],
        order: [['data_movimentacao', 'DESC']]
      });

      res.json(historico);
    } catch (error) {
      next(error);
    }
  }

  async getTipos(req, res, next) {
    try {
      await ensureAtivoCatalogSeed();
      const tipos = await AtivoTipo.findAll({ where: { ativo: true } });
      res.json(tipos);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      await ensureAtivoCatalogSeed();
      const status = await AtivoStatus.findAll({ where: { ativo: true } });
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  async getCategorias(req, res, next) {
    try {
      await ensureAtivoCatalogSeed();
      const categorias = await AtivoCategoria.findAll({ where: { ativo: true } });
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  }

  async getResponsaveis(req, res, next) {
    try {
      const where = { ativo: true };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const responsaveis = await User.findAll({
        where,
        attributes: ['id', 'nome', 'email', 'entidade_id'],
        include: [{
          model: Role,
          as: 'roles',
          attributes: ['id', 'nome', 'nivel'],
          through: { attributes: [], paranoid: false },
          where: { ativo: true, nivel: { [Op.lte]: 3 } },
          required: true
        }],
        order: [['nome', 'ASC']]
      });

      res.json(responsaveis);
    } catch (error) {
      next(error);
    }
  }

  async getUnidades(req, res, next) {
    try {
      const unidades = await Unidade.findAll({
        attributes: ['id', 'nome', 'cliente_id'],
        order: [['nome', 'ASC']]
      });

      res.json(unidades);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AtivoController();
