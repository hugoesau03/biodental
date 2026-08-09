const express = require('express');
const router = express.Router();
const { 
  getNotificaciones, 
  getConteoNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  createNotificacion,
  deleteNotificacion,
  limpiarAntiguos,
  limpiarTodas
} = require('../controllers/notificacionesController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

// Obtener notificaciones del usuario
router.get('/', getNotificaciones);

// Obtener conteo de no leídas
router.get('/conteo', getConteoNoLeidas);

// Marcar todas como leídas
router.put('/leer-todas', marcarTodasLeidas);

// Marcar una como leída
router.put('/:id/leer', marcarLeida);

// Crear notificación (solo admin)
router.post('/', requireRole('admin'), createNotificacion);

// Limpiar todas las notificaciones del usuario actual
router.delete('/limpiar-todas', limpiarTodas);

// Eliminar notificación
router.delete('/:id', deleteNotificacion);

// Limpiar notificaciones antiguas (solo admin)
router.delete('/limpiar', requireRole('admin'), limpiarAntiguos);

module.exports = router;
