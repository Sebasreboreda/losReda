const express = require('express');
const editarController = require('../controllers/editarPersonajeController');
const router = express.Router();

router.get('/:id/editar', editarController.renderEditar);
router.post('/:id/editar', editarController.editarPersonaje);

module.exports = router;