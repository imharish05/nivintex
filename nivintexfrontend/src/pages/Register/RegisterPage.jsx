import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import {
  sanitizeIndianPhone,
  validateEmail,
  validateIndianPhone,
  validateName,
  validatePassword,
} from '../../utils/formValidation';
import AuthLayout, { AUTH_COLORS, AUTH_FONTS, AuthField, AuthIcon } from '../../components/AuthLayout';

const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#DC2626', '#B45309', '#15803D', '#0f5447'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useShop();
  const redirectTimerRef = useRef(null);

  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ username: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
  }, []);

  const validateField = (key, value) => {
    if (key === 'username') return validateName(value, 'Full Name');
    if (key === 'email') return validateEmail(value);
    if (key === 'phone') return validateIndianPhone(value, { required: false });
    if (key === 'password') return validatePassword(value, { minLength: 8, requireStrong: true });
    return '';
  };

  const set = (key) => (e) => {
    const raw = e.target.value;
    const val = key === 'phone' ? sanitizeIndianPhone(raw) : raw;
    setForm((f) => ({ ...f, [key]: val }));
    if (fieldErrors[key]) {
      setFieldErrors((fe) => ({ ...fe, [key]: '' }));
    }
    if (error) setError('');
  };

  const handleBlur = (key) => () => {
    if (form[key] || fieldErrors[key]) {
      setFieldErrors((fe) => ({ ...fe, [key]: validateField(key, form[key]) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const nextErrors = {
      username: validateField('username', form.username),
      email: validateField('email', form.email),
      phone: validateField('phone', form.phone),
      password: validateField('password', form.password),
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      const rawRedirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      const target = rawRedirect ? rawRedirect.replace(/^#/, '/') : '/home';
      const safeTarget = target.startsWith('/') && target !== '/login' && target !== '/register' ? target : '/home';
      setSuccess(
        safeTarget === '/checkout'
          ? 'Account created! Redirecting to checkout…'
          : 'Account created! Taking you to the store…'
      );
      redirectTimerRef.current = setTimeout(() => {
        navigate(safeTarget, { replace: true });
      }, 900);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  return (
    <AuthLayout
      mode="register"
      eyebrow="New Member"
      title="Create Account"
      subtitle="Join Fashion Aura for faster checkout, saved wishlists, and effortless order tracking."
      error={error}
      success={success}
      footerContent={
        <p className="fa-auth-switch-text">
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ authSwitchFrom: 'register' }}
            className="fa-auth-inline-link"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <style>{`
        .fa-reg-strength {
          margin: -8px 0 20px;
        }

        .fa-reg-strength-bars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 6px;
        }

        .fa-reg-strength-seg {
          height: 4px;
          border-radius: 999px;
          background: ${AUTH_COLORS.border};
          transition: background-color 0.25s ease;
        }

        .fa-reg-strength-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-family: ${AUTH_FONTS.sub};
          font-size: 11.5px;
          color: ${AUTH_COLORS.muted};
        }

        .fa-reg-strength-label {
          font-family: ${AUTH_FONTS.main};
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        @media (prefers-reduced-motion: reduce) {
          .fa-reg-strength-seg {
            transition: none !important;
          }
        }
      `}</style>

      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          id="register-username"
          label="Full Name"
          placeholder="Your full name"
          icon="user"
          value={form.username}
          onChange={set('username')}
          onBlur={handleBlur('username')}
          error={fieldErrors.username}
          autoComplete="name"
        />

        <AuthField
          id="register-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon="mail"
          value={form.email}
          onChange={set('email')}
          onBlur={handleBlur('email')}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <AuthField
          id="register-phone"
          label="Phone number"
          optionalLabel="optional"
          type="tel"
          placeholder="10-digit mobile number"
          icon="phone"
          value={form.phone}
          onChange={set('phone')}
          onBlur={handleBlur('phone')}
          error={fieldErrors.phone}
          maxLength={10}
          inputMode="numeric"
          autoComplete="tel"
        />

        <AuthField
          id="register-password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          icon="lock"
          value={form.password}
          onChange={set('password')}
          onBlur={handleBlur('password')}
          error={fieldErrors.password}
          hint={!form.password ? 'Use at least 8 characters including letters and numbers.' : undefined}
          autoComplete="new-password"
        />


        <button
          type="submit"
          className="fa-auth-submit-btn"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <AuthIcon name="spinner" size={16} />
              <span>Creating account…</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
