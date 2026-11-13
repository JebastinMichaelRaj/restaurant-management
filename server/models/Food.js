const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
    image: { type: String, default: '' },
    ingredients: [
      {
        inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
        quantityUsed: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

foodSchema.index({ name: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Food', foodSchema);
