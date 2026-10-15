const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Franchise = sequelize.define('Franchise', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    billingFranchiseId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'billing_franchise_id'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    owner_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gst: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    state_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pincode_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pincode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    area_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Active'
    }
}, {
    tableName: 'franchises',  
    timestamps: true,
    underscored: true
});

module.exports = Franchise;
