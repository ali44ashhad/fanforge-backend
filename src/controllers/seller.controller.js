const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');

// Apply to become a seller
const applyToBecomeSeller = catchAsync(async (req, res) => {
    const userId = req.user.userId;

    // Check if user is already a seller or has pending application
    const existingProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
    });

    if (existingProfile) {
        if (existingProfile.isApproved) {
            throw new AppError('You are already an approved seller', 400);
        } else {
            throw new AppError('Your seller application is pending approval', 400);
        }
    }

    const {
        businessName,
        businessDescription,
        paymentMethods,
        averageShippingCost,
        estimatedDeliveryDays,
        shippingRegions,
        socialLinks,
    } = req.body;

    // Create seller profile
    const sellerProfile = await prisma.sellerProfile.create({
        data: {
            userId,
            businessName,
            businessDescription,
            paymentMethods,
            averageShippingCost,
            estimatedDeliveryDays,
            shippingRegions,
            socialLinks,
            isApproved: false, // Pending approval
        },
    });

    res.status(201).json({
        success: true,
        message: 'Seller application submitted successfully. Awaiting admin approval.',
        data: sellerProfile,
    });
});

// Get seller profile
const getSellerProfile = catchAsync(async (req, res) => {
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.userId },
        include: {
            user: {
                select: {
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
        },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    res.json({
        success: true,
        data: sellerProfile,
    });
});

// Update seller profile
const updateSellerProfile = catchAsync(async (req, res) => {
    const userId = req.user.userId;

    // Check if seller profile exists
    const existingProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
    });

    if (!existingProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    // Build update object
    const updateData = {};
    const allowedFields = [
        'businessName',
        'businessDescription',
        'paymentMethods',
        'averageShippingCost',
        'estimatedDeliveryDays',
        'shippingRegions',
        'socialLinks',
    ];

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    if (Object.keys(updateData).length === 0) {
        throw new AppError('No fields to update', 400);
    }

    const updatedProfile = await prisma.sellerProfile.update({
        where: { userId },
        data: updateData,
    });

    res.json({
        success: true,
        message: 'Seller profile updated successfully',
        data: updatedProfile,
    });
});

module.exports = {
    applyToBecomeSeller,
    getSellerProfile,
    updateSellerProfile,
};
