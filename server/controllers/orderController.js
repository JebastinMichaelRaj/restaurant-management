const Order = require('../models/Order');
const Food = require('../models/Food');
const { deductStockForOrder } = require('./inventoryController');

const TAX_RATE = 0.05; // 5% GST (example)
const SERVICE_CHARGE_RATE = 0.1; // 10% service charge

function calculateBill(items, discountPercent = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const serviceCharge = +(subtotal * SERVICE_CHARGE_RATE).toFixed(2);
  const discount = +((subtotal * discountPercent) / 100).toFixed(2);
  const grandTotal = +(subtotal + tax + serviceCharge - discount).toFixed(2);
  return { subtotal, tax, serviceCharge, discount, grandTotal };
}

// POST /api/orders
exports.placeOrder = async (req, res, next) => {
  try {
    const { items, discountPercent } = req.body; // items: [{ foodId, quantity, customization }]
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const foodIds = items.map((i) => i.foodId);
    const foods = await Food.find({ _id: { $in: foodIds } });
    const foodMap = new Map(foods.map((f) => [f._id.toString(), f]));

    const orderItems = items.map((i) => {
      const food = foodMap.get(i.foodId);
      if (!food) throw Object.assign(new Error(`Food item ${i.foodId} not found`), { statusCode: 404 });
      if (!food.available) throw Object.assign(new Error(`${food.name} is currently unavailable`), { statusCode: 400 });
      return {
        food: food._id,
        name: food.name,
        price: food.price,
        quantity: i.quantity,
        customization: i.customization || '',
      };
    });

    const bill = calculateBill(orderItems, discountPercent || 0);

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      ...bill,
    });

    req.io.emit('order:new', { order }); // notify kitchen dashboard instantly
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders (kitchen/admin/waiter view)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).populate('customer', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status  (chef/admin/waiter) - Preparing / Ready / Served
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Automatically reduce inventory once an order is completed (served)
    if (status === 'served' && previousStatus !== 'served') {
      await deductStockForOrder(order, req.io);
    }

    req.io.emit('order:statusUpdated', { orderId: order._id, status: order.status });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/pay (mock payment confirmation endpoint,
// pairs with the Stripe/Razorpay client-side flow)
exports.markPaid = async (req, res, next) => {
  try {
    const { gateway, paymentRef } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = 'paid';
    order.paymentGateway = gateway || 'cash';
    order.paymentRef = paymentRef || '';
    await order.save();

    req.io.emit('order:paid', { orderId: order._id });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.calculateBill = calculateBill;
