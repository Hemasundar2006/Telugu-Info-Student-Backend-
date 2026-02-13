const Notification = require('../models/Notification');
const JobPosting = require('../models/JobPosting');
const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/student/notifications
 * Get all notifications for the current student
 */
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { isRead, page = 1, limit = 10 } = req.query;

  // Get student ID from auth
  const studentId = req.student?._id || req.user?._id;

  if (!studentId) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    return next(err);
  }

  // Find student to get their ID
  let student;
  if (req.student && req.student._id) {
    student = req.student;
  } else {
    // If student profile doesn't exist, try to find by email
    student = await Student.findOne({ email: req.user.email });
    if (!student) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }
  }

  // Build filter
  const filter = { studentId: student._id };
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get notifications
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('jobId', 'jobId jobTitle organization jobCategory')
    .select('-__v');

  // Get total count and unread count
  const total = await Notification.countDocuments({ studentId: student._id });
  const unreadCount = await Notification.countDocuments({
    studentId: student._id,
    isRead: false,
  });

  res.json({
    success: true,
    notifications: notifications,
    total: total,
    unreadCount: unreadCount,
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

/**
 * PUT /api/student/notifications/:notificationId/read
 * Mark notification as read
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { notificationId } = req.params;

  // Get student ID
  let student;
  if (req.student && req.student._id) {
    student = req.student;
  } else {
    student = await Student.findOne({ email: req.user.email });
    if (!student) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }
  }

  // Find notification
  const notification = await Notification.findOne({
    notificationId: notificationId,
    studentId: student._id,
  });

  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    return next(err);
  }

  // Mark as read
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({
    success: true,
    notification: {
      notificationId: notification.notificationId,
      isRead: notification.isRead,
      readAt: notification.readAt,
    },
  });
});

/**
 * DELETE /api/student/notifications/:notificationId
 * Delete a notification
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const { notificationId } = req.params;

  // Get student ID
  let student;
  if (req.student && req.student._id) {
    student = req.student;
  } else {
    student = await Student.findOne({ email: req.user.email });
    if (!student) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }
  }

  // Find and delete notification
  const notification = await Notification.findOneAndDelete({
    notificationId: notificationId,
    studentId: student._id,
  });

  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    return next(err);
  }

  res.json({
    success: true,
    message: 'Notification deleted',
  });
});

/**
 * GET /api/student/job-listings
 * Get jobs matching student's qualification
 */
exports.getJobListings = asyncHandler(async (req, res, next) => {
  const { category, page = 1, limit = 10 } = req.query;

  // Get student profile
  let student;
  if (req.student && req.student._id) {
    student = req.student;
  } else {
    student = await Student.findOne({ email: req.user.email });
    if (!student) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }
  }

  // Build filter
  const filter = {
    targetQualifications: student.qualification,
    status: 'Active',
  };

  if (category) {
    filter.jobCategory = category;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get jobs
  const jobs = await JobPosting.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select('-__v -notificationTracking -postedBy');

  // Get total count
  const total = await JobPosting.countDocuments(filter);

  res.json({
    success: true,
    jobs: jobs,
    total: total,
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});
