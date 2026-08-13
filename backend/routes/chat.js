const express = require('express');
const router = express.Router();
const { getConversaciones, getMensajes, enviarMensaje, getNoLeidos } = require('../controllers/chatController');
const { authMiddleware } = require('../middleware');

router.use(authMiddleware);

router.get('/no-leidos', getNoLeidos);
router.get('/:paciente_uuid', getMensajes);
router.post('/:paciente_uuid', enviarMensaje);
router.get('/', getConversaciones);

module.exports = router;
