const mongoose = require('mongoose');

const urlValidator = (value) => {
  if (value === undefined || value === null || value === '') return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

const flexibleListItemValidator = (value) => {
  // Allow: "Some title"
  if (typeof value === 'string') return value.trim().length > 0;

  // Allow: { title: "Some title", date?: <date> }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (typeof value.title !== 'string' || value.title.trim().length === 0) return false;
    if (value.date === undefined || value.date === null || value.date === '') return true;
    const d = value.date instanceof Date ? value.date : new Date(value.date);
    return !Number.isNaN(d.getTime());
  }

  return false;
};

const userProfileSchema = new mongoose.Schema(
  {
    // A. Personal Information
    fullName: {
      type: String,
      required: [true, 'fullName is required'],
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [500, 'bio cannot exceed 500 characters'],
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'mobileNumber is required'],
      trim: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    },
    currentCity: {
      type: String,
      trim: true,
    },

    // B. Skills
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // C. Current Education (Object)
    currentEducation: {
      institute: { type: String, trim: true },
      qualification: { type: String, trim: true }, // e.g., "B.Tech"
      department: { type: String, trim: true }, // e.g., "Electronics and Communication"
      yearOfStudying: {
        type: String,
        enum: [
          '1st year',
          '2nd year',
          '3rd year',
          '4th year',
          '5th year',
          'Completed',
        ],
      },
      yearOfPassing: {
        type: Number,
      },
    },

    // D. Job Preferences (Object)
    jobPreferences: {
      minExpectedSalary: { type: Number },
      maxExpectedSalary: { type: Number },
      availability: {
        type: String,
        enum: ['Immediate', '10 days', '30 days', '90 days', '120 days'],
      },
      lookingFor: {
        type: String,
        enum: ['Job', 'Internship'],
      },
      yearsOfExperience: {
        type: mongoose.Schema.Types.Mixed, // Number or String
        validate: {
          validator: (v) =>
            v === undefined ||
            v === null ||
            (typeof v === 'number' && Number.isFinite(v)) ||
            (typeof v === 'string' && v.trim().length > 0),
          message: 'yearsOfExperience must be a number or a non-empty string',
        },
      },
      workPreference: {
        type: String,
        enum: ['Work from Home', 'Work from Office', 'Hybrid', 'Remote'],
      },
    },

    // E. Social Links
    socialLinks: {
      linkedinProfile: {
        type: String,
        trim: true,
        validate: {
          validator: urlValidator,
          message: 'linkedinProfile must be a valid URL (http/https)',
        },
      },
      githubUrl: {
        type: String,
        trim: true,
        validate: {
          validator: urlValidator,
          message: 'githubUrl must be a valid URL (http/https)',
        },
      },
    },

    // F. Dynamic Lists (Arrays)
    certifications: [
      {
        type: mongoose.Schema.Types.Mixed, // string OR {title, date}
        validate: {
          validator: flexibleListItemValidator,
          message: 'certifications items must be a string or { title, date }',
        },
      },
    ],
    achievements: [
      {
        type: mongoose.Schema.Types.Mixed, // string OR {title, date}
        validate: {
          validator: flexibleListItemValidator,
          message: 'achievements items must be a string or { title, date }',
        },
      },
    ],
    rewards: [
      {
        type: mongoose.Schema.Types.Mixed, // string OR {title, date}
        validate: {
          validator: flexibleListItemValidator,
          message: 'rewards items must be a string or { title, date }',
        },
      },
    ],
    hobbies: [
      {
        type: String,
        trim: true,
      },
    ],

    // G. Languages
    languages: [
      {
        name: { type: String, trim: true, required: true },
        proficiency: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Indexes
userProfileSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);

