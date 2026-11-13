const Order = require('../models/Order');
const Food = require('../models/Food');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// GET /api/admin/dashboard - daily sales, popular dishes, summary stats
exports.getDashboard = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysOrders = await Order.find({ createdAt: { $gte: startOfDay }, paymentStatus: 'paid' });
    const dailySales = todaysOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const popularDishesAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalOrdered: { $sum: '$items.quantity' } } },
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 },
    ]);

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalMenuItems = await Food.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'preparing'] } });

    res.json({
      dailySales,
      ordersToday: todaysOrders.length,
      popularDishes: popularDishesAgg,
      totalCustomers,
      totalMenuItems,
      pendingOrders,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/staff - list staff accounts
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'chef', 'waiter'] } }).select('-password');
    res.json(staff);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/staff - create a staff account (admin/chef/waiter)
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!['admin', 'chef', 'waiter'].includes(role)) {
      return res.status(400).json({ message: 'role must be admin, chef, or waiter' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, phone });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/staff/:id - update role/active status
exports.updateStaff = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const update = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
