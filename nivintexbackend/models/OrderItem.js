const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },

    product_id: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        field:     'product_id',
    },

    variant_id: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        field:     'variant_id',
    },
    billing_product_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    billing_variant_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },

    name: {
        type:      DataTypes.STRING,
        allowNull: true,
    },

    image: {
        type:      DataTypes.STRING,
        allowNull: true,
    },

    weight: {
        type:      DataTypes.STRING,
        allowNull: true,
    },
    shipping_weight_kg: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    shipping_length_cm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    shipping_width_cm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    shipping_height_cm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },

    quantity: {
        type:         DataTypes.INTEGER,
        defaultValue: 1,
    },

    price: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },

    status: {
        type: DataTypes.ENUM(
            'Pending',
            'Processing',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Returned',
        ),
        allowNull:    true,
        defaultValue: null,
    },

}, {
    tableName:  'orderitems',
    timestamps: true,
});

module.exports = OrderItem;
