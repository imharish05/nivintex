// controllers/dashboardController.js
const Product  = require('../models/Product');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const ProductVariant = require('../models/ProductVariant');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

// ─── GET /dashboard/stats ────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalProducts, totalCustomers, recentProducts] = await Promise.all([
      Product.count({ where: { status: 'Active', billingProductId: { [Op.ne]: null } } }),
      Customer.count(),
      Product.findAll({
        attributes: [
          'id', 'categoryId', 'productName', 'image', 'status',
          'product_code', 'hsn_code', 'barcode', 'barcode_image',
          'created_at', 'updated_at',
        ],
        order: [['created_at', 'DESC']],
        limit: 10,
        where: { status: 'Active', billingProductId: { [Op.ne]: null } },
        include: [
          { model: Category, attributes: ['id', 'name'] },
        ],
      }),
    ]);

    return res.json({
      stats: { totalProducts, totalCustomers },
      recentProducts,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /dashboard/stock-alerts?threshold=10 ────────────────────────────────
// threshold query param lets the admin set their own low-stock limit.
// Default = 10 if not provided.
exports.getStockAlerts = async (req, res) => {
  try {
    const threshold = Math.max(1, parseInt(req.query.threshold) || 10);

    // Inventory lives on ProductVariants; the legacy Products table uses
    // `description` and `mrp_price` rather than the columns in Product.js.
    const products = await ProductVariant.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'productId', 'stock', 'mrp', 'salesPrice', 'sku', 'variant_code', 'size', 'color', 'fabric', 'billingVariantId', 'billingData'],
      include: [{
        model: Product,
        attributes: ['id', 'productName', 'categoryId', 'product_code', 'barcode', 'hsn_code'],
        where: { status: 'Active' },
        include: [{ model: Category, attributes: ['id', 'name'] }],
      }],
      order: [['stock', 'ASC']],
    });

    const lowStock   = [];
    const outOfStock = [];

    products.forEach(p => {
      const entry = {
        productId:   p.productId,
        variantId:   p.id,
        productName: p.Product?.productName || `Product ${p.productId}`,
        identifier: p.Product?.product_code || p.Product?.barcode || p.Product?.hsn_code || p.sku || p.variant_code || p.billingVariantId || null,
        identifierType: p.Product?.product_code ? 'Product code'
          : p.Product?.barcode ? 'Barcode'
            : p.Product?.hsn_code ? 'HSN'
              : p.sku ? 'SKU'
                : p.variant_code ? 'Variant code'
                  : p.billingVariantId ? 'Billing variant' : null,
        variant: [p.size, p.color, p.fabric].filter(Boolean).join(' · '),
        category:    p.Product?.Category?.name || '—',
        stock:       Number(p.stock) || 0,
        mrp:         p.mrp,
        salesPrice:  p.salesPrice,
      };

      if (entry.stock === 0) {
        outOfStock.push(entry);
      } else if (entry.stock <= threshold) {
        lowStock.push(entry);
      }
    });

    lowStock.sort((a, b) => a.stock - b.stock);

    return res.json({
      lowStockThreshold: threshold,
      lowStock,
      outOfStock,
      summary: {
        lowStockCount:   lowStock.length,
        outOfStockCount: outOfStock.length,
        totalAlerts:     lowStock.length + outOfStock.length,
      },
    });
  } catch (err) {
    console.error('getStockAlerts error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
