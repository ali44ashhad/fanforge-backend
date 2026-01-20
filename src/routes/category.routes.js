const express = require('express');
const { getAllCategories, getCategoryById } = require('../controllers/category.controller');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

module.exports = router;
