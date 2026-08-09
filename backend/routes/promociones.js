const express = require('express');
const router = express.Router();
const {
  getPromociones,
  createPromocion,
  updatePromocion,
  deletePromocion
} = require('../controllers/promocionesController');
const { authMiddleware } = require('../middleware');

router.use(authMiddleware);

router.get('/', getPromociones);
router.post('/', createPromocion);
router.put('/:uuid', updatePromocion);
router.delete('/:uuid', deletePromocion);

module.exports = router;
