// backend/routes/userloginRoutes.js — FULL FIXED FILE
const express   = require('express');
const router    = express.Router();
const UserLogin = require('../models/UserLogin');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { Op }    = require('sequelize');
const {
  validateRegisterInput,
  validateProfileUpdateInput,
} = require('../controllers/userLoginController');

// ─────────────────────────────────────────────
// POST /api/user/register
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { username, email, password, phone } = validation.data;

    const existing = await UserLogin.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await UserLogin.create({ username, email, password: hashed, phone });

    res.status(201).json({
      message: 'Registered successfully',
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone }
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'This email is already registered.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/user/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserLogin.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone || null }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/user/update-profile
// Updates username (Full Name), email, and/or phone
// ─────────────────────────────────────────────
router.put('/update-profile', async (req, res) => {
  try {
    const validation = validateProfileUpdateInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { numericId, updateData } = validation;

    // Only email must be unique across accounts
    if (updateData.email) {
      const conflict = await UserLogin.findOne({
        where: {
          id: { [Op.ne]: numericId },
          email: updateData.email
        }
      });

      if (conflict) {
        return res.status(400).json({ error: 'This email is already in use by another account.' });
      }
    }

    await UserLogin.update(updateData, { where: { id: numericId } });

    const updatedUser = await UserLogin.findOne({
      where: { id: numericId },
      attributes: ['id', 'username', 'email', 'phone']
    });

    if (!updatedUser) return res.status(404).json({ error: 'User not found.' });

    res.json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'This email is already registered to another account.' });
    }
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/user/change-password
// Verifies current password, then sets new one
// ─────────────────────────────────────────────
router.put('/change-password', async (req, res) => {
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
});

// ─────────────────────────────────────────────
// GET /api/user
// All users — for admin panel & dashboard count
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const users = await UserLogin.findAll({
      attributes: ['id', 'username', 'email', 'phone', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
