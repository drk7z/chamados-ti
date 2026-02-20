const { Op } = require('sequelize');
const { Licenca, Software, TipoLicenca } = require('../../models');
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

const getVencimentoStatus = (dataExpiracao, diasJanela = 30) => {
  if (!dataExpiracao) return 'sem_expiracao';

  const now = new Date();
  const expiry = new Date(dataExpiracao);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'vencida';
  if (diffDays <= diasJanela) return 'proxima';
  return 'vigente';
};

const validateLicencaPayload = async ({ payload, isUpdate = false }) => {
  const errors = [];

  if (!isUpdate) {
    if (!payload.software_id) errors.push('software_id é obrigatório');
    if (!payload.tipo_licenca_id) errors.push('tipo_licenca_id é obrigatório');
  }

  if (payload.software_id) {
    const software = await Software.findOne({ where: { id: payload.software_id, ativo: true } });
    if (!software) errors.push('software_id inválido ou inativo');
  }

  if (payload.tipo_licenca_id) {
    const tipoLicenca = await TipoLicenca.findOne({ where: { id: payload.tipo_licenca_id, ativo: true } });
    if (!tipoLicenca) errors.push('tipo_licenca_id inválido ou inativo');
  }

  if (payload.quantidade_licencas !== undefined) {
    const qtd = Number.parseInt(payload.quantidade_licencas, 10);
    if (Number.isNaN(qtd) || qtd <= 0) {
      errors.push('quantidade_licencas deve ser maior que zero');
    }
  }

  if (payload.em_uso !== undefined) {
    const emUso = Number.parseInt(payload.em_uso, 10);
    if (Number.isNaN(emUso) || emUso < 0) {
      errors.push('em_uso deve ser um número maior ou igual a zero');
    }
  }

  const qtdLicencas = payload.quantidade_licencas !== undefined ? Number.parseInt(payload.quantidade_licencas, 10) : null;
  const emUsoLicencas = payload.em_uso !== undefined ? Number.parseInt(payload.em_uso, 10) : null;
  if (qtdLicencas !== null && emUsoLicencas !== null && emUsoLicencas > qtdLicencas) {
    errors.push('em_uso não pode ser maior que quantidade_licencas');
  }

  if (payload.data_aquisicao && payload.data_expiracao) {
    const aq = new Date(payload.data_aquisicao);
    const exp = new Date(payload.data_expiracao);
    if (!Number.isNaN(aq.getTime()) && !Number.isNaN(exp.getTime()) && exp < aq) {
      errors.push('data_expiracao deve ser maior ou igual à data_aquisicao');
    }
  }

  return errors;
};

