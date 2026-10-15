const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InstagramPost = sequelize.define('InstagramPost', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true,   // no longer required
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Stores path for both images and videos
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // 'image' | 'video'  — saved automatically by the controller
  mediaType: {
    type: DataTypes.ENUM('image', 'video'),
    defaultValue: 'image',
  },
  postUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  tableName: 'instagram_posts',
  timestamps: true,
});

module.exports = InstagramPost;