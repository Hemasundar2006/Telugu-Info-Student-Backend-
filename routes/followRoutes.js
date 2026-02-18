const express = require('express');
const { protect } = require('../middleware/auth');
const {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowStatus,
} = require('../controllers/followController');

const router = express.Router();

// Auth required for follow actions and follower/following lists
router.use(protect);

// Toggle follow/unfollow
router.post('/:targetUserId', toggleFollow);

// Follow status (for UI state after refresh)
router.get('/:targetUserId/status', getFollowStatus);

// Lists
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

module.exports = router;

