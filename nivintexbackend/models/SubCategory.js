const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubCategory = sequelize.define('SubCategory', {
    billingSubcategoryId: { type: DataTypes.STRING(64), allowNull: true, field: 'billing_subcategory_id' },
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    image: { type: DataTypes.STRING, allowNull: true },
    categoryId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        field: 'category_id'
    },
    status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' }
}, {
    tableName: 'subcategories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = SubCategory;
