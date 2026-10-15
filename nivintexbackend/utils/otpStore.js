// In-memory OTP store
const otpStore = {};

const setOtp = (email, otp) => {
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    createdAt: Date.now()
  };
  console.log(`✅ OTP stored for ${email}: ${otp}`);
};

const getOtp = (email) => {
  const data = otpStore[email];
  if (!data) {
    console.log(`❌ No OTP found for ${email}`);
    return null;
  }
  
  if (Date.now() > data.expiresAt) {
    console.log(`⏰ OTP expired for ${email}`);
    delete otpStore[email];
    return null;
  }
  
  console.log(`✅ OTP found for ${email}, expires in ${Math.round((data.expiresAt - Date.now())/1000)}s`);
  return data;
};

const clearOtp = (email) => {
  delete otpStore[email];
  console.log(`🗑️ OTP cleared for ${email}`);
};

module.exports = { setOtp, getOtp, clearOtp };