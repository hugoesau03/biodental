const express = require('express');
const router = express.Router();
const { 
  getFormularios, 
  getFormulario,
  createFormulario, 
  updateFormulario, 
  deleteFormulario,
  getFormulariosCompletados,
  completarFormulario,
  deleteFormularioCompletado
} = require('../controllers/formulariosController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

// Formularios completados (DEBE IR ANTES de /:uuid)
router.get('/completados', getFormulariosCompletados);
router.get('/completados/:paciente_uuid', getFormulariosCompletados);
router.post('/completados', completarFormulario);
router.delete('/completados/:id', deleteFormularioCompletado);

// Plantillas de formularios
router.get('/', getFormularios);
router.post('/', requireRole('admin', 'doctor'), createFormulario);
router.get('/:uuid', getFormulario);
router.put('/:uuid', requireRole('admin', 'doctor'), updateFormulario);
router.delete('/:uuid', requireRole('admin', 'doctor'), deleteFormulario);

module.exports = router;
