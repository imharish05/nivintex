const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Offerbanner = sequelize.define('Offerbanner', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title:      { type: DataTypes.STRING,  allowNull: false },
  subtitle:   { type: DataTypes.STRING,  allowNull: true },
  offerLabel: { type: DataTypes.STRING,  allowNull: true },
  btnText:    { type: DataTypes.STRING,  allowNull: true, defaultValue: 'Shop now' },
  btnLink:    { type: DataTypes.STRING,  allowNull: true },
  image:      { type: DataTypes.STRING,  allowNull: true },
  status:     { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
}, {
  tableName: 'offer_banners',
  timestamps: true,
});

module.exports = Offerbanner;