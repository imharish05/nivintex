const bcrypt = require('bcryptjs');
const UserLogin = require('../models/UserLogin');
const { sendOtpEmail } = require('../services/emailService');
const { setOtp, getOtp, clearOtp } = require('../utils/otpStore');

// Generate random 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const cleanEmail = (email) => (email || '').toString().trim().toLowerCase();

// Request password reset - sends OTP to email
exports.requestPasswordReset = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    // Check if user exists
    const user = await UserLogin.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No Fashion Aura account found with this email.' });
    }

    // Generate and store 6-digit OTP
    const otp = generateOtp();
    setOtp(email, otp);

    // Send OTP via email using Nodemailer
    await sendOtpEmail(email, otp, user.username || user.name);

    res.status(200).json({
      success: true,
      message: 'A 6-digit verification PIN has been sent to your email.'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    if (error.code === 'EAUTH' || (error.message && error.message.includes('Invalid login'))) {
      return res.status(500).json({ message: 'Email configuration error. Please contact store support.' });
    }
    res.status(500).json({ message: error.message || 'Server error while sending OTP. Please try again.' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const otp = (req.body.otp || '').toString().trim();

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP are required.' });
    }

    const storedOtpData = getOtp(email);

    if (!storedOtpData) {
      return res.status(400).json({ message: 'Your verification code has expired or does not exist. Please request a new code.' });
    }

    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code. Please check your email and try again.' });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code verified successfully.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error while verifying code.' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const otp = (req.body.otp || '').toString().trim();
    const { newPassword } = req.body;

    console.log('📝 Reset password request for:', email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const storedOtpData = getOtp(email);

    if (!storedOtpData) {
      return res.status(400).json({ message: 'Your verification code has expired. Please request a new one.' });
    }

    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in UserLogin table
    const [updatedCount] = await UserLogin.update(
      { password: hashedPassword },
      { where: { email } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    console.log('✅ Password updated successfully for:', email);

    // Clear OTP after successful reset
    clearOtp(email);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! Please sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};