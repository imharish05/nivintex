const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LiveProduct = sequelize.define('LiveProduct', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  video: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video'),
    defaultValue: 'image',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  discountPercent: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // ── Legacy plain-text link (kept for backward compat, no longer used by UI) ──
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // ── NEW: FK to products table ──────────────────────────────────────────────
  // Stores the integer ID of the linked Product row.
  // NULL means "no product linked" — the admin chose "No link" in the dropdown.
  // ON DELETE SET NULL keeps live products intact if a product is deleted.
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'live_products',
  timestamps: true,
});

module.exports = LiveProduct;


