/**
 * Slot Model
 * Stores available time slots for pickup and delivery fulfillment.
 */
const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: [true, 'Slot type is required (pickup or delivery)'],
    },
    // Storing date as 'YYYY-MM-DD' prevents timezone drift across servers & mobile devices
    date: {
      type: String,
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: true, // e.g. "09:00 AM"
    },
    endTime: {
      type: String,
      required: true, // e.g. "10:00 AM"
    },
    displayLabel: {
      type: String,
      required: true, // e.g. "09:00 AM - 10:00 AM"
    },
    maxCapacity: {
      type: Number,
      default: 5,
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
    isFull: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find slots by date and type
slotSchema.index({ date: 1, type: 1 });

module.exports = mongoose.model('Slot', slotSchema);
