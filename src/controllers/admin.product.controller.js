const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');
const { deleteImages } = require('../services/cloudinary.service');
const { sendProductApprovedEmail } = require('../services/email.service');

// Get pending products
const getPendingProducts = catchAsync(async (req, res) => {
    const pendingProducts = await prisma.product.findMany({
        where: {
            isApproved: false,
            isDeleted: false,
        },
        include: {
            images: {
                orderBy: { order: 'asc' },
            },
            category: true,
            seller: {
                select: {
                    id: true,
                    businessName: true,
                    sellerType: true,
                    user: {
                        select: {
                            fullName: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    res.json({
        success: true,
        data: pendingProducts,
    });
});

// Get all products (including unapproved)
const getAllProducts = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: {
                isDeleted: false,
            },
            skip,
            take: parseInt(limit),
            include: {
                images: {
                    orderBy: { order: 'asc' },
                    take: 1,
                },
                category: true,
                seller: {
                    select: {
                        id: true,
                        businessName: true,
                        sellerType: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({
            where: { isDeleted: false },
        }),
    ]);

    res.json({
        success: true,
        data: products,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    });
});

// Approve product
const approveProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            seller: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (product.isApproved) {
        throw new AppError('Product is already approved', 400);
    }

    const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
            isApproved: true,
        },
        include: {
            images: true,
            category: true,
        },
    });

    // Send approval email to seller
    await sendProductApprovedEmail(
        product.seller.user.email,
        product.seller.businessName,
        updatedProduct
    );

    res.json({
        success: true,
        message: 'Product approved successfully',
        data: updatedProduct,
    });
});

// Remove product (soft delete)
const removeProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
    });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Soft delete product
    await prisma.product.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    // Delete images from Cloudinary
    const publicIds = product.images.map((img) => img.publicId);
    await deleteImages(publicIds);

    res.json({
        success: true,
        message: 'Product removed successfully',
    });
});

module.exports = {
    getPendingProducts,
    getAllProducts,
    approveProduct,
    removeProduct,
};
