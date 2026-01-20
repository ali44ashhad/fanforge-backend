const { z } = require('zod');

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name is required'),
    phoneNumber: z.string().min(10, 'Valid phone number is required'),
    address: z.string().min(5, 'Address is required'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
    fullName: z.string().min(2, 'Full name is required').optional(),
    phoneNumber: z.string().min(10, 'Valid phone number is required').optional(),
    address: z.string().min(5, 'Address is required').optional(),
});

const sellerApplicationSchema = z.object({
    businessName: z.string().min(2, 'Business name is required'),
    businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
    paymentMethods: z.array(z.string()).min(1, 'At least one payment method is required'),
    averageShippingCost: z.number().positive('Shipping cost must be positive'),
    estimatedDeliveryDays: z.number().int().positive('Delivery days must be a positive integer'),
    shippingRegions: z.string().min(5, 'Shipping regions are required'),
    socialLinks: z.string().optional(),
});

const updateSellerProfileSchema = z.object({
    businessName: z.string().min(2).optional(),
    businessDescription: z.string().min(10).optional(),
    paymentMethods: z.array(z.string()).min(1).optional(),
    averageShippingCost: z.number().positive().optional(),
    estimatedDeliveryDays: z.number().int().positive().optional(),
    shippingRegions: z.string().min(5).optional(),
    socialLinks: z.string().optional(),
});

const categorySchema = z.object({
    name: z.string().min(2, 'Category name is required'),
    description: z.string().optional(),
});

const createProductSchema = z.object({
    name: z.string().min(2, 'Product name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.coerce.number().positive('Price must be positive'),
    categoryId: z.string().uuid('Valid category ID is required'),
});

const updateProductSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.coerce.number().positive().optional(),
    categoryId: z.string().uuid().optional(),
});

const placeOrderSchema = z.object({
    productId: z.string().uuid('Valid product ID is required'),
    buyerAddress: z.string().min(5, 'Delivery address is required'),
    buyerPhone: z.string().min(10, 'Valid phone number is required'),
    buyerNotes: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
    status: z.enum(['ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED'], {
        errorMap: () => ({ message: 'Invalid order status' }),
    }),
});



const addAdminSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name is required'),
    phoneNumber: z.string().min(10, 'Valid phone number is required'),
    address: z.string().min(5, 'Address is required'),
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    sellerApplicationSchema,
    updateSellerProfileSchema,
    categorySchema,
    createProductSchema,
    updateProductSchema,
    placeOrderSchema,
    updateOrderStatusSchema,
    addAdminSchema,
};

