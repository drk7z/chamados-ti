const express = require('express');
const router = express.Router();
const chamadoController = require('./chamados.controller');
const anexoController = require('./anexos.controller');
const { authorize } = require('../../middlewares/auth');
const { upload } = require('../../middlewares/upload');

// Rotas de chamados
router.get('/', chamadoController.list);
router.get('/metricas/sla', chamadoController.getMetricasSla);
router.get('/:id', chamadoController.getById);
router.post('/', chamadoController.create);
router.put('/:id', chamadoController.update);
router.delete('/:id', authorize('ocorrencias', 'chamados', 'delete'), chamadoController.delete);

// Ações no chamado
router.post('/:id/atribuir', chamadoController.atribuir);
router.post('/:id/transferir', chamadoController.transferir);
router.post('/:id/resolver', chamadoController.resolver);
router.post('/:id/fechar', chamadoController.fechar);
router.post('/:id/reabrir', chamadoController.reabrir);
router.post('/:id/comentar', chamadoController.comentar);

// Histórico e comentários
router.get('/:id/historico', chamadoController.getHistorico);
router.get('/:id/comentarios', chamadoController.getComentarios);
router.get('/:id/sla-eventos', chamadoController.getSlaEventos);

// Anexos
router.get('/:id/anexos', anexoController.list);
router.post('/:id/anexos', upload.single('arquivo'), anexoController.upload);
router.get('/anexos/:id/download', anexoController.download);
router.delete('/anexos/:id', anexoController.delete);

// Rotas de tipos, status e prioridades
router.get('/config/tipos', chamadoController.getTipos);
router.get('/config/status', chamadoController.getStatus);
router.get('/config/prioridades', chamadoController.getPrioridades);

module.exports = router;
