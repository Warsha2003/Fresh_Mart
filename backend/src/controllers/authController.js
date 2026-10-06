/**
 * Authentication Controller
 * Handles user registration, login, role verification, and token generation.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function: Generate signed JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Friendly role labels for UI-facing messages
const ROLE_DISPLAY_NAMES = {
  customer: 'customer',
  owner: 'shop owner',
  delivery: 'delivery partner',
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Role defaults to 'customer' if omitted
    const assignedRole = role || 'customer';
    if (!['customer', 'owner', 'delivery'].includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Role must be customer, owner, or delivery.',
      });
    }

    // Check if user already exists (409 Conflict)
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // Create user (password is hashed by Mongoose pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '+94 77 123 4567',
      role: assignedRole,
    });

    const token = generateToken(user._id);

    // Return token and user data without exposing password
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || assignedRole,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user by lowercase email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Existing users in DB without a role field are treated as 'customer'
    const userRole = user.role || 'customer';

    // Verify role if a specific role was sent by the client
    if (role && role !== userRole) {
      const displayRole = ROLE_DISPLAY_NAMES[userRole] || userRole;
      return res.status(403).json({
        success: false,
        message: `This account is registered as a ${displayRole}. Please use the correct login.`,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role || 'customer',
      stats: req.user.stats,
    },
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
