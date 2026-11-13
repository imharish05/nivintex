import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { validatePassword } from '../../utils/formValidation';
import AuthLayout, { AUTH_COLORS, AUTH_FONTS, AuthField } from '../../components/AuthLayout';

const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const strengthMeta = [
  { label: '', color: '#EAE4D6' },
  { label: 'Weak', color: '#B91C1C' },
  { label: 'Fair', color: '#D97706' },
  { label: 'Good', color: '#059669' },
  { label: 'Strong', color: '#0f5447' },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const email = (sessionStorage.getItem('resetEmail') || '').trim().toLowerCase();
  const otp = (sessionStorage.getItem('resetOtp') || '').trim();

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, otp, navigate]);

  const strength = getStrength(password);

  const validateConfirm = (pw, confirm) => {
    if (!confirm) return 'Please confirm your new password.';
    if (pw !== confirm) return 'Passwords do not match. Please re-enter.';
    return '';
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (fieldErrors.password) setFieldErrors((fe) => ({ ...fe, password: '' }));
    if (fieldErrors.confirmPassword && confirmPassword) {
      setFieldErrors((fe) => ({ ...fe, confirmPassword: validateConfirm(val, confirmPassword) }));
    }
    if (error) setError('');
  };

  const handleConfirmChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (fieldErrors.confirmPassword) setFieldErrors((fe) => ({ ...fe, confirmPassword: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const nextErrors = {
      password: validatePassword(password, { minLength: 8 }),
      confirmPassword: validateConfirm(password, confirmPassword),
    };
    setFieldErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirmPassword) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/password-reset/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetOtp');

      setSuccess('Password updated successfully! Redirecting to sign in…');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1400);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      mode="reset-password"
      eyebrow="Account Security"
      title="Set New Password"
      subtitle="Create a new, strong password with at least 8 characters to secure your Fashion Aura account."
      backTo="/verify-otp"
      backLabel="Back to Verification"
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
        .fa-strength-wrap {
          margin: -10px 0 18px;
        }
        .fa-strength-bars {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
        }
        .fa-strength-bar {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #EAE4D6;
          transition: background-color 0.25s ease;
        }
        .fa-strength-text {
          font-family: ${AUTH_FONTS.sub};
          font-size: 11px;
          color: ${AUTH_COLORS.muted};
          display: flex;
          justify-content: space-between;
        }
      `}</style>

      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          id="reset-password"
          label="New Password"
          type="password"
          placeholder="At least 8 characters"
          icon="lock"
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => {
            if (password || fieldErrors.password) {
              setFieldErrors((fe) => ({
                ...fe,
                password: validatePassword(password, { minLength: 8 }),
              }));
            }
          }}
          error={fieldErrors.password}
          autoComplete="new-password"
        />

        {password.length > 0 && (
          <div className="fa-strength-wrap">
            <div className="fa-strength-bars">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="fa-strength-bar"
                  style={{
                    backgroundColor:
                      step <= strength
                        ? strengthMeta[strength]?.color
                        : '#EAE4D6',
                  }}
                />
              ))}
            </div>
            <div className="fa-strength-text">
              <span>Password strength:</span>
              <strong style={{ color: strengthMeta[strength]?.color }}>
                {strengthMeta[strength]?.label}
              </strong>
            </div>
          </div>
        )}

        <AuthField
          id="reset-confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your new password"
          icon="lock"
          value={confirmPassword}
          onChange={handleConfirmChange}
          onBlur={() => {
            if (confirmPassword || fieldErrors.confirmPassword) {
              setFieldErrors((fe) => ({
                ...fe,
                confirmPassword: validateConfirm(password, confirmPassword),
              }));
            }
          }}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="fa-auth-submit-btn"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
              Updating Password…
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
