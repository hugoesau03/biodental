const express = require('express');
const router = express.Router();
const { 
  getRecibos, 
  getRecibo,
  getReciboByCita,
  createRecibo, 
  pagarRecibo,
  cancelarRecibo
} = require('../controllers/recibosController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

router.get('/', getRecibos);
router.get('/cita/:citaUuid', getReciboByCita);
router.get('/:uuid', getRecibo);
router.post('/', requireRole('admin', 'recepcionista', 'doctor'), createRecibo);
router.put('/:uuid/pagar', requireRole('admin', 'recepcionista'), pagarRecibo);
router.put('/:uuid/cancelar', requireRole('admin'), cancelarRecibo);

module.exports = router;
