const express = require('express');
const router = express.Router();
const { 
  getServicios, 
  createServicio, 
  updateServicio, 
  deleteServicio,
  getServiciosDoctor,
  setServiciosDoctor,
  agregarServicioDoctor,
  quitarServicioDoctor
} = require('../controllers/serviciosController');
const { authMiddleware } = require('../middleware');

router.use(authMiddleware);

// Rutas de servicios generales
router.get('/', getServicios);
router.post('/', createServicio);
router.put('/:uuid', updateServicio);
router.delete('/:uuid', deleteServicio);

// Rutas de servicios por doctor
router.get('/doctor/:doctor_uuid', getServiciosDoctor);
router.post('/doctor/:doctor_uuid', setServiciosDoctor);
router.post('/doctor/:doctor_uuid/agregar/:servicio_uuid', agregarServicioDoctor);
router.delete('/doctor/:doctor_uuid/quitar/:servicio_uuid', quitarServicioDoctor);

module.exports = router;
