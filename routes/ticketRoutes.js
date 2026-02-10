const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createTicket,
  getSupportTickets,
  assignTicket,
  completeTicket,
  getSuperAdminTickets,
} = require('../controllers/ticketController');
const validate = require('../middleware/validate');
const {
  createTicketSchema,
  idParamSchema,
  completeTicketSchema,
} = require('../validators/ticketValidator');

const router = express.Router();

// USER: create ticket (tickets from users go to support)
router.post(
  '/',
  protect,
  authorize('USER'),
  validate(createTicketSchema),
  createTicket
);

// USER: list own tickets
// SUPPORT: list open/in-progress tickets at base path as well
// GET /api/tickets
router.get(
  '/',
  protect,
  authorize('USER', 'SUPPORT'),
  getSupportTickets
);

// SUPPORT: list open/in-progress tickets
router.get(
  '/support',
  protect,
  authorize('SUPPORT'),
  getSupportTickets
);

// SUPPORT: assign ticket to self
router.patch(
  '/:id/assign',
  protect,
  authorize('SUPPORT'),
  validate(idParamSchema, 'params'),
  assignTicket
);

// SUPPORT: complete ticket → then shows in super admin panel
router.patch(
  '/:id/complete',
  protect,
  authorize('SUPPORT'),
  validate(idParamSchema, 'params'),
  validate(completeTicketSchema),
  completeTicket
);

// SUPER_ADMIN: list completed tickets (support panel)
router.get(
  '/super-admin',
  protect,
  authorize('SUPER_ADMIN'),
  getSuperAdminTickets
);

module.exports = router;
