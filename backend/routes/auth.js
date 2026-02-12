const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, refresh } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegistration, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/logout', logout);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', authenticate, getMe);

module.exports = router;