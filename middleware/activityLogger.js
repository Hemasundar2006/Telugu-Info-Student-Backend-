const Activity = require('../models/ActivityModel');

/**
 * Middleware to log user activities automatically.
 * Usage: app.use(activityLogger('ACTION_NAME', 'RESOURCE_TYPE'))
 * Or call logActivity(req, action, resourceType, resourceId, description, metadata) in controllers.
 */
const logActivity = async (req, action, resourceType, resourceId = null, description = '', metadata = {}) => {
  if (!req.user) return; // Skip if not authenticated

  try {
    await Activity.create({
      userId: req.user._id,
      userRole: req.user.role,
      userName: req.user.name,
      action,
      resourceType,
      resourceId,
      description,
      metadata,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || '',
    });
  } catch (error) {
    // Don't break the request if logging fails
    console.error('Activity logging error:', error.message);
  }
};

/**
 * Factory function to create activity logger middleware for specific actions
 */
const activityLogger = (action, resourceType) => {
  return async (req, res, next) => {
    // Log after response is sent (non-blocking)
    const originalSend = res.json;
    res.json = function (data) {
      if (data.success && req.user) {
        const resourceId = req.params.id || data.data?._id || data.data?.id || null;
        logActivity(req, action, resourceType, resourceId, '', {}).catch(() => {});
      }
      return originalSend.call(this, data);
    };
    next();
  };
};

module.exports = { logActivity, activityLogger };
