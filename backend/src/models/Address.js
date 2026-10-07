/**
 * Address Model
 * Stores user delivery and billing addresses.
 */
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      default: 'Home',
      trim: true,
    },
    addressLine: {
      type: String,
      required: [true, 'Please provide the street address line'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide the city'],
      trim: true,
    },
    postalCode: {
      type: String,
      default: '00300',
      trim: true,
    },
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Address', addressSchema);
