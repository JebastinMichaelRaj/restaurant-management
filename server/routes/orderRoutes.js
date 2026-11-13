const express = require('express');
const router = express.Router();
const {
  placeOrder, getMyOrders, getAllOrders, updateOrderStatus, markPaid,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, placeOrder);
router.get('/my', protect, getMyOrders);
router.get('/', protect, authorize('admin', 'chef', 'waiter'), getAllOrders);
router.patch('/:id/status', protect, authorize('admin', 'chef', 'waiter'), updateOrderStatus);
router.post('/:id/pay', protect, markPaid);

module.exports = router;
