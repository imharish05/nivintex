// models/PromoBar.js
"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // same import your other models use

const PromoBar = sequelize.define(
  "PromoBar",
  {
    id: {
      type:          DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey:    true,
    },
    message: {
      type:      DataTypes.STRING(500),
      allowNull: false,
      comment:   "Main promo text, e.g. 'Pay Online & GET 10% OFF on your Purchase'",
    },
    code: {
      type:      DataTypes.STRING(50),
      allowNull: true,
      comment:   "Coupon/promo code to highlight, e.g. PREPAID. Leave null to hide.",
    },
    codeLabel: {
      type:         DataTypes.STRING(100),
      allowNull:    true,
      defaultValue: "USE CODE:",
      comment:      "Label shown before the code badge",
    },
    bgGradient: {
      type:         DataTypes.STRING(200),
      allowNull:    true,
      defaultValue: "linear-gradient(45deg, #1A1040 0%, #C9933A 100%)",
      comment:      "CSS gradient string for the bar background",
    },
    textColor: {
      type:         DataTypes.STRING(20),
      allowNull:    true,
      defaultValue: "#F8F6F2",
      comment:      "CSS colour for the bar text",
    },
    linkUrl: {
      type:      DataTypes.STRING(500),
      allowNull: true,
      comment:   "Optional URL the entire bar links to",
    },
    isActive: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true,
      comment:      "Only active bars are served to the frontend",
    },
    sortOrder: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 0,
      comment:      "Lowest value shown first when multiple bars are active",
    },
  },
  {
    tableName:  "PromoBars",
    timestamps: true, // adds createdAt / updatedAt
  }
);

module.exports = PromoBar;