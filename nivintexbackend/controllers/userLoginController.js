// backend/controllers/userLoginController.js — FULL FIXED FILE
const UserLogin = require('../models/UserLogin');
const bcrypt    = require('bcryptjs');
const { Op }    = require('sequelize');

// ─────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    const emailExists = await UserLogin.findOne({ where: { email } });
    if (emailExists) return res.status(401).json({ error: 'This email is already registered!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserLogin.create({ username, email, password: hashedPassword, phone: phone || null });

    res.status(201).json({
      message: 'User created successfully!',
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone }
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path;
      if (field === 'username') return res.status(400).json({ error: 'This username is already taken. Please choose another!' });
      if (field === 'email')    return res.status(400).json({ error: 'This email is already registered!' });
      return res.status(400).json({ error: 'Duplicate entry. Please try different details.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await UserLogin.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'No account found with this email. Please register first.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone || null }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// Update Profile (username, email, phone)
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { id, username, email, phone } = req.body;
    if (!id) return res.status(400).json({ error: 'User ID is required.' });

    const numericId = parseInt(id, 10);

    if (username || email) {
      const conditions = [];
      if (username) conditions.push({ username });
      if (email)    conditions.push({ email });

      const existing = await UserLogin.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: numericId } },
            { [Op.or]: conditions }
          ]
        }
      });

      if (existing) return res.status(400).json({ error: 'Username or Email already taken!' });
    }

    const updateData = {};
    if (username)            updateData.username = username;
    if (email)               updateData.email    = email;
    if (phone !== undefined) updateData.phone    = phone || null;

    await UserLogin.update(updateData, { where: { id: numericId } });

    const updatedUser = await UserLogin.findOne({
      where: { id: numericId },
      attributes: ['id', 'username', 'email', 'phone']
    });

    if (!updatedUser) return res.status(404).json({ error: 'User not found.' });

    res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// Change Password
// ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;

    if (!id || !currentPassword || !newPassword)
      return res.status(400).json({ error: 'User ID, current password, and new password are all required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const user = await UserLogin.findOne({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserLogin.update({ password: hashed }, { where: { id } });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: err.message });
  }
};