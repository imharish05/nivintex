import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

const BRAND = '#0f5447';
const BRAND_SOFT = 'rgba(15,84,71,0.05)';
const F = {
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px 14px 44px',
  border: '1px solid #EAE4D6',
  borderRadius: '8px',
  fontSize: '16px',
  fontFamily: F.sub,
  outline: 'none',
  color: '#1A1A1A',
  background: '#fff',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const onFocus = e => { e.target.style.borderColor = BRAND; };
const onBlur  = e => { e.target.style.borderColor = '#EAE4D6'; };

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      sessionStorage.setItem('resetEmail', email);
      navigate('/verify-otp');
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
        <h1 style={{ fontFamily: F.main, fontSize: 32, fontWeight: 800, color: '#1A1040', marginBottom: 16 }}>Forgot Password</h1>
        <p style={{ fontFamily: F.sub, fontSize: 15, color: '#4A4A4A', maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
          Enter your registered email and we'll send you an OTP to reset your password.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', padding: '36px clamp(16px, 5vw, 32px)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', width: 'calc(100% - 32px)', maxWidth: '440px', textAlign: 'center', marginBottom: '60px' }}>
        
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: BRAND_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <i className="fa-regular fa-envelope" style={{ fontSize: 24, color: BRAND }}></i>
        </div>
        
        <h2 style={{ fontFamily: F.main, fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Reset Your Password</h2>
        <p style={{ fontFamily: F.sub, fontSize: 13, color: '#6B6B8A', marginBottom: 32, lineHeight: 1.5 }}>
          A 6-digit OTP will be sent to your email.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 24, textAlign: 'left' }}>
            <i className="fa-regular fa-envelope" style={{ position: 'absolute', left: 16, top: 16, color: '#8FA88A', fontSize: 14 }}></i>
            <input 
              type="email" 
              placeholder="Registered Email Address" 
              value={email} 
              onChange={e => { setEmail(e.target.value); setError(''); }}
              style={inputStyle}
              onFocus={onFocus} onBlur={onBlur}
              required
            />
          </div>
          
          {error && <p style={{ color: '#e74c3c', fontSize: 13, fontFamily: F.sub, margin: '-12px 0 16px', textAlign: 'left' }}>{error}</p>}
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: BRAND, color: '#fff', border: 'none', borderRadius: '8px', fontSize: 15, fontWeight: 600, fontFamily: F.main, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
            {!loading && <i className="fa-solid fa-arrow-right"></i>}
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
