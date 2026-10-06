/**
 * Slot Seeding Script
 * Generates pickup and delivery time slots for the next 7 consecutive days,
 * from 08:00 AM to 09:00 PM.
 * Approximately 40% of the slots are marked as full to accurately reflect the Figma design.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Slot = require('../models/Slot');

const timeIntervals = [
  { start: '08:00 AM', end: '09:00 AM' },
  { start: '09:00 AM', end: '10:00 AM' },
  { start: '10:00 AM', end: '11:00 AM' },
  { start: '11:00 AM', end: '12:00 PM' },
  { start: '12:00 PM', end: '01:00 PM' },
  { start: '01:00 PM', end: '02:00 PM' },
  { start: '02:00 PM', end: '03:00 PM' },
  { start: '03:00 PM', end: '04:00 PM' },
  { start: '04:00 PM', end: '05:00 PM' },
  { start: '05:00 PM', end: '06:00 PM' },
  { start: '06:00 PM', end: '07:00 PM' },
  { start: '07:00 PM', end: '08:00 PM' },
  { start: '08:00 PM', end: '09:00 PM' },
];

const seedSlots = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seeder] Connected successfully.');

    // Clear existing slots to avoid duplicates
    await Slot.deleteMany({});
    console.log('[Seeder] Cleared previous slots from database.');

    const slotsToInsert = [];
    const today = new Date();

    // Loop through 7 consecutive days starting from today
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);

      // Format date as 'YYYY-MM-DD'
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      for (const type of ['pickup', 'delivery']) {
        for (const interval of timeIntervals) {
          const maxCapacity = 5;
          // Approximately 40% probability of being full
          const isFull = Math.random() < 0.4;
          const bookedCount = isFull ? maxCapacity : Math.floor(Math.random() * (maxCapacity - 1));

          slotsToInsert.push({
            type,
            date: dateString,
            startTime: interval.start,
            endTime: interval.end,
            displayLabel: `${interval.start} - ${interval.end}`,
            maxCapacity,
            bookedCount,
            isFull,
          });
        }
      }
    }

    const createdSlots = await Slot.insertMany(slotsToInsert);
    console.log(`[Seeder] Successfully seeded ${createdSlots.length} time slots across 7 days!`);
    console.log(`[Seeder] Pickup slots: ${createdSlots.filter(s => s.type === 'pickup').length}`);
    console.log(`[Seeder] Delivery slots: ${createdSlots.filter(s => s.type === 'delivery').length}`);
    console.log(`[Seeder] Full slots: ${createdSlots.filter(s => s.isFull).length}`);

    await mongoose.connection.close();
    console.log('[Seeder] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedSlots();
