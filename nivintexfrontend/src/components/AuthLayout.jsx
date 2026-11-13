import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from './Footer';

export const AUTH_FONTS = {
  display: "'Cormorant Garamond', 'Playfair Display', serif",
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub: "'Raleway', 'Josefin Sans', sans-serif",
};

export const AUTH_COLORS = {
  brand: '#0f5447',
  brandDark: '#0A332B',
  brandHover: '#145041',
  gold: '#0f5447',
  goldText: '#0f5447',
  goldSoft: '#EAF0E2',
  bg: '#EAF0E2',
  bgWarm: '#F4F0E8',
  surface: '#FFFFFF',
  inputBg: '#FAF8F4',
  border: '#EAE4D6',
  text: '#20332C',
  muted: '#52615B',
  danger: '#B91C1C',
  dangerBorder: '#FECACA',
  dangerBg: '#FEF2F2',
  success: '#15803D',
  successBorder: '#BBF7D0',
  successBg: '#F0FDF4',
};

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

export const AuthIcon = ({ name, size = 16, className = '' }) => {
  const props = { ...iconProps, width: size, height: size, className };

  switch (name) {
    case 'arrowLeft':
      return (
        <svg {...props}>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...props}>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...props}>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...props}>
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'eyeOff':
      return (
        <svg {...props}>
          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
          <path d="m2 2 20 20" />
        </svg>
      );
    case 'user':
      return (
        <svg {...props}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'userPlus':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" x2="19" y1="8" y2="14" />
          <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
      );
    case 'key':
      return (
        <svg {...props}>
          <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
          <path d="m21 2-9.6 9.6" />
          <circle cx="7.5" cy="15.5" r="5.5" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...props}>
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'checkPlain':
      return (
        <svg {...props} strokeWidth={2.3}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'spinner':
      return (
        <svg {...props} className={`fa-auth-spin ${className}`}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      );
    default:
      return null;
  }
};

