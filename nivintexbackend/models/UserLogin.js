// backend/models/UserLogin.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const UserLogin = sequelize.define('UserLogin', {
  id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING,  allowNull: false },
  email:    { type: DataTypes.STRING,  allowNull: false, unique: true },
  phone:    { type: DataTypes.STRING,  allowNull: true  },
  password: { type: DataTypes.STRING,  allowNull: false },
}, {
  tableName:       'userlogin',   // Sequelize will auto-create this table
  freezeTableName: true,
  timestamps:      true,
});

module.exports = UserLogin;