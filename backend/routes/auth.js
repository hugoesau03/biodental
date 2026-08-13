const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, crearConsultorio, login, getMe, updatePassword, logout, solicitarResetPassword, confirmarResetPassword } = require('../controllers/authController');
const { authMiddleware, requireSuperadmin, loginLimiter, validate } = require('../middleware');

// Validadores compartidos entre /register y /crear-consultorio (mismo
// payload). No se usa .normalizeEmail() a propósito: reescribe direcciones
// de Gmail quitando puntos/alias "+", lo que podría dejar de matchear
// cuentas ya existentes que se registraron sin esa normalización.
const validarAltaConsultorio = [
  body('consultorio_nombre').trim().notEmpty().withMessage('El nombre del consultorio es requerido').isLength({ max: 150 }),
  body('consultorio_email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Correo de consultorio inválido'),
  body('consultorio_telefono').optional({ checkFalsy: true }).trim().isLength({ max: 25 }),
  body('usuario_nombre').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 100 }),
  body('usuario_apellidos').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('usuario_email').trim().isEmail().withMessage('Correo inválido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
];

// Rutas públicas (con límite de intentos para evitar fuerza bruta)
router.post('/register', loginLimiter, validarAltaConsultorio, validate, register);
router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().notEmpty().withMessage('El correo es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
  ],
  validate,
  login
);
// Pantalla "olvidé mi contraseña": paso 1 pide el correo y envía un enlace
// con token de un solo uso; paso 2 recibe ese token y define la nueva
// contraseña. Ver detalle de la verificación en el controlador.
router.post(
  '/solicitar-reset-password',
  loginLimiter,
  [body('email').trim().isEmail().withMessage('Correo inválido')],
  validate,
  solicitarResetPassword
);
router.post(
  '/confirmar-reset-password',
  loginLimiter,
  [
    body('token').trim().notEmpty().isLength({ min: 10 }).withMessage('Token inválido'),
    body('new_password').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
  ],
  validate,
  confirmarResetPassword
);

// Rutas protegidas
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);
router.put(
  '/password',
  authMiddleware,
  [
    body('current_password').notEmpty().withMessage('La contraseña actual es requerida'),
    body('new_password').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
  ],
  validate,
  updatePassword
);
// Alta de un consultorio (tenant) nuevo desde dentro de la app, sin pasar
// por el registro público. Exclusivo del superadmin de la plataforma.
router.post(
  '/crear-consultorio',
  authMiddleware,
  requireSuperadmin,
  loginLimiter,
  validarAltaConsultorio,
  validate,
  crearConsultorio
);

module.exports = router;
