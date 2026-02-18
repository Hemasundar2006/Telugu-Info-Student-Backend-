const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createPost,
  getFeed,
  getUserPosts,
  updatePost,
  deletePost,
  toggleLike,
  toggleSave,
  addComment,
  getComments,
  sharePost,
  getLikes,
  getShares,
} = require('../controllers/postController');

const router = express.Router();

// All post routes require authentication
router.use(protect);

// Create a new post (COMPANY and USER)
router.post('/', authorize('COMPANY', 'USER'), createPost);

// Get feed (all authenticated users: students, companies, admins)
router.get('/feed', getFeed);

// Get posts for a specific user (profile \"Posts\" section)
router.get('/user/:userId', getUserPosts);

// Update post (COMPANY and USER, author only)
router.put('/:postId', authorize('COMPANY', 'USER'), updatePost);

// Delete post (COMPANY and USER, author only)
router.delete('/:postId', authorize('COMPANY', 'USER'), deletePost);

// View likes (all authenticated users)
router.get('/:postId/likes', getLikes);

// Like / unlike (USER only - students)
router.post('/:postId/like', authorize('USER'), toggleLike);

// Save / unsave (USER only - students)
router.post('/:postId/save', authorize('USER'), toggleSave);

// Comments
// Add comment (USER only - students)
router.post('/:postId/comments', authorize('USER'), addComment);
// View comments (all authenticated users)
router.get('/:postId/comments', getComments);

// Share (USER only - students)
router.post('/:postId/share', authorize('USER'), sharePost);

// Share tracking (author only: COMPANY or USER)
router.get('/:postId/shares', authorize('COMPANY', 'USER'), getShares);

module.exports = router;


