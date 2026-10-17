import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';


import { useNavigate } from 'react-router-dom';

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
    color: C.muted, marginBottom: '36px',
    letterSpacing: '2px', fontFamily: F.sub,
    textTransform: 'uppercase',
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
  inputNoIcon: (focused) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 2px', fontSize: '16px',
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
  termsRow: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    fontSize: '11px', fontWeight: 300,
    color: C.muted, marginBottom: '24px',
    lineHeight: 1.6, cursor: 'pointer',
    fontFamily: F.sub, letterSpacing: '0.5px',
  },
  termsLink: { color: C.accent, textDecoration: 'none' },
  submitBtn: (loading) => ({
    width: '100%', height: '46px',
    background: loading ? '#9B8060' : C.brand,
    color: '#fff', border: 'none', borderRadius: 8,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '4px', textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginBottom: '28px', fontFamily: F.main,
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

const Field = ({ label, type = 'text', placeholder, icon, value, onChange, noIcon }) => {

  const [focused, setFocused] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={styles.fieldWrap}>
      {label && <label style={styles.label}>{label}</label>}
      <input
        type={isPassword && showPw ? 'text' : type}
        placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={noIcon ? styles.inputNoIcon(focused) : styles.input(focused)}
        autoComplete={isPassword ? 'new-password' : type === 'email' ? 'email' : 'off'}
      />
      {!noIcon && (
        <span style={styles.fieldIcon} onClick={() => isPassword && setShowPw(p => !p)}>
          <i className={isPassword
            ? (showPw ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye')
            : `fa-solid ${icon}`}
          />
        </span>
      )}
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useShop();
  const [form,    setForm]    = useState({ username: '', email: '', phone: '', password: '' });
  const [agreed,  setAgreed]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set      = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.username || !form.email || !form.password)
      { setError('Please fill in all required fields.'); return; }
    if (!agreed)
      { setError('Please accept the Terms of Service to continue.'); return; }
    if (strength < 2)
      { setError('Please choose a stronger password (min. 8 chars with letters & numbers).'); return; }

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim(),
        password: form.password,
      });
      setSuccess('Account created! Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <span style={styles.backLink} onClick={() => navigate('/home')}>
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '11px' }} /> Back to store
        </span>

        <span style={styles.logoWrap} onClick={() => navigate('/home')}>
          <span style={styles.logoAccent}>F</span>ashion aura
        </span>
        <div style={styles.dividerLine} />
        <p style={styles.subtitle}>Create your account — it's free</p>

        {error   && <div style={styles.errorBox}><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
        {success && <div style={styles.successBox}><i className="fa-solid fa-circle-check" /> {success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Username" placeholder="priya_sharma"
            icon="fa-user" value={form.username} onChange={set('username')} />

          <Field label="Email address" type="email" placeholder="you@example.com"
            icon="fa-envelope" value={form.email} onChange={set('email')} />

          <Field label="Phone number (optional)" type="tel" placeholder="+91 98765 43210"
            icon="fa-mobile-screen" value={form.phone} onChange={set('phone')} />

          {/* Password with strength meter */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              style={styles.inputNoIcon(false)}
              autoComplete="new-password"
            />
            {form.password && (
              <>
                <div style={styles.strengthBar}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={styles.strengthSegment(strength >= i, strengthColor[strength])} />
                  ))}
                </div>
                <div style={styles.strengthText(strengthColor[strength])}>
                  {strengthLabel[strength]}
                </div>
              </>
            )}
          </div>

          <label style={styles.termsRow}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ accentColor: C.accent, marginTop: '3px', flexShrink: 0 }} />
            <span>
              I agree to the{' '}
              <a href="#terms"   style={styles.termsLink} onClick={e => e.stopPropagation()}>Terms of Service</a>
              {' '}and{' '}
              <a href="#privacy" style={styles.termsLink} onClick={e => e.stopPropagation()}>Privacy Policy</a>
            </span>
          </label>

          <button type="submit" style={styles.submitBtn(loading)} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <span style={styles.switchLink} onClick={() => navigate('/login')}>Sign in</span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
