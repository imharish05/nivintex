const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const Brand = require('./Brand');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    billingProductId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'billing_product_id'
    },
    franchise_price_final: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    mrpGstType: {
        type: DataTypes.STRING(40),
        allowNull: true,
        field: 'mrp_gst_type',
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'category_id'
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'name'
    },
    mrp: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'mrp_price'
    },
    salesPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'retail_price_final'
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    shippingWeightKg: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        field: 'shipping_weight_kg'
    },
    shippingLengthCm: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'shipping_length_cm'
    },
    shippingWidthCm: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'shipping_width_cm'
    },
    shippingHeightCm: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'shipping_height_cm'
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'main_image'
    },
    shortDescription: {
        type: DataTypes.STRING(300),
        allowNull: true
    },
    longDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description'
    },
    isNewArrival: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isBestSeller: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isBuyOneGetOne: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    subCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'subcategory_id'
    },
    billingSubcategoryId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'billing_subcategory_id'
    },
    brandId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    colors: {
        type: DataTypes.JSON,
        allowNull: true
    },
    sizes: {
        type: DataTypes.JSON,
        allowNull: true
    },
    fabrics: {
        type: DataTypes.JSON,
        allowNull: true
    },
    weights: {
        type: DataTypes.JSON,
        allowNull: true
    },
    volumes: {
        type: DataTypes.JSON,
        allowNull: true
    },
    nos: {
        type: DataTypes.JSON,
        allowNull: true
    },
    product_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hsn_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    barcode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    barcode_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Active'
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});



module.exports = Product;
