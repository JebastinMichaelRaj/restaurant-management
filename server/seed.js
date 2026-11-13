// Optional: populate the database with demo data.
// Run with: node seed.js  (after setting MONGO_URI in .env)
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Food = require('./models/Food');
const Table = require('./models/Table');
const Inventory = require('./models/Inventory');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management');
  console.log('Connected. Seeding...');

  await Promise.all([
    User.deleteMany({}),
    Food.deleteMany({}),
    Table.deleteMany({}),
    Inventory.deleteMany({}),
  ]);

  const password = await bcrypt.hash('password123', 10);
  await User.create([
    { name: 'Restaurant Admin', email: 'admin@restaurant.com', password, role: 'admin' },
    { name: 'Chef Ramesh', email: 'chef@restaurant.com', password, role: 'chef' },
    { name: 'Waiter Suresh', email: 'waiter@restaurant.com', password, role: 'waiter' },
    { name: 'Demo Customer', email: 'customer@restaurant.com', password, role: 'customer' },
  ]);

  const paneer = await Inventory.create({ ingredientName: 'Paneer', stockLevel: 20, unit: 'kg', reorderThreshold: 3 });
  const rice = await Inventory.create({ ingredientName: 'Basmati Rice', stockLevel: 50, unit: 'kg', reorderThreshold: 5 });
  await Inventory.create({ ingredientName: 'Tomatoes', stockLevel: 15, unit: 'kg', reorderThreshold: 4 });

  await Food.create([
    {
      name: 'Shahi Paneer', category: 'Main Course', price: 299, available: true,
      description: 'Paneer cubes in a rich, creamy tomato-based gravy.',
      ingredients: [{ inventoryItem: paneer._id, quantityUsed: 0.2 }],
    },
    {
      name: 'Veg Biryani', category: 'Main Course', price: 249, available: true,
      description: 'Fragrant basmati rice cooked with mixed vegetables and spices.',
      ingredients: [{ inventoryItem: rice._id, quantityUsed: 0.3 }],
    },
    { name: 'Paneer Tikka', category: 'Starters', price: 199, available: true, description: 'Grilled marinated paneer skewers.' },
    { name: 'Masala Papad', category: 'Starters', price: 79, available: true, description: 'Crispy papad topped with onion-tomato masala.' },
    { name: 'Gulab Jamun', category: 'Desserts', price: 99, available: true, description: 'Soft milk dumplings soaked in sugar syrup.' },
    { name: 'Masala Chai', category: 'Beverages', price: 49, available: true, description: 'Spiced Indian tea.' },
  ]);

  await Table.create([
    { tableNumber: 1, capacity: 2 },
    { tableNumber: 2, capacity: 4 },
    { tableNumber: 3, capacity: 4 },
    { tableNumber: 4, capacity: 6 },
    { tableNumber: 5, capacity: 8 },
  ]);

  console.log('Seed complete. Demo accounts (password: password123):');
  console.log('  admin@restaurant.com / chef@restaurant.com / waiter@restaurant.com / customer@restaurant.com');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
