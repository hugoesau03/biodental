const express = require('express');
const router = express.Router();
const { 
  getPacientes, 
  getPaciente, 
  createPaciente, 
  updatePaciente,
  toggleActivePaciente,
  deletePaciente 
} = require('../controllers/pacientesController');
const {
  getDocumentos,
  createDocumento,
  deleteDocumento
} = require('../controllers/documentosController');
const { authMiddleware, requireRole } = require('../middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getPacientes);
router.get('/:uuid', getPaciente);
router.post('/', createPaciente);
router.put('/:uuid', updatePaciente);
router.patch('/:uuid/toggle-active', toggleActivePaciente);
router.delete('/:uuid', requireRole('admin'), deletePaciente);

// Rutas de documentos del paciente
router.get('/:uuid/documentos', getDocumentos);
router.post('/:uuid/documentos', createDocumento);
router.delete('/:uuid/documentos/:docUuid', deleteDocumento);

module.exports = router;
