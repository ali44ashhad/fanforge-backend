const express = require('express');
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { updateProfileSchema } = require('../utils/validation.schemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

module.exports = router;
