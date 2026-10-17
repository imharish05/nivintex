// In-memory OTP store
const otpStore = {};

const cleanKey = (email) => (email || '').toString().trim().toLowerCase();

const setOtp = (email, otp) => {
  const key = cleanKey(email);
  otpStore[key] = {
    otp: otp.toString().trim(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    createdAt: Date.now()
  };
  console.log(`✅ OTP stored for ${key}: ${otp} (valid 15m)`);
};

const getOtp = (email) => {
  const key = cleanKey(email);
  const data = otpStore[key];
  if (!data) {
    console.log(`❌ No OTP found for ${key}`);
    return null;
  }
  
  if (Date.now() > data.expiresAt) {
    console.log(`⏰ OTP expired for ${key}`);
    delete otpStore[key];
    return null;
  }
  
  console.log(`✅ OTP found for ${key}, expires in ${Math.round((data.expiresAt - Date.now())/1000)}s`);
  return data;
};

const clearOtp = (email) => {
  const key = cleanKey(email);
  delete otpStore[key];
  console.log(`🗑️ OTP cleared for ${key}`);
};

module.exports = { setOtp, getOtp, clearOtp };