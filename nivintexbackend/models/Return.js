// models/Return.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Return = sequelize.define('Return', {

  order_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  customer_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  customer_name: {
    type:      DataTypes.STRING,
    allowNull: false,
  },
  customer_email: {
    type:      DataTypes.STRING,
    allowNull: false,
  },
  customer_phone: {
    type:      DataTypes.STRING,
    allowNull: true,
  },
  reason: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'requested',    // Customer request பண்ணினார்
      'approved',     // Admin approve பண்ணினார்
      'rejected',     // Admin reject பண்ணினார்
      'picked_up',    // Courier pick up பண்ணினார்
      'received',     // Warehouse-ல receive ஆச்சு
      'refunded'      // Razorpay refund complete
    ),
    defaultValue: 'requested',
  },

  return_awb_code: {
    type:      DataTypes.STRING,
    allowNull: true,
  },
  return_courier_name: {
    type:      DataTypes.STRING,
    allowNull: true,
  },

  // ── Razorpay refund fields ─────────────
  refund_id: {
    type:      DataTypes.STRING,
    allowNull: true,
  },
  refund_amount: {
    type:      DataTypes.FLOAT,
    allowNull: true,
  },
  refund_status: {
    type:      DataTypes.STRING,
    allowNull: true,
  },

}, {
  timestamps: true,
});

module.exports = Return;