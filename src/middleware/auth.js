const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');

// Authenticate user
const authenticate = catchAsync(async (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists and not deleted
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isSuperAdmin: true,
                isDeleted: true,
            },
        });

        if (!user || user.isDeleted) {
            throw new AppError('User not found or deactivated', 401);
        }

        // Attach user to request
        req.user = {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expired', 401);
        }
        throw error;
    }
});

// Require specific roles
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new AppError('Insufficient permissions', 403);
        }
        next();
    };
};

// Require super admin
const requireSuperAdmin = (req, res, next) => {
    if (!req.user.isSuperAdmin) {
        throw new AppError('Super admin access required', 403);
    }
    next();
};

// Require approved seller
const requireSeller = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'SELLER') {
        throw new AppError('Seller access required', 403);
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.userId },
        select: { isApproved: true, isDeleted: true },
    });

    if (!sellerProfile || !sellerProfile.isApproved || sellerProfile.isDeleted) {
        throw new AppError('Seller account not approved or deactivated', 403);
    }

    next();
});

module.exports = {
    authenticate,
    requireRole,
    requireSuperAdmin,
    requireSeller,
};
