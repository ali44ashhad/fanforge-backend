const express = require('express');
const {
    getPendingSellers,
    getAllSellers,
    approveSeller,
    changeSellerType,
    removeSeller,
} = require('../controllers/admin.seller.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/pending', getPendingSellers);
router.get('/', getAllSellers);
router.put('/:id/approve', approveSeller);
router.put('/:id/type', changeSellerType);
router.delete('/:id', removeSeller);

module.exports = router;
