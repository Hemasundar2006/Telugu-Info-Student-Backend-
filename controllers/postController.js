const mongoose = require('mongoose');
const Post = require('../models/PostModel');
const PostComment = require('../models/PostCommentModel');
const asyncHandler = require('../middleware/asyncHandler');
const { logActivity } = require('../middleware/activityLogger');

/**
 * Helper to safely parse pagination numbers.
 */
const parsePageLimit = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit };
};

/**
 * POST /api/posts
 * Create a new post: author, media image URL, description, and optional link preview.
 * Body: { text?, imageUrl?, linkPreview?: { url, title, description, image } }
 * Access: COMPANY and USER accounts (enforced in routes)
 */
exports.createPost = asyncHandler(async (req, res, next) => {
  const { text, imageUrl, linkPreview } = req.body || {};

  if (!text && !linkPreview?.url && !imageUrl?.trim()) {
    const err = new Error('Post must have text, imageUrl, or linkPreview.url');
    err.statusCode = 400;
    return next(err);
  }

  const cleanedLinkPreview =
    linkPreview && linkPreview.url
      ? {
          url: String(linkPreview.url).trim(),
          title: linkPreview.title?.trim() || undefined,
          description: linkPreview.description?.trim() || undefined,
          image: linkPreview.image?.trim() || undefined,
        }
      : undefined;

  const post = await Post.create({
    author: req.user._id,
    text: text ? String(text).trim() : undefined,
    imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    linkPreview: cleanedLinkPreview,
  });

  await logActivity(
    req,
    'POST_CREATE',
    'POST',
    post._id,
    'User created a post',
    { hasLinkPreview: !!cleanedLinkPreview, hasImageUrl: !!post.imageUrl }
  );

  const authorPayload = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    profileImage: req.user.profileImage,
  };

  res.status(201).json({
    success: true,
    data: {
      id: post._id,
      author: authorPayload,
      imageUrl: post.imageUrl,
      description: post.text,
      previewlink: post.linkPreview,
      likesCount: 0,
      commentsCount: 0,
      shareCount: 0,
    },
  });
});

/**
 * PUT /api/posts/:postId
 * Update a post. Only the post author can update.
 * Body: { text?, imageUrl?, linkPreview?: { url, title, description, image } }
 * Access: COMPANY/USER; must be the author of the post.
 */
exports.updatePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { text, imageUrl, linkPreview } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    return next(err);
  }

  if (String(post.author) !== String(req.user._id)) {
    const err = new Error('You can only edit your own posts');
    err.statusCode = 403;
    return next(err);
  }

  if (text !== undefined) post.text = text ? String(text).trim() : undefined;
  if (imageUrl !== undefined) post.imageUrl = imageUrl ? String(imageUrl).trim() : undefined;

  if (linkPreview !== undefined) {
    if (linkPreview && linkPreview.url) {
      post.linkPreview = {
        url: String(linkPreview.url).trim(),
        title: linkPreview.title?.trim() || undefined,
        description: linkPreview.description?.trim() || undefined,
        image: linkPreview.image?.trim() || undefined,
      };
    } else {
      post.linkPreview = undefined;
    }
  }

  const hasContent =
    (post.text && post.text.length > 0) ||
    (post.imageUrl && post.imageUrl.length > 0) ||
    (post.linkPreview && post.linkPreview.url);
  if (!hasContent) {
    const err = new Error('Post must have text, imageUrl, or linkPreview.url');
    err.statusCode = 400;
    return next(err);
  }

  await post.save();

  await logActivity(
    req,
    'POST_UPDATE',
    'POST',
    post._id,
    'User updated a post',
    {}
  );

  const updated = await Post.findById(postId).populate(
    'author',
    'name email role profileImage plan hasPaidPlan isPaid'
  );

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: {
      id: updated._id,
      author: updated.author,
      imageUrl: updated.imageUrl,
      description: updated.text,
      previewlink: updated.linkPreview,
      likesCount: updated.likes.length,
      commentsCount: updated.commentsCount,
      shareCount: updated.shareCount,
      updatedAt: updated.updatedAt,
    },
  });
});

/**
 * DELETE /api/posts/:postId
 * Delete a post. Only the post author can delete.
 * Access: COMPANY/USER; must be the author of the post.
 */
