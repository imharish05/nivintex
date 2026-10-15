const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./Product');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  hooks: {
    beforeUpdate: (stock) => {
      stock.status = stock.quantity > 0 ? 'Active' : 'Inactive';
    },
    beforeCreate: (stock) => {
      stock.status = stock.quantity > 0 ? 'Active' : 'Inactive';
    }
  }
});

// Relationships
Product.hasMany(Stock, { foreignKey: 'productId', onDelete: 'CASCADE', constraints: false });
Stock.belongsTo(Product, { foreignKey: 'productId', constraints: false });

module.exports = Stock;