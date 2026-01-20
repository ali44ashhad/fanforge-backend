const prisma = require('../config/database');
const { catchAsync } = require('../utils/helpers');

// Get basic analytics
const getAnalytics = catchAsync(async (req, res) => {
    const [
        totalUsers,
        totalBuyers,
        totalSellers,
        totalAdmins,
        totalProducts,
        approvedProducts,
        pendingProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalCategories,
    ] = await Promise.all([
        prisma.user.count({
            where: { isDeleted: false },
        }),
        prisma.user.count({
            where: { role: 'BUYER', isDeleted: false },
        }),
        prisma.user.count({
            where: { role: 'SELLER', isDeleted: false },
        }),
        prisma.user.count({
            where: { role: 'ADMIN', isDeleted: false },
        }),
        prisma.product.count({
            where: { isDeleted: false },
        }),
        prisma.product.count({
            where: { isApproved: true, isDeleted: false },
        }),
        prisma.product.count({
            where: { isApproved: false, isDeleted: false },
        }),
        prisma.order.count(),
        prisma.order.count({
            where: { status: 'PENDING' },
        }),
        prisma.order.count({
            where: { status: 'DELIVERED' },
        }),
        prisma.category.count(),
    ]);

    const analytics = {
        users: {
            total: totalUsers,
            buyers: totalBuyers,
            sellers: totalSellers,
            admins: totalAdmins,
        },
        products: {
            total: totalProducts,
            approved: approvedProducts,
            pending: pendingProducts,
        },
        orders: {
            total: totalOrders,
            pending: pendingOrders,
            completed: completedOrders,
        },
        categories: {
            total: totalCategories,
        },
    };

    res.json({
        success: true,
        data: analytics,
    });
});

module.exports = {
    getAnalytics,
};