exports.deletePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    return next(err);
  }

  if (String(post.author) !== String(req.user._id)) {
    const err = new Error('You can only delete your own posts');
    err.statusCode = 403;
    return next(err);
  }

  await Post.findByIdAndDelete(postId);

  await logActivity(
    req,
    'POST_DELETE',
    'POST',
    post._id,
    'User deleted a post',
    {}
  );

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
});

/**
 * GET /api/posts/feed
 * Get a paginated feed of posts.
 * Query:
 *   - page, limit
 *   - type=daily -> only posts from last 24 hours (for "daily posts" view)
 * Access: any authenticated user (students, companies, admins)
 */
exports.getFeed = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req.query || {});
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.type === 'daily') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    filter.createdAt = { $gte: since };
  }

  const [total, posts] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email role profileImage plan hasPaidPlan isPaid'),
  ]);

  const currentUserId = String(req.user._id);

  const data = posts.map((p) => {
    const likedByMe = p.likes.some((id) => String(id) === currentUserId);
    const savedByMe = p.saves.some((id) => String(id) === currentUserId);
    return {
      id: p._id,
      author: {
        id: p.author._id,
        name: p.author.name,
        email: p.author.email,
        role: p.author.role,
        profileImage: p.author.profileImage,
        plan: p.author.plan,
        hasPaidPlan: p.author.hasPaidPlan,
        isPaid: p.author.isPaid,
      },
      imageUrl: p.imageUrl,
      description: p.text,
      previewlink: p.linkPreview,
      likesCount: p.likes.length,
      commentsCount: p.commentsCount,
      shareCount: p.shareCount,
      likedByMe,
      savedByMe,
      createdAt: p.createdAt,
    };
  });

  res.json({
    success: true,
    page,
    pages: Math.ceil(total / limit) || 1,
    count: data.length,
    total,
    data,
  });
});

/**
 * GET /api/posts/user/:userId
 * Get a paginated list of posts created by a specific user (student or company).
 * Used for profile \"Posts\" section.
 * Query:
 *   - page, limit
 * Access: any authenticated user.
 */
exports.getUserPosts = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid userId');
    err.statusCode = 400;
    return next(err);
  }

  const { page, limit } = parsePageLimit(req.query || {});
  const skip = (page - 1) * limit;

  const filter = { author: userId };

  const [total, posts] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email role profileImage plan hasPaidPlan isPaid'),
  ]);

  const currentUserId = String(req.user._id);

  const data = posts.map((p) => {
    const likedByMe = p.likes.some((id) => String(id) === currentUserId);
    const savedByMe = p.saves.some((id) => String(id) === currentUserId);
    return {
      id: p._id,
      author: {
        id: p.author._id,
        name: p.author.name,
        email: p.author.email,
        role: p.author.role,
        profileImage: p.author.profileImage,
      },
      imageUrl: p.imageUrl,
      description: p.text,
      previewlink: p.linkPreview,
      likesCount: p.likes.length,
      commentsCount: p.commentsCount,
      shareCount: p.shareCount,
      likedByMe,
      savedByMe,
      createdAt: p.createdAt,
    };
  });

  res.json({
    success: true,
    page,
    pages: Math.ceil(total / limit) || 1,
    count: data.length,
    total,
    data,
  });
});

/**
 * GET /api/posts/:postId/likes
 * Returns the list of users who liked a given post.
 * Access: any authenticated user (students, companies, admins)
 */
exports.getLikes = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const post = await Post.findById(postId).populate('likes', 'name email role');
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    return next(err);
  }

  const data = post.likes.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  res.json({
    success: true,
    count: data.length,
    data,
  });
});

/**
 * POST /api/posts/:postId/like
 * Toggle like on a post for current user.
 * Access: USER accounts only (students, enforced in routes)
 */
exports.toggleLike = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    return next(err);
  }

  const userId = String(req.user._id);
  const alreadyLiked = post.likes.some((id) => String(id) === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => String(id) !== userId);
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();

  await logActivity(
    req,
    alreadyLiked ? 'POST_UNLIKE' : 'POST_LIKE',
    'POST',
    post._id,
    alreadyLiked ? 'User unliked a post' : 'User liked a post',
    {}
  );

  res.json({
    success: true,
    liked: !alreadyLiked,
    likesCount: post.likes.length,
  });
});

