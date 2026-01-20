const express = require('express');
const {
    createProduct,
    getAllProducts,
    getProductById,
    getMyProducts,
    updateProduct,
    deleteProduct,
} = require('../controllers/product.controller');
const { authenticate, requireSeller } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createProductSchema, updateProductSchema } = require('../utils/validation.schemas');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Seller routes (require authentication and seller approval)
router.post(
    '/',
    authenticate,
    requireSeller,
    upload.array('images', 5),
    validate(createProductSchema),
    createProduct
);
router.get('/seller/my-products', authenticate, requireSeller, getMyProducts);
router.put('/:id', authenticate, requireSeller, validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, requireSeller, deleteProduct);

module.exports = router;
