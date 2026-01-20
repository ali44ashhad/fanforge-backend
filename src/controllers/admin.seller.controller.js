const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');
const { sendSellerApprovedEmail } = require('../services/email.service');

// Get pending seller applications
const getPendingSellers = catchAsync(async (req, res) => {
    const pendingSellers = await prisma.sellerProfile.findMany({
        where: {
            isApproved: false,
            isDeleted: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    res.json({
        success: true,
        data: pendingSellers,
    });
});

// Get all sellers
const getAllSellers = catchAsync(async (req, res) => {
    const sellers = await prisma.sellerProfile.findMany({
        where: {
            isDeleted: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    res.json({
        success: true,
        data: sellers,
    });
});

// Approve seller and assign type
const approveSeller = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { sellerType } = req.body; // OFFICIAL or FAN_MADE

    if (!sellerType || !['OFFICIAL', 'FAN_MADE'].includes(sellerType)) {
        throw new AppError('Valid seller type (OFFICIAL or FAN_MADE) is required', 400);
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    if (sellerProfile.isApproved) {
        throw new AppError('Seller is already approved', 400);
    }

    // Update seller profile and user role in a transaction
    const [updatedSeller, updatedUser] = await prisma.$transaction([
        prisma.sellerProfile.update({
            where: { id },
            data: {
                isApproved: true,
                sellerType,
            },
        }),
        prisma.user.update({
            where: { id: sellerProfile.userId },
            data: {
                role: 'SELLER',
            },
        }),
    ]);

    // Send approval email to seller
    await sendSellerApprovedEmail(
        sellerProfile.user.email,
        updatedSeller.businessName,
        sellerType
    );

    res.json({
        success: true,
        message: 'Seller approved successfully',
        data: updatedSeller,
    });
});

// Change seller type (and update all products)
const changeSellerType = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { sellerType } = req.body;

    if (!sellerType || !['OFFICIAL', 'FAN_MADE'].includes(sellerType)) {
        throw new AppError('Valid seller type (OFFICIAL or FAN_MADE) is required', 400);
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    // Update seller type and all products in a transaction
    const [updatedSeller, updatedProducts] = await prisma.$transaction([
        prisma.sellerProfile.update({
            where: { id },
            data: { sellerType },
        }),
        prisma.product.updateMany({
            where: { sellerId: id },
            data: { productType: sellerType },
        }),
    ]);

    res.json({
        success: true,
        message: `Seller type changed to ${sellerType}. ${updatedProducts.count} products updated.`,
        data: updatedSeller,
    });
});

// Remove seller (soft delete)
const removeSeller = catchAsync(async (req, res) => {
    const { id } = req.params;

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    // Soft delete seller, products, and cancel active orders in a transaction
    await prisma.$transaction(async (tx) => {
        // Soft delete seller profile
        await tx.sellerProfile.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        // Soft delete all products
        await tx.product.updateMany({
            where: { sellerId: id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        // Cancel all active orders
        await tx.order.updateMany({
            where: {
                sellerId: id,
                status: {
                    in: ['PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED'],
                },
            },
            data: {
                status: 'CANCELLED',
                isCancelled: true,
            },
        });

        // Soft delete user
        await tx.user.update({
            where: { id: sellerProfile.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
    });

    res.json({
        success: true,
        message: 'Seller removed successfully',
    });
});

module.exports = {
    getPendingSellers,
    getAllSellers,
    approveSeller,
    changeSellerType,
    removeSeller,
};
