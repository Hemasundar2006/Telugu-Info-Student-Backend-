const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'APPLIED',
        'SHORTLISTED',
        'REJECTED',
        'ACCEPTED',
        'INTERVIEW_SCHEDULED',
      ],
      default: 'APPLIED',
      index: true,
    },
    resume: {
      type: String, // URL or storage key
      trim: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    hiredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);

