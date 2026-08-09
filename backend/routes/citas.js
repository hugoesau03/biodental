const express = require('express');
const router = express.Router();
const { 
  getCitas, 
  getCita, 
  createCita, 
  updateCita, 
  deleteCita 
} = require('../controllers/citasController');
const { authMiddleware } = require('../middleware');

router.use(authMiddleware);

router.get('/', getCitas);
router.get('/:uuid', getCita);
router.post('/', createCita);
router.put('/:uuid', updateCita);
router.delete('/:uuid', deleteCita);

module.exports = router;
