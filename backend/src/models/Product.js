/**
 * Product Model
 * Stores customer-facing grocery catalogue data and stock state.
 */
const mongoose = require('mongoose');
const { LOW_STOCK_THRESHOLD } = require('../config/customerConstants');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Grains', 'Oils', 'Dairy', 'Bundles'],
      required: [true, 'Product category is required.'],
      index: true,
    },
    packSize: {
      type: String,
      required: [true, 'Pack size is required.'],
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required.'],
      min: [0, 'Unit price cannot be negative.'],
    },
    imageKey: {
      type: String,
      required: [true, 'Image key is required.'],
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative.'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Low-stock threshold cannot be negative.'],
      default: LOW_STOCK_THRESHOLD,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    origin: {
      type: String,
      default: 'Local farms',
      trim: true,
    },
    deliveryEta: {
      type: String,
      default: 'Within 2 hrs',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('isOutOfStock').get(function () {
  return this.stock <= 0;
});

productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
