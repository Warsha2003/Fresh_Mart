/**
 * User Model
 * Stores user profile, credentials, and app stats for FreshMart.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    phone: {
      type: String,
      default: '+94 77 123 4567',
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'owner', 'delivery'],
      default: 'customer',
    },
    avatar: {
      type: String,
      default: '',
    },
    stats: {
      ordersCount: { type: Number, default: 0 },
      savedItems: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 }, // in LKR, e.g. 24000
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: Verify entered password against hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
