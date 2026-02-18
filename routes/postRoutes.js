const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createPost,
  getFeed,
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

// Create a new post (COMPANY only)
router.post('/', authorize('COMPANY'), createPost);

// Get feed (all authenticated users: students, companies, admins)
router.get('/feed', getFeed);

// Update post (COMPANY only, author only)
router.put('/:postId', authorize('COMPANY'), updatePost);

// Delete post (COMPANY only, author only)
router.delete('/:postId', authorize('COMPANY'), deletePost);

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

// Share tracking (COMPANY only)
router.get('/:postId/shares', authorize('COMPANY'), getShares);

module.exports = router;


