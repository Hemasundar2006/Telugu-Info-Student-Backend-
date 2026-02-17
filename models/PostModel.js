const mongoose = require('mongoose');

const linkPreviewSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Main text content of the post
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    // Optional link preview (like LinkedIn URL card)
    linkPreview: linkPreviewSchema,

    // Social features
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    saves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    commentsCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },

    // For "share" feature: this post can reference an original post
    sharedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },

    // Share tracking: who shared this post and when
    shares: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        sharedPost: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);

