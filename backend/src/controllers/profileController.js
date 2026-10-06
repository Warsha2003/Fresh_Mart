/**
 * Profile Controller
 * Manages user profile retrieval, profile updates, password changes,
 * and saved delivery addresses CRUD.
 */
const User = require('../models/User');
const Address = require('../models/Address');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile, stats, and addresses
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user,
        addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile info (name, phone)
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/profile/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    user.password = newPassword; // Will be hashed via pre-save hook
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user saved addresses
// @route   GET /api/profile/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new saved address
// @route   POST /api/profile/addresses
// @access  Private
const createAddress = async (req, res, next) => {
  try {
    const { label, addressLine, city, postalCode, isDefault } = req.body;

    if (!addressLine || !city) {
      return res.status(400).json({
        success: false,
        message: 'Street address line and city are required.',
      });
    }

    // If marked as default, unset other default addresses for this user
    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      label: label || 'Home',
      addressLine,
      city,
      postalCode: postalCode || '00300',
      isDefault: Boolean(isDefault),
    });

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved address
// @route   DELETE /api/profile/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  deleteAddress,
};