/**
 * POST /api/posts/:postId/save
 * Toggle save on a post for current user.
 * Access: USER accounts only (students, enforced in routes)
 */
exports.toggleSave = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    return next(err);
  }

  const userId = String(req.user._id);
  const alreadySaved = post.saves.some((id) => String(id) === userId);

  if (alreadySaved) {
    post.saves = post.saves.filter((id) => String(id) !== userId);
  } else {
    post.saves.push(req.user._id);
  }

  await post.save();

  await logActivity(
    req,
    alreadySaved ? 'POST_UNSAVE' : 'POST_SAVE',
    'POST',
    post._id,
    alreadySaved ? 'User unsaved a post' : 'User saved a post',
    {}
  );

  res.json({
    success: true,
    saved: !alreadySaved,
    savesCount: post.saves.length,
  });
});

/**
 * POST /api/posts/:postId/comments
 * Add a comment to a post.
 * Body: { body }
 * Access: USER accounts only (students, enforced in routes)
 */
exports.addComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { body } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }
  if (!body || !String(body).trim()) {
    const err = new Error('Comment body is required');
    err.statusCode = 400;
    return next(err);
  }

  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    return next(err);
  }

  const comment = await PostComment.create({
    post: post._id,
    author: req.user._id,
    body: String(body).trim(),
  });

  post.commentsCount += 1;
  await post.save();

  await logActivity(
    req,
    'POST_COMMENT',
    'POST',
    post._id,
    'User commented on a post',
    {}
  );

  res.status(201).json({ success: true, data: comment });
});

/**
 * GET /api/posts/:postId/comments
 * Get comments for a post (paginated, newest first).
 * Query: page, limit
 * Access: COMPANY accounts only (enforced in routes)
 */
exports.getComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const { page, limit } = parsePageLimit(req.query || {});
  const skip = (page - 1) * limit;

  const [total, comments] = await Promise.all([
    PostComment.countDocuments({ post: postId }),
    PostComment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email role'),
  ]);

  res.json({
    success: true,
    page,
    pages: Math.ceil(total / limit) || 1,
    count: comments.length,
    total,
    data: comments,
  });
});

/**
 * POST /api/posts/:postId/share
 * Share a post (like "Repost" with optional text/comment).
 * Body: { text?, linkPreview? } — caller can optionally add their own text.
 * Access: USER accounts only (students, enforced in routes)
 */
exports.sharePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { text, linkPreview } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const original = await Post.findById(postId);
  if (!original) {
    const err = new Error('Original post not found');
    err.statusCode = 404;
    return next(err);
  }

  const cleanedLinkPreview =
    linkPreview && linkPreview.url
      ? {
          url: String(linkPreview.url).trim(),
          title: linkPreview.title?.trim() || undefined,
          description: linkPreview.description?.trim() || undefined,
          image: linkPreview.image?.trim() || undefined,
        }
      : undefined;

  const sharedPost = await Post.create({
    author: req.user._id,
    text: text ? String(text).trim() : undefined,
    imageUrl: original.imageUrl,
    linkPreview: cleanedLinkPreview || original.linkPreview,
    sharedFrom: original._id,
  });

  // Track share on original post
  original.shares.push({
    user: req.user._id,
    sharedPost: sharedPost._id,
  });
  original.shareCount += 1;
  await original.save();

  await logActivity(
    req,
    'POST_SHARE',
    'POST',
    original._id,
    'User shared a post',
    {}
  );

  res.status(201).json({ success: true, data: sharedPost });
});

/**
 * GET /api/posts/:postId/shares
 * Returns share tracking info for a post (who shared it and when).
 * Access: COMPANY/USER (author only; enforced in controller)
 */
exports.getShares = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid postId');
    err.statusCode = 400;
    return next(err);
  }

  const post = await Post.findById(postId).populate(
    'shares.user',
    'name email role'
  );
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    return next(err);
  }

  // Only the post author can view share tracking
  if (String(post.author) !== String(req.user._id)) {
    const err = new Error('You can only view share tracking for your own posts');
    err.statusCode = 403;
    return next(err);
  }

  const data = (post.shares || []).map((s) => ({
    user: s.user,
    sharedPost: s.sharedPost,
    createdAt: s.createdAt,
  }));

  res.json({
    success: true,
    count: data.length,
    data,
  });
});

