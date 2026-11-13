import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { validateEmail } from '../../utils/formValidation';
import AuthLayout, { AuthField } from '../../components/AuthLayout';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError('');
    if (error) setError('');
  };

  const handleBlur = () => {
    if (email || fieldError) {
      setFieldError(validateEmail(email));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailErr = validateEmail(email);
    setFieldError(emailErr);
    if (emailErr) return;

    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification PIN.');
      }

      sessionStorage.setItem('resetEmail', cleanEmail);
      setSuccess('6-digit PIN sent to your email! Redirecting to verification…');
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
    <AuthLayout
      mode="forgot-password"
      eyebrow="Account Recovery"
      title="Forgot Password"
      subtitle="Enter your registered email address. We'll send a 6-digit confirmation PIN to help you securely reset your password."
      backTo="/login"
      backLabel="Back to Sign In"
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
      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          id="forgot-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon="mail"
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError}
          autoComplete="email"
          hint="We will send a 6-digit verification code to this address."
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
              Sending 6-Digit PIN…
            </>
          ) : (
            'Send 6-Digit PIN'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
