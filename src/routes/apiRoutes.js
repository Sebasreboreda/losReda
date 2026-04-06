const express = require('express');  
const apiController = require('../controllers/apiController'); 
 
const router = express.Router(); 

router.get('/dnd/clases-api', apiController.clasesApi); 
router.get('/dnd/razas-api', apiController.razasApi); 
router.get('/dnd/subclases-api', apiController.subclasesApi);
router.get('/dnd/subclases-detalle-api', apiController.subclasesDetalleApi); 
 
router.post('/dnd/guardar-clases', apiController.guardarClases); 
router.get('/dnd/guardar-clases', apiController.guardarClases); 

router.post('/dnd/guardar-razas', apiController.guardarRazas); 
router.get('/dnd/guardar-razas', apiController.guardarRazas); 

router.post('/dnd/guardar-niveles', apiController.guardarNiveles);
router.get('/dnd/guardar-niveles', apiController.guardarNiveles);

module.exports = router;
