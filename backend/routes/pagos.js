const express = require('express');
const router = express.Router();
const { registrarPago, getPagosByRecibo, getPagos } = require('../controllers/pagosController');
const { authMiddleware, requireRole } = require('../middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los pagos del consultorio
router.get('/', getPagos);

// Obtener pagos de un recibo específico
router.get('/recibo/:recibo_uuid', getPagosByRecibo);

// Registrar un nuevo pago (roles que manejan cobros)
router.post('/', requireRole('admin', 'recepcionista', 'doctor'), registrarPago);

module.exports = router;
