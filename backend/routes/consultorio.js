const express = require('express');
const router = express.Router();
const {
  getConsultorio,
  updateConsultorio,
  getWhatsappConfig,
  updateWhatsappConfig,
  getEstadisticas,
  getReporteIngresos
} = require('../controllers/consultorioController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

router.get('/', getConsultorio);
router.put('/', requireRole('admin'), updateConsultorio);
router.get('/whatsapp', requireRole('admin'), getWhatsappConfig);
router.put('/whatsapp', requireRole('admin'), updateWhatsappConfig);
router.get('/estadisticas', getEstadisticas);
router.get('/reporte-ingresos', getReporteIngresos);

module.exports = router;
