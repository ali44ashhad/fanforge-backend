const express = require('express');
const {
    getPendingProducts,
    getAllProducts,
    approveProduct,
    removeProduct,
} = require('../controllers/admin.product.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/pending', getPendingProducts);
router.get('/', getAllProducts);
router.put('/:id/approve', approveProduct);
router.delete('/:id', removeProduct);

module.exports = router;
