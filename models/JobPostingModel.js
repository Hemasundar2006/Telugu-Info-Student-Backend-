const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true,
    },
    jobType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    requirements: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
    },
    salaryMin: {
      type: Number,
    },
    salaryMax: {
      type: Number,
    },
    location: {
      type: String,
      trim: true,
      index: true,
    },
    experienceLevel: {
      type: String,
      enum: ['FRESHER', 'JUNIOR', 'SENIOR', 'LEAD'],
      index: true,
    },
    skills: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    applicationDeadline: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED', 'DRAFT'],
      default: 'ACTIVE',
      index: true,
    },
    positionsAvailable: {
      type: Number,
      default: 1,
      min: 1,
    },
    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

jobPostingSchema.index({
  jobTitle: 'text',
  description: 'text',
  requirements: 'text',
});

module.exports = mongoose.model('JobPosting', jobPostingSchema);

