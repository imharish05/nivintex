const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChildCombo = sequelize.define('ChildCombo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    rootComboId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Fixed', 'Mix & Match'),
        defaultValue: 'Fixed'
    },
    shortDescription: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fullDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    comboPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active'
    }
});

module.exports = ChildCombo;
