const express = require('express');
const {
    applyToBecomeSeller,
    getSellerProfile,
    updateSellerProfile,
} = require('../controllers/seller.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
    sellerApplicationSchema,
    updateSellerProfileSchema,
} = require('../utils/validation.schemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/apply', validate(sellerApplicationSchema), applyToBecomeSeller);
router.get('/profile', getSellerProfile);
router.put('/profile', validate(updateSellerProfileSchema), updateSellerProfile);

module.exports = router;
