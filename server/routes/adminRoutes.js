const express = require('express');
const router = express.Router();
const {
  getDashboard, getStaff, createStaff, updateStaff,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.patch('/staff/:id', updateStaff);

module.exports = router;
