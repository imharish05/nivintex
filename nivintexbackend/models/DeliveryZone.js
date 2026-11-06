const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeliveryZone = sequelize.define('DeliveryZone', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  state_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 120.00,
  },
  per_kg_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 35.00,
  },
  base_weight_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1.00,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'delivery_zones',
  timestamps: true,
});

module.exports = DeliveryZone;
