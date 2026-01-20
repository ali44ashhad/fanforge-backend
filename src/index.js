const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'FanForge API is running' });
});

const userRoutes = require('./routes/user.routes');
const sellerRoutes = require('./routes/seller.routes');
const adminSellerRoutes = require('./routes/admin.seller.routes');
const categoryRoutes = require('./routes/category.routes');
const adminCategoryRoutes = require('./routes/admin.category.routes');
const productRoutes = require('./routes/product.routes');
// const adminRoutes = require('./routes/admin.routes');
const adminProductRoutes = require('./routes/admin.product.routes');
const adminUserRoutes = require('./routes/admin.user.routes');
const adminAnalyticsRoutes = require('./routes/admin.analytics.routes');
const orderRoutes = require('./routes/order.routes');


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin/sellers', adminSellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/orders', orderRoutes);


// Error handler (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
