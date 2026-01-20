const express = require('express');
const {
    placeOrder,
    getBuyerOrders,
    getSellerOrders,
    cancelOrder,
    updateOrderStatus,
} = require('../controllers/order.controller');
const { authenticate, requireSeller } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { placeOrderSchema, updateOrderStatusSchema } = require('../utils/validation.schemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Buyer routes
router.post('/', validate(placeOrderSchema), placeOrder);
router.get('/buyer/my-orders', getBuyerOrders);
router.put('/:id/cancel', cancelOrder);

// Seller routes
router.get('/seller/my-orders', requireSeller, getSellerOrders);
router.put('/:id/status', requireSeller, validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
