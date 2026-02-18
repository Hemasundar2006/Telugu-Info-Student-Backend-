const mongoose = require('mongoose');
const Follow = require('../models/FollowModel');
const User = require('../models/UserModel');
const Post = require('../models/PostModel');
const asyncHandler = require('../middleware/asyncHandler');
const { logActivity } = require('../middleware/activityLogger');

const parsePageLimit = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit };
};

/**
 * POST /api/follows/:targetUserId
 * Toggle follow/unfollow another user (USER or COMPANY).
 * Access: any authenticated user.
 */
exports.toggleFollow = asyncHandler(async (req, res, next) => {
  const { targetUserId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    const err = new Error('Invalid targetUserId');
    err.statusCode = 400;
    return next(err);
  }

  if (String(req.user._id) === String(targetUserId)) {
    const err = new Error('You cannot follow yourself');
    err.statusCode = 400;
    return next(err);
  }

  const target = await User.findById(targetUserId).select('name email role profileImage');
  if (!target) {
    const err = new Error('Target user not found');
    err.statusCode = 404;
    return next(err);
  }

  const existing = await Follow.findOne({
    follower: req.user._id,
    following: targetUserId,
  });

  let followingNow;
  if (existing) {
    await Follow.deleteOne({ _id: existing._id });
    followingNow = false;
  } else {
    await Follow.create({
      follower: req.user._id,
      following: targetUserId,
    });
    followingNow = true;
  }

  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: targetUserId }),
    Follow.countDocuments({ follower: req.user._id }),
  ]);

  await logActivity(
    req,
    followingNow ? 'FOLLOW' : 'UNFOLLOW',
    'USER',
    target._id,
    followingNow ? 'User followed another user' : 'User unfollowed another user',
    { targetRole: target.role }
  );

  res.json({
    success: true,
    following: followingNow,
    target: {
      id: target._id,
      name: target.name,
      role: target.role,
      profileImage: target.profileImage,
    },
    followersCount,
    myFollowingCount: followingCount,
  });
});

/**
 * GET /api/follows/:userId/followers
 * List followers for a user (USER or COMPANY).
 * Access: any authenticated user.
 */
exports.getFollowers = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid userId');
    err.statusCode = 400;
    return next(err);
  }

  const { page, limit } = parsePageLimit(req.query || {});
  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'name email role profileImage'),
  ]);

  res.json({
    success: true,
    page,
    pages: Math.ceil(total / limit) || 1,
    count: rows.length,
    total,
    data: rows.map((r) => ({
      id: r._id,
      follower: r.follower,
      createdAt: r.createdAt,
    })),
  });
});

/**
 * GET /api/follows/:userId/following
 * List who a user is following.
 * Access: any authenticated user.
 */
exports.getFollowing = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid userId');
    err.statusCode = 400;
    return next(err);
  }

  const { page, limit } = parsePageLimit(req.query || {});
  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    Follow.countDocuments({ follower: userId }),
    Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('following', 'name email role profileImage'),
  ]);

  res.json({
    success: true,
    page,
    pages: Math.ceil(total / limit) || 1,
    count: rows.length,
    total,
    data: rows.map((r) => ({
      id: r._id,
      following: r.following,
      createdAt: r.createdAt,
    })),
  });
});

/**
 * GET /api/users/:userId/stats
 * Public counts: followers, following, posts.
 * Access: public (no auth needed).
 */
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid userId');
    err.statusCode = 400;
    return next(err);
  }

  const user = await User.findById(userId).select('name role profileImage');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    return next(err);
  }

  const [followersCount, followingCount, postsCount] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
    Post.countDocuments({ author: userId }),
  ]);

  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage,
      followersCount,
      followingCount,
      postsCount,
    },
  });
});

