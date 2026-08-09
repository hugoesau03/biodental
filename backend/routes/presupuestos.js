const express = require('express');
const router = express.Router();
const {
  getPresupuestos,
  getPresupuesto,
  getPresupuestoPorCita,
  createPresupuesto,
  updatePresupuesto,
  actualizarEstadoPresupuesto
} = require('../controllers/presupuestosController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

router.get('/', getPresupuestos);
router.get('/cita/:citaUuid', getPresupuestoPorCita);
router.get('/:uuid', getPresupuesto);
router.post('/', requireRole('admin', 'doctor', 'recepcionista'), createPresupuesto);
router.put('/:uuid', requireRole('admin', 'doctor', 'recepcionista'), updatePresupuesto);
router.put('/:uuid/estado', requireRole('admin', 'doctor', 'recepcionista'), actualizarEstadoPresupuesto);

module.exports = router;
