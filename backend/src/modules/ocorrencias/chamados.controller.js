const { 
  Chamado, 
  ChamadoTipo, 
  ChamadoStatus, 
  ChamadoPrioridade, 
  SLA,
  SlaRegra,
  ChamadoHistorico,
  ChamadoComentario,
  LogSistema,
  SlaEvento,
  AreaAtendimento,
  User 
} = require('../../models');
const { Op } = require('sequelize');
const { auditLog } = require('../../utils/audit');

const addMinutes = (date, minutes) => {
  const base = new Date(date);
  base.setMinutes(base.getMinutes() + minutes);
  return base;
};

const buildDateRange = (dataInicio, dataFim) => {
  if (!dataInicio && !dataFim) return null;

  const range = {};

  if (dataInicio) {
    const dtInicio = new Date(dataInicio);
    if (!Number.isNaN(dtInicio.getTime())) {
      range[Op.gte] = dtInicio;
    }
  }

  if (dataFim) {
    const dtFim = new Date(dataFim);
    if (!Number.isNaN(dtFim.getTime())) {
      range[Op.lte] = dtFim;
    }
  }

  return Object.keys(range).length > 0 ? range : null;
};

const matchConditionValue = (conditions, key, value) => {
  const expected = conditions?.[key];
  if (expected === undefined || expected === null) return true;

  const values = Array.isArray(expected) ? expected : [expected];
  if (values.length === 0) return true;
  if (value === undefined || value === null) return false;

  return values.map((item) => String(item)).includes(String(value));
};

