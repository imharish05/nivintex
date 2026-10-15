import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

const BRAND = '#0f5447';
const BRAND_SOFT = 'rgba(15,84,71,0.05)';
const F = {
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

const inputStyle = {
  width: '100%',
  padding: '14px 44px',
  border: '1px solid #EAE4D6',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: F.sub,
  outline: 'none',
  color: '#1A1A1A',
  background: '#fff',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const onFocus = e => { e.target.style.borderColor = BRAND; };
const onBlur  = e => { e.target.style.borderColor = '#EAE4D6'; };

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const email = sessionStorage.getItem('resetEmail') || '';
  const otp = sessionStorage.getItem('resetOtp') || '';

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
  }, [email, otp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/password-reset/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetOtp');
      
      alert(data.message);
      navigate('/login');
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
        <h1 style={{ fontFamily: F.main, fontSize: 32, fontWeight: 800, color: '#1A1040', marginBottom: 16 }}>Reset Password</h1>
        <p style={{ fontFamily: F.sub, fontSize: 15, color: '#4A4A4A', maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
          Create a new password for your account.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, background: '#fff', padding: '40px 32px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', width: '100%', maxWidth: '440px', textAlign: 'center', marginBottom: '60px' }}>
        
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: BRAND_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 24, color: BRAND }}></i>
        </div>
        
        <h2 style={{ fontFamily: F.main, fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Create New Password</h2>
        <p style={{ fontFamily: F.sub, fontSize: 13, color: '#6B6B8A', marginBottom: 32, lineHeight: 1.5 }}>
          For account <span style={{ color: BRAND, fontWeight: 600 }}>{email}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 16, textAlign: 'left' }}>
            <i className="fa-solid fa-lock" style={{ position: 'absolute', left: 16, top: 16, color: '#8FA88A', fontSize: 14 }}></i>
            <input 
              type={showP1 ? 'text' : 'password'}
              placeholder="New Password" 
              value={password} 
              onChange={e => { setPassword(e.target.value); setError(''); }}
              style={inputStyle}
              onFocus={onFocus} onBlur={onBlur}
              required
            />
            <i className={`fa-solid ${showP1 ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowP1(!showP1)} style={{ position: 'absolute', right: 16, top: 16, color: '#8FA88A', cursor: 'pointer', fontSize: 12 }}></i>
          </div>

          <div style={{ position: 'relative', marginBottom: 24, textAlign: 'left' }}>
            <i className="fa-solid fa-lock" style={{ position: 'absolute', left: 16, top: 16, color: '#8FA88A', fontSize: 14 }}></i>
            <input 
              type={showP2 ? 'text' : 'password'}
              placeholder="Confirm New Password" 
              value={confirmPassword} 
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              style={inputStyle}
              onFocus={onFocus} onBlur={onBlur}
              required
            />
            <i className={`fa-solid ${showP2 ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowP2(!showP2)} style={{ position: 'absolute', right: 16, top: 16, color: '#8FA88A', cursor: 'pointer', fontSize: 12 }}></i>
          </div>
          
          {error && <p style={{ color: '#e74c3c', fontSize: 13, fontFamily: F.sub, margin: '-12px 0 16px', textAlign: 'left' }}>{error}</p>}
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: BRAND, color: '#fff', border: 'none', borderRadius: '8px', fontSize: 15, fontWeight: 600, fontFamily: F.main, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
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
