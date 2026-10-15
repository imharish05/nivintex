const { LiveProduct, Product } = require('../models');

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { Op } = require('sequelize');

// ── Multer Storage ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'video'
      ? 'uploads/live-products/videos'
      : 'uploads/live-products/images';
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
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) return cb(null, true);
      return cb(new Error('Only image files are allowed for thumbnail'));
    }
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) return cb(null, true);
      return cb(new Error('Only video files are allowed'));
    }
    cb(new Error('Unexpected field: ' + file.fieldname));
  },
  limits: { fileSize: 100 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// ── Helper: delete file safely ──────────────────────────────────
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { console.warn('Could not delete file:', filePath); }
  }
};

// ── Helper: coerce productId safely ────────────────────────────
const parseProductId = (raw) => {
  if (raw === undefined || raw === null) return null;
  const str = String(raw).trim();
  if (!str || str === '0' || str === 'null' || str === 'undefined') return null;
  const n = parseInt(str, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ── Helper: uniqueness check ────────────────────────────────────
const checkProductIdUnique = async (productId, excludeId = null) => {
  if (!productId) return null;
  const where = { productId };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return await LiveProduct.findOne({ where });
};

// ── GET all ─────────────────────────────────────────────────────
// No JOIN — the admin dropdown loads products separately,
// and the frontend carousel only needs productId to build /product/:id.
const getAllLiveProducts = async (req, res) => {
  try {
    const items = await LiveProduct.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(items);
  } catch (err) {
    console.error('getAllLiveProducts:', err);
    res.status(500).json({ error: 'Failed to fetch live products' });
  }
};

// ── GET single ──────────────────────────────────────────────────
const getLiveProductById = async (req, res) => {
  try {
    const item = await LiveProduct.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Live product not found' });
    res.json(item);
  } catch (err) {
    console.error('getLiveProductById:', err);
    res.status(500).json({ error: 'Failed to fetch live product' });
  }
};

// ── POST add ────────────────────────────────────────────────────
const addLiveProduct = async (req, res) => {
  try {
    const {
      title, price, originalPrice, discountPercent,
      link, productId: rawProductId, sortOrder, status,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!price) return res.status(400).json({ error: 'Price is required' });

    const productId = parseProductId(rawProductId);

    if (productId) {
      const exists = await Product.findByPk(productId, { attributes: ['id'] });
      if (!exists) {
        return res.status(400).json({
          error: `Product with ID ${productId} does not exist. Please select a valid product.`,
        });
      }
      const conflict = await checkProductIdUnique(productId);
      if (conflict) {
        return res.status(409).json({
          error: `Product #${productId} is already linked to live product "${conflict.title}" (ID: ${conflict.id}).`,
        });
      }
    }

    const image = req.files?.image?.[0]?.path.replace(/\\/g, '/') || null;
    const video = req.files?.video?.[0]?.path.replace(/\\/g, '/') || null;

    const item = await LiveProduct.create({
      title,
      image,
      video,
      mediaType:       video ? 'video' : 'image',
      price:           parseFloat(price),
      originalPrice:   originalPrice   ? parseFloat(originalPrice)  : null,
      discountPercent: discountPercent ? parseInt(discountPercent)   : null,
      link:            link            || null,
      productId,
      sortOrder:       sortOrder ? parseInt(sortOrder) : 1,
      status:          status    || 'Active',
    });

    res.status(201).json({ message: 'Live product added successfully', item });
  } catch (err) {
    console.error('addLiveProduct:', err);
    res.status(500).json({ error: 'Failed to add live product', details: err.message });
  }
};

// ── PUT update ──────────────────────────────────────────────────
const updateLiveProduct = async (req, res) => {
  try {
    const item = await LiveProduct.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Live product not found' });

    const {
      title, price, originalPrice, discountPercent,
      link, productId: rawProductId, sortOrder, status,
    } = req.body;

    const productId = parseProductId(rawProductId);

    if (productId) {
      const exists = await Product.findByPk(productId, { attributes: ['id'] });
      if (!exists) {
        return res.status(400).json({
          error: `Product with ID ${productId} does not exist. Please select a valid product.`,
        });
      }
      const conflict = await checkProductIdUnique(productId, item.id);
      if (conflict) {
        return res.status(409).json({
          error: `Product #${productId} is already linked to live product "${conflict.title}" (ID: ${conflict.id}).`,
        });
      }
    }

    if (req.files?.image?.[0]) {
      deleteFile(item.image);
      item.image = req.files.image[0].path.replace(/\\/g, '/');
    }
    if (req.files?.video?.[0]) {
      deleteFile(item.video);
      item.video = req.files.video[0].path.replace(/\\/g, '/');
    }

    item.mediaType = item.video ? 'video' : 'image';

    item.title           = title           || item.title;
    item.price           = price           ? parseFloat(price)           : item.price;
    item.originalPrice   = originalPrice   !== undefined
                             ? (originalPrice ? parseFloat(originalPrice) : null)
                             : item.originalPrice;
    item.discountPercent = discountPercent !== undefined
                             ? (discountPercent ? parseInt(discountPercent) : null)
                             : item.discountPercent;
    item.link            = link !== undefined ? link : item.link;

    if (rawProductId !== undefined) {
      item.productId = productId;
    }

    item.sortOrder = sortOrder ? parseInt(sortOrder) : item.sortOrder;
    item.status    = status    || item.status;

    await item.save();
    res.json({ message: 'Live product updated successfully', item });
  } catch (err) {
    console.error('updateLiveProduct:', err);
    res.status(500).json({ error: 'Failed to update live product', details: err.message });
  }
};

// ── DELETE ──────────────────────────────────────────────────────
const deleteLiveProduct = async (req, res) => {
  try {
    const item = await LiveProduct.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Live product not found' });

    deleteFile(item.image);
    deleteFile(item.video);

    await item.destroy();
    res.json({ message: 'Live product deleted successfully' });
  } catch (err) {
    console.error('deleteLiveProduct:', err);
    res.status(500).json({ error: 'Failed to delete live product', details: err.message });
  }
};

module.exports = {
  uploadFields,
  getAllLiveProducts,
  getLiveProductById,
  addLiveProduct,
  updateLiveProduct,
  deleteLiveProduct,
};