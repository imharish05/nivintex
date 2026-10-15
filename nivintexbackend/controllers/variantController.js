// controllers/variantController.js
const ProductVariant = require('../models/ProductVariant');
const Product        = require('../models/Product');
const fs             = require('fs');
const path           = require('path');

const normPath   = (p) => p.replace(/\\/g, '/');
const unlinkSafe = (filePath) => {
  if (!filePath) return;
  try {
    const abs = path.resolve(filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (_) { /* ignore */ }
};

// ── 1. Add a variant ─────────────────────────────────────────────────────────
exports.addVariant = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const {
      color, size, fabric, weight, volume, nos,
      mrp, salesPrice, stock, sku,
    } = req.body;

    const imageFile = (req.files || []).find(f => f.fieldname === 'image');
    const imagePath = imageFile ? normPath(imageFile.path) : null;

    const variant = await ProductVariant.create({
      productId: Number(productId),
      color:      color      || null,
      size:       size       || null,
      fabric:     fabric     || null,
      weight:     weight     || null,
      volume:     volume     || null,
      nos:        nos        || null,
      mrp:        mrp        ? parseFloat(mrp)       : null,
      salesPrice: salesPrice ? parseFloat(salesPrice): null,
      stock:      stock      ? parseInt(stock, 10)   : 0,
      sku:        sku        || null,
      image:      imagePath,
    });

    res.status(201).json({ success: true, variant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 2. Get variants for a product ────────────────────────────────────────────
exports.getVariantsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await ProductVariant.findAll({
      where:  { productId: Number(productId) },
      order:  [['id', 'ASC']],
    });
    res.status(200).json({ success: true, variants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 3. Get a single variant ───────────────────────────────────────────────────
exports.getVariantById = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
    res.status(200).json({ success: true, variant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 4. Update a variant ───────────────────────────────────────────────────────
exports.updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const {
      color, size, fabric, weight, volume, nos,
      mrp, salesPrice, stock, sku, status,
    } = req.body;

    const imageFile = (req.files || []).find(f => f.fieldname === 'image');

    const updates = {};
    if (color      !== undefined) updates.color      = color      || null;
    if (size       !== undefined) updates.size       = size       || null;
    if (fabric     !== undefined) updates.fabric     = fabric     || null;
    if (weight     !== undefined) updates.weight     = weight     || null;
    if (volume     !== undefined) updates.volume     = volume     || null;
    if (nos        !== undefined) updates.nos        = nos        || null;
    if (mrp        !== undefined) updates.mrp        = mrp        ? parseFloat(mrp)        : null;
    if (salesPrice !== undefined) updates.salesPrice = salesPrice ? parseFloat(salesPrice) : null;
    if (stock      !== undefined) updates.stock      = parseInt(stock, 10);
    if (sku        !== undefined) updates.sku        = sku        || null;
    if (status     !== undefined) updates.status     = status;

    if (imageFile) {
      unlinkSafe(variant.image); // remove old image
      updates.image = normPath(imageFile.path);
    }

    await variant.update(updates);
    res.status(200).json({ success: true, variant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 5. Delete a variant ───────────────────────────────────────────────────────
exports.deleteVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    unlinkSafe(variant.image);
    await variant.destroy();
    res.status(200).json({ success: true, message: 'Variant deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 6. Bulk replace variants for a product ───────────────────────────────────
//    Sends the full new list; controller deletes old ones and inserts fresh.
exports.bulkSetVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // variants sent as JSON string in body.variants
    let incoming = [];
    try {
      incoming = req.body.variants ? JSON.parse(req.body.variants) : [];
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid variants JSON' });
    }

    // Delete existing variants (cascade deletes images too via hook)
    const old = await ProductVariant.findAll({ where: { productId: Number(productId) } });
    old.forEach(v => unlinkSafe(v.image));
    await ProductVariant.destroy({ where: { productId: Number(productId) } });

    if (!incoming.length) {
      return res.status(200).json({ success: true, variants: [] });
    }

    const records = incoming.map(v => ({
      productId:  Number(productId),
      color:      v.color      || null,
      size:       v.size       || null,
      fabric:     v.fabric     || null,
      weight:     v.weight     || null,
      volume:     v.volume     || null,
      nos:        v.nos        || null,
      mrp:        v.mrp        ? parseFloat(v.mrp)        : null,
      salesPrice: v.salesPrice ? parseFloat(v.salesPrice) : null,
      stock:      v.stock      ? parseInt(v.stock, 10)    : 0,
      sku:        v.sku        || null,
      image:      v.image      || null,
    }));

    const variants = await ProductVariant.bulkCreate(records, { individualHooks: true });
    res.status(201).json({ success: true, variants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};