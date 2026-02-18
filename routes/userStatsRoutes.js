const express = require('express');
const { getUserStats } = require('../controllers/followController');

const router = express.Router();

// Public stats endpoint (no auth)
router.get('/:userId/stats', getUserStats);

module.exports = router;

