const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/auth/login'));
router.get('/login', authController.renderLogin);
router.post('/login', authController.login);

router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;

