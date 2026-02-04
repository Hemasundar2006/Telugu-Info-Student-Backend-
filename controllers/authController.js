const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const asyncHandler = require('../middleware/asyncHandler');
const { logActivity } = require('../middleware/activityLogger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/**
 * POST /api/auth/register
 * Body: name, phone, state, role (optional, default USER), email, password (optional)
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, phone, state, role, email, password } = req.body;
  const userData = {
    name,
    phone,
    state: state || 'AP',
    role: role || 'USER',
  };
  if (email) userData.email = email;
  if (password) userData.password = password;
  const user = await User.create(userData);
  const token = signToken(user._id);
  
  // Log registration activity
  req.user = { _id: user._id, role: user.role, name: user.name };
  await logActivity(req, 'REGISTER', 'AUTH', user._id, `User registered: ${user.name} (${user.role})`, { email: user.email, phone: user.phone });
  
  res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, state: user.state, tier: user.tier } });
});

/**
 * POST /api/auth/login
 * Body: email + password OR phone (for backward compatibility)
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, phone } = req.body;
  let user;
  
  if (email && password) {
    // Email/password login
    user = await User.findOne({ email }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }
  } else if (phone) {
    // Phone login (backward compatibility)
    user = await User.findOne({ phone });
    if (!user) {
      const err = new Error('Invalid phone number');
      err.statusCode = 401;
      return next(err);
    }
  } else {
    const err = new Error('Provide email+password or phone');
    err.statusCode = 400;
    return next(err);
  }
  
  const token = signToken(user._id);
  
  // Log login activity
  req.user = { _id: user._id, role: user.role, name: user.name };
  await logActivity(req, 'LOGIN', 'AUTH', user._id, `User logged in: ${user.name} (${user.role})`, { email: user.email, phone: user.phone, loginMethod: email ? 'email' : 'phone' });
  
  res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, state: user.state, tier: user.tier } });
});