class LicencasController {
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        software_id,
        tipo_licenca_id,
        vencimento,
        ativo,
      } = req.query;

      const where = {};
      if (software_id) where.software_id = software_id;
      if (tipo_licenca_id) where.tipo_licenca_id = tipo_licenca_id;

      const ativoFilter = parseBooleanFilter(ativo);
      if (ativoFilter === undefined) {
        return res.status(400).json({ error: 'Filtro ativo inválido. Use true ou false.' });
      }
      if (ativoFilter !== null) where.ativo = ativoFilter;

      if (vencimento === 'vencidas') {
        where.data_expiracao = { [Op.lt]: new Date() };
      }

      const pageNumber = parsePositiveInt(page, 1);
      const pageSize = parsePositiveInt(limit, 20, 100);

      const { count, rows } = await Licenca.findAndCountAll({
        where,
        include: [
          { model: Software, as: 'software', attributes: ['id', 'nome', 'fabricante', 'versao'] },
          { model: TipoLicenca, as: 'tipo_licenca', attributes: ['id', 'nome'] },
        ],
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
      });

      const licencas = rows.map((item) => {
        const json = item.toJSON();
        json.status_vencimento = getVencimentoStatus(json.data_expiracao);
        return json;
      });

      res.json({
        licencas,
        total: count,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize)
      });
    } catch (error) {
      next(error);
    }
  }

  async proximasExpiracao(req, res, next) {
    try {
      const dias = parsePositiveInt(req.query.dias, 30, 365);

      const now = new Date();
      const limite = new Date();
      limite.setDate(limite.getDate() + dias);

      const licencas = await Licenca.findAll({
        where: {
          ativo: true,
          data_expiracao: {
            [Op.not]: null,
            [Op.gte]: now,
            [Op.lte]: limite,
          },
        },
        include: [
          { model: Software, as: 'software', attributes: ['id', 'nome', 'fabricante', 'versao'] },
          { model: TipoLicenca, as: 'tipo_licenca', attributes: ['id', 'nome'] },
        ],
        order: [['data_expiracao', 'ASC']],
      });

      res.json(licencas.map((item) => ({
        ...item.toJSON(),
        status_vencimento: getVencimentoStatus(item.data_expiracao, dias)
      })));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        quantidade_licencas: req.body.quantidade_licencas !== undefined ? Number.parseInt(req.body.quantidade_licencas, 10) : 1,
        em_uso: req.body.em_uso !== undefined ? Number.parseInt(req.body.em_uso, 10) : 0,
      };

      const validationErrors = await validateLicencaPayload({ payload, isUpdate: false });
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: validationErrors });
      }

      const licenca = await Licenca.create({
        software_id: payload.software_id,
        chave_licenca: payload.chave_licenca || null,
        tipo_licenca_id: payload.tipo_licenca_id,
        quantidade_licencas: payload.quantidade_licencas,
        em_uso: payload.em_uso,
        data_aquisicao: payload.data_aquisicao || null,
        data_expiracao: payload.data_expiracao || null,
        valor: payload.valor || null,
        fornecedor: payload.fornecedor || null,
        nota_fiscal: payload.nota_fiscal || null,
        observacoes: payload.observacoes || null,
        ativo: payload.ativo !== undefined ? Boolean(payload.ativo) : true,
      });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'create',
        entidade: 'licenca',
        entidadeId: licenca.id,
        descricao: `Licença criada para software ${licenca.software_id}`,
        dadosDepois: licenca.toJSON()
      });

      res.status(201).json(licenca);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const licenca = await Licenca.findByPk(req.params.id);
      if (!licenca) {
        return res.status(404).json({ error: 'Licença não encontrada' });
      }

      const payload = {
        ...req.body,
      };

      if (payload.quantidade_licencas !== undefined) {
        payload.quantidade_licencas = Number.parseInt(payload.quantidade_licencas, 10);
      }
      if (payload.em_uso !== undefined) {
        payload.em_uso = Number.parseInt(payload.em_uso, 10);
      }

      const validationErrors = await validateLicencaPayload({ payload, isUpdate: true });
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: validationErrors });
      }

      const dadosAntes = licenca.toJSON();

      const quantidadeFinal = payload.quantidade_licencas !== undefined ? payload.quantidade_licencas : licenca.quantidade_licencas;
      const emUsoFinal = payload.em_uso !== undefined ? payload.em_uso : licenca.em_uso;
      if (emUsoFinal > quantidadeFinal) {
        return res.status(400).json({ error: 'em_uso não pode ser maior que quantidade_licencas' });
      }

      await licenca.update({
        software_id: payload.software_id !== undefined ? payload.software_id : licenca.software_id,
        chave_licenca: payload.chave_licenca !== undefined ? (payload.chave_licenca || null) : licenca.chave_licenca,
        tipo_licenca_id: payload.tipo_licenca_id !== undefined ? payload.tipo_licenca_id : licenca.tipo_licenca_id,
        quantidade_licencas: quantidadeFinal,
        em_uso: emUsoFinal,
        data_aquisicao: payload.data_aquisicao !== undefined ? (payload.data_aquisicao || null) : licenca.data_aquisicao,
        data_expiracao: payload.data_expiracao !== undefined ? (payload.data_expiracao || null) : licenca.data_expiracao,
        valor: payload.valor !== undefined ? (payload.valor || null) : licenca.valor,
        fornecedor: payload.fornecedor !== undefined ? (payload.fornecedor || null) : licenca.fornecedor,
        nota_fiscal: payload.nota_fiscal !== undefined ? (payload.nota_fiscal || null) : licenca.nota_fiscal,
        observacoes: payload.observacoes !== undefined ? (payload.observacoes || null) : licenca.observacoes,
        ativo: payload.ativo !== undefined ? Boolean(payload.ativo) : licenca.ativo,
      });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'update',
        entidade: 'licenca',
        entidadeId: licenca.id,
        descricao: `Licença atualizada: ${licenca.id}`,
        dadosAntes,
        dadosDepois: licenca.toJSON()
      });

      res.json(licenca);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const licenca = await Licenca.findByPk(req.params.id);
      if (!licenca) {
        return res.status(404).json({ error: 'Licença não encontrada' });
      }

      if (!licenca.ativo) {
        return res.status(409).json({ error: 'Licença já está inativa' });
      }

      const dadosAntes = licenca.toJSON();
      await licenca.update({ ativo: false });

      await auditLog(req, {
        modulo: 'inventario',
        acao: 'inactivate',
        entidade: 'licenca',
        entidadeId: licenca.id,
        descricao: `Licença inativada: ${licenca.id}`,
        dadosAntes,
        dadosDepois: licenca.toJSON()
      });

      res.json({ message: 'Licença inativada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LicencasController();
