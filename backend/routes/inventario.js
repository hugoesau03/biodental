const express = require('express');
const router = express.Router();
const { 
  getInventario, 
  getProducto, 
  createProducto, 
  updateProducto, 
  deleteProducto,
  getAlertasStock,
  ajustarStock
} = require('../controllers/inventarioController');
const { authMiddleware, requireRole } = require('../middleware');

router.use(authMiddleware);

router.get('/', getInventario);
router.get('/alertas', getAlertasStock);
router.get('/:uuid', getProducto);
router.post('/', requireRole('admin', 'recepcionista'), createProducto);
router.put('/:uuid', requireRole('admin', 'recepcionista'), updateProducto);
router.delete('/:uuid', requireRole('admin'), deleteProducto);
router.post('/:uuid/ajustar-stock', requireRole('admin', 'recepcionista'), ajustarStock);

module.exports = router;
