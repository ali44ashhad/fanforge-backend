const transporter = require('../config/email');
const {
    orderPlacedTemplate,
    orderAcceptedTemplate,
    orderStatusUpdateTemplate,
    orderCancelledTemplate,
    newOrderTemplate,
    productApprovedTemplate,
    sellerApprovedTemplate,
    accountRestoredTemplate,
} = require('../templates/email');

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'FanForge <noreply@fanforge.com>',
            to,
            subject,
            html,
        });
        console.log(`✅ Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error('Email sending error:', error);
        // Don't throw error, just log it
    }
};

// Order placed - to buyer
const sendOrderPlacedEmail = async (buyerEmail, buyerName, order) => {
    const subject = 'Order Placed Successfully - FanForge';
    const html = orderPlacedTemplate(buyerName, order);
    await sendEmail(buyerEmail, subject, html);
};

// New order - to seller
const sendNewOrderEmail = async (sellerEmail, sellerName, order) => {
    const subject = 'New Order Received - FanForge';
    console.log("[DEBUG]NEW ORDER ", order);

    const html = newOrderTemplate(sellerName, order);
    await sendEmail(sellerEmail, subject, html);
};

// Order accepted - to buyer
const sendOrderAcceptedEmail = async (buyerEmail, buyerName, order) => {
    const subject = 'Order Accepted - FanForge';
    const html = orderAcceptedTemplate(buyerName, order);
    await sendEmail(buyerEmail, subject, html);
};

// Order status update - to buyer
const sendOrderStatusUpdateEmail = async (buyerEmail, buyerName, order, status) => {
    const subject = `Order ${status} - FanForge`;
    const html = orderStatusUpdateTemplate(buyerName, order, status);
    await sendEmail(buyerEmail, subject, html);
};

// Order cancelled - to buyer
const sendOrderCancelledEmail = async (buyerEmail, buyerName, order) => {
    const subject = 'Order Cancelled - FanForge';
    const html = orderCancelledTemplate(buyerName, order);
    await sendEmail(buyerEmail, subject, html);
};

// Product approved - to seller
const sendProductApprovedEmail = async (sellerEmail, sellerName, product) => {
    const subject = 'Product Approved - FanForge';
    const html = productApprovedTemplate(sellerName, product);
    await sendEmail(sellerEmail, subject, html);
};

// Seller approved - to seller
const sendSellerApprovedEmail = async (sellerEmail, sellerName, sellerType) => {
    const subject = 'Seller Account Approved - FanForge';
    const html = sellerApprovedTemplate(sellerName, sellerType);
    await sendEmail(sellerEmail, subject, html);
};

// Account restored - to user
const sendAccountRestoredEmail = async (userEmail, userName) => {
    const subject = 'Account Restored - FanForge';
    const html = accountRestoredTemplate(userName);
    await sendEmail(userEmail, subject, html);
};

module.exports = {
    sendOrderPlacedEmail,
    sendNewOrderEmail,
    sendOrderAcceptedEmail,
    sendOrderStatusUpdateEmail,
    sendOrderCancelledEmail,
    sendProductApprovedEmail,
    sendSellerApprovedEmail,
    sendAccountRestoredEmail,
};
