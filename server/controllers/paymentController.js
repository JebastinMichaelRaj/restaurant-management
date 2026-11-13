const Order = require('../models/Order');

// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent for the given order.
// Requires STRIPE_SECRET_KEY to be set in .env
exports.createPaymentIntent = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe is not configured on this server' });
    }
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.grandTotal * 100), // amount in smallest currency unit
      currency: 'inr',
      metadata: { orderId: order._id.toString() },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
};
