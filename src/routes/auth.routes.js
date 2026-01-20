const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);

module.exports = router;
