const express = require('express');
const { protect } = require('../middleware/auth');
const { getUserStats, getUserProfileDetails } = require('../controllers/followController');

const router = express.Router();

// Public stats endpoint (no auth)
router.get('/:userId/stats', getUserStats);

// Full profile + counts + isFollowing (auth required)
router.get('/:userId/profile', protect, getUserProfileDetails);

module.exports = router;

