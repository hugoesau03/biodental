const express = require('express');
const router = express.Router();
const { register, crearConsultorio, login, getMe, updatePassword, resetPassword } = require('../controllers/authController');
const { authMiddleware, requireSuperadmin, loginLimiter } = require('../middleware');

// Rutas públicas (con límite de intentos para evitar fuerza bruta)
router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
// Pantalla "olvidé mi contraseña": restablece sin pedir la anterior.
// Provisional (sin verificación por correo) — ver nota en el controlador.
router.post('/reset-password', loginLimiter, resetPassword);

// Rutas protegidas
router.get('/me', authMiddleware, getMe);
router.put('/password', authMiddleware, updatePassword);
// Alta de un consultorio (tenant) nuevo desde dentro de la app, sin pasar
// por el registro público. Exclusivo del superadmin de la plataforma.
router.post('/crear-consultorio', authMiddleware, requireSuperadmin, loginLimiter, crearConsultorio);

module.exports = router;
