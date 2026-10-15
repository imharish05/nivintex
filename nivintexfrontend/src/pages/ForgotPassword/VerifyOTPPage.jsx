import { useNavigate } from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';

const BRAND = '#0f5447';
const BRAND_SOFT = 'rgba(15,84,71,0.05)';
const F = {
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

export default function VerifyOTPPage() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(50);
  const inputRefs = useRef([]);
  
  const email = sessionStorage.getItem('resetEmail') || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    
    try {
      setTimeLeft(50);
      setError('');
      await fetch(`${process.env.REACT_APP_API_URL}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (err) {
      setError('Failed to resend OTP');
      setTimeLeft(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return setError('Please enter all 6 digits');
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/password-reset/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }
      
      sessionStorage.setItem('resetOtp', otpValue);
      navigate('/reset-password');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', background: '#FDFDFD', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55vh', background: BRAND_SOFT, zIndex: 0 }}></div>
      
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: '40px', marginBottom: '40px', padding: '0 20px' }}>
        <h4 style={{ fontFamily: F.main, fontSize: 13, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Fashion Aura</h4>
        <h1 style={{ fontFamily: F.main, fontSize: 32, fontWeight: 800, color: '#1A1040', marginBottom: 16 }}>Verify OTP</h1>
        <p style={{ fontFamily: F.sub, fontSize: 15, color: '#4A4A4A', maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
          Enter the 6-digit code sent to your email to continue.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', padding: '40px 32px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', width: '100%', maxWidth: '440px', textAlign: 'center', marginBottom: '60px' }}>
        
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: BRAND_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: 24, color: BRAND }}></i>
        </div>
        
        <h2 style={{ fontFamily: F.main, fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Enter Verification Code</h2>
        <p style={{ fontFamily: F.sub, fontSize: 13, color: '#6B6B8A', marginBottom: 32, lineHeight: 1.5 }}>
          OTP sent to <span style={{ color: BRAND, fontWeight: 600 }}>{email}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                maxLength="1"
                value={digit}
                onChange={e => handleChange(e, idx)}
                onKeyDown={e => handleKeyDown(e, idx)}
                onFocus={e => { e.target.style.borderColor = BRAND; }}
                onBlur={e => { e.target.style.borderColor = '#EAE4D6'; }}
                style={{
                  width: 48, height: 56, border: '1px solid #EAE4D6', borderRadius: 8,
                  fontSize: 24, fontWeight: 700, fontFamily: F.main, color: BRAND,
                  textAlign: 'center', outline: 'none', background: '#fff',
                  transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
              />
            ))}
          </div>
          
          <p style={{ fontSize: 13, color: '#6B6B8A', fontFamily: F.sub, marginBottom: 24 }}>
            <span style={{ cursor: timeLeft === 0 ? 'pointer' : 'default', color: timeLeft === 0 ? BRAND : '#6B6B8A', fontWeight: timeLeft === 0 ? 600 : 400, textDecoration: timeLeft === 0 ? 'underline' : 'none' }} onClick={handleResend}>
              Resend OTP
            </span>
            {timeLeft > 0 && <span> in <strong style={{ color: BRAND }}>00:{timeLeft.toString().padStart(2, '0')}</strong></span>}
          </p>

          {error && <p style={{ color: '#e74c3c', fontSize: 13, fontFamily: F.sub, margin: '-12px 0 16px' }}>{error}</p>}
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: BRAND, color: '#fff', border: 'none', borderRadius: '8px', fontSize: 15, fontWeight: 600, fontFamily: F.main, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verifying...' : 'Verify OTP'}
            {!loading && <i className="fa-regular fa-circle-check"></i>}
          </button>
        </form>
        
        <div style={{ marginTop: 24 }}>
          <a href="#login" style={{ color: BRAND, fontSize: 14, fontFamily: F.main, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-arrow-left" style={{ fontSize: 12 }}></i> Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
