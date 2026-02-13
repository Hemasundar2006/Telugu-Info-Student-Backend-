const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
      required: [true, 'Student ID is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Phone must be exactly 10 digits',
      },
    },
    qualification: {
      type: String,
      enum: ['10th', '12th', 'Diploma', 'B.Tech', 'B.Sc', 'B.Com', 'B.A', 'MBA', 'M.Tech'],
      required: [true, 'Qualification is required'],
    },
    specialization: {
      type: String,
      trim: true,
    },
    yearOfStudy: {
      type: Number,
      min: 1,
      max: 4,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    collegeCode: {
      type: String,
      trim: true,
    },
    appliedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
      },
    ],
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
      },
    ],
    jobAlerts: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

// Indexes
studentSchema.index({ qualification: 1, status: 1 });
studentSchema.index({ email: 1 });

module.exports = mongoose.model('Student', studentSchema);
