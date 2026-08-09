const express = require('express');
const router = express.Router();
const { getRecetas, getReceta, getRecetaPorCita, createReceta, updateReceta } = require('../controllers/recetasController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

router.get('/', getRecetas);
router.get('/cita/:citaUuid', getRecetaPorCita);
router.get('/:uuid', getReceta);
router.post('/', requireRole('admin', 'doctor'), createReceta);
router.put('/:uuid', requireRole('admin', 'doctor'), updateReceta);

module.exports = router;
