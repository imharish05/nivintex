const express = require('express');
const { Op } = require('sequelize');
const SizeChart = require('../models/SizeChart');
const ProductSizeChart = require('../models/ProductSizeChart');
const Product = require('../models/Product');
const Category = require('../models/Category');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
const parseJSONList = value => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; }
    catch (_) { return []; }
  }
  return [];
};
const chartResponse = chart => {
  if (!chart) return null;
  const data = chart.toJSON();
  data.columns = parseJSONList(data.columns);
  data.rows = parseJSONList(data.rows);
  return data;
};
const validateChart = chart => {
  const title = String(chart?.title || '').trim();
  const unit = String(chart?.unit || 'IN').toUpperCase();
  const columns = Array.isArray(chart?.columns) ? chart.columns.map(column => ({
    key: String(column?.key || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    label: String(column?.label || '').trim(),
  })).filter(column => column.key && column.label) : [];
  const rows = Array.isArray(chart?.rows) ? chart.rows.map(row => ({
    size: String(row?.size || '').trim(),
    measurements: row?.measurements && typeof row.measurements === 'object' ? row.measurements : {},
  })).filter(row => row.size) : [];
  if (!title || title.length > 140 || !['IN', 'CM'].includes(unit) || columns.length < 1 || columns.length > 12 || rows.length < 1 || rows.length > 40) return null;
  if (new Set(columns.map(column => column.key)).size !== columns.length) return null;
  return { title, unit, columns, rows };
};

router.get('/product/:productId', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, { attributes: ['id', 'categoryId'] });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const assignment = await ProductSizeChart.findByPk(product.id);
    let chart = assignment ? await SizeChart.findByPk(assignment.sizeChartId) : null;
    if (!chart) {
      const category = product.categoryId ? await Category.findByPk(product.categoryId, { attributes: ['billingCategoryId'] }) : null;
      const categoryBillingId = category?.billingCategoryId || null;
      if (categoryBillingId) chart = await SizeChart.findOne({ where: { categoryBillingId } });
    }
    if (!chart) chart = await SizeChart.findOne({ where: { isDefault: true } });
    return res.json({ success: true, chart: chartResponse(chart) });
  } catch (error) {
    console.error('Load product size chart failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load this product’s size chart.' });
  }
});

router.get('/', requireAdmin, async (_req, res) => {
  const charts = await SizeChart.findAll({ order: [['isDefault', 'DESC'], ['title', 'ASC']] });
  return res.json({ success: true, charts });
});

router.post('/', requireAdmin, async (req, res) => {
  const chart = validateChart(req.body);
  if (!chart) return res.status(400).json({ success: false, message: 'Add a title, at least one measurement column, and one size row.' });
  try {
    const categoryBillingId = req.body.categoryBillingId ? String(req.body.categoryBillingId) : null;
    if (categoryBillingId && !(await Category.findOne({ where: { billingCategoryId: categoryBillingId } }))) return res.status(400).json({ success: false, message: 'Choose a valid category.' });
    if (categoryBillingId && await SizeChart.findOne({ where: { categoryBillingId } })) return res.status(409).json({ success: false, message: 'A category chart already exists. Edit it, or leave this chart unassigned to a category and assign it to products individually.' });
    if (req.body.isDefault) await SizeChart.update({ isDefault: false }, { where: { isDefault: true } });
    const saved = await SizeChart.create({ ...chart, categoryBillingId, isDefault: Boolean(req.body.isDefault) });
    return res.status(201).json({ success: true, chart: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not create size chart.' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const chart = validateChart(req.body);
  if (!chart) return res.status(400).json({ success: false, message: 'Add a title, at least one measurement column, and one size row.' });
  try {
    const existing = await SizeChart.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Size chart not found.' });
    const categoryBillingId = req.body.categoryBillingId ? String(req.body.categoryBillingId) : null;
    if (categoryBillingId && !(await Category.findOne({ where: { billingCategoryId: categoryBillingId } }))) return res.status(400).json({ success: false, message: 'Choose a valid category.' });
    if (categoryBillingId && await SizeChart.findOne({ where: { categoryBillingId, id: { [Op.ne]: existing.id } } })) return res.status(409).json({ success: false, message: 'A category chart already exists. Edit that chart, or assign this chart to products individually.' });
    const isDefault = Boolean(req.body.isDefault);
    if (existing.isDefault && !isDefault) return res.status(400).json({ success: false, message: 'The store must keep a default chart. Make another chart the default first.' });
    if (isDefault) await SizeChart.update({ isDefault: false }, { where: { isDefault: true, id: { [Op.ne]: existing.id } } });
    await existing.update({ ...chart, categoryBillingId, isDefault });
    return res.json({ success: true, chart: existing });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not update size chart.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const chart = await SizeChart.findByPk(req.params.id);
    if (!chart) return res.status(404).json({ success: false, message: 'Size chart not found.' });
    if (chart.isDefault) return res.status(400).json({ success: false, message: 'Choose another default chart before deleting this one.' });
    await ProductSizeChart.destroy({ where: { sizeChartId: chart.id } });
    await chart.destroy();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not delete size chart.' });
  }
});

router.get('/assignment/:productId', requireAdmin, async (req, res) => {
  const assignment = await ProductSizeChart.findByPk(req.params.productId);
  return res.json({ success: true, sizeChartId: assignment?.sizeChartId || null });
});

router.put('/assignment/:productId', requireAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.productId, { attributes: ['id'] });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  const sizeChartId = req.body?.sizeChartId ? Number(req.body.sizeChartId) : null;
  if (sizeChartId && !(await SizeChart.findByPk(sizeChartId))) return res.status(400).json({ success: false, message: 'Choose a valid size chart.' });
  if (!sizeChartId) await ProductSizeChart.destroy({ where: { productId: product.id } });
  else await ProductSizeChart.upsert({ productId: product.id, sizeChartId });
  return res.json({ success: true, sizeChartId });
});

module.exports = router;
