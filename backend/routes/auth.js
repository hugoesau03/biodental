const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/authController');
const { authMiddleware, loginLimiter } = require('../middleware');

// Rutas públicas (con límite de intentos para evitar fuerza bruta)
router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);

// Rutas protegidas
router.get('/me', authMiddleware, getMe);
router.put('/password', authMiddleware, updatePassword);

module.exports = router;
