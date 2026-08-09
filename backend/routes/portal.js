const express = require('express');
const router = express.Router();
const {
  registro,
  login,
  getMe,
  updatePassword,
  getCitasProximas,
  getHistorial,
  getDoctoresDisponibles,
  crearCitaPortal,
  checkinCita,
  getCuenta,
  getRecompensas,
  getPromocionesActivas
} = require('../controllers/portalController');
const { getServiciosDoctor } = require('../controllers/serviciosController');
const { getDisponibilidad } = require('../controllers/horariosController');
const { authPaciente } = require('../middleware/authPaciente');
const { loginLimiter } = require('../middleware');

// Auth pública (con rate limit compartido con el login de staff: mismo
// propósito, protegerse de fuerza bruta por IP)
router.post('/auth/registro', loginLimiter, registro);
router.post('/auth/login', loginLimiter, login);

// A partir de aquí, requiere sesión de paciente
router.use(authPaciente);

router.get('/me', getMe);
router.put('/password', updatePassword);

router.get('/citas', getCitasProximas);
router.post('/citas', crearCitaPortal);
router.post('/citas/:uuid/checkin', checkinCita);

router.get('/historial', getHistorial);

router.get('/doctores', getDoctoresDisponibles);
router.get('/doctores/:doctor_uuid/servicios', getServiciosDoctor);
router.get('/doctores/:doctor_uuid/disponibilidad', getDisponibilidad);

router.get('/cuenta', getCuenta);
router.get('/recompensas', getRecompensas);
router.get('/promociones', getPromocionesActivas);

module.exports = router;
