const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('ProductSizeChart', {
  productId: { type: DataTypes.INTEGER, primaryKey: true, field: 'product_id' },
  sizeChartId: { type: DataTypes.INTEGER, allowNull: false, field: 'size_chart_id' },
}, { tableName: 'product_size_charts', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