export const AuthField = ({
  id,
  label,
  optionalLabel,
  type = 'text',
  placeholder,
  icon,
  value,
  onChange,
  onBlur,
  error,
  hint,
  maxLength,
  inputMode,
  autoComplete,
  rightSlot,
}) => {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="fa-auth-field">
      <div className="fa-auth-label-row">
        <label htmlFor={id} className="fa-auth-label">
          {label}
          {optionalLabel && (
            <span className="fa-auth-optional"> ({optionalLabel})</span>
          )}
        </label>
        {rightSlot}
      </div>

      <div className={`fa-auth-input-wrap${error ? ' has-error' : ''}`}>
        {icon && (
          <span className="fa-auth-input-icon" aria-hidden="true">
            <AuthIcon name={icon} size={16} />
          </span>
        )}
        <input
          id={id}
          type={isPassword && showPw ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`fa-auth-input${icon ? ' with-left-icon' : ''}${isPassword ? ' with-right-btn' : ''}`}
          autoComplete={autoComplete || (isPassword ? 'current-password' : type === 'email' ? 'email' : 'off')}
          maxLength={maxLength}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {isPassword && (
          <button
            type="button"
            className="fa-auth-eye-btn"
            onClick={() => setShowPw((prev) => !prev)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            aria-pressed={showPw}
          >
            <AuthIcon name={showPw ? 'eyeOff' : 'eye'} size={17} />
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="fa-auth-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="fa-auth-field-error" role="alert">
          <AuthIcon name="alert" size={13} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

const AuthLayout = ({
  mode,
  eyebrow,
  title,
  subtitle,
  error,
  success,
  children,
  footerContent,
  backTo = '/home',
  backLabel = 'Back to store',
}) => {
  const location = useLocation();
  const targetSlot = mode === 'register' ? 1 : 0;
  const cameFrom = location.state?.authSwitchFrom;
  const initialSlot =
    cameFrom === 'register' && mode === 'login'
      ? 1
      : cameFrom === 'login' && mode === 'register'
        ? 0
        : targetSlot;

  const [sliderSlot, setSliderSlot] = useState(initialSlot);

  useEffect(() => {
    if (initialSlot === targetSlot) {
      setSliderSlot(targetSlot);
      return undefined;
    }
    const raf = requestAnimationFrame(() => {
      setSliderSlot(targetSlot);
    });
    return () => cancelAnimationFrame(raf);
  }, [initialSlot, targetSlot]);

  return (
    <>
      <main className="fa-auth-page" aria-label={title}>
        <style>{`
          .fa-auth-page {
            flex: 1 1 auto;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: clamp(28px, 5vw, 56px) clamp(14px, 3vw, 24px) clamp(48px, 7vw, 72px);
            background:
              radial-gradient(circle at 15% 18%, rgba(201, 147, 58, 0.12) 0%, transparent 42%),
              radial-gradient(circle at 85% 82%, rgba(15, 84, 71, 0.10) 0%, transparent 45%),
              linear-gradient(180deg, #EAF0E2 0%, #F4F0E8 100%);
            font-family: ${AUTH_FONTS.sub};
            color: ${AUTH_COLORS.text};
            box-sizing: border-box;
          }

          .fa-auth-card {
            width: 100%;
            max-width: 640px;
            background: ${AUTH_COLORS.surface};
            border: 1px solid ${AUTH_COLORS.border};
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            box-shadow:
              0 22px 58px rgba(15, 54, 43, 0.10),
              0 4px 16px rgba(15, 54, 43, 0.04);
            animation: faAuthCardIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .fa-auth-crest-bar {
            height: 4px;
            width: 100%;
            background: linear-gradient(
              90deg,
              ${AUTH_COLORS.brandDark} 0%,
              ${AUTH_COLORS.brand} 50%,
              ${AUTH_COLORS.brandDark} 100%
            );
          }

          .fa-auth-card-body {
            padding: clamp(26px, 4.5vw, 44px) clamp(22px, 5vw, 56px) clamp(28px, 4.5vw, 40px);
          }

          @keyframes faAuthCardIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes faAuthSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }

          .fa-auth-spin {
            animation: faAuthSpin 0.85s linear infinite;
          }

          /* ── Top Breadcrumb / Back Row ── */
          .fa-auth-top-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 20px;
          }

          .fa-auth-back-link {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 36px;
            padding: 4px 2px;
            font-family: ${AUTH_FONTS.main};
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: ${AUTH_COLORS.muted};
            text-decoration: none;
            border-radius: 6px;
            transition: color 0.2s ease, transform 0.2s ease;
          }

          .fa-auth-back-link:hover {
            color: ${AUTH_COLORS.brand};
          }

          .fa-auth-back-link:hover svg {
            transform: translateX(-2px);
          }

          .fa-auth-back-link svg {
            transition: transform 0.2s ease;
          }

          .fa-auth-back-link:focus-visible {
            outline: 2px solid ${AUTH_COLORS.brand};
            outline-offset: 3px;
          }

          .fa-auth-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: ${AUTH_FONTS.main};
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 2.4px;
            text-transform: uppercase;
            color: ${AUTH_COLORS.goldText};
            margin: 0;
          }

          .fa-auth-eyebrow::before {
            content: '';
            width: 18px;
            height: 1px;
            background: ${AUTH_COLORS.gold};
          }

          /* ── Bespoke Atelier Morphing Mode Switcher ── */
          .fa-atelier-switch {
            position: relative;
            display: grid;
            grid-template-columns: 1fr 1fr;
            padding: 5px;
            margin-bottom: 26px;
            border-radius: 12px;
            background: linear-gradient(180deg, #F6F2E8 0%, #EFE9DA 100%);
            border: 1px solid ${AUTH_COLORS.border};
            box-shadow: inset 0 1px 3px rgba(15, 54, 43, 0.06);
          }

          .fa-atelier-glider {
            position: absolute;
            top: 5px;
            bottom: 5px;
            left: 5px;
            width: calc(50% - 5px);
            border-radius: 9px;
            background: linear-gradient(135deg, ${AUTH_COLORS.brand} 0%, ${AUTH_COLORS.brandDark} 100%);
            box-shadow:
              0 6px 18px rgba(15, 84, 71, 0.26),
              inset 0 0 0 1px rgba(242, 211, 155, 0.35);
            transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
            pointer-events: none;
            z-index: 1;
          }

          .fa-atelier-glider::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 22%;
            right: 22%;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, transparent, ${AUTH_COLORS.gold}, transparent);
          }

          .fa-atelier-option {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 10px 12px;
            min-height: 50px;
            border-radius: 9px;
            text-decoration: none;
            color: ${AUTH_COLORS.muted};
            transition: color 0.25s ease;
          }

          .fa-atelier-option:hover:not(.active) {
            color: ${AUTH_COLORS.brand};
          }

          .fa-atelier-option.active {
            color: #FFFFFF;
          }

          .fa-atelier-option:focus-visible {
            outline: 2px solid ${AUTH_COLORS.gold};
            outline-offset: -2px;
          }

          .fa-atelier-opt-icon {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(15, 84, 71, 0.08);
            color: ${AUTH_COLORS.brand};
            flex-shrink: 0;
            transition: background-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
          }

          .fa-atelier-option:hover:not(.active) .fa-atelier-opt-icon {
            transform: scale(1.06);
          }

          .fa-atelier-option.active .fa-atelier-opt-icon {
            background: rgba(201, 147, 58, 0.22);
            color: ${AUTH_COLORS.goldSoft};
          }

          .fa-atelier-opt-copy {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            line-height: 1.15;
            min-width: 0;
          }

          .fa-atelier-opt-title {
            font-family: ${AUTH_FONTS.main};
            font-size: 11.5px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .fa-atelier-opt-sub {
            font-family: ${AUTH_FONTS.sub};
            font-size: 10.5px;
            font-weight: 400;
            letter-spacing: 0.2px;
            opacity: 0.78;
            margin-top: 2px;
            white-space: nowrap;
          }

          /* ── Editorial Header ── */
          .fa-auth-header {
            text-align: center;
            margin-bottom: 24px;
          }

          .fa-auth-title {
            font-family: ${AUTH_FONTS.display};
            font-size: clamp(30px, 4vw, 38px);
            font-weight: 700;
            line-height: 1.1;
            color: ${AUTH_COLORS.brand};
            margin: 0 0 8px;
            letter-spacing: 0.01em;
          }

          .fa-auth-subtitle {
            font-family: ${AUTH_FONTS.sub};
            font-size: 13.5px;
            font-weight: 400;
            line-height: 1.55;
            color: ${AUTH_COLORS.muted};
            margin: 0 auto;
            max-width: 460px;
          }

          /* ── Alerts ── */
          .fa-auth-alert {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            border-radius: 8px;
            font-family: ${AUTH_FONTS.sub};
            font-size: 12.5px;
            font-weight: 500;
            line-height: 1.5;
            margin-bottom: 20px;
          }

          .fa-auth-alert svg {
            flex-shrink: 0;
            margin-top: 2px;
          }

          .fa-auth-alert.error {
            background: ${AUTH_COLORS.dangerBg};
            border: 1px solid ${AUTH_COLORS.dangerBorder};
            border-left: 3px solid ${AUTH_COLORS.danger};
            color: ${AUTH_COLORS.danger};
          }

          .fa-auth-alert.success {
            background: ${AUTH_COLORS.successBg};
            border: 1px solid ${AUTH_COLORS.successBorder};
            border-left: 3px solid ${AUTH_COLORS.success};
            color: ${AUTH_COLORS.success};
          }

          /* ── Form Fields ── */
          .fa-auth-field {
            margin-bottom: 18px;
          }

          .fa-auth-label-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 7px;
          }

          .fa-auth-label {
            display: block;
            font-family: ${AUTH_FONTS.main};
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: ${AUTH_COLORS.brand};
            margin: 0;
          }

          .fa-auth-optional {
            font-family: ${AUTH_FONTS.sub};
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 0.3px;
            text-transform: none;
            color: ${AUTH_COLORS.muted};
          }

          .fa-auth-input-wrap {
            position: relative;
            display: flex;
            align-items: center;
          }

          .fa-auth-input-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: ${AUTH_COLORS.muted};
            display: inline-flex;
            align-items: center;
            pointer-events: none;
            transition: color 0.2s ease;
          }

          .fa-auth-input-wrap:focus-within .fa-auth-input-icon {
            color: ${AUTH_COLORS.brand};
          }

          .fa-auth-input-wrap.has-error .fa-auth-input-icon {
            color: ${AUTH_COLORS.danger};
          }

          .fa-auth-input {
            width: 100%;
            min-height: 46px;
            padding: 11px 14px;
            font-family: ${AUTH_FONTS.sub};
            font-size: 15px;
            font-weight: 500;
            color: ${AUTH_COLORS.text};
            background: ${AUTH_COLORS.inputBg};
            border: 1px solid ${AUTH_COLORS.border};
            border-radius: 8px;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          }

          .fa-auth-input.with-left-icon {
            padding-left: 42px;
          }

          .fa-auth-input.with-right-btn {
            padding-right: 48px;
          }

          .fa-auth-input::placeholder {
            color: #828E88;
            font-weight: 400;
            font-size: 13.5px;
          }

          .fa-auth-input:hover {
            border-color: #D2C8B4;
          }

          .fa-auth-input:focus {
            background: #FFFFFF;
            border-color: ${AUTH_COLORS.brand};
            box-shadow: 0 0 0 3px rgba(15, 84, 71, 0.12);
          }

          .fa-auth-input-wrap.has-error .fa-auth-input {
            border-color: #E05252;
            background: #FFF9F9;
          }

          .fa-auth-input-wrap.has-error .fa-auth-input:focus {
            box-shadow: 0 0 0 3px rgba(224, 82, 82, 0.14);
          }

          .fa-auth-eye-btn {
            position: absolute;
            right: 2px;
            top: 50%;
            transform: translateY(-50%);
            width: 42px;
            height: 42px;
            border: none;
            background: transparent;
            color: ${AUTH_COLORS.muted};
            cursor: pointer;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s ease, background-color 0.2s ease;
          }

          .fa-auth-eye-btn:hover {
            color: ${AUTH_COLORS.brand};
            background: rgba(15, 84, 71, 0.06);
          }

          .fa-auth-eye-btn:focus-visible {
            outline: 2px solid ${AUTH_COLORS.brand};
            outline-offset: -2px;
          }

          .fa-auth-hint {
            margin: 6px 0 0;
            font-family: ${AUTH_FONTS.sub};
            font-size: 11.5px;
            color: ${AUTH_COLORS.muted};
            line-height: 1.45;
          }

          .fa-auth-field-error {
            margin: 6px 0 0;
            display: flex;
            align-items: center;
            gap: 5px;
            font-family: ${AUTH_FONTS.sub};
            font-size: 11.5px;
            font-weight: 500;
            color: ${AUTH_COLORS.danger};
            line-height: 1.4;
          }

          /* ── Submit CTA ── */
          .fa-auth-submit-btn {
            width: 100%;
            min-height: 48px;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            background: ${AUTH_COLORS.brand};
            color: #FFFFFF;
            font-family: ${AUTH_FONTS.main};
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 2.8px;
            text-transform: uppercase;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 6px 18px rgba(15, 84, 71, 0.22);
            transition: background-color 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
          }

          .fa-auth-submit-btn:hover:not(:disabled) {
            background: ${AUTH_COLORS.brandHover};
            box-shadow: 0 8px 22px rgba(15, 84, 71, 0.28);
            transform: translateY(-1px);
          }

          .fa-auth-submit-btn:active:not(:disabled) {
            transform: translateY(0);
          }

          .fa-auth-submit-btn:disabled {
            background: #7A958E;
            cursor: not-allowed;
            box-shadow: none;
          }

          .fa-auth-submit-btn:focus-visible {
            outline: 2px solid ${AUTH_COLORS.gold};
            outline-offset: 3px;
          }

          .fa-auth-footer {
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid ${AUTH_COLORS.border};
            text-align: center;
          }

          .fa-auth-switch-text {
            margin: 0 0 10px;
            font-family: ${AUTH_FONTS.sub};
            font-size: 13px;
            font-weight: 400;
            color: ${AUTH_COLORS.muted};
          }

          .fa-auth-inline-link {
            color: ${AUTH_COLORS.brand};
            font-weight: 600;
            text-decoration: none;
            border-bottom: 1px solid rgba(15, 84, 71, 0.35);
            padding-bottom: 1px;
            transition: color 0.2s ease, border-color 0.2s ease;
          }

          .fa-auth-inline-link:hover {
            color: ${AUTH_COLORS.brandHover};
            border-color: ${AUTH_COLORS.brandHover};
          }

          .fa-auth-inline-link:focus-visible {
            outline: 2px solid ${AUTH_COLORS.brand};
            outline-offset: 3px;
            border-radius: 3px;
          }

          .fa-auth-trust-note {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin: 0;
            font-family: ${AUTH_FONTS.sub};
            font-size: 11px;
            color: ${AUTH_COLORS.muted};
            letter-spacing: 0.4px;
          }

          .fa-auth-trust-note svg {
            color: ${AUTH_COLORS.brand};
          }

          @media (max-width: 479.98px) {
            .fa-auth-page {
              padding: 20px 12px 44px;
            }
            .fa-auth-card-body {
              padding: 24px 18px 24px;
            }
            .fa-auth-top-meta {
              gap: 8px;
              margin-bottom: 16px;
            }
            .fa-auth-back-link {
              font-size: 10px;
              letter-spacing: 1px;
              white-space: nowrap;
            }
            .fa-auth-eyebrow {
              font-size: 9.5px;
              letter-spacing: 1px;
              white-space: nowrap;
            }
            .fa-atelier-option {
              gap: 8px;
              padding: 9px 8px;
            }
            .fa-atelier-opt-icon {
              width: 24px;
              height: 24px;
            }
            .fa-atelier-opt-title {
              font-size: 10.5px;
              letter-spacing: 1px;
            }
            .fa-atelier-opt-sub {
              display: none;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .fa-auth-card,
            .fa-auth-spin,
            .fa-atelier-glider,
            .fa-atelier-opt-icon,
            .fa-auth-back-link svg,
            .fa-auth-submit-btn,
            .fa-auth-input {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>

        <section className="fa-auth-card">
          <div className="fa-auth-crest-bar" aria-hidden="true" />

          <div className="fa-auth-card-body">
            <div className="fa-auth-top-meta">
              <Link
                to={backTo}
                className="fa-auth-back-link"
                onClick={() => sessionStorage.removeItem('redirectAfterLogin')}
              >
                <AuthIcon name="arrowLeft" size={14} />
                <span>{backLabel}</span>
              </Link>
              <p className="fa-auth-eyebrow">{eyebrow}</p>
            </div>

            {/* <nav className="fa-atelier-switch" aria-label="Account mode">
              <span
                className="fa-atelier-glider"
                aria-hidden="true"
                style={{ transform: `translateX(${sliderSlot * 100}%)` }}
              />
              <Link
                to="/login"
                state={{ authSwitchFrom: mode }}
                className={`fa-atelier-option${mode === 'login' ? ' active' : ''}`}
                aria-current={mode === 'login' ? 'page' : undefined}
              >
                <span className="fa-atelier-opt-icon" aria-hidden="true">
                  <AuthIcon name="key" size={13} />
                </span>
                <span className="fa-atelier-opt-copy">
                  <span className="fa-atelier-opt-title">Sign In</span>
                  <span className="fa-atelier-opt-sub">Member access</span>
                </span>
              </Link>

              <Link
                to="/register"
                state={{ authSwitchFrom: mode }}
                className={`fa-atelier-option${mode === 'register' ? ' active' : ''}`}
                aria-current={mode === 'register' ? 'page' : undefined}
              >
                <span className="fa-atelier-opt-icon" aria-hidden="true">
                  <AuthIcon name="userPlus" size={13} />
                </span>
                <span className="fa-atelier-opt-copy">
                  <span className="fa-atelier-opt-title">Register</span>
                  <span className="fa-atelier-opt-sub">Join Fashion Aura</span>
                </span>
              </Link>
            </nav> */}

            <header className="fa-auth-header">
              <h1 className="fa-auth-title">{title}</h1>
              <p className="fa-auth-subtitle">{subtitle}</p>
            </header>

            {error && (
              <div className="fa-auth-alert error" role="alert">
                <AuthIcon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="fa-auth-alert success" role="status" aria-live="polite">
                <AuthIcon name="check" size={16} />
                <span>{success}</span>
              </div>
            )}

            {children}

            <footer className="fa-auth-footer">
              {footerContent}
              <p className="fa-auth-trust-note">
                <AuthIcon name="shield" size={13} />
                <span>Protected customer account · Fashion Aura</span>
              </p>
            </footer>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default AuthLayout;
