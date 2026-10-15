const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./Product');

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  billingVariantId: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'billing_variant_id',
  },
  billingData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'billing_data',
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Variant attributes — all optional; use whichever apply
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fabric: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  weight: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  volume: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nos: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Per-variant pricing (overrides product price when set)
  mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  salesPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  // Per-variant stock
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Per-variant image (optional)
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('images');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    set(val) {
      this.setDataValue('images', JSON.stringify(val || []));
    }
  },
  // SKU for this specific combination
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  variant_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  wholesale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  wholesale_discount_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  wholesale_discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  wholesale_final_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  retail_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  retail_discount_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  retail_discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  retail_final_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  franchise_price_final: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'franchise_price_final',
  },
  selling_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  hooks: {
    beforeCreate: (v) => { v.status = v.stock > 0 ? 'Active' : 'Inactive'; },
    beforeUpdate: (v) => { v.status = v.stock > 0 ? 'Active' : 'Inactive'; },
  },
});

module.exports = ProductVariant;
