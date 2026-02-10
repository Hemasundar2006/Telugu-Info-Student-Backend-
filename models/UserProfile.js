const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    // A. Personal Information (no validations, only basic types)
    fullName: {
      type: String,
      trim: true,
      required: [true, 'fullName is required'],
    },
    bio: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, 'email is required'],
      unique: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      required: [true, 'mobileNumber is required'],
    },
    isMobileVerified: {
      type: Boolean,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      trim: true,
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
      qualification: { type: String, trim: true },
      department: { type: String, trim: true },
      yearOfStudying: {
        type: String,
        trim: true,
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
        trim: true,
      },
      lookingFor: {
        type: String,
        trim: true,
      },
      yearsOfExperience: {
        type: mongoose.Schema.Types.Mixed,
      },
      workPreference: {
        type: String,
        trim: true,
      },
    },

    // E. Social Links
    socialLinks: {
      linkedinProfile: {
        type: String,
        trim: true,
      },
      githubUrl: {
        type: String,
        trim: true,
      },
    },

    // F. Dynamic Lists (Arrays)
    certifications: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    achievements: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    rewards: [
      {
        type: mongoose.Schema.Types.Mixed,
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
        name: { type: String, trim: true },
        proficiency: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);

