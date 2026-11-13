import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import defaultLogo from '../../assets/img/logo2.png';
import {
  sanitizeIndianPhone,
  validateEmail,
  validateIndianPhone,
  validateName,
  validatePassword,
} from '../../utils/formValidation';

const F = {
  serif: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  main:  "'Josefin Sans', 'Montserrat', 'Century Gothic', sans-serif",
  sub:   "'Raleway', 'Josefin Sans', sans-serif",
};

const C = {
  brand:       '#0F4E42',
  brandDark:   '#0A332B',
  accent:      '#0F4E42',
  accentHov:   '#0B3A31',
  border:      '#E2E8F0',
  borderLight: 'rgba(15, 78, 66, 0.08)',
  surface:     '#FFFFFF',
  muted:       '#64748B',
  text:        '#1E293B',
  bg:          '#FAF7F2',
  success:     '#2E9E6B',
  danger:      '#E05252',
};

const STATUS_COLORS = {
  Pending:          { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
  pending:          { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
  Confirmed:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  confirmed:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  Processing:       { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  processing:       { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  Shipped:          { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  shipped:          { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  out_for_delivery: { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  Delivered:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  delivered:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  Cancelled:        { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  cancelled:        { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
};

const statusStyle = status => {
  const value = String(status || 'Processing').toLowerCase();
  if (value.includes('cancel')) return { color: '#B91C1C', bg: '#FEF2F2' };
  if (value.includes('deliver')) return { color: '#15803D', bg: '#F0FDF4' };
  if (value.includes('ship')) return { color: '#1D4ED8', bg: '#EFF6FF' };
  if (value.includes('pending')) return { color: '#475569', bg: '#F8FAFC' };
  return { color: C.brand, bg: '#EAF5F0' };
};

const labelFor = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  full = false,
  readOnly = false,
  error = '',
  inputMode,
  maxLength,
  icon,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={{ flex: full ? '1 1 100%' : '1 1 240px', marginBottom: '18px' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        color: error ? C.danger : '#334155',
        marginBottom: '8px',
        fontFamily: F.main,
      }}>
        <span>{label}</span>
      </label>

      <div style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        background: readOnly ? '#F8FAFC' : (focused ? '#FFFFFF' : '#F8FAFC'),
        border: `1.5px solid ${error ? C.danger : (focused ? C.brand : '#CBD5E1')}`,
        borderRadius: '12px',
        boxShadow: focused ? '0 0 0 4px rgba(15, 78, 66, 0.08)' : 'none',
        transition: 'all 0.2s ease',
        height: '48px',
        padding: '0 14px',
        boxSizing: 'border-box',
      }}>
        {icon && (
          <i className={icon} style={{
            color: focused ? C.brand : (readOnly ? '#94A3B8' : '#64748B'),
            fontSize: '14px',
            width: '20px',
            textAlign: 'center',
            marginRight: '10px',
            flexShrink: 0,
            transition: 'color 0.2s',
          }} />
        )}
        <input
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={e => !readOnly && onChange && onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : 0}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: readOnly ? '#64748B' : C.text,
            fontFamily: F.sub,
            fontWeight: 400,
            letterSpacing: '0.3px',
            cursor: readOnly ? 'not-allowed' : 'text',
          }}
          onFocus={() => !readOnly && setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPassword && (
          <button
            type="button"
            className="profile-pw-toggle"
            onClick={() => setShowPw(prev => !prev)}
            aria-label={showPw ? `Hide ${label}` : `Show ${label}`}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: showPw ? C.brand : '#94A3B8',
              fontSize: '14px',
              padding: '6px',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'color 0.2s',
            }}
          >
            <i className={`fa-regular ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
          </button>
        )}
      </div>

      {error && (
        <span role="alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginTop: '6px',
          fontSize: '11px',
          color: C.danger,
          fontFamily: F.sub,
          fontWeight: 500,
        }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '11px' }} /> {error}
        </span>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user, updateUser, changePassword, logout,
    cartItems, addToCart, removeFromCart, updateQty, cartCount, getCartTotals,
    wishlistItems, removeFromWishlist, wishlistCount,
    myOrders, showToast: showCommonToast
  } = useShop();

  const getTab = () => {
    const h = (location.hash || window.location.hash || '').replace('#', '').toLowerCase();
    if (['orders', 'wishlist'].includes(h)) return h;
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getTab);

  useEffect(() => {
    setActiveTab(getTab());
  }, [location.hash]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/profile#${tabId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [profile, setProfile] = useState({
    name:  user?.name || user?.username || '',
    phone: sanitizeIndianPhone(user?.phone || ''),
    email: user?.email || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const setP = (key) => (val) => {
    const nextVal = key === 'phone' ? sanitizeIndianPhone(val) : val;
    setProfile(p => ({ ...p, [key]: nextVal }));
    setProfileErrors(errs => (errs[key] ? { ...errs, [key]: '' } : errs));
  };

  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const setPwF = (key) => (val) => {
    setPw(p => ({ ...p, [key]: val }));
    setPwErrors(errs => (errs[key] ? { ...errs, [key]: '' } : errs));
  };

  useEffect(() => {
    if (user) {
      setProfile({
        name:  user.name || user.username || '',
        phone: sanitizeIndianPhone(user.phone || ''),
        email: user.email || '',
      });
      setProfileErrors({});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user.username ? user.username[0].toUpperCase() : '?');

  const showToast = (msg, isError = false) => showCommonToast(msg, isError ? 'error' : 'success');

  const handleSaveProfile = async () => {
    const errs = {};
    const nameErr = validateName(profile.name, 'Full name');
    if (nameErr) errs.name = nameErr;
    const phoneErr = validateIndianPhone(profile.phone);
    if (phoneErr) errs.phone = phoneErr;
    const emailErr = validateEmail(profile.email);
    if (emailErr) errs.email = emailErr;

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      showToast(Object.values(errs)[0], true);
      return;
    }

    setProfileErrors({});
    setProfileLoading(true);
    try {
      await updateUser({
        name: profile.name.trim(),
        phone: sanitizeIndianPhone(profile.phone),
        email: profile.email.trim(),
      });
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', true);
    } finally { setProfileLoading(false); }
  };

  const handleDiscard = () => {
    setProfile({
      name: user.name || user.username || '',
      phone: sanitizeIndianPhone(user.phone || ''),
      email: user.email || '',
    });
    setProfileErrors({});
  };

  const handleSavePassword = async () => {
    const errs = {};
    if (!pw.current) errs.current = 'Please enter your current password.';
    const newPwErr = validatePassword(pw.newPw, { minLength: 6 });
    if (newPwErr) errs.newPw = newPwErr;
    if (!pw.confirm) {
      errs.confirm = 'Please confirm your new password.';
    } else if (pw.newPw !== pw.confirm) {
      errs.confirm = 'Passwords do not match.';
    }

    if (Object.keys(errs).length > 0) {
      setPwErrors(errs);
      showToast(Object.values(errs)[0], true);
      return;
    }

    setPwErrors({});
    setPwLoading(true);
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.newPw });
      setPw({ current: '', newPw: '', confirm: '' });
      showToast('Password updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to change password', true);
    } finally { setPwLoading(false); }
  };

  const navLinks = [
    { id: 'profile',  icon: 'fa-regular fa-user',        label: 'Personal Info',  badge: null },
    { id: 'orders',   icon: 'fa-solid fa-truck',         label: 'My Orders',      badge: myOrders?.length || 0 },
    { id: 'wishlist', icon: 'fa-regular fa-heart',       label: 'My Wishlist',    badge: wishlistCount || 0 },
    // { id: 'cart',     icon: 'fa-solid fa-cart-shopping', label: 'Shopping Bag',   badge: cartCount || 0 },
  ];

  const pageHeaders = {
    profile:  { title: 'Personal Information', sub: 'Manage your personal details and account security' },
    orders:   { title: 'My Orders',            sub: 'Track shipments and view past purchases' },
    wishlist: { title: 'My Wishlist',          sub: 'Saved items you love and cherish' },
    // cart:     { title: 'Shopping Bag',         sub: 'Review selected items before proceeding to checkout' },
  };

  const currentHeader = pageHeaders[activeTab] || pageHeaders.profile;
  const { subtotal } = getCartTotals ? getCartTotals(false) : { subtotal: 0 };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: F.main, color: C.text }}>
      <Header />

      <style>{`
        .profile-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 24px 24px 80px;
        }

        .profile-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-family: ${F.sub};
          color: ${C.muted};
          margin-bottom: 20px;
        }
        .profile-breadcrumb a, .profile-breadcrumb span.link {
          color: ${C.brand};
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }
        .profile-breadcrumb a:hover, .profile-breadcrumb span.link:hover {
          color: ${C.accentHov};
        }
        .profile-breadcrumb .sep {
          color: #94A3B8;
          font-size: 11px;
        }
        .profile-breadcrumb .current {
          color: #1E293B;
          font-weight: 600;
        }

        .profile-hero-card {
          background: #FFFFFF;
          border: 1px solid ${C.border};
          border-top: 3px solid ${C.brand};
          border-radius: 18px;
          padding: 26px 32px;
          box-shadow: 0 10px 30px -6px rgba(15, 78, 66, 0.05), 0 2px 8px rgba(0, 0, 0, 0.02);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 28px;
        }
        .profile-hero-left {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 0;
        }
        .profile-hero-avatar-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: ${C.brand};
          padding: 3px;
          box-shadow: 0 0 0 4px #EAF5F0;
          flex-shrink: 0;
        }
        .profile-hero-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: ${C.brand};
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          font-family: ${F.serif};
          letter-spacing: 0.5px;
        }
        .profile-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #EAF5F0;
          color: ${C.brand};
          border: 1px solid rgba(15, 78, 66, 0.18);
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .profile-hero-name {
          font-family: ${F.serif};
          font-size: clamp(24px, 2.8vw, 32px);
          font-weight: 600;
          color: ${C.brandDark};
          margin: 4px 0 6px;
          line-height: 1.2;
        }
        .profile-hero-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 13px;
          color: ${C.muted};
          font-family: ${F.sub};
        }
        .profile-hero-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .profile-hero-stats {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .profile-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4px 22px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          outline: none;
        }
        .profile-stat-item:hover .profile-stat-number {
          color: ${C.accentHov};
          transform: translateY(-1px);
        }
        .profile-stat-item:hover .profile-stat-label {
          color: ${C.brand};
        }
        .profile-stat-divider {
          width: 1px;
          height: 28px;
          background: #E2E8F0;
          flex-shrink: 0;
        }
        .profile-stat-number {
          font-size: 26px;
          font-weight: 700;
          color: ${C.brand};
          font-family: ${F.serif};
          line-height: 1;
          transition: all 0.2s ease;
        }
        .profile-stat-label {
          font-size: 11px;
          color: ${C.muted};
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          margin-top: 5px;
          font-family: ${F.main};
          transition: color 0.2s ease;
        }

        .profile-grid-layout {
          display: flex;
          align-items: flex-start;
          gap: 28px;
        }

        .profile-sidebar-wrap {
          width: 270px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-nav-box {
          background: #FFFFFF;
          border: 1px solid ${C.border};
          border-radius: 16px;
          box-shadow: 0 8px 24px -4px rgba(15, 78, 66, 0.04);
          padding: 16px 12px;
        }
        .profile-nav-eyebrow {
          display: block;
          padding: 8px 14px 12px;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: ${C.brand};
          font-weight: 700;
        }
        .profile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;
          font-family: ${F.main};
          border: 1px solid transparent;
        }
        .profile-nav-item:hover {
          background: #F8FAFC;
          color: ${C.brand};
        }
        .profile-nav-item.is-active {
          background: linear-gradient(135deg, #0F4E42 0%, #166455 100%);
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(15, 78, 66, 0.22);
          transform: translateY(-1px);
        }
        .profile-nav-item-icon {
          width: 20px;
          text-align: center;
          font-size: 14px;
          color: ${C.brand};
        }
        .profile-nav-item.is-active .profile-nav-item-icon {
          color: #FFFFFF;
        }
        .profile-nav-badge {
          margin-left: auto;
          background: #EAF5F0;
          color: ${C.brand};
          border: 1px solid rgba(15, 78, 66, 0.2);
          border-radius: 20px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 700;
        }
        .profile-nav-item.is-active .profile-nav-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          border: none;
        }

        .profile-support-card {
          background: #F8FAFC;
          border: 1px solid ${C.border};
          border-radius: 14px;
          padding: 16px;
          text-align: center;
        }
        .profile-support-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: ${C.brand};
          margin-bottom: 6px;
        }
        .profile-support-desc {
          font-size: 12px;
          color: ${C.muted};
          font-family: ${F.sub};
          line-height: 1.4;
          margin-bottom: 12px;
        }
        .profile-support-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          background: #25D366;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);
          transition: all 0.2s;
        }
        .profile-support-link:hover {
          background: #1EBE5D;
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .profile-nav-logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          color: ${C.danger};
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(224, 82, 82, 0.15);
          background: #FFF5F5;
          font-family: ${F.main};
          margin-top: 8px;
        }
        .profile-nav-logout-btn:hover {
          background: #FEE2E2;
          border-color: ${C.danger};
        }

        .profile-main-wrap {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .profile-content-card {
          background: #FFFFFF;
          border: 1px solid ${C.border};
          border-radius: 18px;
          box-shadow: 0 8px 24px -4px rgba(15, 78, 66, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02);
          padding: 30px 32px;
        }
        .profile-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 1px solid ${C.border};
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .profile-card-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .profile-card-icon-pill {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #EAF5F0;
          border: 1px solid rgba(15, 78, 66, 0.15);
          color: ${C.brand};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .profile-card-title {
          font-family: ${F.serif};
          font-size: 24px;
          font-weight: 600;
          color: ${C.brandDark};
          margin: 0;
          line-height: 1.2;
        }
        .profile-card-subtitle {
          font-size: 13px;
          color: ${C.muted};
          font-family: ${F.sub};
          margin: 4px 0 0;
        }

        .profile-action-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid ${C.border};
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .profile-btn-ghost {
          min-height: 44px;
          padding: 0 24px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1.5px solid ${C.border};
          color: ${C.muted};
          font-family: ${F.main};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .profile-btn-ghost:hover {
          border-color: ${C.brand};
          color: ${C.brand};
          background: #F8FAFC;
        }
        .profile-btn-primary {
          min-height: 44px;
          padding: 0 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0F4E42 0%, #166455 100%);
          border: none;
          color: #FFFFFF;
          font-family: ${F.main};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(15, 78, 66, 0.22);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .profile-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(15, 78, 66, 0.3);
        }
        .profile-btn-primary:disabled {
          background: #CBD5E0;
          cursor: not-allowed;
          box-shadow: none;
        }

        .profile-order-card {
          background: #FFFFFF;
          border: 1px solid ${C.border};
          border-radius: 14px;
          padding: 20px 22px 0;
          box-shadow: 0 4px 16px rgba(15, 78, 66, 0.04);
          margin-bottom: 16px;
        }
        .profile-order-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid #F1F5F9;
        }
        .profile-order-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .profile-order-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }
        .profile-order-body {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
        }
        .profile-order-thumb {
          width: 64px;
          height: 74px;
          border-radius: 8px;
          object-fit: cover;
          object-position: top;
          background: #F8FAFC;
          border: 1px solid ${C.border};
          flex-shrink: 0;
        }
        .profile-order-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #F1F5F9;
          color: ${C.muted};
          font-size: 12px;
        }
        .profile-track-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          color: ${C.brand};
          font-family: ${F.main};
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }
        .profile-track-btn:hover {
          color: ${C.accentHov};
        }

        .profile-empty-state {
          text-align: center;
          padding: 48px 20px;
        }
        .profile-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #F4F8F2;
          color: ${C.brand};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          margin-bottom: 16px;
        }
        .profile-empty-title {
          font-family: ${F.serif};
          font-size: 22px;
          font-weight: 600;
          color: ${C.brandDark};
          margin: 0 0 8px;
        }
        .profile-empty-text {
          font-size: 14px;
          color: ${C.muted};
          font-family: ${F.sub};
          max-width: 380px;
          margin: 0 auto 20px;
        }

        @media (max-width: 992px) {
          .profile-grid-layout {
            flex-direction: column;
            gap: 20px;
          }
          .profile-sidebar-wrap {
            width: 100%;
          }
          .profile-nav-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .profile-nav-item {
            margin-bottom: 0;
          }
          .profile-hero-stats {
            width: 100%;
            justify-content: space-around;
            padding-top: 14px;
            border-top: 1px solid #F1F5F9;
          }
          .profile-stat-item {
            flex: 1;
            padding: 6px 12px;
          }
        }

        @media (max-width: 600px) {
          .profile-container {
            padding: 16px 14px 60px;
          }
          .profile-hero-card {
            padding: 20px 18px;
            gap: 16px;
          }
          .profile-hero-avatar-ring {
            width: 58px;
            height: 58px;
          }
          .profile-hero-avatar {
            font-size: 20px;
          }
          .profile-hero-stats {
            display: flex !important;
            width: 100% !important;
            justify-content: space-around !important;
            padding-top: 12px !important;
            border-top: 1px solid #F1F5F9 !important;
          }
          .profile-stat-item {
            flex: 1 !important;
            padding: 4px 6px !important;
          }
          .profile-stat-number {
            font-size: 20px !important;
          }
          .profile-stat-label {
            font-size: 10px !important;
            letter-spacing: 0.6px !important;
          }
          .profile-nav-list {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .profile-content-card {
            padding: 20px 16px;
          }
          .profile-action-bar button {
            flex: 1 1 100%;
          }
        }
      `}</style>

      <div className="profile-container">

        <nav className="profile-breadcrumb" aria-label="Breadcrumb">
          <span className="link" onClick={() => navigate('/home')}>Home</span>
          <span className="sep">/</span>
          <span className="link" onClick={() => handleTabChange('profile')}>My Account</span>
          {activeTab !== 'profile' && (
            <>
              <span className="sep">/</span>
              <span className="current">{currentHeader.title}</span>
            </>
          )}
        </nav>

        <section className="profile-hero-card">
          <div className="profile-hero-left">
            <div className="profile-hero-avatar-ring">
              <div className="profile-hero-avatar">{initials}</div>
            </div>
            <div className="profile-hero-info">
              
              <h1 className="profile-hero-name">Hello, {profile.name || 'Valued Customer'}</h1>
              <div className="profile-hero-meta">
                <span><i className="fa-regular fa-envelope" /> {profile.email}</span>
                {profile.phone && <span><i className="fa-solid fa-phone" /> +91 {profile.phone}</span>}
              </div>
            </div>
          </div>

          <div className="profile-hero-stats">
            <button
              type="button"
              className="profile-stat-item"
              onClick={() => handleTabChange('orders')}
              title="View your orders"
              aria-label={`${myOrders?.length || 0} Orders`}
            >
              <span className="profile-stat-number">{myOrders?.length || 0}</span>
              <span className="profile-stat-label">Orders</span>
            </button>

            <span className="profile-stat-divider" aria-hidden="true" />

            <button
              type="button"
              className="profile-stat-item"
              onClick={() => handleTabChange('wishlist')}
              title="View your wishlist"
              aria-label={`${wishlistCount || 0} Wishlist items`}
            >
              <span className="profile-stat-number">{wishlistCount || 0}</span>
              <span className="profile-stat-label">Wishlist</span>
            </button>

            <span className="profile-stat-divider" aria-hidden="true" />

            {/* <button
              type="button"
              className="profile-stat-item"
              onClick={() => handleTabChange('cart')}
              title="View shopping bag"
              aria-label={`${cartCount || 0} Items in Bag`}
            >
              <span className="profile-stat-number">{cartCount || 0}</span>
              <span className="profile-stat-label">In Bag</span>
            </button> */}
          </div>
        </section>

        <div className="profile-grid-layout">

          <aside className="profile-sidebar-wrap">
            <div className="profile-nav-box">
              <span className="profile-nav-eyebrow">Account Dashboard</span>
              <div className="profile-nav-list">
                {navLinks.map(({ id, icon, label, badge }) => {
                  const active = activeTab === id;
                  return (
                    <div
                      key={id}
                      role="button"
                      tabIndex={0}
                      className={`profile-nav-item ${active ? 'is-active' : ''}`}
                      onClick={() => handleTabChange(id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTabChange(id); } }}
                    >
                      <i className={`profile-nav-item-icon ${icon}`} />
                      <span>{label}</span>
                      {badge > 0 && <span className="profile-nav-badge">{badge}</span>}
                    </div>
                  );
                })}
              </div>

              <div
                role="button"
                tabIndex={0}
                className="profile-nav-logout-btn"
                onClick={() => { logout(); navigate('/home'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logout(); navigate('/home'); } }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" />
                <span>Sign Out</span>
              </div>
            </div>
          </aside>

          <main className="profile-main-wrap">

            {activeTab === 'profile' && (
              <>
                <section className="profile-content-card">
                  <div className="profile-card-header">
                    <div className="profile-card-header-left">
                      <span className="profile-card-icon-pill"><i className="fa-regular fa-user" /></span>
                      <div>
                        <h2 className="profile-card-title">Personal Information</h2>
                        <p className="profile-card-subtitle">Manage your personal identification and contact details</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <Field
                      label="Full Name"
                      value={profile.name}
                      onChange={setP('name')}
                      placeholder="Your full name"
                      error={profileErrors.name}
                      icon="fa-regular fa-user"
                    />
                    <Field
                      label="Phone Number"
                      value={profile.phone}
                      onChange={setP('phone')}
                      placeholder="10-digit mobile number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      error={profileErrors.phone}
                      icon="fa-solid fa-phone"
                    />
                    <Field
                      label="Email Address"
                      value={profile.email}
                      placeholder="you@example.com"
                      type="email"
                      full
                      readOnly
                      error={profileErrors.email}
                      icon="fa-regular fa-envelope"
                    />
                  </div>

                  <div className="profile-action-bar">
                    <button type="button" className="profile-btn-ghost" onClick={handleDiscard}>
                      Discard
                    </button>
                    <button
                      type="button"
                      className="profile-btn-primary"
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                    >
                      {profileLoading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} /> Saving...
                        </>
                      ) : (
                        <>
                          <i className="fa-regular fa-floppy-disk" style={{ marginRight: 8 }} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </section>

                <section className="profile-content-card">
                  <div className="profile-card-header">
                    <div className="profile-card-header-left">
                      <span className="profile-card-icon-pill"><i className="fa-solid fa-shield-halved" /></span>
                      <div>
                        <h2 className="profile-card-title">Security & Password</h2>
                        <p className="profile-card-subtitle">Update your password to keep your shopping account secure</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <Field
                      label="Current Password"
                      value={pw.current}
                      onChange={setPwF('current')}
                      type="password"
                      placeholder="Enter your current password"
                      full
                      error={pwErrors.current}
                      icon="fa-solid fa-key"
                    />
                    <Field
                      label="New Password"
                      value={pw.newPw}
                      onChange={setPwF('newPw')}
                      type="password"
                      placeholder="Min. 6 characters"
                      error={pwErrors.newPw}
                      icon="fa-solid fa-lock"
                    />
                    <Field
                      label="Confirm New Password"
                      value={pw.confirm}
                      onChange={setPwF('confirm')}
                      type="password"
                      placeholder="Re-enter new password"
                      error={pwErrors.confirm}
                      icon="fa-solid fa-circle-check"
                    />
                  </div>

                  <div className="profile-action-bar">
                    <button
                      type="button"
                      className="profile-btn-primary"
                      onClick={handleSavePassword}
                      disabled={pwLoading}
                    >
                      {pwLoading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} /> Updating...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-shield-halved" style={{ marginRight: 8 }} /> Update Password
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'orders' && (
              <section className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-header-left">
                    <span className="profile-card-icon-pill"><i className="fa-solid fa-truck" /></span>
                    <div>
                      <h2 className="profile-card-title">Order History ({myOrders?.length || 0})</h2>
                      <p className="profile-card-subtitle">Track deliveries and view itemized invoices</p>
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'none', border: 'none', color: C.brand,
                      fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: F.main, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                    onClick={() => navigate('/profile#orders')}
                  >
                    <span>Full Orders View</span>
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }} />
                  </button>
                </div>

                {!myOrders || myOrders.length === 0 ? (
                  <div className="profile-empty-state">
                    <div className="profile-empty-icon"><i className="fa-solid fa-box-open" /></div>
                    <h3 className="profile-empty-title">No Orders Yet</h3>
                    <p className="profile-empty-text">When you place your first order with Fashion Aura, your tracking timeline and receipt will appear here.</p>
                    <button className="profile-btn-primary" onClick={() => navigate('/shop')}>
                      Explore Collection
                    </button>
                  </div>
                ) : (
                  <div>
                    {myOrders.map((order) => {
                      const badge = statusStyle(order.status);
                      const itemCount = (order.items || []).reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
                      const firstItem = order.items?.[0];
                      return (
                        <article className="profile-order-card" key={order.id}>
                          <div className="profile-order-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ color: C.muted, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Order</span>
                              <strong style={{ fontSize: '14px', color: C.brandDark }}>#{order.id}</strong>
                            </div>
                            <span className="profile-order-badge" style={{ color: badge.color, background: badge.bg }}>
                              <span className="profile-order-dot" />{labelFor(order.status || 'Processing')}
                            </span>
                          </div>

                          <div className="profile-order-body">
                            {firstItem?.image ? (
                              <img
                                src={firstItem.image}
                                alt={firstItem?.name || ''}
                                className="profile-order-thumb"
                                onError={(e) => {
                                  e.target.src = defaultLogo;
                                  e.target.style.objectFit = 'contain';
                                  e.target.style.background = '#126354';
                                  e.target.style.padding = '4px';
                                }}
                              />
                            ) : (
                              <div className="profile-order-thumb" style={{ display: 'grid', placeItems: 'center', color: C.brand, fontSize: '20px' }}>
                                <i className="fa-solid fa-bag-shopping" />
                              </div>
                            )}

                            <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: '4px' }}>
                              <span style={{ color: C.muted, fontSize: '12px', fontFamily: F.sub }}>Placed on {order.date || 'Recent'}</span>
                              <strong style={{ fontSize: '14px', color: C.brandDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {firstItem?.name || 'Order Items'}
                              </strong>
                              {order.items?.length > 1 && (
                                <span style={{ color: C.brand, fontSize: '11px', fontWeight: 600 }}>
                                  + {order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ display: 'block', color: C.muted, fontSize: '11px' }}>Total Amount</span>
                              <strong style={{ fontSize: '16px', color: C.brand, fontFamily: F.serif }}>
                                ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </strong>
                            </div>
                          </div>

                          <div className="profile-order-bottom">
                            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'} in parcel</span>
                            <button
                              type="button"
                              className="profile-track-btn"
                              onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)}
                            >
                              Track Order <i className="fa-solid fa-arrow-right" />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'wishlist' && (
              <section className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-header-left">
                    <span className="profile-card-icon-pill"><i className="fa-regular fa-heart" /></span>
                    <div>
                      <h2 className="profile-card-title">My Wishlist ({wishlistCount || 0})</h2>
                      <p className="profile-card-subtitle">Your curated selection of favorites</p>
                    </div>
                  </div>
                </div>

                {!wishlistItems || wishlistItems.length === 0 ? (
                  <div className="profile-empty-state">
                    <div className="profile-empty-icon"><i className="fa-regular fa-heart" /></div>
                    <h3 className="profile-empty-title">Your Wishlist is Empty</h3>
                    <p className="profile-empty-text">Explore our ethnic designs, kurtis, and maxi collections, then tap the heart icon to save what you love.</p>
                    <button className="profile-btn-primary" onClick={() => navigate('/shop')}>
                      Discover Collections
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {wishlistItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px',
                          border: `1px solid ${C.border}`,
                          borderRadius: '12px',
                          background: '#FFFFFF',
                          flexWrap: 'wrap',
                        }}
                      >
                        <img
                          src={item.img || item.image || defaultLogo}
                          alt={item.name}
                          style={{
                            width: '64px',
                            height: '74px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: `1px solid ${C.border}`,
                            background: C.bg,
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            e.target.src = defaultLogo;
                            e.target.style.objectFit = 'contain';
                            e.target.style.background = '#126354';
                            e.target.style.padding = '4px';
                          }}
                        />

                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: C.brandDark, fontWeight: 600 }}>
                            {item.name}
                          </h4>
                          {item.subtitle && (
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: C.muted, fontFamily: F.sub }}>
                              {item.subtitle}
                            </p>
                          )}
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.brand, fontFamily: F.serif }}>
                            ₹{(Number(item.price) || 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                          <button
                            type="button"
                            className="profile-btn-primary"
                            style={{ minHeight: '40px', padding: '0 18px', fontSize: '10px' }}
                            onClick={() => {
                              addToCart({
                                productId: item.productId || item.id,
                                variantId: item.variantId,
                                name:      item.name,
                                img:       item.img || item.image,
                                image:     item.img || item.image,
                                price:     item.price,
                                subtitle:  item.subtitle,
                              });
                              removeFromWishlist(item.id);
                              showToast(`${item.name} moved to bag!`);
                            }}
                          >
                            <i className="fa-solid fa-bag-shopping" style={{ marginRight: 6 }} /> Move to Bag
                          </button>

                          <button
                            type="button"
                            aria-label={`Remove ${item.name} from wishlist`}
                            title="Remove from Wishlist"
                            style={{
                              width: '40px',
                              height: '40px',
                              border: `1px solid ${C.border}`,
                              borderRadius: '10px',
                              background: '#F8FAFC',
                              color: C.muted,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onClick={() => removeFromWishlist(item.id)}
                            onMouseEnter={e => { e.currentTarget.style.color = C.danger; e.currentTarget.style.borderColor = C.danger; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
                          >
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* {activeTab === 'cart' && (
              <section className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-header-left">
                    <span className="profile-card-icon-pill"><i className="fa-solid fa-bag-shopping" /></span>
                    <div>
                      <h2 className="profile-card-title">Shopping Bag ({cartCount || 0})</h2>
                      <p className="profile-card-subtitle">Review and manage items before checkout</p>
                    </div>
                  </div>
                </div>

                {!cartItems || cartItems.length === 0 ? (
                  <div className="profile-empty-state">
                    <div className="profile-empty-icon"><i className="fa-solid fa-bag-shopping" /></div>
                    <h3 className="profile-empty-title">Your Bag is Empty</h3>
                    <p className="profile-empty-text">Add your desired outfits and dresses to your shopping bag to continue.</p>
                    <button className="profile-btn-primary" onClick={() => navigate('/shop')}>
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            border: `1px solid ${C.border}`,
                            borderRadius: '12px',
                            background: '#FFFFFF',
                            flexWrap: 'wrap',
                          }}
                        >
                          <img
                            src={item.image || item.img || defaultLogo}
                            alt={item.name}
                            style={{
                              width: '64px',
                              height: '74px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: `1px solid ${C.border}`,
                              background: C.bg,
                              flexShrink: 0,
                            }}
                            onError={(e) => {
                              e.target.src = defaultLogo;
                              e.target.style.objectFit = 'contain';
                              e.target.style.background = '#126354';
                              e.target.style.padding = '4px';
                            }}
                          />

                          <div style={{ flex: 1, minWidth: '150px' }}>
                            <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: C.brandDark, fontWeight: 600 }}>
                              {item.name}
                            </h4>
                            {item.subtitle && (
                              <p style={{ margin: '0 0 4px', fontSize: '12px', color: C.muted, fontFamily: F.sub }}>
                                {item.subtitle}
                              </p>
                            )}
                            <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>
                              Unit Price: <span style={{ color: C.brand, fontWeight: 600 }}>₹{(Number(item.price) || 0).toLocaleString('en-IN')}</span>
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                              <button
                                type="button"
                                aria-label={`Decrease quantity for ${item.name}`}
                                style={{
                                  width: '32px', height: '32px', border: 'none', background: '#F1F5F9',
                                  color: C.brand, cursor: 'pointer', fontSize: '14px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                onClick={() => updateQty(item.id, -1)}
                              >
                                −
                              </button>
                              <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: C.brandDark }}>
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase quantity for ${item.name}`}
                                style={{
                                  width: '32px', height: '32px', border: 'none', background: '#F1F5F9',
                                  color: C.brand, cursor: 'pointer', fontSize: '14px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                onClick={() => updateQty(item.id, 1)}
                              >
                                +
                              </button>
                            </div>

                            <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 700, color: C.brand, fontFamily: F.serif, fontSize: '16px' }}>
                              ₹{((Number(item.price) || 0) * (Number(item.qty) || 1)).toLocaleString('en-IN')}
                            </div>

                            <button
                              type="button"
                              aria-label={`Remove ${item.name} from cart`}
                              title="Remove Item"
                              style={{
                                width: '36px', height: '36px', border: `1px solid ${C.border}`, borderRadius: '8px',
                                background: '#F8FAFC', color: C.muted, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                              onClick={() => removeFromCart(item.id)}
                              onMouseEnter={e => { e.currentTarget.style.color = C.danger; e.currentTarget.style.borderColor = C.danger; }}
                              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
                            >
                              <i className="fa-regular fa-trash-can" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '20px 24px', background: '#F8FAFC', borderRadius: '14px',
                      border: `1px solid ${C.border}`, flexWrap: 'wrap', gap: '16px'
                    }}>
                      <div>
                        <span style={{ fontSize: '12px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Estimated Bag Subtotal</span>
                        <strong style={{ fontSize: '24px', color: C.brandDark, fontFamily: F.serif }}>
                          ₹{Number(subtotal || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="profile-btn-ghost"
                          onClick={() => navigate('/shop')}
                        >
                          Continue Shopping
                        </button>
                        <button
                          type="button"
                          className="profile-btn-primary"
                          onClick={() => navigate('/checkout')}
                        >
                          Proceed to Checkout <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )} */}

          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
