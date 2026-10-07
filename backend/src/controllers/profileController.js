/**
 * Profile Controller
 * Manages user profile retrieval, profile updates, password changes,
 * and saved delivery addresses CRUD.
 */
const User = require('../models/User');
const Address = require('../models/Address');
const Cart = require('../models/Cart');
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

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      user.name = name.trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ success: false, message: 'Phone number must be text.' });
      }
      user.phone = phone.trim();
    }

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
    const { label, addressLine, city, postalCode, isDefault, location } = req.body;

    if (
      typeof addressLine !== 'string' ||
      !addressLine.trim() ||
      typeof city !== 'string' ||
      !city.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Street address line and city are required.',
      });
    }
    if (location && (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude))) {
      return res.status(400).json({
        success: false,
        message: 'Location must include valid latitude and longitude coordinates.',
      });
    }

    // If marked as default, unset other default addresses for this user
    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      label: label || 'Home',
      addressLine: addressLine.trim(),
      city: city.trim(),
      postalCode: postalCode || '00300',
      ...(location ? { location } : {}),
      isDefault: Boolean(isDefault),
    });
    if (address.isDefault) {
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart && !cart.selectedAddress) {
        cart.selectedAddress = address._id;
        await cart.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a saved address
// @route   PUT /api/profile/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized.',
      });
    }

    const { label, addressLine, city, postalCode, isDefault, location } = req.body;
    if (addressLine !== undefined && (typeof addressLine !== 'string' || !addressLine.trim())) {
      return res.status(400).json({ success: false, message: 'Street address cannot be empty.' });
    }
    if (city !== undefined && (typeof city !== 'string' || !city.trim())) {
      return res.status(400).json({ success: false, message: 'City cannot be empty.' });
    }
    if (label !== undefined && typeof label !== 'string') {
      return res.status(400).json({ success: false, message: 'Address label must be text.' });
    }
    if (postalCode !== undefined && typeof postalCode !== 'string') {
      return res.status(400).json({ success: false, message: 'Postal code must be text.' });
    }
    if (location && (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude))) {
      return res.status(400).json({
        success: false,
        message: 'Location must include valid latitude and longitude coordinates.',
      });
    }

    if (label !== undefined) address.label = label.trim() || 'Home';
    if (addressLine !== undefined) address.addressLine = addressLine.trim();
    if (city !== undefined) address.city = city.trim();
    if (postalCode !== undefined) address.postalCode = postalCode.trim();
    if (location !== undefined) address.location = location;

    if (isDefault === true) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: address._id } },
        { isDefault: false }
      );
      address.isDefault = true;
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart && !cart.selectedAddress) {
        cart.selectedAddress = address._id;
        await cart.save();
      }
    } else if (isDefault === false) {
      address.isDefault = false;
    }

    await address.save();
    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
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

    if (address.isDefault) {
      const nextDefault = await Address.findOne({ user: req.user._id }).sort({ createdAt: 1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }
    const replacementAddress = await Address.findOne({ user: req.user._id, isDefault: true });
    await Cart.updateMany(
      { user: req.user._id, selectedAddress: address._id },
      { selectedAddress: replacementAddress?._id || null }
    );

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
  updateAddress,
  deleteAddress,
};
