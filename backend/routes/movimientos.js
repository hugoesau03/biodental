const express = require('express');
const router = express.Router();
const movimientosController = require('../controllers/movimientosController');
const { authMiddleware, requireRole } = require('../middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/movimientos-externos - Obtener movimientos
router.get('/', movimientosController.getMovimientos);

// GET /api/movimientos-externos/:uuid - Obtener un movimiento
router.get('/:uuid', movimientosController.getMovimiento);

// Registrar / modificar / eliminar movimientos: solo roles que manejan caja
router.post('/', requireRole('admin', 'recepcionista'), movimientosController.registrarMovimiento);
router.put('/:uuid', requireRole('admin', 'recepcionista'), movimientosController.actualizarMovimiento);
router.delete('/:uuid', requireRole('admin'), movimientosController.eliminarMovimiento);

module.exports = router;
