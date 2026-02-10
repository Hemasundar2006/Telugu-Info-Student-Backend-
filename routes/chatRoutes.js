const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  sendUserSupportMessage,
  getUserSupportMessages,
  sendSupportAdminMessage,
  getSupportAdminMessages,
  sendAdminSuperAdminMessage,
  getAdminSuperAdminMessages,
} = require('../controllers/chatController');

const router = express.Router();

// USER ↔ SUPPORT chat, attached to a ticket
router.post(
  '/user-support/:ticketId',
  protect,
  authorize('USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'),
  sendUserSupportMessage
);

router.get(
  '/user-support/:ticketId',
  protect,
  authorize('USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'),
  getUserSupportMessages
);

// SUPPORT ↔ ADMIN (and SUPER_ADMIN can observe)
router.post(
  '/support-admin',
  protect,
  authorize('SUPPORT', 'ADMIN', 'SUPER_ADMIN'),
  sendSupportAdminMessage
);

router.get(
  '/support-admin',
  protect,
  authorize('SUPPORT', 'ADMIN', 'SUPER_ADMIN'),
  getSupportAdminMessages
);

// ADMIN ↔ SUPER_ADMIN
router.post(
  '/admin-super-admin',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  sendAdminSuperAdminMessage
);

router.get(
  '/admin-super-admin',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getAdminSuperAdminMessages
);

module.exports = router;

