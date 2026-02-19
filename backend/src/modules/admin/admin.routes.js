const express = require('express');
const router = express.Router();
const { authorize } = require('../../middlewares/auth');

// Importar sub-rotas
const usuariosRoutes = require('./usuarios.routes');
const configuracoes = require('./configuracoes.routes');
const entidadesRoutes = require('./entidades.routes');
const logsRoutes = require('./logs.routes');
const areasRoutes = require('./areas.routes');
const gruposTecnicosRoutes = require('./grupos-tecnicos.routes');

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
  const admin = req.user.roles?.some(role => role.nivel <= 2);
  if (!admin) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

router.use(isAdmin);

// Sub-rotas
router.use('/usuarios', usuariosRoutes);
router.use('/configuracoes', configuracoes);
router.use('/entidades', entidadesRoutes);
router.use('/logs', logsRoutes);
router.use('/areas', areasRoutes);
router.use('/grupos-tecnicos', gruposTecnicosRoutes);

module.exports = router;
