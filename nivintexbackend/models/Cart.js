const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cart = sequelize.define('Cart', {
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
    variantId: { type: DataTypes.INTEGER, allowNull: true },
    color: { type: DataTypes.STRING, allowNull: true },
    size: { type: DataTypes.STRING, allowNull: true },
    fabric: { type: DataTypes.STRING, allowNull: true },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    weight: {
    type: DataTypes.STRING,
    allowNull: true,
},
    shipping_weight_kg: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    shipping_length_cm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    shipping_width_cm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    shipping_height_cm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    img: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    isBuyOneGetOne: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'carts',
    timestamps: true,
});

module.exports = Cart;
