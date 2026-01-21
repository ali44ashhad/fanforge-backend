const orderPlacedTemplate = (buyerName, order) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Placed Successfully!</h1>
    </div>
    <div class="content">
      <p>Hi ${buyerName},</p>
      <p>Your order has been placed successfully and is awaiting seller confirmation.</p>
      <h3>Order Details:</h3>
      <p><strong>Product:</strong> ${order.product.name}</p>
      <p><strong>Price:</strong> $${order.product.price}</p>
      <p><strong>Seller:</strong> ${order.seller.businessName}</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p>You will receive seller contact details once they accept your order.</p>
    </div>
    <div class="footer">
      <p>Thank you for using FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

const newOrderTemplate = (sellerName, order) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Order Received!</h1>
    </div>
    <div class="content">
      <p>Hi ${sellerName},</p>
      <p>You have received a new order!</p>
      <h3>Order Details:</h3>
      <p><strong>Product:</strong> ${order.product.name}</p>
      <p><strong>Buyer:</strong> ${order.buyer.fullName}</p>
      <p><strong>Buyer Phone:</strong> ${order.buyerPhone}</p>
      <p><strong>Delivery Address:</strong> ${order.buyerAddress}</p>
      ${order.buyerNotes ? `<p><strong>Notes:</strong> ${order.buyerNotes}</p>` : ''}
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p>Please log in to your seller dashboard to accept or manage this order.</p>
    </div>
    <div class="footer">
      <p>Thank you for selling on FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

const orderAcceptedTemplate = (buyerName, order) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Accepted!</h1>
    </div>
    <div class="content">
      <p>Hi ${buyerName},</p>
      <p>Great news! Your order has been accepted by the seller.</p>
      <h3>Seller Contact Details:</h3>
      <p><strong>Business:</strong> ${order.seller.businessName}</p>
      <p><strong>Email:</strong> ${order.seller.user.email}</p>
      <p><strong>Phone:</strong> ${order.seller.user.phoneNumber}</p>
      <p><strong>Payment Methods:</strong> ${order.seller.paymentMethods.join(', ')}</p>
      <p><strong>Estimated Delivery:</strong> ${order.seller.estimatedDeliveryDays} days</p>
      <p>Please contact the seller to arrange payment and confirm delivery details.</p>
    </div>
    <div class="footer">
      <p>Thank you for using FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

const orderStatusUpdateTemplate = (buyerName, order, status) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Status Updated</h1>
    </div>
    <div class="content">
      <p>Hi ${buyerName},</p>
      <p>Your order status has been updated to: <strong>${status}</strong></p>
      <h3>Order Details:</h3>
      <p><strong>Product:</strong> ${order.product.name}</p>
      <p><strong>Seller:</strong> ${order.seller.businessName}</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      ${status === 'SHIPPED' ? '<p>Your order is on its way! You should receive it soon.</p>' : ''}
      ${status === 'DELIVERED' ? '<p>Your order has been delivered. We hope you enjoy your purchase!</p>' : ''}
    </div>
    <div class="footer">
      <p>Thank you for using FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

const orderCancelledTemplate = (buyerName, order) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi ${buyerName},</p>
      <p>Your order has been cancelled.</p>
      <h3>Order Details:</h3>
      <p><strong>Product:</strong> ${order.product.name}</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p>If you have any questions, please contact support.</p>
    </div>
    <div class="footer">
      <p>Thank you for using FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

const productApprovedTemplate = (sellerName, product) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Product Approved!</h1>
    </div>
    <div class="content">
      <p>Hi ${sellerName},</p>
      <p>Congratulations! Your product has been approved and is now live on FanForge.</p>
      <h3>Product Details:</h3>
      <p><strong>Name:</strong> ${product.name}</p>
      <p><strong>Price:</strong> $${product.price}</p>
      <p><strong>Product ID:</strong> ${product.id}</p>
      <p>Your product is now visible to all buyers on the marketplace.</p>
    </div>
    <div class="footer">
      <p>Thank you for selling on FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

const sellerApprovedTemplate = (sellerName, sellerType) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Seller Account Approved!</h1>
    </div>
    <div class="content">
      <p>Hi ${sellerName},</p>
      <p>Congratulations! Your seller account has been approved.</p>
      <p><strong>Seller Type:</strong> ${sellerType === 'OFFICIAL' ? 'Official' : 'Fan-Made'}</p>
      <p>You can now start adding products to your shop and selling on FanForge!</p>
      <p>Log in to your seller dashboard to get started.</p>
    </div>
    <div class="footer">
      <p>Welcome to FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

const accountRestoredTemplate = (userName) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Account Restored</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Your account on FanForge has been restored.</p>
      <p>You can now log in and access your account as usual.</p>
      <p>If you have any questions or concerns, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>Welcome back to FanForge!</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  orderPlacedTemplate,
  newOrderTemplate,
  orderAcceptedTemplate,
  orderStatusUpdateTemplate,
  orderCancelledTemplate,
  productApprovedTemplate,
  sellerApprovedTemplate,
  accountRestoredTemplate,
};
