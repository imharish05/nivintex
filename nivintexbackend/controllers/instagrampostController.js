const InstagramPost = require('../models/InstagramPost');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Null helper ─────────────────────────────────────────────────
const nullIfEmpty = (val) =>
  val === '' || val === undefined || val === 'undefined' ? null : val;

// ── Multer Storage ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/instagram';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept both images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error(`Only image or video files are allowed. Got: ${file.mimetype}`));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (videos need more room)
});

// ── GET all posts (public — Active only, sorted) ────────────────
const getAllPosts = async (req, res) => {
  try {
    const posts = await InstagramPost.findAll({
      where: { status: 'Active' },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(posts);
  } catch (err) {
    console.error('getAllPosts:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET all posts (admin — all statuses) ────────────────────────
const getAllPostsAdmin = async (req, res) => {
  try {
    const posts = await InstagramPost.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(posts);
  } catch (err) {
    console.error('getAllPostsAdmin:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET single post ─────────────────────────────────────────────
const getPostById = async (req, res) => {
  try {
    const post = await InstagramPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error('getPostById:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── Detect media type from mimetype ────────────────────────────
const getMediaType = (mimetype) => {
  if (!mimetype) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'image';
};

// ── POST add post ───────────────────────────────────────────────
const addPost = async (req, res) => {
  try {
    console.log('📦 Body:', req.body);
    console.log('🖼️  File:', req.file);

    const { label, tag, postUrl, status, sortOrder } = req.body;

    const mediaPath = req.file ? req.file.path.replace(/\\/g, '/') : null;
    const mediaType = req.file ? getMediaType(req.file.mimetype) : 'image';

    const post = await InstagramPost.create({
      label:     nullIfEmpty(label)    || null,
      tag:       nullIfEmpty(tag),
      postUrl:   nullIfEmpty(postUrl),
      status:    nullIfEmpty(status)   || 'Active',
      sortOrder: sortOrder ? parseInt(sortOrder) : 1,
      image:     mediaPath,   // stores path for both image & video
      mediaType,              // 'image' | 'video'
    });

    res.status(201).json({ message: 'Post added successfully', post });
  } catch (err) {
    console.error('❌ addPost ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── PUT update post ─────────────────────────────────────────────
const updatePost = async (req, res) => {
  try {
    console.log('📦 Body:', req.body);
    console.log('🖼️  File:', req.file);

    const post = await InstagramPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { label, tag, postUrl, status, sortOrder } = req.body;

    if (req.file) {
      // Delete old file if it exists
      if (post.image && fs.existsSync(post.image)) fs.unlinkSync(post.image);
      post.image     = req.file.path.replace(/\\/g, '/');
      post.mediaType = getMediaType(req.file.mimetype);
    }

    if (label     !== undefined) post.label     = nullIfEmpty(label);
    if (tag       !== undefined) post.tag       = nullIfEmpty(tag);
    if (postUrl   !== undefined) post.postUrl   = nullIfEmpty(postUrl);
    if (status    !== undefined) post.status    = status;
    if (sortOrder !== undefined) post.sortOrder = parseInt(sortOrder);

    await post.save();
    res.json({ message: 'Post updated successfully', post });
  } catch (err) {
    console.error('❌ updatePost ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE post ─────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await InstagramPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.image && fs.existsSync(post.image)) fs.unlinkSync(post.image);
    await post.destroy();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('❌ deletePost ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  upload,
  getAllPosts,
  getAllPostsAdmin,
  getPostById,
  addPost,
  updatePost,
  deletePost,
};