const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Student = require('../models/Student');
const asyncHandler = require('./asyncHandler');

/**
 * Student Authentication Middleware
 * Verifies JWT token and ensures user has USER role (student)
 * Also attaches student profile if exists
 */
exports.studentAuth = asyncHandler(async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.STUDENT_JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 401;
      return next(err);
    }

    // Check if user is a student (USER role)
    if (user.role !== 'USER') {
      const err = new Error('Access denied. Student privileges required');
      err.statusCode = 403;
      return next(err);
    }

    // Try to find student profile by email
    const student = await Student.findOne({ email: user.email });
    
    req.student = student || user; // Use student profile if exists, otherwise use user
    req.user = user; // Keep user reference for compatibility
    next();
  } catch (err) {
    const e = new Error('Not authorized to access this route');
    e.statusCode = 401;
    return next(e);
  }
});
