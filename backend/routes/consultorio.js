const express = require('express');
const router = express.Router();
const {
  getConsultorio,
  updateConsultorio,
  getWhatsappConfig,
  updateWhatsappConfig,
  getAsistenteIAConfig,
  updateAsistenteIAConfig,
  getCredencialesAsistente,
  getEstadisticas,
  getReporteIngresos
} = require('../controllers/consultorioController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

router.get('/', getConsultorio);
router.put('/', requireRole('admin'), updateConsultorio);
router.get('/whatsapp', requireRole('admin'), getWhatsappConfig);
router.put('/whatsapp', requireRole('admin'), updateWhatsappConfig);
router.get('/asistente-whatsapp', requireRole('admin'), getAsistenteIAConfig);
router.put('/asistente-whatsapp', requireRole('admin'), updateAsistenteIAConfig);
// Sin requireRole('admin') a propósito: la consume el agente de WhatsApp
// (whatsapp-agentkit) con su cuenta de servicio de rol recepcionista, ver
// el comentario de getCredencialesAsistente en el controlador.
router.get('/asistente-whatsapp/credenciales', getCredencialesAsistente);
router.get('/estadisticas', getEstadisticas);
router.get('/reporte-ingresos', getReporteIngresos);

module.exports = router;
