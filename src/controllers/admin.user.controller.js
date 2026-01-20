const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const { AppError, catchAsync } = require('../utils/helpers');

// Get all users
const getAllUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        isDeleted: false,
    };

    // Filter by role if provided
    if (role && ['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
        where.role = role;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: parseInt(limit),
            select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
                address: true,
                role: true,
                isSuperAdmin: true,
                createdAt: true,
                sellerProfile: {
                    select: {
                        id: true,
                        businessName: true,
                        isApproved: true,
                        sellerType: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        }),
        prisma.user.count({ where }),
    ]);

    res.json({
        success: true,
        data: users,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    });
});

// Get user by ID
const getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            address: true,
            role: true,
            isSuperAdmin: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            sellerProfile: {
                include: {
                    _count: {
                        select: {
                            products: true,
                            orders: true,
                        },
                    },
                },
            },
            orders: {
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                },
                take: 10,
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({
        success: true,
        data: user,
    });
});

// Ban user (soft delete)
const banUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            sellerProfile: true,
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.isSuperAdmin) {
        throw new AppError('Cannot ban super admin', 403);
    }

    if (user.isDeleted) {
        throw new AppError('User is already banned', 400);
    }

    // Ban user and cascade effects in a transaction
    await prisma.$transaction(async (tx) => {
        // Soft delete user
        await tx.user.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        // If user is a seller, soft delete seller profile and products
        if (user.sellerProfile) {
            await tx.sellerProfile.update({
                where: { id: user.sellerProfile.id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });

            // Soft delete all products
            await tx.product.updateMany({
                where: { sellerId: user.sellerProfile.id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });

            // Cancel all active orders as seller
            await tx.order.updateMany({
                where: {
                    sellerId: user.sellerProfile.id,
                    status: {
                        in: ['PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED'],
                    },
                },
                data: {
                    status: 'CANCELLED',
                    isCancelled: true,
                },
            });
        }

        // Cancel all active orders as buyer
        await tx.order.updateMany({
            where: {
                buyerId: id,
                status: {
                    in: ['PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED'],
                },
            },
            data: {
                status: 'CANCELLED',
                isCancelled: true,
            },
        });
    });

    res.json({
        success: true,
        message: 'User banned successfully',
    });
});

// Add admin (super admin only)
const addAdmin = catchAsync(async (req, res) => {
    const { email, password, fullName, phoneNumber, address } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName,
            phoneNumber,
            address,
            role: 'ADMIN',
            isSuperAdmin: false,
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isSuperAdmin: true,
            createdAt: true,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Admin added successfully',
        data: admin,
    });
});

// Remove admin (super admin only)
const removeAdmin = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.role !== 'ADMIN') {
        throw new AppError('User is not an admin', 400);
    }

    if (user.isSuperAdmin) {
        throw new AppError('Cannot remove super admin', 403);
    }

    // Soft delete admin
    await prisma.user.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    res.json({
        success: true,
        message: 'Admin removed successfully',
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    banUser,
    addAdmin,
    removeAdmin,
};
