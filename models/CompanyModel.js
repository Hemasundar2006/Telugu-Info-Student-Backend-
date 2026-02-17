const mongoose = require('mongoose');

// Reusable address schema for HQ and office locations
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    pinCode: { type: String, trim: true },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    // Link to auth user (recruiter/company account)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Authentication-level snapshot (actual auth stays in User)
    email: { type: String, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true },
    accountType: {
      type: String,
      enum: ['individual', 'company'],
      default: 'company',
    },

    // Basic Info
    companyName: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    yearFounded: { type: Number },
    companyType: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: { type: String, trim: true },
    website: { type: String, trim: true },
    linkedInProfile: { type: String, trim: true },

    // Contact
    headquarters: addressSchema,
    officeLocations: [addressSchema],
    contactEmail: { type: String, trim: true },
    hrContactNumber: { type: String, trim: true },

    // Branding
    logo: { type: String, trim: true },
    banner: { type: String, trim: true },
    gallery: [{ type: String, trim: true }],
    videoUrl: { type: String, trim: true },

    // Description
    about: { type: String, trim: true },
    tagline: { type: String, trim: true },
    coreValues: [{ type: String, trim: true }],
    products: { type: String, trim: true },
    achievements: { type: String, trim: true },

    // Social Media
    socialMedia: {
      linkedin: { type: String, trim: true },
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true },
      instagram: { type: String, trim: true },
      youtube: { type: String, trim: true },
      glassdoor: { type: String, trim: true },
    },

    // Primary Contact / Recruiter
    recruiter: {
      name: { type: String, trim: true },
      designation: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      linkedIn: { type: String, trim: true },
      photo: { type: String, trim: true },
    },

    // Benefits
    benefits: [{ type: String, trim: true }],
    customBenefits: { type: String, trim: true },

    // Hiring Preferences
    hiringTimeline: { type: String, trim: true },
    preferredQualifications: [{ type: String, trim: true }],
    hiringIndustries: [{ type: String, trim: true }],
    commonRoles: [{ type: String, trim: true }],
    fresherFriendly: { type: Boolean, default: false },
    internshipAvailable: { type: Boolean, default: false },

    // Verification
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    businessLicense: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    verificationDocuments: [{ type: String, trim: true }],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: { type: Date },
    verificationNote: { type: String, trim: true },
    emailVerified: { type: Boolean, default: false },

    // Stats (auto-generated)
    stats: {
      profileViews: { type: Number, default: 0 },
      totalJobsPosted: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      averageResponseTime: { type: Number },
      rating: { type: Number },
    },

    // Settings / Preferences
    preferences: {
      emailNotifications: {
        newApplications: { type: Boolean, default: true },
        statusUpdates: { type: Boolean, default: true },
        weeklySummary: { type: Boolean, default: true },
      },
      visibility: {
        publicProfile: { type: Boolean, default: true },
        showContact: { type: Boolean, default: true },
        showSize: { type: Boolean, default: true },
      },
      language: { type: String, trim: true, default: 'english' },
      timezone: { type: String, trim: true },
    },

    // Additional
    cultureTags: [{ type: String, trim: true }],
    diversityStatement: { type: String, trim: true },
    workEnvironment: { type: String, trim: true },
    dressCode: { type: String, trim: true },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
    },

    // Activity
    lastActive: { type: Date },

    // Profile completion
    profileCompletionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

companySchema.index({ companyName: 'text', about: 'text', products: 'text' });
companySchema.index({ industry: 1 });

module.exports = mongoose.model('Company', companySchema);

