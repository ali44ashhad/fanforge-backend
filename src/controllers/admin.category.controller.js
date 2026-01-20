const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');

// Create category
const createCategory = catchAsync(async (req, res) => {
    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
        where: { name },
    });

    if (existingCategory) {
        throw new AppError('Category with this name already exists', 400);
    }

    const category = await prisma.category.create({
        data: {
            name,
            description,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
    });
});

// Update category
const updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // If name is being updated, check for duplicates
    if (name && name !== category.name) {
        const existingCategory = await prisma.category.findUnique({
            where: { name },
        });

        if (existingCategory) {
            throw new AppError('Category with this name already exists', 400);
        }
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
        throw new AppError('No fields to update', 400);
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: updateData,
    });

    res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory,
    });
});

// Get all categories (admin view with all products count)
const getAllCategoriesAdmin = catchAsync(async (req, res) => {
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: {
                    products: true, // All products, not just approved
                },
            },
        },
    });

    res.json({
        success: true,
        data: categories,
    });
});

module.exports = {
    createCategory,
    updateCategory,
    getAllCategoriesAdmin,
};
