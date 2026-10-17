import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
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

const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#E05252', '#C9933A', '#2E9E6B', '#0f5447'];

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
    color: C.muted, marginBottom: '20px',
    letterSpacing: '2px', fontFamily: F.sub,
    textTransform: 'uppercase',
  },
  emailBadge: {
    background: '#F8F6F2', border: `1px solid ${C.border}`,
    borderRadius: '8px', padding: '10px 14px',
    textAlign: 'center', marginBottom: '28px',
    fontSize: '12px', color: '#4A4A4A', fontFamily: F.sub,
  },
  label: {
    display: 'block', fontSize: '10px', fontWeight: 400,
    color: C.accent, letterSpacing: '2.5px',
    textTransform: 'uppercase', marginBottom: '8px',
    fontFamily: F.main,
  },
  fieldWrap: { marginBottom: '20px', position: 'relative' },
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
    fontSize: '14px', color: C.muted, cursor: 'pointer',
  },
  strengthBar: {
    display: 'flex', gap: '4px', marginTop: '8px',
  },
  strengthSegment: (filled, color) => ({
    flex: 1, height: '2px',
    background: filled ? color : C.border,
    transition: 'background 0.3s',
  }),
  strengthText: (color) => ({
    fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
    color: color || C.muted, fontFamily: F.main, fontWeight: 300,
    marginTop: '6px',
  }),
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

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);
  const [focusP1, setFocusP1] = useState(false);
  const [focusP2, setFocusP2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const email = (sessionStorage.getItem('resetEmail') || '').trim().toLowerCase();
  const otp = (sessionStorage.getItem('resetOtp') || '').trim();

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter.');
    }

    setLoading(true);

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/password-reset/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetOtp');

      setSuccess('Password updated successfully! Redirecting to sign in…');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.backLink} onClick={() => navigate('/verify-otp')}>
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '11px' }} /> Back to Verification
        </span>

        <span style={styles.logoWrap} onClick={() => navigate('/home')}>
          <span style={styles.logoAccent}>F</span>ashion aura
        </span>
        <div style={styles.dividerLine} />
        <p style={styles.subtitle}>Set New Password</p>

        <div style={styles.emailBadge}>
          Updating password for account:<br />
          <strong style={{ color: C.brand, fontSize: '13px', wordBreak: 'break-all' }}>{email}</strong>
        </div>

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
          {/* New Password */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>New Password</label>
            <input
              type={showP1 ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onFocus={() => setFocusP1(true)}
              onBlur={() => setFocusP1(false)}
              style={styles.input(focusP1)}
              autoComplete="new-password"
              required
            />
            <span style={styles.fieldIcon} onClick={() => setShowP1(p => !p)}>
              <i className={showP1 ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
            </span>

            {password && (
              <>
                <div style={styles.strengthBar}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={styles.strengthSegment(strength >= i, strengthColor[strength])} />
                  ))}
                </div>
                <div style={styles.strengthText(strengthColor[strength])}>
                  {strengthLabel[strength]}
                </div>
              </>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type={showP2 ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              onFocus={() => setFocusP2(true)}
              onBlur={() => setFocusP2(false)}
              style={styles.input(focusP2)}
              autoComplete="new-password"
              required
            />
            <span style={styles.fieldIcon} onClick={() => setShowP2(p => !p)}>
              <i className={showP2 ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
            </span>
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn(loading)} 
            disabled={loading}
          >
            {loading ? 'Updating Password…' : 'Update Password'}
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
