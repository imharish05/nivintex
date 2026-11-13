// backend/controllers/userLoginController.js — FULL FIXED FILE
const UserLogin = require('../models/UserLogin');
const bcrypt    = require('bcryptjs');
const { Op }    = require('sequelize');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Validates and normalizes an email address (trimmed, lowercased).
 * @param {unknown} email
 * @returns {{ valid: boolean, value?: string, error?: string }}
 */
function validateEmail(email) {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates and normalizes an Indian 10-digit mobile number.
 * Strips spaces/dashes and optional leading +91 or 91 (when length > 10).
 * @param {unknown} phone
 * @param {{ required?: boolean }} [options]
 * @returns {{ valid: boolean, value: string | null, error?: string }}
 */
function validateAndNormalizePhone(phone, { required = false } = {}) {
  if (phone === undefined || phone === null || (typeof phone === 'string' && phone.trim() === '')) {
    if (required) {
      return { valid: false, value: null, error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.' };
    }
    return { valid: true, value: null };
  }

  if (typeof phone !== 'string' && typeof phone !== 'number') {
    return { valid: false, value: null, error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.' };
  }

  let cleaned = String(phone).trim().replace(/[\s-]+/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }

  if (!INDIAN_PHONE_REGEX.test(cleaned)) {
    return { valid: false, value: null, error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.' };
  }

  return { valid: true, value: cleaned };
}

/**
 * Validates username (minimum 2 characters after trimming).
 * @param {unknown} username
 * @returns {{ valid: boolean, value?: string, error?: string }}
 */
function validateUsername(username) {
  if (typeof username !== 'string' || username.trim().length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters long.' };
  }
  return { valid: true, value: username.trim() };
}

/**
 * Validates and normalizes the /register request payload.
 */
function validateRegisterInput({ username, email, password, phone } = {}) {
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) return { valid: false, error: usernameCheck.error };

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return { valid: false, error: emailCheck.error };

  if (typeof password !== 'string' || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long.' };
  }

  const phoneCheck = validateAndNormalizePhone(phone, { required: false });
  if (!phoneCheck.valid) return { valid: false, error: phoneCheck.error };

  return {
    valid: true,
    data: {
      username: usernameCheck.value,
      email: emailCheck.value,
      password,
      phone: phoneCheck.value,
    },
  };
}

/**
 * Validates and normalizes the /update-profile request payload.
 */
function validateProfileUpdateInput({ id, username, email, phone } = {}) {
  if (id === undefined || id === null || id === '' || typeof id === 'boolean') {
    return { valid: false, error: 'User ID is required.' };
  }

  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { valid: false, error: 'Valid User ID is required.' };
  }

  const updateData = {};

  if (username !== undefined) {
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) return { valid: false, error: usernameCheck.error };
    updateData.username = usernameCheck.value;
  }

  if (email !== undefined) {
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return { valid: false, error: emailCheck.error };
    updateData.email = emailCheck.value;
  }

  if (phone !== undefined) {
    const phoneCheck = validateAndNormalizePhone(phone, { required: false });
    if (!phoneCheck.valid) return { valid: false, error: phoneCheck.error };
    updateData.phone = phoneCheck.value;
  }

  if (Object.keys(updateData).length === 0) {
    return { valid: false, error: 'At least one profile field is required to update.' };
  }

  return { valid: true, numericId, updateData };
}

exports.validateEmail = validateEmail;
exports.validateAndNormalizePhone = validateAndNormalizePhone;
exports.validateUsername = validateUsername;
exports.validateRegisterInput = validateRegisterInput;
exports.validateProfileUpdateInput = validateProfileUpdateInput;

// ─────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { username, email, password, phone } = validation.data;

    const emailExists = await UserLogin.findOne({ where: { email } });
    if (emailExists) return res.status(400).json({ error: 'This email is already registered!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserLogin.create({ username, email, password: hashedPassword, phone });

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

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserLogin.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

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
    const validation = validateProfileUpdateInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { numericId, updateData } = validation;

    if (updateData.email) {
      const existing = await UserLogin.findOne({
        where: {
          id: { [Op.ne]: numericId },
          email: updateData.email
        }
      });

      if (existing) return res.status(400).json({ error: 'This email is already in use by another account.' });
    }

    await UserLogin.update(updateData, { where: { id: numericId } });

    const updatedUser = await UserLogin.findOne({
      where: { id: numericId },
      attributes: ['id', 'username', 'email', 'phone']
    });

    if (!updatedUser) return res.status(404).json({ error: 'User not found.' });

    res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'This email is already in use.' });
    }
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
