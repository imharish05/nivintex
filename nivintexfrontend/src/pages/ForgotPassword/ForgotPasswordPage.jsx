import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';

const F = {
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

const C = {
  brand:   '#0f5447',
  accent:  '#C9933A',
  border:  '#EAE4D6',
  surface: '#FFFFFF',
  muted:   '#6B6B8A',
  bg:      '#EAF0E2',
};

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#EAF0E2', padding: 'clamp(14px, 3vw, 24px)',
    fontFamily: F.main,
  },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderTop: `3px solid ${C.brand}`,
    padding: 'clamp(28px, 6vw, 48px) clamp(18px, 6vw, 52px)', width: '100%', maxWidth: '520px',
    boxShadow: '0 8px 40px rgba(31,92,68,0.09)',
  },
  backLink: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 300, letterSpacing: '2px',
    textTransform: 'uppercase', color: C.muted,
    cursor: 'pointer', marginBottom: '32px',
    fontFamily: F.main,
  },
  logoWrap: {
    textAlign: 'center', marginBottom: '6px',
    fontFamily: F.main, fontWeight: 300,
    fontSize: '28px', color: C.brand,
    letterSpacing: '6px', textTransform: 'uppercase',
    display: 'block', cursor: 'pointer',
  },
  logoAccent: { color: C.accent },
  dividerLine: {
    width: '28px', height: '1px', background: C.accent,
    margin: '14px auto 10px', opacity: 0.8,
  },
  subtitle: {
    textAlign: 'center', fontSize: '11px', fontWeight: 300,
    color: C.muted, marginBottom: '24px',
    letterSpacing: '2px', fontFamily: F.sub,
    textTransform: 'uppercase',
  },
  description: {
    textAlign: 'center', fontSize: '13px', fontWeight: 300,
    color: '#4A4A4A', marginBottom: '32px',
    lineHeight: '1.6', fontFamily: F.sub,
  },
  label: {
    display: 'block', fontSize: '10px', fontWeight: 400,
    color: C.accent, letterSpacing: '2.5px',
    textTransform: 'uppercase', marginBottom: '8px',
    fontFamily: F.main,
  },
  fieldWrap: { marginBottom: '26px', position: 'relative' },
  input: (focused) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 36px 11px 2px', fontSize: '16px',
    color: C.brand, background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${focused ? C.brand : C.border}`,
    borderRadius: 0, outline: 'none',
    transition: 'border-color 0.25s',
    fontFamily: F.sub, fontWeight: 300, letterSpacing: '0.5px',
  }),
  fieldIcon: {
    position: 'absolute', right: '2px', bottom: '12px',
    fontSize: '14px', color: C.muted,
  },
  submitBtn: (loading) => ({
    width: '100%', height: '46px',
    background: loading ? '#9B8060' : C.brand,
    color: '#fff', border: 'none', borderRadius: 8,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '4px', textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginBottom: '24px', fontFamily: F.main,
    transition: 'opacity 0.2s',
  }),
  switchText: {
    textAlign: 'center', fontSize: '11px', fontWeight: 300,
    letterSpacing: '1.5px', color: C.muted, fontFamily: F.sub,
  },
  switchLink: {
    color: C.accent, fontWeight: 400, cursor: 'pointer', letterSpacing: '1.5px',
  },
  errorBox: {
    border: `1px solid #FECACA`, borderLeft: `3px solid #E05252`,
    padding: '11px 14px', fontSize: '11px', fontWeight: 300,
    letterSpacing: '1.5px', color: '#B91C1C',
    marginBottom: '20px', display: 'flex', alignItems: 'center',
    gap: '10px', fontFamily: F.sub,
  },
  successBox: {
    border: `1px solid #BBF7D0`, borderLeft: `3px solid #2E9E6B`,
    padding: '11px 14px', fontSize: '11px', fontWeight: 300,
    letterSpacing: '1.5px', color: '#15803D',
    marginBottom: '20px', display: 'flex', alignItems: 'center',
    gap: '10px', fontFamily: F.sub,
  },
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setError('Please enter your registered email address.');
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification PIN.');
      }
      
      sessionStorage.setItem('resetEmail', cleanEmail);
      setSuccess('6-digit PIN sent to your email! Redirecting...');
      setTimeout(() => {
        navigate('/verify-otp');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.backLink} onClick={() => navigate('/login')}>
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '11px' }} /> Back to Sign In
        </span>

        <span style={styles.logoWrap} onClick={() => navigate('/home')}>
          <span style={styles.logoAccent}>F</span>ashion aura
        </span>
        <div style={styles.dividerLine} />
        <p style={styles.subtitle}>Forgot Password — Account Verification</p>

        <p style={styles.description}>
          Enter your registered email address below. We'll send a 6-digit confirmation PIN to help you securely reset your password.
        </p>

        {error && (
          <div style={styles.errorBox}>
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <i className="fa-solid fa-circle-check" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={styles.input(focused)}
              autoComplete="email"
              required
            />
            <span style={styles.fieldIcon}>
              <i className="fa-regular fa-envelope" />
            </span>
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn(loading)} 
            disabled={loading}
          >
            {loading ? 'Sending 6-Digit PIN…' : 'Send 6-Digit PIN'}
          </button>
        </form>

        <p style={styles.switchText}>
          Remember your password?{' '}
          <span style={styles.switchLink} onClick={() => navigate('/login')}>Sign in</span>
        </p>
      </div>
    </div>
  );
}
