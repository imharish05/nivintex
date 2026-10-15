const Brand       = require('./Brand');
const Category    = require('./Category');
const Customer    = require('./Customer');
const Product     = require('./Product');
const Review      = require('./Review');
const Stock       = require('./Stock');
const User        = require('./User');
const LiveProduct = require('./LiveProduct');
const Order       = require('./Order');
const OrderItem   = require('./OrderItem');
const FranchiseUser = require('./FranchiseUser');

// ── Associations ──────────────────────────────────────────────────
// Define ALL model relationships here so every require('./models')
// gets them for free, and controllers can use `include:` safely.

// LiveProduct  ←→  Product  (productId FK)
LiveProduct.belongsTo(Product, {
  foreignKey: 'productId',
  as:         'linkedProduct',   // used in controller includes
  constraints: false,
});
Product.hasMany(LiveProduct, {
  foreignKey: 'productId',
  as:         'liveProducts',
  constraints: false,
});

module.exports = {
  Brand,
  Category,
  Customer,
  Product,
  Review,
  Stock,
  User,
  LiveProduct,   // ← NEW
  FranchiseUser, // ← NEW
};