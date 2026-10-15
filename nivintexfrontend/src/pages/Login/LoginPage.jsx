import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';



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
  fieldIcon: {
    position: 'absolute', right: '2px', bottom: '12px',
    fontSize: '14px', color: C.muted, cursor: 'pointer',
  },
  row: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '28px',
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '11px', fontWeight: 300, letterSpacing: '1.5px',
    color: C.muted, cursor: 'pointer', fontFamily: F.sub,
  },
  forgotLink: {
    fontSize: '11px', fontWeight: 300, letterSpacing: '1.5px',
    color: C.accent, cursor: 'pointer', fontFamily: F.sub,
  },
  submitBtn: (loading) => ({
    width: '100%', height: '46px',
    background: loading ? '#9B8060' : C.brand,
    color: '#fff', border: 'none', borderRadius: 0,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '4px', textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginBottom: '20px', fontFamily: F.main,
    transition: 'opacity 0.2s',
  }),
  orRow: {
    display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px',
  },
  orLine: { flex: 1, height: '1px', background: C.border },
  orText: {
    fontSize: '10px', color: C.muted, letterSpacing: '2px',
    textTransform: 'uppercase', fontFamily: F.main, fontWeight: 300,
  },
  googleBtn: (loading) => ({
    width: '100%', height: '44px',
    border: `1px solid ${C.border}`, borderRadius: 0,
    background: loading ? '#f9f7f3' : C.surface,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '2.5px', textTransform: 'uppercase',
    color: loading ? C.muted : C.brand,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '12px', marginBottom: '28px',
    fontFamily: F.main, transition: 'background 0.2s',
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
};

const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const Field = ({ label, type, placeholder, icon, value, onChange }) => {

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
        style={styles.input(focused)}
        autoComplete={isPassword ? 'current-password' : 'email'}
      />
      <span style={styles.fieldIcon} onClick={() => isPassword && setShowPw(p => !p)}>
        <i className={isPassword
          ? (showPw ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye')
          : `fa-regular ${icon}`}
        />
      </span>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useShop();
  const [form,          setForm]          = useState({ email: '', password: '' });
  const [remember,      setRemember]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password, remember);
      const redirect = sessionStorage.getItem('redirectAfterLogin') || '/home';
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirect);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      const redirect = sessionStorage.getItem('redirectAfterLogin') || '/home';
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirect);
    } catch (err) {
      if (err.message !== 'Google sign-in was cancelled.') {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
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
        <p style={styles.subtitle}>Welcome back — sign in to continue</p>

        {error && (
          <div style={styles.errorBox}>
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Email address" type="email" placeholder="you@example.com"
            icon="fa-envelope" value={form.email} onChange={set('email')} />
          <Field label="Password" type="password" placeholder="Enter your password"
            value={form.password} onChange={set('password')} />

          <div style={styles.row}>
            <label style={styles.checkLabel}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: C.accent }} />
              Remember me
            </label>
            <span style={styles.forgotLink}>Forgot password?</span>
          </div>

          <button type="submit" style={styles.submitBtn(loading)} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

       
        

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <span style={styles.switchLink} onClick={() => navigate('/register')}>Create one</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
