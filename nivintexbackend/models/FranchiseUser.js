const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FranchiseUser = sequelize.define('FranchiseUser', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    franchise_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    franchise_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'franchise_users',  
    timestamps: true,
    underscored: true
});

module.exports = FranchiseUser;
