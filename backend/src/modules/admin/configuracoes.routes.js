const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { ConfiguracaoSistema } = require('../../models');
const { isGlobalAdmin } = require('../../middlewares/auth');

const parseValor = (tipo, valor) => {
  if (valor === null || valor === undefined) return null;
  if (tipo === 'number') return Number(valor);
  if (tipo === 'boolean') return String(valor) === 'true';
  if (tipo === 'json') {
    try {
      return JSON.parse(valor);
    } catch (_error) {
      return valor;
    }
  }
  return valor;
};

const montarChaveEscopo = (escopo, tenantId, chave) => {
  if (escopo === 'tenant') return `tenant:${tenantId}:${chave}`;
  return `global:${chave}`;
};

router.get('/', async (req, res) => {
  try {
    const globalAdmin = isGlobalAdmin(req.user);
    const tenantId = req.tenantId || null;
    const escopoSolicitado = req.query.escopo === 'global' ? 'global' : 'tenant';
    const escopoEfetivo = (escopoSolicitado === 'global' && globalAdmin) ? 'global' : 'tenant';

    if (escopoEfetivo === 'tenant' && !tenantId && process.env.MULTIEMPRESA === 'true') {
      return res.status(403).json({ error: 'Tenant não resolvido para configurações' });
    }

    const prefixo = escopoEfetivo === 'tenant'
      ? `tenant:${tenantId}:`
      : 'global:';

    const configuracoes = await ConfiguracaoSistema.findAll({
      where: {
        chave: { [Op.like]: `${prefixo}%` }
      },
      order: [['categoria', 'ASC'], ['chave', 'ASC']]
    });

    const overrides = {};
    for (const item of configuracoes) {
      const chaveSemPrefixo = item.chave.replace(prefixo, '');
      overrides[chaveSemPrefixo] = parseValor(item.tipo, item.valor);
    }

    res.json({
      sistema: {
        nome: overrides.sistema_nome || 'Chamados TI',
        versao: overrides.sistema_versao || '1.0.0'
      },
      email: {
        smtp_host: overrides.smtp_host || process.env.SMTP_HOST,
        smtp_port: overrides.smtp_port || process.env.SMTP_PORT
      },
      geral: {
        timezone: overrides.timezone || process.env.TIMEZONE,
        multiempresa: process.env.MULTIEMPRESA === 'true'
      },
      escopo: escopoEfetivo,
      tenant_id: escopoEfetivo === 'tenant' ? tenantId : null,
      overrides
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const globalAdmin = isGlobalAdmin(req.user);
    const tenantId = req.tenantId || null;
    const { chave, valor, tipo = 'string', categoria = 'geral', descricao = null, escopo = 'tenant' } = req.body;

    if (!chave) {
      return res.status(400).json({ error: 'Campo chave é obrigatório' });
    }

    if (escopo === 'global' && !globalAdmin) {
      return res.status(403).json({ error: 'Apenas administrador global pode alterar configurações globais' });
    }

    if (escopo !== 'global' && process.env.MULTIEMPRESA === 'true' && !tenantId) {
      return res.status(403).json({ error: 'Tenant não resolvido para atualização de configuração' });
    }

    const chaveEscopo = montarChaveEscopo(escopo === 'global' ? 'global' : 'tenant', tenantId, chave);

    const existente = await ConfiguracaoSistema.findOne({ where: { chave: chaveEscopo } });

    let configuracao;
    if (existente) {
      await existente.update({
        valor: valor !== undefined && valor !== null ? String(valor) : null,
        tipo,
        categoria,
        descricao
      });
      configuracao = existente;
    } else {
      configuracao = await ConfiguracaoSistema.create({
        chave: chaveEscopo,
        valor: valor !== undefined && valor !== null ? String(valor) : null,
        tipo,
        categoria,
        descricao,
        editavel: true
      });
    }

    res.json({
      message: 'Configuração salva com sucesso',
      configuracao
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
