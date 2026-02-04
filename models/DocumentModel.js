const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    docType: {
      type: String,
      enum: ['HALL_TICKET', 'RESULT', 'ROADMAP'],
      required: [true, 'Document type is required'],
    },
    state: {
      type: String,
      enum: ['AP', 'TS'],
      required: [true, 'State (AP or TS) is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast queries: pending (Super Admin), list by state+status
documentSchema.index({ status: 1 });
documentSchema.index({ state: 1, status: 1 });
documentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Document', documentSchema);
