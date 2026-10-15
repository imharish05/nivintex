const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');   // ← THIS LINE WAS MISSING

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true }
    },
}, {
    tableName: 'Customers',
    freezeTableName: true,
    timestamps: true
});

module.exports = Customer;