const express = require('express');
const router = express.Router();
const { getCanjes, entregarCanje, cancelarCanje } = require('../controllers/canjesController');
const { authMiddleware } = require('../middleware');

router.use(authMiddleware);

router.get('/', getCanjes);
router.put('/:uuid/entregar', entregarCanje);
router.put('/:uuid/cancelar', cancelarCanje);

module.exports = router;
