const express = require('express');  
const verController = require('../controllers/verPersonajeController'); 
const router = express.Router(); 
 
router.post('/:id/vida', verController.actualizarVidaActual);
router.get('/:id', verController.renderVer);

module.exports = router;