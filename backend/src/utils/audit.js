const { LogSistema } = require('../models');

const auditLog = async (req, {
  modulo,
  acao,
  entidade,
  entidadeId = null,
  descricao,
  dadosAntes = null,
  dadosDepois = null
}) => {
  try {
    const tenantId = req.tenantId || req.user?.entidade_id || null;

    await LogSistema.create({
      usuario_id: req.user?.id || null,
      modulo,
      acao,
      entidade,
      entidade_id: entidadeId,
      descricao,
      ip: req.ip,
      user_agent: req.get('user-agent') || null,
      dados_antes: dadosAntes,
      dados_depois: {
        ...(dadosDepois || {}),
        tenant_id: tenantId
      }
    });
  } catch (_error) {
  }
};

module.exports = { auditLog };
