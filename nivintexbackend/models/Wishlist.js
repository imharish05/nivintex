const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Wishlist = sequelize.define('Wishlist', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    color: { type: DataTypes.STRING, allowNull: true },
    size: { type: DataTypes.STRING, allowNull: true },
    fabric: { type: DataTypes.STRING, allowNull: true },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    img: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    weight: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    stock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 4.5,
    },
    reviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'wishlists',
    timestamps: true,
});

module.exports = Wishlist;
