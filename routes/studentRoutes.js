const express = require('express');
const router = express.Router();
const { studentAuth } = require('../middleware/studentAuth');
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  getJobListings,
} = require('../controllers/studentNotificationController');

// All routes are protected with studentAuth middleware

// GET /api/student/notifications - Get all notifications
router.get('/notifications', studentAuth, getNotifications);

// PUT /api/student/notifications/:notificationId/read - Mark as read
router.put('/notifications/:notificationId/read', studentAuth, markAsRead);

// DELETE /api/student/notifications/:notificationId - Delete notification
router.delete('/notifications/:notificationId', studentAuth, deleteNotification);

// GET /api/student/job-listings - Get jobs matching student's qualification
router.get('/job-listings', studentAuth, getJobListings);

module.exports = router;
