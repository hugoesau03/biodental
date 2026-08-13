const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  registro,
  login,
  solicitarResetPassword,
  confirmarResetPassword,
  getMe,
  updatePassword,
  logout,
  getCitasProximas,
  getHistorial,
  getDoctoresDisponibles,
  crearCitaPortal,
  checkinCita,
  confirmarCita,
  cancelarCitaPortal,
  actualizarCitaPortal,
  getFormulariosCompletadosPortal,
  getCuenta,
  getRecompensas,
  getCanjeCatalogo,
  crearCanje,
  getMisCanjes,
  getPromocionesActivas
} = require('../controllers/portalController');
const { getServiciosDoctor } = require('../controllers/serviciosController');
const { getDisponibilidad } = require('../controllers/horariosController');
const { getMisMensajes, enviarMensajePortal, getNoLeidosPortal } = require('../controllers/chatController');
const { authPaciente } = require('../middleware/authPaciente');
const { loginLimiter, validate } = require('../middleware');

// Auth pública (con rate limit compartido con el login de staff: mismo
// propósito, protegerse de fuerza bruta por IP)
router.post(
  '/auth/registro',
  loginLimiter,
  [
    body('telefono').trim().notEmpty().withMessage('El teléfono es requerido'),
    body('fecha_nacimiento').notEmpty().isDate().withMessage('Fecha de nacimiento inválida'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    // .custom() en vez de .equals()/.isBoolean(): el body llega como JSON,
    // así que estos campos ya son boolean reales (true/false), no strings —
    // comparar con === true directamente, no contra 'true'.
    body('terminos_aceptados').custom((value) => value === true).withMessage('Debes aceptar los términos y condiciones'),
    body('privacidad_aceptada').custom((value) => value === true).withMessage('Debes aceptar el Aviso de Privacidad')
  ],
  validate,
  registro
);
router.post(
  '/auth/login',
  loginLimiter,
  [
    body('telefono').trim().notEmpty().withMessage('El teléfono es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
  ],
  validate,
  login
);
// "Olvidé mi contraseña" del portal: el login usa teléfono, pero la
// recuperación usa correo (canal por el que se manda el enlace). Mismo
// flujo de dos pasos y token de un solo uso que el de staff — ver detalle
// en portalController.
router.post(
  '/auth/solicitar-reset-password',
  loginLimiter,
  [body('email').trim().isEmail().withMessage('Correo inválido')],
  validate,
  solicitarResetPassword
);
router.post(
  '/auth/confirmar-reset-password',
  loginLimiter,
  [
    body('token').trim().notEmpty().isLength({ min: 10 }).withMessage('Token inválido'),
    body('new_password').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
  ],
  validate,
  confirmarResetPassword
);

// A partir de aquí, requiere sesión de paciente
router.use(authPaciente);

router.get('/me', getMe);
router.post('/auth/logout', logout);
router.put(
  '/password',
  [
    body('current_password').notEmpty().withMessage('La contraseña actual es requerida'),
    body('new_password').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
  ],
  validate,
  updatePassword
);

router.get('/citas', getCitasProximas);
router.post('/citas', crearCitaPortal);
router.post('/citas/:uuid/checkin', checkinCita);
router.put('/citas/:uuid/confirmar', confirmarCita);
router.put('/citas/:uuid/cancelar', cancelarCitaPortal);
router.put('/citas/:uuid', actualizarCitaPortal);

router.get('/historial', getHistorial);
router.get('/formularios-completados', getFormulariosCompletadosPortal);

router.get('/doctores', getDoctoresDisponibles);
router.get('/doctores/:doctor_uuid/servicios', getServiciosDoctor);
router.get('/doctores/:doctor_uuid/disponibilidad', getDisponibilidad);

router.get('/cuenta', getCuenta);
router.get('/recompensas', getRecompensas);
router.get('/canje-catalogo', getCanjeCatalogo);
router.post('/canjes', crearCanje);
router.get('/canjes', getMisCanjes);
router.get('/promociones', getPromocionesActivas);

router.get('/chat', getMisMensajes);
router.post('/chat', enviarMensajePortal);
router.get('/chat/no-leidos', getNoLeidosPortal);

module.exports = router;
