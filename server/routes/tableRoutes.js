const express = require('express');
const router = express.Router();
const {
  getTables, createTable, getAvailability, reserveTable, cancelReservation, getMyReservations,
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getTables);
router.post('/', protect, authorize('admin'), createTable);
router.get('/availability', getAvailability);
router.post('/reserve', protect, reserveTable);
router.get('/reserve/my', protect, getMyReservations);
router.patch('/reserve/:id/cancel', protect, cancelReservation);

module.exports = router;
