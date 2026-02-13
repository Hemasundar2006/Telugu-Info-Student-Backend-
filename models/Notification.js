const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
      required: true,
      default: () => `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: [true, 'Job ID is required'],
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    jobCategory: {
      type: String,
      enum: ['Government', 'Private'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    importantDates: {
      lastApplicationDate: {
        type: Date,
      },
      examDate: {
        type: Date,
      },
      admitCardDate: {
        type: Date,
      },
      resultDate: {
        type: Date,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ studentId: 1, isRead: 1 });
notificationSchema.index({ jobId: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
