/**
 * Owner Seeding Script
 * Seeds sample shop owner account, sample customer, orders in multiple lifecycle states,
 * and calibrated product stock levels for viva demo.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Slot = require('../models/Slot');
const OrderPrep = require('../models/OrderPrep');

const seedOwner = async () => {
  try {
    console.log('[Owner Seeder] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Ensure Owner User exists
    let owner = await User.findOne({ email: 'owner@freshmart.lk' });
    if (!owner) {
      owner = await User.create({
        name: 'Ramani Perera',
        email: 'owner@freshmart.lk',
        password: 'owner123',
        phone: '+94 77 123 4567',
        role: 'owner',
        stats: {
          ordersCount: 38,
          savedItems: 14,
          totalSpent: 68200,
        },
      });
      console.log('[Owner Seeder] Created sample owner account: owner@freshmart.lk / owner123');
    } else {
      owner.role = 'owner';
      owner.name = 'Ramani Perera';
      await owner.save();
      console.log('[Owner Seeder] Verified existing owner account.');
    }

    // 2. Ensure Customer User exists
    let customer = await User.findOne({ email: 'kamal.perera@gmail.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Kamal Perera',
        email: 'kamal.perera@gmail.com',
        password: 'password123',
        phone: '+94 77 987 6543',
        role: 'customer',
      });
    }

    let customer2 = await User.findOne({ email: 'john.doe@gmail.com' });
    if (!customer2) {
      customer2 = await User.create({
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        password: 'password123',
        phone: '+94 71 555 4321',
        role: 'customer',
      });
    }

    let customer3 = await User.findOne({ email: 'sarah.miller@gmail.com' });
    if (!customer3) {
      customer3 = await User.create({
        name: 'Sarah Miller',
        email: 'sarah.miller@gmail.com',
        password: 'password123',
        phone: '+94 76 111 2233',
        role: 'customer',
      });
    }

    // 3. Ensure Delivery Slot
    let sampleSlot = await Slot.findOne({ type: 'delivery' });
    if (!sampleSlot) {
      sampleSlot = await Slot.create({
        type: 'delivery',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        displayLabel: '09:00 AM - 10:00 AM',
        maxCapacity: 10,
        bookedCount: 2,
        isFull: false,
      });
    }

    // 4. Update / Calibrate Products stock to match Screenshot 18_inventory-stock 1
    const stockUpdates = [
      { name: 'Coconut Oil 1L', stock: 3, lowStockThreshold: 5, unitPrice: 1200, imageKey: 'coconut-oil' },
      { name: 'Basmati Rice 5kg', stock: 42, lowStockThreshold: 5, unitPrice: 800, imageKey: 'rice' },
      { name: 'Eggs (12)', stock: 0, lowStockThreshold: 5, unitPrice: 480, imageKey: 'eggs' },
      { name: 'Tomato 1kg', stock: 64, lowStockThreshold: 5, unitPrice: 500, imageKey: 'tomato' },
      { name: 'Red Onion 1kg', stock: 4, lowStockThreshold: 5, unitPrice: 380, imageKey: 'red-onion' },
      { name: 'Carrot 500g', stock: 12, lowStockThreshold: 5, unitPrice: 260, imageKey: 'carrot' },
    ];

    for (const update of stockUpdates) {
      await Product.findOneAndUpdate(
        { name: update.name },
        {
          $set: {
            stock: update.stock,
            lowStockThreshold: update.lowStockThreshold,
            unitPrice: update.unitPrice,
            imageKey: update.imageKey,
            isActive: true,
          },
        },
        { upsert: false }
      );
    }
    console.log('[Owner Seeder] Calibrated product stock counts.');

    // 5. Seed Demo Orders matching screenshots
    // Clear previously seeded demo orders to prevent duplication
    await Order.deleteMany({
      orderNumber: { $in: ['#8402', '#8399', '#8390', '#8385'] },
    });

    // Order #8402 (Screenshots 16 & 17: Kamal Perera, 3 items, Rs. 1450, 09:00-10:00 AM)
    const order8402 = await Order.create({
      orderNumber: '#8402',
      user: customer._id,
      slot: sampleSlot._id,
      fulfillmentType: 'delivery',
      items: [
        { name: 'Samahan Herbal Tea x 10', quantity: 1, price: 450, unit: 'Herbal tea • Qty 10' },
        { name: 'Munchee Cream Cracker 125g', quantity: 1, price: 200, unit: 'Biscuits • Qty 1' },
        { name: 'Keells Coconut Oil 1L', quantity: 1, price: 800, unit: 'Cooking oil • Qty 1' },
      ],
      subtotal: 1450,
      deliveryFee: 0,
      totalAmount: 1450,
      status: 'placed',
      storeAddress: '203 Galle Road, Colombo 03',
      estimatedTime: '09:41 AM',
    });

    // Order #8399 (Screenshot 16: John Doe, 1 item, Rs. 600, Pickup 03:00 - 04:00 PM)
    const order8399 = await Order.create({
      orderNumber: '#8399',
      user: customer2._id,
      slot: sampleSlot._id,
      fulfillmentType: 'pickup',
      items: [
        { name: 'Coconut Oil 1L', quantity: 1, price: 600, unit: '1L' },
      ],
      subtotal: 600,
      deliveryFee: 0,
      totalAmount: 600,
      status: 'placed',
      storeAddress: '203 Galle Road, Colombo 03',
      estimatedTime: '03:30 PM',
    });

    // Order #8390 (Screenshot 15: Sarah Miller, Basmati Rice, Eggs, Rs. 1,280, Delivered)
    const order8390 = await Order.create({
      orderNumber: '#8390',
      user: customer3._id,
      slot: sampleSlot._id,
      fulfillmentType: 'delivery',
      items: [
        { name: 'Basmati Rice 5kg', quantity: 1, price: 800, unit: '5kg' },
        { name: 'Eggs (12)', quantity: 1, price: 480, unit: '12-pack' },
      ],
      subtotal: 1280,
      deliveryFee: 0,
      totalAmount: 1280,
      status: 'delivered',
      storeAddress: '203 Galle Road, Colombo 03',
    });

    // Initialize OrderPrep for #8402
    await OrderPrep.deleteMany({ order: { $in: [order8402._id, order8399._id, order8390._id] } });
    await OrderPrep.create({
      order: order8402._id,
      isAccepted: false,
      isReady: false,
      packedItems: [],
      riderName: 'Nimal Silva',
      handoverTime: '09:41 AM',
    });

    console.log('[Owner Seeder] Seeded demo orders #8402, #8399, #8390.');
    console.log('[Owner Seeder] Seeding completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Owner Seeder Error]:', error);
    process.exit(1);
  }
};

seedOwner();
