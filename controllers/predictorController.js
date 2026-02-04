const College = require('../models/CollegeModel');
const asyncHandler = require('../middleware/asyncHandler');
const { logActivity } = require('../middleware/activityLogger');

/**
 * POST /api/predict
 * Body: rank (number), category (OC|BC|SC|ST), state (AP|TS), optional: district
 * Returns colleges where cutoff for that category >= rank (student can get seat).
 * Uses indexes on state and cutoffRanks.* for scalability.
 */
exports.predictColleges = asyncHandler(async (req, res, next) => {
  const { rank, category, state, district } = req.body;

  const categoryKey = `cutoffRanks.${category}`;
  const filter = {
    state,
    [categoryKey]: { $gte: rank },
  };
  if (district) filter.district = district;

  const colleges = await College.find(filter)
    .select('name district cutoffRanks reviews')
    .sort({ [categoryKey]: 1 })
    .limit(100)
    .lean();

  // Log college prediction activity
  await logActivity(req, 'COLLEGE_PREDICT', 'PREDICTOR', null, `${req.user.name} predicted colleges`, { rank, category, state, district, resultCount: colleges.length });

  res.json({ success: true, count: colleges.length, data: colleges });
});
