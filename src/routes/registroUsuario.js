const express = require('express');
const authController = require('../controllers/registroUsuarioController');

const router = express.Router();

router.get('/registro', authController.renderRegistro);
router.post('/registro', authController.crearCuenta);

module.exports = router;