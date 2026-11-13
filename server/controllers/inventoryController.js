const Inventory = require('../models/Inventory');

// GET /api/inventory (admin only)
exports.getInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find().sort({ ingredientName: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// POST /api/inventory (admin only)
exports.createItem = async (req, res, next) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// PUT /api/inventory/:id (admin only)
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    if (item.stockLevel <= item.reorderThreshold) {
      req.io.emit('inventory:low', {
        item: item.ingredientName,
        stockLevel: item.stockLevel,
        threshold: item.reorderThreshold,
      });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/inventory/:id (admin only)
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.json({ message: 'Inventory item deleted' });
  } catch (err) {
    next(err);
  }
};

// Internal helper (not a route): deduct stock for a food's ingredients
// and emit a low-stock alert if any item drops below its threshold.
exports.deductStockForOrder = async (order, io) => {
  const Food = require('../models/Food');

  for (const orderItem of order.items) {
    const food = await Food.findById(orderItem.food).populate('ingredients.inventoryItem');
    if (!food || !food.ingredients?.length) continue;

    for (const ing of food.ingredients) {
      if (!ing.inventoryItem) continue;
      const deduction = ing.quantityUsed * orderItem.quantity;

      const updated = await Inventory.findByIdAndUpdate(
        ing.inventoryItem._id,
        { $inc: { stockLevel: -deduction } },
        { new: true }
      );

      if (updated && updated.stockLevel <= updated.reorderThreshold) {
        io.emit('inventory:low', {
          item: updated.ingredientName,
          stockLevel: updated.stockLevel,
          threshold: updated.reorderThreshold,
        });
      }
    }
  }
};
