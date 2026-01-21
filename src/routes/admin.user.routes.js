const express = require('express');
const {
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    addAdmin,
    removeAdmin,
} = require('../controllers/admin.user.controller');
const { authenticate, requireRole, requireSuperAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { addAdminSchema } = require('../utils/validation.schemas');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.delete('/:id/ban', banUser);
router.put('/:id/unban', unbanUser);

// Super admin only routes
router.post('/admins', requireSuperAdmin, validate(addAdminSchema), addAdmin);
router.delete('/admins/:id', requireSuperAdmin, removeAdmin);

module.exports = router;
