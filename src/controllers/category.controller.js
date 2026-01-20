const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');

// Get all categories (public)
const getAllCategories = catchAsync(async (req, res) => {
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: {
                    products: {
                        where: {
                            isApproved: true,
                            isDeleted: false,
                        },
                    },
                },
            },
        },
    });

    res.json({
        success: true,
        data: categories,
    });
});

// Get single category (public)
const getCategoryById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    products: {
                        where: {
                            isApproved: true,
                            isDeleted: false,
                        },
                    },
                },
            },
        },
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    res.json({
        success: true,
        data: category,
    });
});

module.exports = {
    getAllCategories,
    getCategoryById,
};
