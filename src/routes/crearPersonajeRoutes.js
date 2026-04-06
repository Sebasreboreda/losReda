const express = require('express');
const crearController = require('../controllers/crearPersonajeController');

const router = express.Router();

router.get('/crear', crearController.renderCrear);
router.get('/crear/1', crearController.renderCrearPaso1);
router.get('/crear/2', crearController.renderCrearPaso2);
router.get('/crear/3', crearController.renderCrearPaso3);
router.post('/crear', crearController.crearPersonaje);

module.exports = router;