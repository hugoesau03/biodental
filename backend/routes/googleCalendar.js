const express = require('express');
const router = express.Router();
const {
  getConfig, updateConfig, getAuthUrl, handleCallback, getStatus, disconnect, syncNow
} = require('../controllers/googleCalendarController');
const { authMiddleware, requireRole } = require('../middleware');

// Callback público: Google redirige el navegador aquí sin nuestro JWT.
// La identidad del usuario viaja firmada en el parámetro `state`.
router.get('/callback', handleCallback);

router.use(authMiddleware);

// Credenciales OAuth de la aplicación: globales a toda la instalación,
// no por consultorio. Solo admin.
router.get('/config', requireRole('admin'), getConfig);
router.put('/config', requireRole('admin'), updateConfig);

// Conexión personal del doctor con su propio calendario
router.get('/auth-url', requireRole('doctor'), getAuthUrl);
router.get('/status', requireRole('doctor'), getStatus);
router.delete('/', requireRole('doctor'), disconnect);
router.post('/sync', requireRole('doctor'), syncNow);

module.exports = router;
