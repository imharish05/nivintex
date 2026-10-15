// controllers/dashboardController.js
const Product  = require('../models/Product');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const ProductVariant = require('../models/ProductVariant');
const sequelize = require('../config/db');

// ─── GET /dashboard/stats ────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalProducts, totalCustomers, recentProducts] = await Promise.all([
      Product.count(),
      Customer.count(),
      Product.findAll({
        attributes: [
          'id', 'categoryId', 'productName', 'image', 'status',
          'product_code', 'hsn_code', 'barcode', 'barcode_image',
          'created_at', 'updated_at',
        ],
        order: [['created_at', 'DESC']],
        limit: 10,
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
      attributes: ['id', 'productId', 'stock', 'mrp', 'salesPrice'],
      include: [{
        model: Product,
        attributes: ['id', 'productName', 'categoryId'],
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
