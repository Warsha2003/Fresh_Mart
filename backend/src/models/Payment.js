/**
 * Payment Model
 * Stores payment transaction receipts.
 * 
 * SECURITY COMPLIANCE NOTE:
 * Full credit/debit card numbers and CVV codes are NEVER stored in this database,
 * logged, or retained anywhere in the backend application.
 * Only the card brand (e.g., Visa, Mastercard) and the last 4 digits are recorded
 * for receipt rendering and user reference.
 * Real payment gateway transactions are simulated for this university assignment.
 */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: ['card', 'cash_on_pickup', 'cash_on_delivery'],
      required: [true, 'Payment method is required'],
    },
    // Safe card metadata (PCI-DSS compliant design)
    cardBrand: {
      type: String,
      default: null, // e.g. "Visa", "Mastercard"
    },
    last4: {
      type: String,
      default: null, // e.g. "4242"
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    status: {
      type: String,
      enum: ['successful', 'pending', 'failed'],
      default: 'successful',
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true, // e.g. "TXN-SIM-783921"
    },
    isSimulated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
