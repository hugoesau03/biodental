const express = require('express');
const router = express.Router();
const { 
  getHorarios, 
  setHorarios, 
  getBloqueos, 
  createBloqueo, 
  deleteBloqueo,
  getDisponibilidad
} = require('../controllers/horariosController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

// Horarios de doctor
router.get('/doctor/:doctor_uuid', getHorarios);
router.put('/doctor/:doctor_uuid', requireRole('admin', 'doctor'), setHorarios);

// Disponibilidad
router.get('/disponibilidad/:doctor_uuid', getDisponibilidad);

// Bloqueos
router.get('/bloqueos/:doctor_uuid', getBloqueos);
router.post('/bloqueos/:doctor_uuid', requireRole('admin', 'doctor'), createBloqueo);
router.delete('/bloqueos/:id', requireRole('admin', 'doctor'), deleteBloqueo);

module.exports = router;
