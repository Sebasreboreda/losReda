const express = require('express');
const borrarController = require('../controllers/borrarPersonajeController');
const router = express.Router();

router.post('/:id/borrar', borrarController.borrarPersonaje);

module.exports = router;