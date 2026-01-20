const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');

// Get user profile
const getProfile = catchAsync(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            address: true,
            role: true,
            isSuperAdmin: true,
            createdAt: true,
            updatedAt: true,
            sellerProfile: {
                select: {
                    id: true,
                    businessName: true,
                    businessDescription: true,
                    sellerType: true,
                    paymentMethods: true,
                    averageShippingCost: true,
                    estimatedDeliveryDays: true,
                    shippingRegions: true,
                    socialLinks: true,
                    isApproved: true,
                },
            },
        },
    });

    if (!user || user.isDeleted) {
        throw new AppError('User not found', 404);
    }

    res.json({
        success: true,
        data: user,
    });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
    const { fullName, phoneNumber, address } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        throw new AppError('No fields to update', 400);
    }

    const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: updateData,
        select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            address: true,
            role: true,
            updatedAt: true,
        },
    });

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
    });
});

module.exports = {
    getProfile,
    updateProfile,
};
