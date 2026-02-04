const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardActivities,
  getActivityStats,
  getUserActivities,
} = require('../controllers/activityController');
const validate = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

// All routes are SUPER_ADMIN only
const idParamSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});

// GET /api/activities/dashboard - All activities with filters
router.get(
  '/dashboard',
  protect,
  authorize('SUPER_ADMIN'),
  getDashboardActivities
);

// GET /api/activities/stats - Activity statistics
router.get(
  '/stats',
  protect,
  authorize('SUPER_ADMIN'),
  getActivityStats
);

// GET /api/activities/user/:userId - Activities for specific user
router.get(
  '/user/:userId',
  protect,
  authorize('SUPER_ADMIN'),
  validate(idParamSchema, 'params'),
  getUserActivities
);

module.exports = router;
