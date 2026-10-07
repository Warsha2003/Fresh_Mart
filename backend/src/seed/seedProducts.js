/**
 * Product Seeding Script
 * Seeds the customer catalogue used by the FreshMart prototype screens.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: 'Basmati Rice 5kg',
    slug: 'basmati-rice-5kg',
    category: 'Grains',
    packSize: '5kg pack',
    unitPrice: 800,
    imageKey: 'rice',
    stock: 24,
    lowStockThreshold: 5,
    description: 'Long-grain basmati rice, locally sourced, 5kg pack.',
  },
  {
    name: 'Coconut Oil 1L',
    slug: 'coconut-oil-1l',
    category: 'Oils',
    packSize: '1L bottle',
    unitPrice: 1200,
    imageKey: 'coconut-oil',
    stock: 3,
    lowStockThreshold: 5,
    description: 'Cold-pressed coconut oil for everyday cooking.',
  },
  {
    name: 'Eggs (12)',
    slug: 'eggs-12',
    category: 'Dairy',
    packSize: 'Out of stock',
    unitPrice: 480,
    imageKey: 'eggs',
    stock: 0,
    lowStockThreshold: 5,
    description: 'Farm fresh eggs, dozen pack.',
  },
  {
    name: 'Tomato 1kg',
    slug: 'tomato-1kg',
    category: 'Vegetables',
    packSize: '1kg',
    unitPrice: 500,
    imageKey: 'tomato',
    stock: 18,
    lowStockThreshold: 5,
    description: 'Fresh red tomatoes selected from local farms.',
  },
  {
    name: 'Red Onion 1kg',
    slug: 'red-onion-1kg',
    category: 'Vegetables',
    packSize: '1kg',
    unitPrice: 380,
    imageKey: 'red-onion',
    stock: 4,
    lowStockThreshold: 5,
    description: 'Crisp red onions for curries, sambols, and salads.',
  },
  {
    name: 'Carrot 500g',
    slug: 'carrot-500g',
    category: 'Vegetables',
    packSize: '500g',
    unitPrice: 260,
    imageKey: 'carrot',
    stock: 12,
    lowStockThreshold: 5,
    description: 'Sweet crunchy carrots, washed and packed.',
  },
  {
    name: 'Vegetable Basket',
    slug: 'vegetable-basket',
    category: 'Bundles',
    packSize: 'Mixed pack',
    unitPrice: 950,
    imageKey: 'vegetable-basket',
    stock: 8,
    lowStockThreshold: 5,
    description: 'A same-day basket of seasonal vegetables.',
  },
  {
    name: 'Sunflower Oil 1L',
    slug: 'sunflower-oil-1l',
    category: 'Oils',
    packSize: '1L bottle',
    unitPrice: 990,
    imageKey: 'oils',
    stock: 10,
    lowStockThreshold: 5,
    description: 'Light sunflower oil for frying and cooking.',
  },
];

const seedProducts = async () => {
  try {
    console.log('[Product Seeder] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    await Product.deleteMany({});
    const created = await Product.insertMany(products);

    console.log(`[Product Seeder] Seeded ${created.length} products.`);
    console.log(`[Product Seeder] Low-stock products: ${created.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length}`);
    console.log(`[Product Seeder] Out-of-stock products: ${created.filter((p) => p.stock === 0).length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Product Seeder Error]:', error);
    process.exit(1);
  }
};

seedProducts();
