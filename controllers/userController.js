const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');

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

const validateStrictNumber = (res, fieldPath, value) => {
  if (value === undefined) return true;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    badRequest(res, `${fieldPath} must be a number`);
    return false;
  }
  return true;
};

const validateArrayOfStrings = (res, fieldPath, value) => {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.some((x) => typeof x !== 'string')) {
    badRequest(res, `${fieldPath} must be an array of strings`);
    return false;
  }
  return true;
};

/**
 * POST /api/user-profiles
 */
exports.createUserProfile = async (req, res) => {
  try {
    const body = req.body || {};

    // Strict typing checks (reject numeric strings)
    if (
      !validateStrictNumber(res, 'jobPreferences.minExpectedSalary', body?.jobPreferences?.minExpectedSalary) ||
      !validateStrictNumber(res, 'jobPreferences.maxExpectedSalary', body?.jobPreferences?.maxExpectedSalary) ||
      !validateStrictNumber(res, 'currentEducation.yearOfPassing', body?.currentEducation?.yearOfPassing)
    ) {
      return;
    }

    if (!validateArrayOfStrings(res, 'skills', body.skills)) return;
    if (!validateArrayOfStrings(res, 'hobbies', body.hobbies)) return;

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
      const profile = await UserProfile.findOne({ email: String(email).toLowerCase() }).lean();
      if (!profile) return badRequest(res, 'User profile not found');
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

    // Strict typing checks (reject numeric strings)
    if (
      !validateStrictNumber(res, 'jobPreferences.minExpectedSalary', body?.jobPreferences?.minExpectedSalary) ||
      !validateStrictNumber(res, 'jobPreferences.maxExpectedSalary', body?.jobPreferences?.maxExpectedSalary) ||
      !validateStrictNumber(res, 'currentEducation.yearOfPassing', body?.currentEducation?.yearOfPassing)
    ) {
      return;
    }

    if (!validateArrayOfStrings(res, 'skills', body.skills)) return;
    if (!validateArrayOfStrings(res, 'hobbies', body.hobbies)) return;

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


