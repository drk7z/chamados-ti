const express = require('express');
const router = express.Router();
const ativoController = require('./ativos.controller');
const softwareController = require('./software.controller');
const { authorize } = require('../../middlewares/auth');

// Configurações
router.get('/config/tipos', ativoController.getTipos);
router.get('/config/status', ativoController.getStatus);
router.get('/config/categorias', ativoController.getCategorias);
router.get('/config/responsaveis', ativoController.getResponsaveis);
router.get('/config/unidades', ativoController.getUnidades);

// Catálogo de software
router.get('/software/config/categorias', softwareController.getCategorias);
router.get('/software/config/tipos-licenca', softwareController.getTiposLicenca);
router.get('/software', softwareController.list);
router.get('/software/:id', softwareController.getById);
router.post('/software', authorize('inventario', 'software', 'create'), softwareController.create);
router.put('/software/:id', authorize('inventario', 'software', 'update'), softwareController.update);
router.delete('/software/:id', authorize('inventario', 'software', 'delete'), softwareController.delete);

// Rotas de ativos
router.get('/', ativoController.list);
router.post('/', authorize('inventario', 'ativos', 'create'), ativoController.create);
router.put('/:id', authorize('inventario', 'ativos', 'update'), ativoController.update);
router.delete('/:id', authorize('inventario', 'ativos', 'delete'), ativoController.delete);

// Movimentação
router.post('/:id/movimentar', authorize('inventario', 'ativos', 'update'), ativoController.movimentar);
router.get('/:id/historico', ativoController.getHistorico);
router.get('/:id', ativoController.getById);

module.exports = router;
