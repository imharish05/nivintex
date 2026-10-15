const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        validate: { min: 1, max: 5 },
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    verifiedPurchase: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
    // REMOVED the duplicate name, email, comment from here
}, {
    tableName: 'reviews',
    timestamps: true,
    underscored: false,
});

// Associations remain the same
const Customer = require('./Customer');
const Product = require('./Product');

Customer.hasMany(Review, { foreignKey: 'customerId', constraints: false });
Review.belongsTo(Customer, { foreignKey: 'customerId', constraints: false });

Product.hasMany(Review, { foreignKey: 'productId', constraints: false });
Review.belongsTo(Product, { foreignKey: 'productId', constraints: false });

module.exports = Review;