const logger = require('../utils/logger');

const resolveTenant = (req, res, next) => {
  const multiTenantEnabled = process.env.MULTIEMPRESA === 'true';

  if (!multiTenantEnabled) {
    req.tenantId = null;
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const tenantId = req.user.entidade_id || req.user.entidade?.id || null;

  if (!tenantId) {
    logger.warn(`Usuário sem entidade no modo multiempresa: ${req.user.email}`);
    return res.status(403).json({
      error: 'Usuário sem entidade vinculada para operação multiempresa'
    });
  }

  req.tenantId = tenantId;
  return next();
};

module.exports = { resolveTenant };
