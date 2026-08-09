const express = require('express');
const router = express.Router();
const consultoriosInternosController = require('../controllers/consultoriosInternosController');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los consultorios internos
router.get('/', consultoriosInternosController.getAll);

// Obtener solo consultorios activos
router.get('/activos', consultoriosInternosController.getActivos);

// Obtener un consultorio por UUID
router.get('/:uuid', consultoriosInternosController.getByUuid);

// Obtener disponibilidad de un consultorio
router.get('/:uuid/disponibilidad', consultoriosInternosController.getDisponibilidad);

// Crear un nuevo consultorio
router.post('/', consultoriosInternosController.create);

// Actualizar un consultorio
router.put('/:uuid', consultoriosInternosController.update);

// Eliminar un consultorio
router.delete('/:uuid', consultoriosInternosController.remove);

module.exports = router;
