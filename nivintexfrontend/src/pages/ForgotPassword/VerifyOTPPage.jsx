import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import AuthLayout, { AUTH_COLORS, AUTH_FONTS } from '../../components/AuthLayout';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef([]);

  const email = (sessionStorage.getItem('resetEmail') || '').trim().toLowerCase();

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    } else {
      inputRefs.current[0]?.focus();
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1);

    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
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

    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || '';
    }
    setOtp(nextOtp);
    setError('');

    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;

    setResending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend confirmation PIN.');
      }

      setTimeLeft(60);
      setSuccess('A fresh 6-digit confirmation PIN has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend confirmation PIN.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      return setError('Please enter all 6 digits of the confirmation PIN.');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/password-reset/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired confirmation PIN.');
      }

      sessionStorage.setItem('resetOtp', otpValue);
      setSuccess('PIN verified successfully! Redirecting…');
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
    <AuthLayout
      mode="verify-otp"
      eyebrow="Two-Factor Security"
      title="Enter 6-Digit PIN"
      subtitle={
        <>
          We've sent a 6-digit confirmation code to{' '}
          <strong style={{ color: AUTH_COLORS.brand, fontWeight: 600 }}>{email || 'your email'}</strong>
        </>
      }
      backTo="/forgot-password"
      backLabel="Change Email"
      error={error}
      success={success}
      footerContent={
        <p className="fa-auth-switch-text">
          Remember your password?{' '}
          <Link to="/login" className="fa-auth-inline-link">
            Sign in
          </Link>
        </p>
      }
    >
      <style>{`
        .fa-otp-inputs-row {
          display: flex;
          justify-content: center;
          gap: clamp(6px, 1.8vw, 12px);
          margin: 12px 0 24px;
        }
        .fa-otp-digit-box {
          width: clamp(38px, 11vw, 52px);
          height: clamp(48px, 12vw, 60px);
          border-radius: 8px;
          border: 1.5px solid ${AUTH_COLORS.border};
          background: #FFFFFF;
          color: ${AUTH_COLORS.brand};
          font-size: clamp(20px, 5vw, 24px);
          font-weight: 700;
          font-family: ${AUTH_FONTS.main};
          text-align: center;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .fa-otp-digit-box:focus {
          border-color: ${AUTH_COLORS.brand};
          box-shadow: 0 0 0 3px rgba(15, 84, 71, 0.12);
        }
        .fa-otp-digit-box.is-filled {
          border-color: ${AUTH_COLORS.brand};
          background: #F8FAF7;
        }
        .fa-otp-resend-row {
          text-align: center;
          font-size: 12.5px;
          color: ${AUTH_COLORS.muted};
          margin-bottom: 22px;
          font-family: ${AUTH_FONTS.sub};
        }
        .fa-otp-resend-btn {
          background: none;
          border: none;
          color: ${AUTH_COLORS.brand};
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          margin-left: 6px;
          font-family: ${AUTH_FONTS.sub};
          font-size: 12.5px;
        }
        .fa-otp-resend-btn:disabled {
          color: ${AUTH_COLORS.muted};
          cursor: not-allowed;
          text-decoration: none;
        }
      `}</style>

      <form onSubmit={handleSubmit} noValidate>
        <div className="fa-otp-inputs-row" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`fa-otp-digit-box${digit ? ' is-filled' : ''}`}
              aria-label={`Digit ${idx + 1}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <div className="fa-otp-resend-row">
          {timeLeft > 0 ? (
            <span>
              Resend code in <strong style={{ color: AUTH_COLORS.brand }}>{timeLeft}s</strong>
            </span>
          ) : (
            <span>
              Didn’t receive the code?
              <button
                type="button"
                className="fa-otp-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending…' : 'Resend PIN'}
              </button>
            </span>
          )}
        </div>

        <button
          type="submit"
          className="fa-auth-submit-btn"
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
              Verifying PIN…
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
