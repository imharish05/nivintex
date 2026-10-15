// models/Coupon.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // your sequelize instance

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('percent', 'fixed'),
    allowNull: false,
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  min_order: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null, // null = no cap
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    defaultValue: null, // null = never expires
  },
  
description: {
    type: DataTypes.STRING(255),
    defaultValue: null,
},
}, {
  tableName: 'coupons',
  timestamps: true,
});

module.exports = Coupon;