const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      unique: true,
      required: true,
      default: () => `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
      minlength: [10, 'Job title must be at least 10 characters'],
    },
    organization: {
      type: String,
      required: [true, 'Organization is required'],
      trim: true,
    },
    jobCategory: {
      type: String,
      enum: ['Government', 'Private'],
      required: [true, 'Job category is required'],
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required'],
      minlength: [50, 'Job description must be at least 50 characters'],
    },
    targetQualifications: {
      type: [String],
      enum: ['10th', '12th', 'Diploma', 'B.Tech', 'B.Sc', 'B.Com', 'B.A', 'MBA', 'M.Tech'],
      required: [true, 'At least one target qualification is required'],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one target qualification must be selected',
      },
    },
    qualifications: {
      type: [String],
      default: [],
    },
    experience: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
      },
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    ageLimit: {
      min: {
        type: Number,
      },
      max: {
        type: Number,
      },
    },
    categoryEligibility: {
      type: [String],
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'PWD'],
      default: ['General'],
    },
    totalPositions: {
      type: Number,
      required: [true, 'Total positions is required'],
      min: [1, 'Total positions must be at least 1'],
    },
    lastApplicationDate: {
      type: Date,
      required: [true, 'Last application date is required'],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: 'Last application date must be in the future',
      },
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    // Conditional fields for Government jobs
    govtJobFields: {
      notifyingAuthority: {
        type: String,
        enum: ['APPSC', 'UPSC', 'SSC', 'RRB', 'IBPS', 'TNPSC', 'KPSC', 'MPSC'],
      },
      postCode: {
        type: String,
      },
      grade: {
        type: String,
        enum: ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
      },
      payScale: {
        min: {
          type: Number,
        },
        max: {
          type: Number,
        },
        currency: {
          type: String,
          default: 'INR',
        },
      },
      additionalBenefits: {
        dearness: {
          type: String,
        },
        houseRent: {
          type: String,
        },
        medicalBenefit: {
          type: String,
        },
        pensionScheme: {
          type: String,
        },
      },
      examPattern: {
        type: String,
      },
      examSyllabi: {
        type: String,
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
      selectionProcess: {
        type: String,
      },
      applicationFee: {
        type: Number,
        default: 0,
      },
      officialLink: {
        type: String,
      },
      notificationPDF: {
        type: String,
      },
    },
    // Conditional fields for Private jobs
    privateJobFields: {
      workMode: {
        type: String,
        enum: ['Remote', 'On-site', 'Hybrid'],
      },
      jobLocation: {
        type: [String],
      },
      salaryRange: {
        min: {
          type: Number,
        },
        max: {
          type: Number,
        },
        currency: {
          type: String,
          default: 'INR',
        },
        payStructure: {
          type: String,
          enum: ['CTC', 'Monthly', 'Hourly'],
        },
      },
      companyWebsite: {
        type: String,
      },
      companyDescription: {
        type: String,
      },
      companySize: {
        type: String,
        enum: ['Startup', 'SME', 'Large', 'Enterprise'],
      },
      industry: {
        type: String,
      },
      hrContactPerson: {
        type: String,
      },
      hrContactEmail: {
        type: String,
      },
      hrContactPhone: {
        type: String,
      },
      applicationLink: {
        type: String,
      },
    },
    // Notification tracking
    notificationTracking: {
      notificationSent: {
        type: Boolean,
        default: false,
      },
      notificationSentTo: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
        },
      ],
      notificationSentDate: {
        type: Date,
      },
      totalStudentsMatched: {
        type: Number,
        default: 0,
      },
    },
    // Publishing
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Closed', 'Expired'],
      default: 'Active',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Validation: Government jobs must have govtJobFields
jobPostingSchema.pre('validate', function (next) {
  if (this.jobCategory === 'Government') {
    if (!this.govtJobFields?.notifyingAuthority) {
      this.invalidate('govtJobFields.notifyingAuthority', 'Notifying authority is required for government jobs');
    }
    if (!this.govtJobFields?.postCode) {
      this.invalidate('govtJobFields.postCode', 'Post code is required for government jobs');
    }
    if (!this.govtJobFields?.grade) {
      this.invalidate('govtJobFields.grade', 'Grade is required for government jobs');
    }
    if (!this.govtJobFields?.payScale?.min || !this.govtJobFields?.payScale?.max) {
      this.invalidate('govtJobFields.payScale', 'Pay scale is required for government jobs');
    }
    if (!this.govtJobFields?.examDate) {
      this.invalidate('govtJobFields.examDate', 'Exam date is required for government jobs');
    }
    if (!this.govtJobFields?.officialLink) {
      this.invalidate('govtJobFields.officialLink', 'Official link is required for government jobs');
    }
  }
  
  if (this.jobCategory === 'Private') {
    if (!this.privateJobFields?.workMode) {
      this.invalidate('privateJobFields.workMode', 'Work mode is required for private jobs');
    }
    if (!this.privateJobFields?.jobLocation || this.privateJobFields.jobLocation.length === 0) {
      this.invalidate('privateJobFields.jobLocation', 'Job location is required for private jobs');
    }
    if (!this.privateJobFields?.salaryRange?.min || !this.privateJobFields?.salaryRange?.max) {
      this.invalidate('privateJobFields.salaryRange', 'Salary range is required for private jobs');
    }
    if (!this.privateJobFields?.hrContactEmail) {
      this.invalidate('privateJobFields.hrContactEmail', 'HR contact email is required for private jobs');
    }
    if (!this.privateJobFields?.hrContactPhone) {
      this.invalidate('privateJobFields.hrContactPhone', 'HR contact phone is required for private jobs');
    }
  }
  
  next();
});

// Indexes
jobPostingSchema.index({ targetQualifications: 1 });
jobPostingSchema.index({ jobCategory: 1 });
jobPostingSchema.index({ status: 1 });
jobPostingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('JobPosting', jobPostingSchema);
