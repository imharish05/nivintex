import { useNavigate } from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';
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
  otpRow: {
    display: 'flex', justifyContent: 'center',
    gap: 'clamp(6px, 1.8vw, 12px)', marginBottom: '24px',
  },
  otpInput: (isFilled, isFocused) => ({
    width: 'clamp(40px, 11vw, 52px)',
    height: 'clamp(48px, 12vw, 58px)',
    borderRadius: '8px',
    border: `1.5px solid ${isFocused ? C.brand : isFilled ? C.accent : C.border}`,
    background: '#FFFFFF',
    color: C.brand,
    fontSize: '24px',
    fontWeight: 700,
    fontFamily: F.main,
    textAlign: 'center',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused ? '0 0 0 3px rgba(15,84,71,0.1)' : 'none',
    boxSizing: 'border-box',
  }),
  submitBtn: (loading) => ({
    width: '100%', height: '46px',
    background: loading ? '#9B8060' : C.brand,
    color: '#fff', border: 'none', borderRadius: 8,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '4px', textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginBottom: '20px', fontFamily: F.main,
    transition: 'opacity 0.2s',
  }),
  resendRow: {
    textAlign: 'center', fontSize: '12px', fontWeight: 300,
    color: C.muted, marginBottom: '24px', fontFamily: F.sub,
  },
  resendLink: (active) => ({
    color: active ? C.accent : C.muted,
    fontWeight: active ? 600 : 400,
    cursor: active ? 'pointer' : 'default',
    textDecoration: active ? 'underline' : 'none',
    marginLeft: '6px',
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

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef([]);
  
  const email = (sessionStorage.getItem('resetEmail') || '').trim().toLowerCase();

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    } else {
      // Focus first input automatically
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    // Allow only numeric digit
    const digit = rawVal.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    setError('');

    // Focus last filled index or next empty
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;
    
    setResending(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      setTimeLeft(60);
      setSuccess('A new 6-digit confirmation PIN has been sent!');
    } catch (err) {
      setError(err.message || 'Failed to resend PIN.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      return setError('Please enter all 6 digits of the confirmation code.');
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/password-reset/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired confirmation PIN.');
      }
      
      sessionStorage.setItem('resetOtp', otpValue);
      setSuccess('PIN verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/reset-password');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.backLink} onClick={() => navigate('/forgot-password')}>
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '11px' }} /> Change Email
        </span>

        <span style={styles.logoWrap} onClick={() => navigate('/home')}>
          <span style={styles.logoAccent}>F</span>ashion aura
        </span>
        <div style={styles.dividerLine} />
        <p style={styles.subtitle}>Enter 6-Digit Confirmation PIN</p>

        <div style={styles.emailBadge}>
          Verification code sent to:<br />
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
          <div style={styles.otpRow} onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={e => handleChange(e, idx)}
                onKeyDown={e => handleKeyDown(e, idx)}
                onFocus={() => setFocusedIndex(idx)}
                style={styles.otpInput(Boolean(digit), focusedIndex === idx)}
                autoComplete="one-time-code"
                aria-label={`Digit ${idx + 1}`}
              />
            ))}
          </div>

          <div style={styles.resendRow}>
            Didn't receive the email?
            <span
              style={styles.resendLink(timeLeft === 0 && !resending)}
              onClick={handleResend}
              role="button"
              tabIndex={timeLeft === 0 ? 0 : -1}
            >
              {resending ? 'Resending…' : timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend PIN'}
            </span>
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn(loading)} 
            disabled={loading}
          >
            {loading ? 'Verifying PIN…' : 'Verify & Continue'}
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
