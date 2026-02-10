const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    // USER ↔ SUPPORT, SUPPORT ↔ ADMIN, ADMIN ↔ SUPER_ADMIN
    conversationType: {
      type: String,
      enum: ['USER_SUPPORT', 'SUPPORT_ADMIN', 'ADMIN_SUPER_ADMIN'],
      required: true,
    },

    // For USER_SUPPORT conversations, we attach messages to a ticket
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fromRole: {
      type: String,
      enum: ['USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: [
      {
        url: {
          type: String,
          trim: true,
        },
        type: {
          type: String,
          trim: true,
        },
        name: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ conversationType: 1, ticket: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

