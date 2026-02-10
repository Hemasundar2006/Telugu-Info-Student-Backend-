const Ticket = require('../models/TicketModel');
const asyncHandler = require('../middleware/asyncHandler');
const { logActivity } = require('../middleware/activityLogger');

/**
 * POST /api/tickets
 * USER creates a ticket (from users → support).
 */
exports.createTicket = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const ticket = await Ticket.create({
    title,
    description: description || '',
    state: req.user.state,
    createdBy: req.user._id,
    status: 'OPEN',
  });
  
  // Log ticket creation activity
  await logActivity(req, 'TICKET_CREATE', 'TICKET', ticket._id, `${req.user.name} created ticket: ${title}`, { state: req.user.state, status: 'OPEN' });
  
  res.status(201).json({ success: true, data: ticket });
});

/**
 * GET /api/tickets
 * USER: lists tickets created by the current user.
 * SUPPORT: lists tickets with status OPEN or IN_PROGRESS.
 */
exports.getSupportTickets = asyncHandler(async (req, res, next) => {
  const role = req.user.role;

  let query;

  if (role === 'USER') {
    // Normal users see only their own tickets (any status)
    query = { createdBy: req.user._id };
  } else if (role === 'SUPPORT') {
    // Support sees tickets that are currently actionable
    query = {
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    };
  } else {
    const err = new Error(`Role ${role} is not allowed to view tickets`);
    err.statusCode = 403;
    return next(err);
  }

  const tickets = await Ticket.find(query)
    .populate('createdBy', 'name phone state')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, count: tickets.length, data: tickets });
});

/**
 * PATCH /api/tickets/:id/assign
 * SUPPORT only. Assign ticket to self and set IN_PROGRESS.
 */
exports.assignTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.statusCode = 404;
    return next(err);
  }
  if (ticket.status === 'COMPLETED') {
    const err = new Error('Ticket already completed');
    err.statusCode = 400;
    return next(err);
  }
  ticket.assignedTo = req.user._id;
  ticket.status = 'IN_PROGRESS';
  await ticket.save();
  
  // Log ticket assignment activity
  await logActivity(req, 'TICKET_ASSIGN', 'TICKET', ticket._id, `${req.user.name} assigned ticket: ${ticket.title}`, { status: 'IN_PROGRESS', assignedTo: req.user._id });
  
  res.json({ success: true, data: ticket });
});

/**
 * PATCH /api/tickets/:id/complete
 * SUPPORT only. Mark ticket COMPLETED; then it shows in super admin panel.
 */
exports.completeTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.statusCode = 404;
    return next(err);
  }
  ticket.status = 'COMPLETED';
  ticket.completedBy = req.user._id;
  ticket.completedAt = new Date();
  ticket.resolutionNote = req.body.resolutionNote || ticket.resolutionNote || '';
  await ticket.save();
  await ticket.populate('createdBy', 'name phone');
  await ticket.populate('completedBy', 'name phone');
  
  // Log ticket completion activity
  await logActivity(req, 'TICKET_COMPLETE', 'TICKET', ticket._id, `${req.user.name} completed ticket: ${ticket.title}`, { status: 'COMPLETED', createdBy: ticket.createdBy._id, resolutionNote: ticket.resolutionNote });
  
  res.json({ success: true, data: ticket });
});

/**
 * GET /api/tickets/super-admin
 * SUPER_ADMIN only. Lists completed tickets (support panel overview).
 */
exports.getSuperAdminTickets = asyncHandler(async (req, res, next) => {
  const tickets = await Ticket.find({ status: 'COMPLETED' })
    .populate('createdBy', 'name phone state')
    .populate('assignedTo', 'name phone')
    .populate('completedBy', 'name phone')
    .sort({ completedAt: -1 })
    .lean();
  res.json({ success: true, count: tickets.length, data: tickets });
});
