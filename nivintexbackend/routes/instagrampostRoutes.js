const express = require('express');
const router = express.Router();
const {
  upload,
  getAllPosts,
  getAllPostsAdmin,
  getPostById,
  addPost,
  updatePost,
  deletePost,
} = require('../controllers/instagrampostController');

// ── Public (used by frontend InstagramSection) ──────────────────
// GET  /instagram-posts           → Active posts only, sorted
router.get('/', getAllPosts);

// ── Admin ───────────────────────────────────────────────────────
// GET    /instagram-posts/admin          → All posts (any status)
// GET    /instagram-posts/:id            → Single post
// POST   /instagram-posts/add            → Add post  (multipart/form-data)
// PUT    /instagram-posts/update/:id     → Update post (multipart/form-data)
// DELETE /instagram-posts/:id            → Delete post

router.get('/admin',         getAllPostsAdmin);
router.get('/:id',           getPostById);
router.post('/add',          upload.single('image'), addPost);
router.put('/update/:id',    upload.single('image'), updatePost);
router.delete('/:id',        deletePost);

module.exports = router;