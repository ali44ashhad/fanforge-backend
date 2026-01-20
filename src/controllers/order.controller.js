const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');
const {
    sendOrderPlacedEmail,
    sendNewOrderEmail,
    sendOrderAcceptedEmail,
    sendOrderStatusUpdateEmail,
    sendOrderCancelledEmail,
} = require('../services/email.service');

// Place order (buyer only)
const placeOrder = catchAsync(async (req, res) => {
    const { productId, buyerAddress, buyerPhone, buyerNotes } = req.body;
    const buyerId = req.user.userId;

    // Check if product exists and is approved
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            seller: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!product || product.isDeleted || !product.isApproved) {
        throw new AppError('Product not available', 404);
    }

    // Prevent seller from buying their own product
    if (product.seller.userId === buyerId) {
        throw new AppError('You cannot order your own product', 400);
    }

    // Create order
    const order = await prisma.order.create({
        data: {
            buyerId,
            sellerId: product.sellerId,
            productId,
            buyerAddress,
            buyerPhone,
            buyerNotes,
            status: 'PENDING',
        },
        include: {
            product: {
                include: {
                    images: {
                        orderBy: { order: 'asc' },
                        take: 1,
                    },
                },
            },
            seller: {
                select: {
                    businessName: true,
                },
            },
            buyer: {
                select: {
                    fullName: true,
                },
            },
        },
    });

    // Send email to buyer (order placed confirmation)
    await sendOrderPlacedEmail(
        req.user.email,
        req.user.fullName,
        order
    );

    // Send email to seller (new order notification)
    await sendNewOrderEmail(
        product.seller.user.email,
        product.seller.businessName,
        order
    );

    res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: order,
    });
});

// Get buyer's orders
const getBuyerOrders = catchAsync(async (req, res) => {
    const buyerId = req.user.userId;
    const { status } = req.query;

    const where = {
        buyerId,
    };

    // Filter by status if provided
    if (status) {
        where.status = status;
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            product: {
                include: {
                    images: {
                        orderBy: { order: 'asc' },
                        take: 1,
                    },
                },
            },
            seller: {
                select: {
                    id: true,
                    businessName: true,
                    paymentMethods: true,
                    averageShippingCost: true,
                    estimatedDeliveryDays: true,
                    shippingRegions: true,
                    socialLinks: true,
                    user: {
                        select: {
                            email: true,
                            phoneNumber: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Only show seller contact details for accepted orders
    const ordersWithConditionalContact = orders.map((order) => {
        if (order.status === 'PENDING') {
            // Hide seller contact details for pending orders
            const { user, ...sellerWithoutContact } = order.seller;
            return {
                ...order,
                seller: sellerWithoutContact,
            };
        }
        return order;
    });

    res.json({
        success: true,
        data: ordersWithConditionalContact,
    });
});

// Get seller's orders
const getSellerOrders = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const { status } = req.query;

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    const where = {
        sellerId: sellerProfile.id,
    };

    // Filter by status if provided
    if (status) {
        where.status = status;
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            product: {
                include: {
                    images: {
                        orderBy: { order: 'asc' },
                        take: 1,
                    },
                },
            },
            buyer: {
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
        data: orders,
    });
});

// Cancel order (buyer only, before acceptance)
const cancelOrder = catchAsync(async (req, res) => {
    const { id } = req.params;
    const buyerId = req.user.userId;

    const order = await prisma.order.findUnique({
        where: { id },
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check if order belongs to buyer
    if (order.buyerId !== buyerId) {
        throw new AppError('You can only cancel your own orders', 403);
    }

    // Can only cancel pending orders
    if (order.status !== 'PENDING') {
        throw new AppError('Only pending orders can be cancelled', 400);
    }

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            isCancelled: true,
        },
        include: {
            product: true,
        },
    });

    // Send cancellation email to buyer
    await sendOrderCancelledEmail(
        req.user.email,
        req.user.fullName,
        updatedOrder
    );

    res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder,
    });
});

// Update order status (seller only)
const updateOrderStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
    });

    if (!sellerProfile) {
        throw new AppError('Seller profile not found', 404);
    }

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            buyer: {
                select: {
                    email: true,
                    fullName: true,
                },
            },
        },
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check if order belongs to seller
    if (order.sellerId !== sellerProfile.id) {
        throw new AppError('You can only update your own orders', 403);
    }

    // Cannot update cancelled orders
    if (order.isCancelled) {
        throw new AppError('Cannot update cancelled orders', 400);
    }

    // Validate status transition
    const validTransitions = {
        PENDING: ['ACCEPTED'],
        ACCEPTED: ['PROCESSING'],
        PROCESSING: ['SHIPPED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: [],
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
        throw new AppError(`Cannot change status from ${order.status} to ${status}`, 400);
    }

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
            product: true,
            seller: {
                include: {
                    user: true,
                },
            },
            buyer: {
                select: {
                    fullName: true,
                    email: true,
                },
            },
        },
    });

    // Send status update email to buyer
    if (status === 'ACCEPTED') {
        await sendOrderAcceptedEmail(
            order.buyer.email,
            order.buyer.fullName,
            updatedOrder
        );
    } else {
        await sendOrderStatusUpdateEmail(
            order.buyer.email,
            order.buyer.fullName,
            updatedOrder,
            status
        );
    }

    res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: updatedOrder,
    });
});

module.exports = {
    placeOrder,
    getBuyerOrders,
    getSellerOrders,
    cancelOrder,
    updateOrderStatus,
};
