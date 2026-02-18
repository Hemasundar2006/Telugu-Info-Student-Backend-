const User = require('../models/UserModel');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/search/people
 * Search users/companies by name or email for the global search bar.
 * Query:
 *   - q: search text (required, min 1–2 chars recommended)
 *   - role?: 'USER' | 'COMPANY' (optional filter)
 *   - page?: number (default 1)
 *   - limit?: number (default 10, max 50)
 * Access: any authenticated user.
 */
exports.searchPeople = asyncHandler(async (req, res, next) => {
  const { q, role, page = 1, limit = 10 } = req.query || {};

  const trimmed = (q || '').trim();
  if (!trimmed) {
    const err = new Error('Query parameter "q" is required');
    err.statusCode = 400;
    return next(err);
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const regex = new RegExp(trimmed, 'i');
  const filter = {
    $or: [{ name: regex }, { email: regex }],
  };

  if (role && ['USER', 'COMPANY'].includes(role)) {
    filter.role = role;
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum)
      .select('name email role profileImage plan hasPaidPlan isPaid state'),
  ]);

  res.json({
    success: true,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    count: users.length,
    total,
    data: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      state: u.state,
      profileImage: u.profileImage,
      plan: u.plan,
      hasPaidPlan: u.hasPaidPlan,
      isPaid: u.isPaid,
    })),
  });
});

