/**
 * Authentication Middleware
 * Protects private routes by verifying JWT tokens sent in the Authorization header.
 * Expected format: "Authorization: Bearer <token>"
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header string "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature with JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach authenticated user to request object (excluding password)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Error] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Invalid or expired token.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No Bearer token provided in header.',
    });
  }
};

module.exports = { protect };
