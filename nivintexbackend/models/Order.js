const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {

  customer_id: { type: DataTypes.INTEGER, allowNull: true },

  customer_name:  { type: DataTypes.STRING, allowNull: false },
  customer_email: { type: DataTypes.STRING, allowNull: false },
  customer_phone: { type: DataTypes.STRING, allowNull: true },
  customer_phone2:{ type: DataTypes.STRING, allowNull: true },  // ← second phone

  billing_address:  { type: DataTypes.TEXT, allowNull: true },
  shipping_address: { type: DataTypes.TEXT, allowNull: true },
  order_notes:      { type: DataTypes.TEXT, allowNull: true },

  franchise_id:     { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  franchise_name:   { type: DataTypes.STRING, allowNull: true, defaultValue: null },

  subtotal:        { type: DataTypes.FLOAT, defaultValue: 0 },
  delivery_charge: { type: DataTypes.FLOAT, defaultValue: 0 },
  tax:             { type: DataTypes.FLOAT, defaultValue: 0 },
  discount:        { type: DataTypes.FLOAT, defaultValue: 0 },
  total:           { type: DataTypes.FLOAT, defaultValue: 0 },

  coupon_code:        DataTypes.STRING,
  // Keep both the local editable snapshot and the exact Billing API exchange
  // with each order for invoice sync auditing.
  billing_bill_number: { type: DataTypes.STRING, allowNull: true },
  billing_stock_location_id: { type: DataTypes.STRING, allowNull: true },
  billing_price_type: { type: DataTypes.STRING, allowNull: true },
  billing_payment_mode: { type: DataTypes.STRING, allowNull: true },
  billing_has_gst: { type: DataTypes.BOOLEAN, allowNull: true },
  billing_gst_percent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  billing_customer_id: { type: DataTypes.STRING, allowNull: true },
  billing_source: { type: DataTypes.STRING, allowNull: true },
  billing_entry_mode: { type: DataTypes.STRING, allowNull: true },
  billing_submission_action: { type: DataTypes.STRING, allowNull: true },
  billing_paid_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  billing_balance: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  billing_payload: { type: DataTypes.JSON, allowNull: true },
  billing_request_payload: { type: DataTypes.JSON, allowNull: true },
  billing_response: { type: DataTypes.JSON, allowNull: true },
  billing_sync_status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'not_configured' },
  billing_sync_error: { type: DataTypes.TEXT, allowNull: true },
  billing_stock_sync_status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'not_configured' },
  billing_stock_sync_error: { type: DataTypes.TEXT, allowNull: true },
  billing_stock_synced_at: { type: DataTypes.DATE, allowNull: true },
  payment_id:         DataTypes.STRING,
  razorpay_order_id:  DataTypes.STRING,
  razorpay_signature: DataTypes.STRING,

  payment_status: {
    type: DataTypes.ENUM('paid', 'pending', 'failed'),
    defaultValue: 'paid',
  },

  status: {
    type: DataTypes.ENUM(
      'pending',
      'processing',
      'assigned',
      'accepted',
      'packed',
      'confirmed',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'return_approved',
      'return_picked_up',
      'return_received',
      'refunded'
    ),
    defaultValue: 'pending',
  },

  awb_code:     DataTypes.STRING,
  courier_name: DataTypes.STRING,
  shiprocket_shipment_id: DataTypes.STRING,
  shiprocket_booking_error: DataTypes.TEXT,
  shiprocket_requested_courier_id: DataTypes.STRING,
  shiprocket_requested_courier_name: DataTypes.STRING,
  shiprocket_requested_rate: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  shiprocket_estimated_delivery_days: DataTypes.STRING,
  shiprocket_booking_status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'not_requested' },
  image:        DataTypes.STRING,

}, {
  timestamps: true,
});

module.exports = Order;
