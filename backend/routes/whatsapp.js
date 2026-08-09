const express = require('express');
const router = express.Router();
const { enviarConfirmacion, enviarRecordatorio, getMensajesCita } = require('../controllers/whatsappController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

// Historial de mensajes de una cita
router.get('/citas/:uuid', getMensajesCita);

// Enviar mensajes (roles que atienden al paciente directamente)
router.post('/citas/:uuid/confirmacion', requireRole('admin', 'recepcionista', 'doctor', 'asistente'), enviarConfirmacion);
router.post('/citas/:uuid/recordatorio', requireRole('admin', 'recepcionista', 'doctor', 'asistente'), enviarRecordatorio);

module.exports = router;
