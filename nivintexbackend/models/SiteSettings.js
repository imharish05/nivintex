// models/SiteSettings.js
"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SiteSettings = sequelize.define(
  "SiteSettings",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: "Setting key, e.g. 'headerBgColor', 'headerTextColor'",
    },
    value: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Setting value, e.g. '#165b4d'",
    },
    label: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Human-readable label shown in admin panel",
    },
    type: {
      type: DataTypes.ENUM("color", "text", "boolean"),
      allowNull: false,
      defaultValue: "color",
      comment: "Type of the setting for admin UI rendering",
    },
  },
  {
    tableName: "SiteSettings",
    timestamps: true,
  }
);

module.exports = SiteSettings;
