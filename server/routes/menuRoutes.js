const express = require('express');
const router = express.Router();
const {
  getMenu, getFoodById, createFood, updateFood, deleteFood,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getMenu);
router.get('/:id', getFoodById);
router.post('/', protect, authorize('admin'), createFood);
router.put('/:id', protect, authorize('admin'), updateFood);
router.delete('/:id', protect, authorize('admin'), deleteFood);

module.exports = router;
