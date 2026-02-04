const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const asyncHandler = require('./asyncHandler');

/**
 * Protect routes: verify JWT and attach user to req.
 * Students (USER) with valid JWT still cannot access /pending — that is enforced by authorize().
 */
exports.protect = asyncHandler(async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 401;
      return next(err);
    }
    req.user = user;
    next();
  } catch (err) {
    const e = new Error('Not authorized to access this route');
    e.statusCode = 401;
    return next(e);
  }
});

/**
 * RBAC: Restrict access to specific roles.
 * Usage: authorize('SUPER_ADMIN', 'SUPPORT') — only these roles can access.
 * Must be used after protect() so req.user is set.
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error('Not authorized');
      err.statusCode = 401;
      return next(err);
    }
    if (!roles.includes(req.user.role)) {
      const err = new Error(`Role ${req.user.role} is not authorized`);
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
};
