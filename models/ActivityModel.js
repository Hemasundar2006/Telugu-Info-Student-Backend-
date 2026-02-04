const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: {
      type: String,
      enum: ['USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'],
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'REGISTER',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_APPROVE',
        'DOCUMENT_REJECT',
        'DOCUMENT_VIEW',
        'TICKET_CREATE',
        'TICKET_ASSIGN',
        'TICKET_COMPLETE',
        'COLLEGE_PREDICT',
        'PAYMENT_VERIFY',
        'USER_UPDATE',
        'PROFILE_UPDATE',
      ],
    },
    resourceType: {
      type: String,
      enum: ['DOCUMENT', 'TICKET', 'USER', 'PAYMENT', 'AUTH', 'PREDICTOR'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast queries: by user, role, action, date
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ userRole: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ resourceType: 1, resourceId: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
