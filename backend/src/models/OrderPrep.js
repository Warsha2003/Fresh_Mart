/**
 * OrderPrep Model
 * Tracks item packing progress and rider handover for shop owner order preparation.
 */
const mongoose = require('mongoose');

const orderPrepSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    packedItems: {
      type: [String],
      default: [],
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
    isReady: {
      type: Boolean,
      default: false,
    },
    isHandedOver: {
      type: Boolean,
      default: false,
    },
    riderName: {
      type: String,
      default: 'Nimal Silva',
    },
    handoverTime: {
      type: String,
      default: '09:41 AM',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OrderPrep', orderPrepSchema);
