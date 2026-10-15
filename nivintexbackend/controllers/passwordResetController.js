const bcrypt = require('bcryptjs');
const UserLogin = require('../models/UserLogin');
const { sendOtpEmail } = require('../services/emailService');   // ⚠️ path fixed: services, not utils
const { setOtp, getOtp, clearOtp } = require('../utils/otpStore');

// Generate random 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset - sends OTP to email
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await UserLogin.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate and store OTP
    const otp = generateOtp();
    setOtp(email, otp);

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Request password reset error:', error);
    if (error.code === 'EAUTH' || (error.message && error.message.includes('Invalid login'))) {
      return res.status(500).json({ message: 'Email Config Error: Your Gmail App Password has expired or is invalid. Please update your backend .env file.' });
    }
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedOtpData = getOtp(email);

    if (!storedOtpData) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log('📝 Reset password request for:', email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const storedOtpData = getOtp(email);

    if (!storedOtpData) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in UserLogin table
    const [updatedCount] = await UserLogin.update(
      { password: hashedPassword },
      { where: { email } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Password updated successfully for:', email);

    // Clear OTP after successful reset
    clearOtp(email);

    res.status(200).json({
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};