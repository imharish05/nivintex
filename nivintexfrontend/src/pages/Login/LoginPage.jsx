import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { validateEmail, validatePassword } from '../../utils/formValidation';
import AuthLayout, { AUTH_COLORS, AUTH_FONTS, AuthField, AuthIcon } from '../../components/AuthLayout';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useShop();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateField = (key, value) => {
    if (key === 'email') return validateEmail(value);
    if (key === 'password') return validatePassword(value, { minLength: 1 });
    return '';
  };

  const set = (key) => (e) => {
    const val = e.target.value;
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
    const nextErrors = {
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    };
    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    const cleanEmail = form.email.trim();
    setLoading(true);
    try {
      await login(cleanEmail, form.password, true);
      const rawRedirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      const target = rawRedirect ? rawRedirect.replace(/^#/, '/') : '/home';
      const safeTarget = target.startsWith('/') && target !== '/login' && target !== '/register' ? target : '/home';
      navigate(safeTarget, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      mode="login"
      eyebrow="Member Sign In"
      title="Welcome Back"
      subtitle="Sign in to view your orders, saved wishlist, and express checkout."
      error={error}
      footerContent={
        <p className="fa-auth-switch-text">
          New to Fashion Aura?{' '}
          <Link
            to="/register"
            state={{ authSwitchFrom: 'login' }}
            className="fa-auth-inline-link"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <style>{`
        .fa-login-options {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin: -4px 0 22px;
        }

        .fa-login-forgot {
          display: inline-flex;
          align-items: center;
          min-height: 36px;
          font-family: ${AUTH_FONTS.sub};
          font-size: 12.5px;
          font-weight: 600;
          color: ${AUTH_COLORS.goldText};
          text-decoration: none;
          border-radius: 6px;
          padding: 0 4px;
          transition: color 0.2s ease;
        }

        .fa-login-forgot:hover {
          color: ${AUTH_COLORS.brand};
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .fa-login-forgot:focus-visible {
          outline: 2px solid ${AUTH_COLORS.brand};
          outline-offset: 2px;
        }
      `}</style>

      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          id="login-email"
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
          id="login-password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon="lock"
          value={form.password}
          onChange={set('password')}
          onBlur={handleBlur('password')}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        <div className="fa-login-options">
          <Link to="/forgot-password" className="fa-login-forgot">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="fa-auth-submit-btn"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <AuthIcon name="spinner" size={16} />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
