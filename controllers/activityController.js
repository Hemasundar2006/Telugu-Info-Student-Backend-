const Activity = require('../models/ActivityModel');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/activities/dashboard
 * SUPER_ADMIN only. Returns all activities for dashboard (with filters).
 * Query params: role, action, resourceType, startDate, endDate, limit, page
 */
exports.getDashboardActivities = asyncHandler(async (req, res, next) => {
  const { role, action, resourceType, startDate, endDate, limit = 50, page = 1 } = req.query;
  
  const filter = {};
  if (role) filter.userRole = role;
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const activities = await Activity.find(filter)
    .populate('userId', 'name email phone role state')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Activity.countDocuments(filter);

  res.json({
    success: true,
    count: activities.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: activities,
  });
});

/**
 * GET /api/activities/stats
 * SUPER_ADMIN only. Returns activity statistics for dashboard.
 */
exports.getActivityStats = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const [
    totalActivities,
    byRole,
    byAction,
    byResourceType,
    recentActivities,
  ] = await Promise.all([
    Activity.countDocuments(dateFilter),
    Activity.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$userRole', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Activity.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Activity.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Activity.find(dateFilter)
      .populate('userId', 'name email phone role')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action resourceType userName userRole createdAt description')
      .lean(),
  ]);

  res.json({
    success: true,
    stats: {
      totalActivities,
      byRole,
      byAction,
      byResourceType,
      recentActivities,
    },
  });
});

/**
 * GET /api/activities/user/:userId
 * SUPER_ADMIN only. Returns all activities for a specific user.
 */
exports.getUserActivities = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { limit = 50, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const activities = await Activity.find({ userId })
    .populate('userId', 'name email phone role state')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Activity.countDocuments({ userId });

  res.json({
    success: true,
    count: activities.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: activities,
  });
});
