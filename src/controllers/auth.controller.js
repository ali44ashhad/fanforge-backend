const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { AppError, catchAsync } = require('../utils/helpers');

// Register
const register = catchAsync(async (req, res) => {
    const { email, password, fullName, phoneNumber, address } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName,
            phoneNumber,
            address,
            role: 'BUYER', // Default role
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            address: true,
            role: true,
            createdAt: true,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: user,
    });
});

// Login
const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            sellerProfile: {
                select: {
                    id: true,
                    isApproved: true,
                    sellerType: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check if user is deleted
    if (user.isDeleted) {
        throw new AppError('Account has been deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: userWithoutPassword,
            token,
        },
    });
});

// Get current user
const getMe = catchAsync(async (req, res) => {
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
            sellerProfile: {
                select: {
                    id: true,
                    businessName: true,
                    isApproved: true,
                    sellerType: true,
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

module.exports = {
    register,
    login,
    getMe,
};
