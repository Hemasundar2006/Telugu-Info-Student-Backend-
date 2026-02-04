const mongoose = require('mongoose');

const cutoffRanksSchema = new mongoose.Schema(
  {
    OC: { type: Number, default: null },
    BC: { type: Number, default: null },
    SC: { type: Number, default: null },
    ST: { type: Number, default: null },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    state: {
      type: String,
      enum: ['AP', 'TS'],
      required: [true, 'State (AP or TS) is required'],
    },
    cutoffRanks: {
      type: cutoffRanksSchema,
      default: () => ({}),
    },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

// Indexes for College Predictor: fast filtering by state, category rank
collegeSchema.index({ state: 1 });
collegeSchema.index({ 'cutoffRanks.OC': 1, state: 1 });
collegeSchema.index({ 'cutoffRanks.BC': 1, state: 1 });
collegeSchema.index({ 'cutoffRanks.SC': 1, state: 1 });
collegeSchema.index({ 'cutoffRanks.ST': 1, state: 1 });
collegeSchema.index({ district: 1, state: 1 });

module.exports = mongoose.model('College', collegeSchema);
