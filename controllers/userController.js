const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const User = require('../models/UserModel');

const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

/**
 * Flatten nested objects into MongoDB dot-notation paths so partial updates
 * don't erase sibling fields inside nested objects.
 *
 * Arrays are treated as atomic (replacement) values.
 */
const flattenForSet = (obj, prefix = '') => {
  const out = {};
  if (!isPlainObject(obj)) return out;

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      Object.assign(out, flattenForSet(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
};

const badRequest = (res, message, details) =>
  res.status(400).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });

/**
 * POST /api/user-profiles
 */
exports.createUserProfile = async (req, res) => {
  try {
    const body = req.body || {};

    const created = await UserProfile.create(body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    // Duplicate key (unique email) or validation errors should be 400
    if (err && (err.code === 11000 || err.name === 'ValidationError')) {
      return res.status(400).json({
        success: false,
        error: err.code === 11000 ? 'Email already exists' : err.message,
      });
    }
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/user-profiles/:id
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return badRequest(res, 'Invalid id');
    }

    const profile = await UserProfile.findById(id).lean();
    if (!profile) {
      return badRequest(res, 'User profile not found');
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/user-profiles
 * Optional query: ?email=...
 */
exports.getUserProfiles = async (req, res) => {
  try {
    const { email } = req.query || {};
    if (email) {
      const normalizedEmail = String(email).toLowerCase();

      let profile = await UserProfile.findOne({ email: normalizedEmail }).lean();

      // If profile not found, try to create it on the fly from UserModel
      if (!profile) {
        const user = await User.findOne({ email: normalizedEmail }).lean();
        if (!user) {
          return badRequest(res, 'User profile not found');
        }

        const createdProfile = await UserProfile.create({
          fullName: user.name || normalizedEmail,
          email: normalizedEmail,
          mobileNumber: user.phone,
          isMobileVerified: false,
        });

        profile = createdProfile.toObject();
      }

      return res.status(200).json({ success: true, data: profile });
    }

    const profiles = await UserProfile.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, count: profiles.length, data: profiles });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * PATCH /api/user-profiles/:id
 * Partial updates supported (including nested objects via dot-notation flattening).
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return badRequest(res, 'Invalid id');
    }

    const body = req.body || {};

    // Prevent accidental full replacement; $set only provided fields.
    const $set = flattenForSet(body);
    if (Object.keys($set).length === 0) {
      return badRequest(res, 'No valid fields provided to update');
    }

    const updated = await UserProfile.findByIdAndUpdate(
      id,
      { $set },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!updated) {
      return badRequest(res, 'User profile not found');
    }

    // When profile photo is updated via link, sync to User.profileImage so it shows on posts
    if ('profilePhoto' in $set && updated.email) {
      await User.findOneAndUpdate(
        { email: updated.email.toLowerCase() },
        { profileImage: updated.profilePhoto || null }
      );
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err && (err.code === 11000 || err.name === 'ValidationError')) {
      return res.status(400).json({
        success: false,
        error: err.code === 11000 ? 'Email already exists' : err.message,
      });
    }
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * DELETE /api/user-profiles/:id
 */
exports.deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return badRequest(res, 'Invalid id');
    }

    const deleted = await UserProfile.findByIdAndDelete(id);
    if (!deleted) {
      return badRequest(res, 'User profile not found');
    }

    return res.status(200).json({
      success: true,
      message: 'User profile deleted successfully',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


