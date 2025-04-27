const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', isAuthenticated, getMe);
router.get('/logout', isAuthenticated, logout);

module.exports = router;
