const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

router.post('/forgot-password', passwordResetController.requestPasswordReset);
router.post('/verify-otp', passwordResetController.verifyOtp);
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;