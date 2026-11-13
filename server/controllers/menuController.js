const Food = require('../models/Food');

// GET /api/menu?search=&category=&available=
exports.getMenu = async (req, res, next) => {
  try {
    const { search, category, available } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === 'true';
    if (search) filter.$text = { $search: search };

    const items = await Food.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/:id
exports.getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    res.json(food);
  } catch (err) {
    next(err);
  }
};

// POST /api/menu (admin only)
exports.createFood = async (req, res, next) => {
  try {
    const food = await Food.create(req.body);
    req.io.emit('menu:updated', { action: 'created', food });
    res.status(201).json(food);
  } catch (err) {
    next(err);
  }
};

// PUT /api/menu/:id (admin only)
exports.updateFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    req.io.emit('menu:updated', { action: 'updated', food });
    res.json(food);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/menu/:id (admin only)
exports.deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    req.io.emit('menu:updated', { action: 'deleted', foodId: req.params.id });
    res.json({ message: 'Food item deleted' });
  } catch (err) {
    next(err);
  }
};