const getRuleSpecificity = (conditions = {}) => {
  return Object.keys(conditions).filter((key) => {
    const value = conditions[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  }).length;
};

const resolveSlaSelection = async ({ tipoId, prioridadeId, clienteId, areaId, explicitSlaId = null }) => {
  if (explicitSlaId) {
    const sla = await SLA.findByPk(explicitSlaId);
    return {
      slaId: explicitSlaId,
      tempoResolucaoMinutos: sla?.tempo_resolucao || null,
      rule: null
    };
  }

  const regras = await SlaRegra.findAll({
    where: { ativo: true },
    include: [{ model: SLA, as: 'sla', required: false }],
    order: [['ordem', 'ASC']]
  });

  const candidatas = regras.filter((regra) => {
    const condicoes = regra.condicoes || {};

    return (
      matchConditionValue(condicoes, 'tipo_id', tipoId) &&
      matchConditionValue(condicoes, 'prioridade_id', prioridadeId) &&
      matchConditionValue(condicoes, 'cliente_id', clienteId) &&
      matchConditionValue(condicoes, 'area_id', areaId)
    );
  });

  if (candidatas.length > 0) {
    const melhor = candidatas
      .sort((a, b) => {
        const scoreA = getRuleSpecificity(a.condicoes || {});
        const scoreB = getRuleSpecificity(b.condicoes || {});
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (a.ordem || 0) - (b.ordem || 0);
      })[0];

    return {
      slaId: melhor.sla_id,
      tempoResolucaoMinutos: melhor.tempo_resolucao_minutos || melhor?.sla?.tempo_resolucao || null,
      rule: melhor
    };
  }

  if (tipoId) {
    const tipo = await ChamadoTipo.findByPk(tipoId);
    if (tipo?.sla_padrao_id) {
      const sla = await SLA.findByPk(tipo.sla_padrao_id);
      return {
        slaId: tipo.sla_padrao_id,
        tempoResolucaoMinutos: sla?.tempo_resolucao || null,
        rule: null
      };
    }
  }

  return {
    slaId: null,
    tempoResolucaoMinutos: null,
    rule: null
  };
};

const getSlaState = (chamado, now = new Date()) => {
  const aberto = !chamado.data_resolucao && !chamado.data_fechamento;
  const prazo = chamado.prazo_sla ? new Date(chamado.prazo_sla) : null;

  if (!aberto || !prazo) {
    return { aberto, sla_vencido: false, sla_em_risco: false };
  }

  const diff = prazo.getTime() - now.getTime();
  const sla_vencido = diff < 0;
  const sla_em_risco = diff >= 0 && diff <= (60 * 60 * 1000);

  return { aberto, sla_vencido, sla_em_risco };
};

const logSlaEvent = async ({ req, chamadoId, acao, descricao, dados_antes = null, dados_depois = null }) => {
  try {
    const dadosDepoisComTenant = {
      ...(dados_depois || {}),
      tenant_id: req.tenantId || null
    };

    await LogSistema.create({
      usuario_id: req.user?.id || null,
      modulo: 'sla',
      acao,
      entidade: 'chamado',
      entidade_id: chamadoId,
      descricao,
      ip: req.ip,
      user_agent: req.get('user-agent') || null,
      dados_antes,
      dados_depois: dadosDepoisComTenant
    });
  } catch (_error) {
  }
};

const persistSlaEvento = async ({
  req,
  chamado,
  tipoEvento,
  status,
  tempoPrevisto = null,
  tempoReal = null,
  tempoPausadoMinutos = null
}) => {
  try {
    const previsto = tempoPrevisto ? new Date(tempoPrevisto) : null;
    const real = tempoReal ? new Date(tempoReal) : null;

    let percentualCumprimento = null;
    if (previsto && real) {
      const previstoMs = previsto.getTime();
      const realMs = real.getTime();
      if (previstoMs > 0) {
        percentualCumprimento = Number(((previstoMs / realMs) * 100).toFixed(2));
      }
    }

    await SlaEvento.create({
      chamado_id: chamado.id,
      sla_id: chamado.sla_id || null,
      tipo_evento: tipoEvento,
      status,
      tempo_previsto: previsto,
      tempo_real: real,
      tempo_pausado_minutos: tempoPausadoMinutos !== null ? tempoPausadoMinutos : (chamado.tempo_pausado || 0),
      percentual_cumprimento: percentualCumprimento,
      criado_por: req.user?.id || null
    });
  } catch (_error) {
  }
};

class ChamadoController {
  async list(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        prioridade, 
        tipo,
        solicitante,
        tecnico,
        busca 
      } = req.query;

      const where = {};

      if (req.tenantId) {
        where.entidade_id = req.tenantId;
      }
      
      if (status) where.status_id = status;
      if (prioridade) where.prioridade_id = prioridade;
      if (tipo) where.tipo_id = tipo;
      if (solicitante) where.solicitante_id = solicitante;
      if (tecnico) where.tecnico_responsavel_id = tecnico;
      
      if (busca) {
        where[Op.or] = [
          { titulo: { [Op.iLike]: `%${busca}%` } },
          { descricao: { [Op.iLike]: `%${busca}%` } },
          { numero: { [Op.eq]: parseInt(busca) || 0 } }
        ];
      }

      // Verificar permissões
      const isAdmin = req.user.roles?.some(role => role.nivel <= 2);
      if (!isAdmin) {
        where.solicitante_id = req.user.id;
      }

      const { count, rows } = await Chamado.findAndCountAll({
        where,
        include: [
          { model: ChamadoTipo, as: 'tipo' },
          { model: ChamadoStatus, as: 'status' },
          { model: ChamadoPrioridade, as: 'prioridade' },
          { model: User, as: 'solicitante', attributes: ['id', 'nome', 'email'] },
          { model: User, as: 'tecnico_responsavel', attributes: ['id', 'nome', 'email'] }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      const now = new Date();
      const chamados = rows.map((item) => {
        const chamado = item.toJSON();
        const state = getSlaState(chamado, now);

        return {
          ...chamado,
          sla_vencido: state.sla_vencido,
          sla_em_risco: state.sla_em_risco
        };
      });

      res.json({
        chamados,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({
        where,
        include: [
          { model: ChamadoTipo, as: 'tipo' },
          { model: ChamadoStatus, as: 'status' },
          { model: ChamadoPrioridade, as: 'prioridade' },
          { model: User, as: 'solicitante', attributes: ['id', 'nome', 'email'] },
          { model: User, as: 'tecnico_responsavel', attributes: ['id', 'nome', 'email'] }
        ]
      });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const chamadoJson = chamado.toJSON();
      const state = getSlaState(chamadoJson);

      res.json({
        ...chamadoJson,
        sla_vencido: state.sla_vencido,
        sla_em_risco: state.sla_em_risco
      });
    } catch (error) {
      next(error);
    }
  }

  async getMetricasSla(req, res, next) {
    try {
      const { data_inicio, data_fim, tecnico_id, area_id } = req.query;
      const where = {};
      if (req.tenantId) where.entidade_id = req.tenantId;

      const dateRange = buildDateRange(data_inicio, data_fim);
      if (dateRange) {
        where.data_abertura = dateRange;
      }

      if (tecnico_id) {
        where.tecnico_responsavel_id = tecnico_id;
      }

      if (area_id) {
        where.area_id = area_id;
      }

      const isAdmin = req.user.roles?.some(role => role.nivel <= 2);
      if (!isAdmin) {
        where.solicitante_id = req.user.id;
      }

      const chamados = await Chamado.findAll({
        where,
        include: [
          { model: User, as: 'tecnico_responsavel', attributes: ['id', 'nome'], required: false },
          { model: AreaAtendimento, as: 'area', attributes: ['id', 'nome'], required: false }
        ]
      });

      const now = new Date();
      const abertos = chamados.filter((item) => !item.data_resolucao && !item.data_fechamento);
      const abertosComSla = abertos.filter((item) => !!item.prazo_sla);
      const abertosSemSla = abertos.filter((item) => !item.prazo_sla);

      const vencidos = abertosComSla.filter((item) => getSlaState(item, now).sla_vencido);
      const emRisco = abertosComSla.filter((item) => getSlaState(item, now).sla_em_risco);
      const dentroPrazo = abertosComSla.filter((item) => {
        const state = getSlaState(item, now);
        return !state.sla_vencido && !state.sla_em_risco;
      });

      const resolvidosComSla = chamados.filter((item) => {
        if (!item.prazo_sla) return false;
        return !!item.data_resolucao || !!item.data_fechamento;
      });

      const resolvidosNoPrazo = resolvidosComSla.filter((item) => {
        const fim = item.data_fechamento || item.data_resolucao;
        if (!fim) return false;
        return new Date(fim).getTime() <= new Date(item.prazo_sla).getTime();
      });

      const taxaCumprimento = resolvidosComSla.length > 0
        ? Number(((resolvidosNoPrazo.length / resolvidosComSla.length) * 100).toFixed(2))
        : 0;

      const porTecnicoMap = new Map();
      const porAreaMap = new Map();
      const evolucaoTemporalMap = new Map();

      chamados.forEach((item) => {
        const tecnicoId = item.tecnico_responsavel?.id || 'sem_tecnico';
        const tecnicoNome = item.tecnico_responsavel?.nome || 'Sem técnico';
        const areaId = item.area?.id || 'sem_area';
        const areaNome = item.area?.nome || 'Sem área';
        const resolvido = !!item.data_resolucao || !!item.data_fechamento;
        const dataResolucao = item.data_fechamento || item.data_resolucao;
        const violado = !!item.prazo_sla && !!(item.data_resolucao || item.data_fechamento) &&
          (new Date(item.data_fechamento || item.data_resolucao).getTime() > new Date(item.prazo_sla).getTime());

        if (!porTecnicoMap.has(tecnicoId)) {
          porTecnicoMap.set(tecnicoId, {
            tecnico_id: tecnicoId === 'sem_tecnico' ? null : tecnicoId,
            tecnico_nome: tecnicoNome,
            total: 0,
            resolvidos: 0,
            violados: 0
          });
        }

        if (!porAreaMap.has(areaId)) {
          porAreaMap.set(areaId, {
            area_id: areaId === 'sem_area' ? null : areaId,
            area_nome: areaNome,
            total: 0,
            resolvidos: 0,
            violados: 0
          });
        }

        const tecnicoAgg = porTecnicoMap.get(tecnicoId);
        tecnicoAgg.total += 1;
        if (resolvido) tecnicoAgg.resolvidos += 1;
        if (violado) tecnicoAgg.violados += 1;

        const areaAgg = porAreaMap.get(areaId);
        areaAgg.total += 1;
        if (resolvido) areaAgg.resolvidos += 1;
        if (violado) areaAgg.violados += 1;

        if (resolvido && item.prazo_sla && dataResolucao) {
          const dateKey = new Date(dataResolucao).toISOString().slice(0, 10);

          if (!evolucaoTemporalMap.has(dateKey)) {
            evolucaoTemporalMap.set(dateKey, {
              data: dateKey,
              total_resolvidos_com_sla: 0,
              cumpridos: 0,
              violados: 0,
              taxa_cumprimento_percentual: 0
            });
          }

          const temporalAgg = evolucaoTemporalMap.get(dateKey);
          temporalAgg.total_resolvidos_com_sla += 1;

          if (violado) {
            temporalAgg.violados += 1;
          } else {
            temporalAgg.cumpridos += 1;
          }
        }
      });

      const evolucaoTemporal = Array.from(evolucaoTemporalMap.values())
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((item) => ({
          ...item,
          taxa_cumprimento_percentual: item.total_resolvidos_com_sla > 0
            ? Number(((item.cumpridos / item.total_resolvidos_com_sla) * 100).toFixed(2))
            : 0
        }));

      res.json({
        filtros: {
          data_inicio: data_inicio || null,
          data_fim: data_fim || null,
          tecnico_id: tecnico_id || null,
          area_id: area_id || null
        },
        resumo: {
          total_chamados: chamados.length,
          abertos: abertos.length,
          abertos_com_sla: abertosComSla.length,
          abertos_sem_sla: abertosSemSla.length,
          sla_vencido: vencidos.length,
          sla_em_risco: emRisco.length,
          sla_dentro_prazo: dentroPrazo.length
        },
        desempenho: {
          resolvidos_com_sla: resolvidosComSla.length,
          resolvidos_no_prazo: resolvidosNoPrazo.length,
          taxa_cumprimento_percentual: taxaCumprimento
        },
        evolucao_temporal: evolucaoTemporal,
        visao_por_tecnico: Array.from(porTecnicoMap.values()),
        visao_por_area: Array.from(porAreaMap.values())
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const slaSelection = await resolveSlaSelection({
        tipoId: req.body.tipo_id || null,
        prioridadeId: req.body.prioridade_id || null,
        clienteId: req.body.cliente_id || null,
        areaId: req.body.area_id || null,
        explicitSlaId: req.body.sla_id || null
      });

      const prazoSla = slaSelection.tempoResolucaoMinutos
        ? addMinutes(new Date(), slaSelection.tempoResolucaoMinutos)
        : null;

      const chamado = await Chamado.create({
        ...req.body,
        sla_id: slaSelection.slaId,
        prazo_sla: prazoSla,
        sla_vencido: false,
        entidade_id: req.tenantId || req.body.entidade_id || null,
        solicitante_id: req.user.id,
        criado_por: req.user.id
      });

      await logSlaEvent({
        req,
        chamadoId: chamado.id,
        acao: 'create',
        descricao: 'SLA inicial aplicado no chamado',
        dados_depois: {
          sla_id: chamado.sla_id,
          prazo_sla: chamado.prazo_sla,
          sla_vencido: chamado.sla_vencido,
          regra_sla_id: slaSelection.rule?.id || null
        }
      });

      await persistSlaEvento({
        req,
        chamado,
        tipoEvento: 'resolucao',
        status: 'retomado',
        tempoPrevisto: chamado.prazo_sla,
        tempoReal: null
      });

      // Registrar no histórico
      await ChamadoHistorico.create({
        chamado_id: chamado.id,
        usuario_id: req.user.id,
        tipo: 'criacao',
        descricao: 'Chamado criado',
        visivel_solicitante: true
      });

      res.status(201).json(chamado);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });
      
      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const dadosAntes = {
        sla_id: chamado.sla_id,
        prazo_sla: chamado.prazo_sla,
        sla_vencido: chamado.sla_vencido
      };

      const payload = {
        ...req.body,
        atualizado_por: req.user.id
      };

      if (req.body.sla_id || req.body.tipo_id || req.body.prioridade_id || req.body.cliente_id || req.body.area_id) {
        const slaSelection = await resolveSlaSelection({
          tipoId: req.body.tipo_id || chamado.tipo_id,
          prioridadeId: req.body.prioridade_id || chamado.prioridade_id,
          clienteId: req.body.cliente_id || chamado.cliente_id,
          areaId: req.body.area_id || chamado.area_id,
          explicitSlaId: req.body.sla_id || null
        });

        payload.sla_id = slaSelection.slaId;

        if (slaSelection.tempoResolucaoMinutos) {
          payload.prazo_sla = addMinutes(chamado.data_abertura || new Date(), slaSelection.tempoResolucaoMinutos);
        }
      }

      await chamado.update(payload);

      const state = getSlaState(chamado);
      if (chamado.sla_vencido !== state.sla_vencido) {
        await chamado.update({ sla_vencido: state.sla_vencido });
      }

      await logSlaEvent({
        req,
        chamadoId: chamado.id,
        acao: 'update',
        descricao: 'SLA atualizado no chamado',
        dados_antes: dadosAntes,
        dados_depois: {
          sla_id: chamado.sla_id,
          prazo_sla: chamado.prazo_sla,
          sla_vencido: state.sla_vencido
        }
      });

      await persistSlaEvento({
        req,
        chamado,
        tipoEvento: 'resolucao',
        status: state.sla_vencido ? 'violado' : 'retomado',
        tempoPrevisto: chamado.prazo_sla,
        tempoReal: state.sla_vencido ? new Date() : null
      });

      res.json(chamado);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });
      
      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      await chamado.destroy();
      res.json({ message: 'Chamado excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async atribuir(req, res, next) {
    try {
      const { tecnico_id } = req.body;
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const dadosAntes = {
        tecnico_responsavel_id: chamado.tecnico_responsavel_id,
        data_atribuicao: chamado.data_atribuicao
      };

      await chamado.update({
        tecnico_responsavel_id: tecnico_id,
        data_atribuicao: new Date()
      });

      await ChamadoHistorico.create({
        chamado_id: chamado.id,
        usuario_id: req.user.id,
        tipo: 'atribuicao',
        descricao: `Chamado atribuído`,
        valor_novo: { tecnico_id }
      });

      await auditLog(req, {
        modulo: 'ocorrencias',
        acao: 'assign',
        entidade: 'chamado',
        entidadeId: chamado.id,
        descricao: `Chamado atribuído para técnico ${tecnico_id}`,
        dadosAntes,
        dadosDepois: {
          tecnico_responsavel_id: chamado.tecnico_responsavel_id,
          data_atribuicao: chamado.data_atribuicao
        }
      });

      res.json(chamado);
    } catch (error) {
      next(error);
    }
  }

  async resolver(req, res, next) {
    try {
      const { solucao } = req.body;
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      // Buscar status "resolvido"
      const statusResolvido = await ChamadoStatus.findOne({ 
        where: { tipo: 'resolvido' } 
      });

      await chamado.update({
        solucao,
        status_id: statusResolvido.id,
        data_resolucao: new Date(),
        sla_vencido: chamado.prazo_sla ? (new Date(chamado.prazo_sla).getTime() < Date.now()) : false
      });

      await logSlaEvent({
        req,
        chamadoId: chamado.id,
        acao: 'resolve',
        descricao: 'Chamado resolvido com estado de SLA registrado',
        dados_depois: {
          data_resolucao: chamado.data_resolucao,
          prazo_sla: chamado.prazo_sla,
          sla_vencido: chamado.sla_vencido
        }
      });

      await persistSlaEvento({
        req,
        chamado,
        tipoEvento: 'resolucao',
        status: chamado.sla_vencido ? 'violado' : 'cumprido',
        tempoPrevisto: chamado.prazo_sla,
        tempoReal: chamado.data_resolucao || new Date()
      });

      await ChamadoHistorico.create({
        chamado_id: chamado.id,
        usuario_id: req.user.id,
        tipo: 'resolucao',
        descricao: 'Chamado resolvido',
        valor_novo: { solucao }
      });

      res.json(chamado);
    } catch (error) {
      next(error);
    }
  }

  async fechar(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }
      const statusFechado = await ChamadoStatus.findOne({ 
        where: { tipo: 'fechado' } 
      });

      await chamado.update({
        status_id: statusFechado.id,
        data_fechamento: new Date(),
        sla_vencido: chamado.prazo_sla ? (new Date(chamado.prazo_sla).getTime() < Date.now()) : false
      });

      await logSlaEvent({
        req,
        chamadoId: chamado.id,
        acao: 'close',
        descricao: 'Chamado fechado com estado de SLA registrado',
        dados_depois: {
          data_fechamento: chamado.data_fechamento,
          prazo_sla: chamado.prazo_sla,
          sla_vencido: chamado.sla_vencido
        }
      });

      await persistSlaEvento({
        req,
        chamado,
        tipoEvento: 'fechamento',
        status: chamado.sla_vencido ? 'violado' : 'cumprido',
        tempoPrevisto: chamado.prazo_sla,
        tempoReal: chamado.data_fechamento || new Date()
      });

      res.json(chamado);
    } catch (error) {
      next(error);
    }
  }

  async reabrir(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }
      const statusAberto = await ChamadoStatus.findOne({ 
        where: { tipo: 'aberto' } 
      });

      await chamado.update({
        status_id: statusAberto.id,
        data_resolucao: null,
        data_fechamento: null,
        sla_vencido: getSlaState({
          ...chamado.toJSON(),
          data_resolucao: null,
          data_fechamento: null
        }).sla_vencido
      });

      await logSlaEvent({
        req,
        chamadoId: chamado.id,
        acao: 'reopen',
        descricao: 'Chamado reaberto com recálculo de SLA',
        dados_depois: {
          data_resolucao: chamado.data_resolucao,
          data_fechamento: chamado.data_fechamento,
          prazo_sla: chamado.prazo_sla,
          sla_vencido: chamado.sla_vencido
        }
      });

      await persistSlaEvento({
        req,
        chamado,
        tipoEvento: 'resolucao',
        status: 'retomado',
        tempoPrevisto: chamado.prazo_sla,
        tempoReal: null
      });

      res.json(chamado);
    } catch (error) {
      next(error);
    }
  }

  async comentar(req, res, next) {
    try {
      const { comentario, tipo } = req.body;

      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;
      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }
      
      const novoComentario = await ChamadoComentario.create({
        chamado_id: req.params.id,
        usuario_id: req.user.id,
        comentario,
        tipo: tipo || 'publico'
      });

      await auditLog(req, {
        modulo: 'ocorrencias',
        acao: 'comment',
        entidade: 'chamado',
        entidadeId: chamado.id,
        descricao: 'Comentário adicionado ao chamado',
        dadosDepois: {
          comentario_id: novoComentario.id,
          tipo: novoComentario.tipo
        }
      });

      res.status(201).json(novoComentario);
    } catch (error) {
      next(error);
    }
  }

  async getHistorico(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;
      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const historico = await ChamadoHistorico.findAll({
        where: { chamado_id: req.params.id },
        include: [{ model: User, as: 'usuario', attributes: ['id', 'nome'] }],
        order: [['created_at', 'DESC']]
      });

      res.json(historico);
    } catch (error) {
      next(error);
    }
  }

  async getSlaEventos(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });
      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const eventos = await SlaEvento.findAll({
        where: { chamado_id: chamado.id },
        order: [['created_at', 'ASC']]
      });

      res.json({
        chamado_id: chamado.id,
        total: eventos.length,
        eventos
      });
    } catch (error) {
      next(error);
    }
  }

  async getComentarios(req, res, next) {
    try {
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;
      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const comentarios = await ChamadoComentario.findAll({
        where: { chamado_id: req.params.id },
        include: [{ model: User, as: 'usuario', attributes: ['id', 'nome', 'avatar'] }],
        order: [['created_at', 'ASC']]
      });

      res.json(comentarios);
    } catch (error) {
      next(error);
    }
  }

  async getTipos(req, res, next) {
    try {
      const tipos = await ChamadoTipo.findAll({ where: { ativo: true } });
      res.json(tipos);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const status = await ChamadoStatus.findAll({ 
        where: { ativo: true },
        order: [['ordem', 'ASC']]
      });
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  async getPrioridades(req, res, next) {
    try {
      const prioridades = await ChamadoPrioridade.findAll({ 
        where: { ativo: true },
        order: [['nivel', 'ASC']]
      });
      res.json(prioridades);
    } catch (error) {
      next(error);
    }
  }

  async transferir(req, res, next) {
    try {
      const { area_id, motivo } = req.body;
      const where = { id: req.params.id };
      if (req.tenantId) where.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where });

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const dadosAntes = {
        area_id: chamado.area_id,
        tecnico_responsavel_id: chamado.tecnico_responsavel_id
      };

      await chamado.update({
        area_id,
        tecnico_responsavel_id: null
      });

      await ChamadoHistorico.create({
        chamado_id: chamado.id,
        usuario_id: req.user.id,
        tipo: 'transferencia',
        descricao: motivo || 'Chamado transferido',
        valor_novo: { area_id }
      });

      await auditLog(req, {
        modulo: 'ocorrencias',
        acao: 'transfer',
        entidade: 'chamado',
        entidadeId: chamado.id,
        descricao: motivo || 'Chamado transferido',
        dadosAntes,
        dadosDepois: {
          area_id: chamado.area_id,
          tecnico_responsavel_id: chamado.tecnico_responsavel_id
        }
      });

      res.json(chamado);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChamadoController();
