const express = require('express');
const { protect } = require('../middleware/auth');
const {
  toggleFollow,
  getFollowers,
  getFollowing,
} = require('../controllers/followController');

const router = express.Router();

// Auth required for follow actions and follower/following lists
router.use(protect);

// Toggle follow/unfollow
router.post('/:targetUserId', toggleFollow);

// Lists
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

module.exports = router;

