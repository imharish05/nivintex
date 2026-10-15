// models/ProductImage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product   = require('./Product');

const ProductImage = sequelize.define('ProductImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'ProductImages',
    timestamps: true,
});

module.exports = ProductImage;