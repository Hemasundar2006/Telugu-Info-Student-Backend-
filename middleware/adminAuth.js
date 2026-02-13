const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const asyncHandler = require('./asyncHandler');

/**
 * Admin Authentication Middleware
 * Verifies JWT token and ensures user has ADMIN or SUPER_ADMIN role
 */
exports.adminAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const err = new Error('Not authorized to access this route');
    err.statusCode = 401;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 401;
      return next(err);
    }

    // Check if user is ADMIN or SUPER_ADMIN
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const err = new Error('Access denied. Admin privileges required');
      err.statusCode = 403;
      return next(err);
    }

    req.admin = user;
    next();
  } catch (err) {
    const e = new Error('Not authorized to access this route');
    e.statusCode = 401;
    return next(e);
  }
});
