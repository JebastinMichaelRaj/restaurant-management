const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    ingredientName: { type: String, required: true, unique: true, trim: true },
    stockLevel: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'kg' },
    reorderThreshold: { type: Number, default: 5 },
    supplier: {
      name: { type: String, default: '' },
      contact: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
