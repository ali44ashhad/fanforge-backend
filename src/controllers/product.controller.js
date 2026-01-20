const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');
const { uploadImage, deleteImages } = require('../services/cloudinary.service');

// Create product (seller only)
const createProduct = catchAsync(async (req, res) => {
    const { name, description, price, categoryId } = req.body;
    const files = req.files;

    // Validate files
    if (!files || files.length === 0) {
        throw new AppError('At least one product image is required', 400);
    }

    if (files.length > 5) {
        throw new AppError('Maximum 5 images allowed per product', 400);
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.userId },
    });

    if (!sellerProfile || !sellerProfile.isApproved) {
        throw new AppError('Seller account not approved', 403);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // Upload images to Cloudinary
    const uploadPromises = files.map((file) => uploadImage(file.buffer));
    const uploadedImages = await Promise.all(uploadPromises);

    // Create product with images in a transaction
    const product = await prisma.product.create({
        data: {
            name,
            description,
            price: parseFloat(price),
            categoryId,
            sellerId: sellerProfile.id,
            productType: sellerProfile.sellerType, // Inherit from seller
            isApproved: false, // Pending approval
            images: {
                create: uploadedImages.map((img, index) => ({
                    url: img.url,
                    publicId: img.publicId,
                    order: index,
                })),
            },
        },
        include: {
            images: true,
            category: true,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Product created successfully. Awaiting admin approval.',
        data: product,
    });
});

// Get all approved products (public)
const getAllProducts = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        categoryId,
        minPrice,
        maxPrice,
        productType,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
        isApproved: true,
        isDeleted: false,
    };

    // Search by product name or seller business name
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { seller: { businessName: { contains: search, mode: 'insensitive' } } },
        ];
    }

    // Filter by category
    if (categoryId) {
        where.categoryId = categoryId;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Filter by product type
    if (productType && ['OFFICIAL', 'FAN_MADE'].includes(productType)) {
        where.productType = productType;
    }

    // Get products and total count
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: {
                images: {
                    orderBy: { order: 'asc' },
                    take: 1, // Only first image for listing
                },
                category: {
                    select: { id: true, name: true },
                },
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
        prisma.product.count({ where }),
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

// Get single product
const getProductById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            images: {
                orderBy: { order: 'asc' },
            },
            category: true,
            seller: {
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
                },
            },
        },
    });

    if (!product || product.isDeleted) {
        throw new AppError('Product not found', 404);
    }

    // Only show approved products to non-sellers/non-admins
    if (!product.isApproved && req.user?.role !== 'ADMIN') {
        // Check if user is the seller
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user?.userId },
        });

        if (!sellerProfile || sellerProfile.id !== product.sellerId) {
            throw new AppError('Product not found', 404);
        }
    }

    res.json({
        success: true,
        data: product,
    });
});

// Get seller's own products
const getMyProducts = catchAsync(async (req, res) => {
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.userId },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    const products = await prisma.product.findMany({
        where: {
            sellerId: sellerProfile.id,
            isDeleted: false,
        },
        include: {
            images: {
                orderBy: { order: 'asc' },
                take: 1,
            },
            category: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({
        success: true,
        data: products,
    });
});

// Update product (requires re-approval)
const updateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, categoryId } = req.body;

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.userId },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    // Check if product exists and belongs to seller
    const product = await prisma.product.findUnique({
        where: { id },
    });

    if (!product || product.isDeleted) {
        throw new AppError('Product not found', 404);
    }

    if (product.sellerId !== sellerProfile.id) {
        throw new AppError('You can only update your own products', 403);
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (categoryId) {
        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        updateData.categoryId = categoryId;
    }

    if (Object.keys(updateData).length === 0) {
        throw new AppError('No fields to update', 400);
    }

    // Update product and set isApproved to false (requires re-approval)
    updateData.isApproved = false;

    const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
            images: true,
            category: true,
        },
    });

    res.json({
        success: true,
        message: 'Product updated successfully. Awaiting admin re-approval.',
        data: updatedProduct,
    });
});

// Delete product (soft delete)
const deleteProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.userId },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    // Check if product exists and belongs to seller
    const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
    });

    if (!product || product.isDeleted) {
        throw new AppError('Product not found', 404);
    }

    if (product.sellerId !== sellerProfile.id) {
        throw new AppError('You can only delete your own products', 403);
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
        message: 'Product deleted successfully',
    });
});

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    getMyProducts,
    updateProduct,
    deleteProduct,
};
