const express = require('express');
const { getAnalytics } = require('../controllers/admin.analytics.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/stats', getAnalytics);

module.exports = router;
