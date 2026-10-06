/**
 * Order Model
 * Stores grocery orders, assigned fulfillment slot, delivery address, and status lifecycle.
 */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'unit',
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true, // e.g. "#FM-98432"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      default: null,
    },
    fulfillmentType: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'pickup',
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 2000,
    },
    deliveryFee: {
      type: Number,
      default: 50,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 2050,
    },
    status: {
      type: String,
      enum: ['draft', 'placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'draft',
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      default: null,
    },
    storeAddress: {
      type: String,
      default: '203 Galle Road, Colombo 03',
    },
    estimatedTime: {
      type: String,
      default: '12:15 PM',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
