const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('SizeChart', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(140), allowNull: false },
  categoryBillingId: { type: DataTypes.STRING(64), allowNull: true, field: 'category_billing_id' },
  unit: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'IN' },
  columns: { type: DataTypes.JSON, allowNull: false },
  rows: { type: DataTypes.JSON, allowNull: false },
  isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' },
}, { tableName: 'size_charts', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
