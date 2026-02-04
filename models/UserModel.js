const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // allows null/undefined but enforces uniqueness when present
    },
    password: {
      type: String,
      select: false, // don't return password by default
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'],
      default: 'USER',
    },
    state: {
      type: String,
      enum: ['AP', 'TS'],
      required: [true, 'State (AP or TS) is required'],
    },
    tier: {
      type: String,
      enum: ['FREE', '1_RUPEE', '9_RUPEE'],
      default: 'FREE',
    },
    purchasedItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ state: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
