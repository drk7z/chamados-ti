const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth');
const {
	loginValidation,
	alterarSenhaValidation,
	validate
} = require('./auth.validators');

const loginLimiter = rateLimit({
	windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
	max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: 'Muitas tentativas de login. Tente novamente mais tarde.'
});

// Rotas públicas
router.post('/login', loginLimiter, loginValidation, validate, authController.login);

// Rotas protegidas
router.get('/me', authenticate, authController.me);
router.post('/refresh', authenticate, authController.refresh);
router.post('/alterar-senha', authenticate, alterarSenhaValidation, validate, authController.alterarSenha);

module.exports = router;
