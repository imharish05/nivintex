const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductSpecification = sequelize.define('ProductSpecification', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
  label: { type: DataTypes.STRING(120), allowNull: false },
  value: { type: DataTypes.TEXT, allowNull: false },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
}, {
  tableName: 'product_specifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProductSpecification;
