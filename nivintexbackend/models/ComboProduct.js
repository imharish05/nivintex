const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ComboProduct = sequelize.define('ComboProduct', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    comboId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

module.exports = ComboProduct;
