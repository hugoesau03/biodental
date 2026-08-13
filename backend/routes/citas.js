const express = require('express');
const router = express.Router();
const {
  getCitas,
  getCita,
  createCita,
  updateCita,
  deleteCita,
  toggleCheckin
} = require('../controllers/citasController');
const { authMiddleware } = require('../middleware');

router.use(authMiddleware);

router.get('/', getCitas);
router.get('/:uuid', getCita);
router.post('/', createCita);
router.put('/:uuid', updateCita);
router.delete('/:uuid', deleteCita);
// Check-in de recepción: cualquier rol de staff autenticado puede marcar/
// desmarcar la llegada del paciente, en conjunto con el check-in que el
// propio paciente puede hacer desde su portal.
router.put('/:uuid/checkin', toggleCheckin);

module.exports = router;
