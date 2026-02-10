const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessageModel');
const Ticket = require('../models/TicketModel');
const asyncHandler = require('../middleware/asyncHandler');

const badRequest = (res, message) =>
  res.status(400).json({
    success: false,
    error: message,
  });

const notFound = (res, message) =>
  res.status(404).json({
    success: false,
    error: message,
  });

// Ensure the current user has access to the ticket (for USER_SUPPORT chats)
const assertTicketAccess = async (req, ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    const err = new Error('Invalid ticket id');
    err.statusCode = 400;
    throw err;
  }

  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.statusCode = 404;
    throw err;
  }

  // USER can only access their own ticket
  if (req.user.role === 'USER' && String(ticket.createdBy) !== String(req.user._id)) {
    const err = new Error('Not authorized for this ticket');
    err.statusCode = 403;
    throw err;
  }

  return ticket;
};

/**
 * POST /api/chats/user-support/:ticketId
 * USER and SUPPORT can send messages in the USER_SUPPORT channel for a specific ticket.
 */
exports.sendUserSupportMessage = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message, attachments } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return badRequest(res, 'message is required');
  }

  await assertTicketAccess(req, ticketId);

  const chatMessage = await ChatMessage.create({
    conversationType: 'USER_SUPPORT',
    ticket: ticketId,
    from: req.user._id,
    fromRole: req.user.role,
    message: message.trim(),
    attachments: Array.isArray(attachments) ? attachments : [],
  });

  return res.status(201).json({ success: true, data: chatMessage });
});

/**
 * GET /api/chats/user-support/:ticketId
 * USER: only their own ticket messages
 * SUPPORT / ADMIN / SUPER_ADMIN: can view all messages for that ticket
 */
exports.getUserSupportMessages = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  await assertTicketAccess(req, ticketId);

  const messages = await ChatMessage.find({
    conversationType: 'USER_SUPPORT',
    ticket: ticketId,
  })
    .populate('from', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json({ success: true, count: messages.length, data: messages });
});

/**
 * POST /api/chats/support-admin
 * SUPPORT, ADMIN, SUPER_ADMIN can send messages in the SUPPORT_ADMIN channel.
 */
exports.sendSupportAdminMessage = asyncHandler(async (req, res) => {
  const { message, attachments } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return badRequest(res, 'message is required');
  }

  const chatMessage = await ChatMessage.create({
    conversationType: 'SUPPORT_ADMIN',
    from: req.user._id,
    fromRole: req.user.role,
    message: message.trim(),
    attachments: Array.isArray(attachments) ? attachments : [],
  });

  return res.status(201).json({ success: true, data: chatMessage });
});

/**
 * GET /api/chats/support-admin
 * SUPPORT, ADMIN, SUPER_ADMIN can read messages in SUPPORT_ADMIN channel.
 */
exports.getSupportAdminMessages = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({
    conversationType: 'SUPPORT_ADMIN',
  })
    .populate('from', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json({ success: true, count: messages.length, data: messages });
});

/**
 * POST /api/chats/admin-super-admin
 * ADMIN and SUPER_ADMIN chat channel.
 */
exports.sendAdminSuperAdminMessage = asyncHandler(async (req, res) => {
  const { message, attachments } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return badRequest(res, 'message is required');
  }

  const chatMessage = await ChatMessage.create({
    conversationType: 'ADMIN_SUPER_ADMIN',
    from: req.user._id,
    fromRole: req.user.role,
    message: message.trim(),
    attachments: Array.isArray(attachments) ? attachments : [],
  });

  return res.status(201).json({ success: true, data: chatMessage });
});

/**
 * GET /api/chats/admin-super-admin
 * ADMIN and SUPER_ADMIN can read messages in ADMIN_SUPER_ADMIN channel.
 */
exports.getAdminSuperAdminMessages = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({
    conversationType: 'ADMIN_SUPER_ADMIN',
  })
    .populate('from', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json({ success: true, count: messages.length, data: messages });
});

