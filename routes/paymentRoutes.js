const express = require('express');

const router = express.Router();

// POST /api/payments/verify is registered in server.js with express.raw() for webhook signature verification.
// Add other payment routes here (e.g. POST /create-order).

module.exports = router;
