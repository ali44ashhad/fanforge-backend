const USER_ROLES = {
    BUYER: 'BUYER',
    SELLER: 'SELLER',
    ADMIN: 'ADMIN'
};

const SELLER_TYPES = {
    OFFICIAL: 'OFFICIAL',
    FAN_MADE: 'FAN_MADE'
};

const ORDER_STATUS = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
};

const PAYMENT_METHODS = [
    'Cash on Delivery',
    'Bank Transfer',
    'UPI',
    'PayPal',
    'Venmo',
    'Stripe',
    'Other'
];

module.exports = {
    USER_ROLES,
    SELLER_TYPES,
    ORDER_STATUS,
    PAYMENT_METHODS
};
