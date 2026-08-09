const express = require('express');
const router = express.Router();
const { 
  getUsuarios, 
  getDoctores,
  getUsuario, 
  createUsuario, 
  updateUsuario, 
  deleteUsuario 
} = require('../controllers/usuariosController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

router.get('/', getUsuarios);
router.get('/doctores', getDoctores);
router.get('/:uuid', getUsuario);
router.post('/', requireRole('admin'), createUsuario);
// Permitir que cualquier usuario autenticado haga PUT, pero el controlador verifica permisos
router.put('/:uuid', updateUsuario);
router.delete('/:uuid', requireRole('admin'), deleteUsuario);

module.exports = router;
