const express = require('express');
const {
    createCategory,
    updateCategory,
    getAllCategoriesAdmin,
} = require('../controllers/admin.category.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { categorySchema } = require('../utils/validation.schemas');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.post('/', validate(categorySchema), createCategory);
router.put('/:id', validate(categorySchema), updateCategory);
router.get('/', getAllCategoriesAdmin);

module.exports = router;
