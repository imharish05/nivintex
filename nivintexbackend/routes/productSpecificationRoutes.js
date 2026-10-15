const express = require('express');
const Product = require('../models/Product');
const ProductSpecification = require('../models/ProductSpecification');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/product/:productId', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, { attributes: ['id'] });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const specifications = await ProductSpecification.findAll({
      where: { productId: product.id },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'productId', 'label', 'value', 'sortOrder'],
    });
    return res.json({ success: true, specifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not load product specifications.' });
  }
});

router.put('/product/:productId', requireAdmin, async (req, res) => {
  const entries = req.body?.specifications;
  if (!Array.isArray(entries)) return res.status(400).json({ success: false, message: 'Specifications must be a list.' });
  const normalized = entries.map((item, index) => ({
    label: String(item?.label || '').trim(),
    value: String(item?.value || '').trim(),
    sortOrder: index,
  }));
  if (normalized.length > 60) return res.status(400).json({ success: false, message: 'A product can have up to 60 specifications.' });
  if (normalized.some(item => !item.label || !item.value || item.label.length > 120 || item.value.length > 4000)) {
    return res.status(400).json({ success: false, message: 'Each specification needs a label and value (label up to 120 characters, value up to 4000).' });
  }
  try {
    const product = await Product.findByPk(req.params.productId, { attributes: ['id'] });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    await ProductSpecification.sequelize.transaction(async transaction => {
      await ProductSpecification.destroy({ where: { productId: product.id }, transaction });
      if (normalized.length) {
        await ProductSpecification.bulkCreate(normalized.map(item => ({ ...item, productId: product.id })), { transaction });
      }
    });
    const specifications = await ProductSpecification.findAll({ where: { productId: product.id }, order: [['sortOrder', 'ASC'], ['id', 'ASC']], attributes: ['id', 'productId', 'label', 'value', 'sortOrder'] });
    return res.json({ success: true, specifications });
  } catch (error) {
    console.error('Save product specifications failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not save product specifications.' });
  }
});

module.exports = router;
