import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import defaultLogo from '../../assets/img/logo2.png';

const F = {
  main:    "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif",
  sub:     "'Raleway', 'Josefin Sans', sans-serif",
};

const C = {
  brand:     '#0f5447',
  accent:    '#0f5447',
  accentHov: '#0b3a31',
  border:    '#EAE4D6',
  surface:   '#FFFFFF',
  muted:     '#6B6B8A',
  bg:        '#EAF0E2',
  success:   '#2E9E6B',
  danger:    '#E05252',
  gold:      '#C9933A',
};

const STATUS_COLORS = {
  Pending:          { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  pending:          { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  Confirmed:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  confirmed:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  Processing:       { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  processing:       { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
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
  if (value.includes('pending')) return { color: '#B45309', bg: '#FFFBEB' };
  return { color: C.brand, bg: '#EAF5F0' };
};

const labelFor = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const styles = {
  page:  { background: C.bg, minHeight: '100vh', fontFamily: F.main },
  inner: { maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' },

  topRow: {
    marginBottom: '40px',
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: '24px',
  },
  headingWrap: { display: 'flex', alignItems: 'center', gap: '16px' },
  headingLine: {
    width: '36px', height: '1px',
    background: C.gold, display: 'inline-block',
  },
  heading: {
    margin: 0, fontSize: '28px', fontWeight: 300,
    color: C.brand, letterSpacing: '6px',
    fontFamily: F.main, textTransform: 'uppercase',
  },
  subHead: {
    margin: '6px 0 0', fontSize: '13px', color: C.muted,
    letterSpacing: '2px', fontFamily: F.sub, fontWeight: 300,
  },

  layout: { display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' },

  sidebar: {
    width: '230px', flexShrink: 0,
    display: 'flex', flexDirection: 'column', gap: '16px',
  },

  avatarCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderTop: `3px solid ${C.brand}`,
    padding: '32px 16px 28px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(31,92,68,0.07)',
  },
  avatarRing: {
    width: '80px', height: '80px', borderRadius: '50%',
    border: `1px solid ${C.border}`,
    padding: '3px',
    margin: '0 auto 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: '100%', height: '100%', borderRadius: '50%',
    background: `linear-gradient(135deg, ${C.brand} 0%, #0b3a31 100%)`,
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', fontWeight: 300,
    fontFamily: F.main, letterSpacing: '2px',
  },
  avatarName: {
    margin: '0 0 4px', fontSize: '16px', fontWeight: 300,
    color: C.brand, letterSpacing: '3px',
    fontFamily: F.main, textTransform: 'uppercase',
  },
  avatarDivider: {
    width: '28px', height: '1px', background: C.gold,
    margin: '10px auto', opacity: 0.8,
  },
  avatarEmail: {
    margin: 0, fontSize: '12px', color: C.muted,
    letterSpacing: '0.5px', fontFamily: F.sub, fontWeight: 300,
    wordBreak: 'break-all',
  },

  navCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(31,92,68,0.07)',
  },
  navLabel: {
    padding: '12px 16px 10px',
    fontSize: '10px', fontWeight: 400, letterSpacing: '3px',
    textTransform: 'uppercase', color: C.gold,
    fontFamily: F.main, borderBottom: `1px solid ${C.border}`,
  },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '13px 16px',
    fontSize: '12px', fontWeight: active ? 400 : 300,
    letterSpacing: '2px', textTransform: 'uppercase',
    fontFamily: F.main,
    color: active ? C.brand : C.muted,
    background: active ? 'rgba(31,92,68,0.08)' : 'transparent',
    borderLeft: `3px solid ${active ? C.brand : 'transparent'}`,
    cursor: 'pointer', transition: 'all 0.2s',
  }),
  navIcon: (active) => ({
    fontSize: '13px', color: active ? C.gold : C.muted,
    width: '16px', textAlign: 'center',
  }),
  navBadge: {
    marginLeft: 'auto',
    background: C.gold, color: '#fff',
    borderRadius: '2px', fontSize: '9px', fontWeight: 400,
    padding: '2px 7px', letterSpacing: '0.5px',
    fontFamily: F.main,
  },

  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' },

  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: '32px 28px',
    boxShadow: '0 4px 20px rgba(31,92,68,0.07)',
  },
  cardTitleWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '28px', paddingBottom: '16px',
    borderBottom: `1px solid ${C.border}`,
  },
  cardTitleLeft: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  cardTitleBar: { width: '3px', height: '20px', background: C.gold, flexShrink: 0 },
  cardTitle: {
    fontSize: '12px', fontWeight: 400, color: C.brand,
    letterSpacing: '4px', textTransform: 'uppercase',
    fontFamily: F.main, margin: 0,
  },

  formRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  fieldWrap: { flex: '1 1 180px', marginBottom: '16px' },
  fieldWrapFull: { flex: '1 1 100%', marginBottom: '16px' },

  label: {
    display: 'block', fontSize: '10px', fontWeight: 400,
    color: C.gold, letterSpacing: '2.5px',
    textTransform: 'uppercase', marginBottom: '8px',
    fontFamily: F.main,
  },
  input: (focused, readOnly = false) => ({
    width: '100%', padding: '11px 2px', fontSize: '14px',
    color: readOnly ? '#888' : C.brand,
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${readOnly ? C.border : focused ? C.brand : C.border}`,
    borderRadius: 0, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.25s',
    fontFamily: F.sub, fontWeight: 300, letterSpacing: '1px',
    cursor: readOnly ? 'not-allowed' : 'text',
  }),

  actionRow: {
    display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center',
    marginTop: '8px', paddingTop: '20px',
    borderTop: `1px solid ${C.border}`,
  },
  saveBtn: {
    minHeight: '42px', height: '42px',
    padding: '0 26px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: C.brand, color: '#fff',
    border: 'none', borderRadius: 6,
    fontSize: '11px', fontWeight: 500,
    lineHeight: 1,
    letterSpacing: '2px', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: F.main,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    transition: 'opacity 0.2s',
  },
  saveBtnDisabled: {
    minHeight: '42px', height: '42px',
    padding: '0 26px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: '#aaa', color: '#fff',
    border: 'none', borderRadius: 6,
    fontSize: '11px', fontWeight: 500,
    lineHeight: 1,
    letterSpacing: '2px', textTransform: 'uppercase',
    cursor: 'not-allowed', fontFamily: F.main,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
  },
  discardBtn: {
    minHeight: '42px', height: '42px',
    padding: '0 22px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', color: C.muted,
    border: `1px solid ${C.border}`, borderRadius: 6,
    fontSize: '11px', fontWeight: 500,
    lineHeight: 1,
    letterSpacing: '2px', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: F.main,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },

  emptyState: {
    textAlign: 'center', padding: '50px 20px',
  },
  emptyIcon: {
    fontSize: '40px', marginBottom: '16px', opacity: 0.6,
  },
  emptyTitle: {
    fontSize: '16px', color: C.brand, letterSpacing: '2px', textTransform: 'uppercase',
    margin: '0 0 8px', fontFamily: F.main, fontWeight: 400,
  },
  emptyText: {
    fontSize: '13px', color: C.muted, margin: '0 0 24px', fontFamily: F.sub,
  },
  primaryBtn: {
    display: 'inline-block',
    padding: '12px 28px',
    background: C.brand, color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: '11px', fontWeight: 400,
    letterSpacing: '2px', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: F.main,
    textDecoration: 'none',
  },

};

const Field = ({ label, value, onChange, type = 'text', placeholder = '', full = false, readOnly = false }) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={full ? styles.fieldWrapFull : styles.fieldWrap}>
      <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {label}
        {readOnly && (
          <span style={{ fontSize: '9px', textTransform: 'none', letterSpacing: '0.5px', color: '#999', fontWeight: 300 }}>
            (Cannot be changed)
          </span>
        )}
      </label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={e => !readOnly && onChange && onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : 0}
          style={{
            ...styles.input(focused && !readOnly, readOnly),
            paddingRight: isPassword ? '32px' : '2px',
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
              position: 'absolute',
              right: '2px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              padding: '6px 4px',
              cursor: 'pointer',
              color: showPw ? C.brand : C.muted,
              fontSize: '14px',
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
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user, updateUser, changePassword,
    cartItems, addToCart, removeFromCart, updateQty, cartCount, getCartTotals,
    wishlistItems, removeFromWishlist, wishlistCount,
    myOrders, showToast: showCommonToast
  } = useShop();

  // Tab State syncing with hash (#profile, #orders, #wishlist, #cart)
  const getTab = () => {
    const h = (location.hash || window.location.hash || '').replace('#', '').toLowerCase();
    if (['orders', 'wishlist', 'cart'].includes(h)) return h;
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getTab);

  useEffect(() => {
    setActiveTab(getTab());
  }, [location.hash]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/profile#${tabId}`);
  };

  const [profile, setProfile] = useState({
    name:  user?.name || user?.username || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const setP = (key) => (val) => setProfile(p => ({ ...p, [key]: val }));

  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const setPwF = (key) => (val) => setPw(p => ({ ...p, [key]: val }));

  // Keep the profile form in sync once authenticated user is available
  useEffect(() => {
    if (user) {
      setProfile({
        name:  user.name || user.username || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user?.id]);

  // Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user.username ? user.username[0].toUpperCase() : '?');

  const showToast = (msg, isError = false) => showCommonToast(msg, isError ? 'error' : 'success');

  const handleSaveProfile = async () => {
    if (!profile.name.trim())  { showToast('Name is required', true);  return; }
    if (!profile.email.trim()) { showToast('Email is required', true); return; }
    setProfileLoading(true);
    try {
      await updateUser({ name: profile.name, phone: profile.phone, email: profile.email });
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', true);
    } finally { setProfileLoading(false); }
  };

  const handleDiscard = () => {
    setProfile({ name: user.name || user.username || '', phone: user.phone || '', email: user.email || '' });
  };

  const handleSavePassword = async () => {
    if (!pw.current)             { showToast('Enter your current password', true); return; }
    if (pw.newPw.length < 6)     { showToast('Password must be at least 6 characters', true); return; }
    if (pw.newPw !== pw.confirm) { showToast('Passwords do not match', true); return; }
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
    { id: 'profile',  icon: 'fa-regular fa-user',        label: 'My Profile', badge: null },
    { id: 'orders',   icon: 'fa-solid fa-truck',         label: 'My Orders',  badge: myOrders?.length || 0 },
    { id: 'wishlist', icon: 'fa-regular fa-heart',       label: 'Wishlist',   badge: wishlistCount || 0 },
    { id: 'cart',     icon: 'fa-solid fa-cart-shopping', label: 'Cart',       badge: cartCount || 0 },
  ];

  const pageHeaders = {
    profile:  { title: 'My Profile', sub: 'Manage your personal information' },
    orders:   { title: 'My Orders',  sub: 'Track and manage your purchases' },
    wishlist: { title: 'Wishlist',   sub: 'Saved items you love' },
    cart:     { title: 'My Cart',    sub: 'Review and manage items in your bag' },
  };

  const currentHeader = pageHeaders[activeTab] || pageHeaders.profile;
  const { subtotal } = getCartTotals ? getCartTotals(false) : { subtotal: 0 };

  return (
    <div style={styles.page}>
      <style>{`
        @media (max-width: 768px) {
          .profile-sidebar { width: 100% !important; }
          .profile-inner { padding: 24px 16px 60px !important; }
          .profile-card { padding: 20px 16px !important; }
          .profile-layout { flex-direction: column !important; }
          .profile-inner input { font-size: 16px !important; }
        }
        .profile-pw-toggle:hover {
          color: ${C.brand} !important;
        }
        .item-action-btn:hover {
          background-color: ${C.brand} !important;
          color: #fff !important;
        }
        .profile-action-row {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
          padding-top: 20px;
          border-top: 1px solid ${C.border};
        }
        .profile-btn-save, .profile-btn-discard {
          min-height: 42px !important;
          height: 42px !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          box-sizing: border-box !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: ${F.main} !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          letter-spacing: 2px !important;
          text-transform: uppercase !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
        }
        .profile-btn-save {
          padding: 0 28px !important;
          background: ${C.brand} !important;
          color: #fff !important;
          border: none !important;
          cursor: pointer;
        }
        .profile-btn-save:hover:not(:disabled) {
          opacity: 0.92;
        }
        .profile-btn-save:disabled {
          background: #aaa !important;
          cursor: not-allowed;
        }
        .profile-btn-discard {
          padding: 0 22px !important;
          background: transparent !important;
          color: ${C.muted} !important;
          border: 1px solid ${C.border} !important;
          cursor: pointer;
        }
        .profile-btn-discard:hover {
          color: ${C.brand} !important;
          border-color: ${C.brand} !important;
        }
        @media (max-width: 600px) {
          .profile-action-row {
            gap: 10px !important;
          }
          .profile-action-row .profile-btn-discard,
          .profile-action-row .profile-btn-save {
            flex: 1 1 0 !important;
            padding: 0 10px !important;
            font-size: 11px !important;
            letter-spacing: 1px !important;
            min-height: 42px !important;
            height: 42px !important;
          }
        }
        .my-orders-list { display: grid; gap: 16px; }
        .my-order-card { background: #fff; border: 1px solid ${C.border}; border-radius: 14px; padding: 20px 22px 0; box-shadow: 0 5px 18px rgba(31,92,68,.05); }
        .my-order-topline { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid #F0EEE8; }
        .my-order-topline > div { display: flex; align-items: center; gap: 10px; }
        .my-order-label { color: ${C.muted}; font-size: 10px; letter-spacing: 1.5px; }
        .my-order-topline strong { font-size: 14px; }
        .my-order-status { display: inline-flex; align-items: center; gap: 7px; border-radius: 20px; padding: 7px 11px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
        .my-order-status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
        .my-order-summary { display: flex; align-items: center; gap: 16px; padding: 18px 0; }
        .my-order-image, .my-order-image-placeholder { width: 64px; height: 74px; border-radius: 8px; object-fit: cover; object-position: top; background: ${C.bg}; flex-shrink: 0; }
        .my-order-image-placeholder { display: grid; place-items: center; color: ${C.brand}; font-size: 20px; }
        .my-order-info { display: grid; gap: 5px; min-width: 0; flex: 1; }
        .my-order-date, .my-order-more { color: ${C.muted}; font-size: 12px; }
        .my-order-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 500; }
        .my-order-total { display: grid; justify-items: end; gap: 5px; padding-left: 14px; }
        .my-order-total span { color: ${C.muted}; font-size: 11px; }
        .my-order-total strong { font-size: 15px; white-space: nowrap; }
        .my-order-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 0; border-top: 1px solid #F0EEE8; color: ${C.muted}; font-size: 12px; }
        .my-order-bottom button { display: inline-flex; align-items: center; gap: 9px; border: 0; background: transparent; color: ${C.brand}; font: 600 12px ${F.main}; cursor: pointer; padding: 7px 0 7px 10px; transition: color 0.2s ease; }
        .my-order-bottom button:hover { color: ${C.gold}; }
        @media (max-width: 600px) {
          .my-order-card { padding: 15px 14px 0; }
          .my-order-summary { gap: 11px; padding: 14px 0; }
          .my-order-image, .my-order-image-placeholder { width: 54px; height: 64px; }
          .my-order-info strong { font-size: 12px; }
          .my-order-date, .my-order-more { font-size: 10px; }
          .my-order-total { padding-left: 4px; }
          .my-order-total strong { font-size: 12px; }
          .my-order-total span, .my-order-bottom { font-size: 10px; }
          .my-order-bottom button { font-size: 10px; }
        }
      `}</style>
      <Header />
      <div className="profile-inner" style={styles.inner}>

        {/* ── Page Heading ── */}
        <div style={styles.topRow}>
          <div style={styles.headingWrap}>
            <span style={styles.headingLine} />
            <div>
              <h1 style={styles.heading}>{currentHeader.title}</h1>
              <p style={styles.subHead}>{currentHeader.sub}</p>
            </div>
          </div>
        </div>

        <div className="profile-layout" style={styles.layout}>

          {/* ── Sidebar ── */}
          <div className="profile-sidebar" style={styles.sidebar}>
            <div style={styles.avatarCard}>
              <div style={styles.avatarRing}>
                <div style={styles.avatar}>{initials}</div>
              </div>
              <p style={styles.avatarName}>{profile.name || 'Your Name'}</p>
              <div style={styles.avatarDivider} />
              <p style={styles.avatarEmail}>{profile.email}</p>
            </div>

            <div style={styles.navCard}>
              <div style={styles.navLabel}>Account</div>
              {navLinks.map(({ id, icon, label, badge }, i) => {
                const active = activeTab === id;
                const isLast = i === navLinks.length - 1;
                return (
                  <div
                    key={id}
                    style={{
                      ...styles.navItem(active),
                      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                    }}
                    onClick={() => handleTabChange(id)}
                  >
                    <i className={icon} style={styles.navIcon(active)} />
                    {label}
                    {badge > 0 && <span style={styles.navBadge}>{badge}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Main Content Tabs ── */}
          <div style={styles.main}>

            {/* ══════════════════════════════════════════════════
               TAB 1: PROFILE
            ══════════════════════════════════════════════════ */}
            {activeTab === 'profile' && (
              <>
                {/* Edit Profile */}
                <div className="profile-card" style={styles.card}>
                  <div style={styles.cardTitleWrap}>
                    <div style={styles.cardTitleLeft}>
                      <div style={styles.cardTitleBar} />
                      <p style={styles.cardTitle}>Edit Profile</p>
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <Field label="Full Name"    value={profile.name}  onChange={setP('name')}  placeholder="Your full name" />
                    <Field label="Phone Number" value={profile.phone} onChange={setP('phone')} placeholder="+91 00000 00000" type="tel" />
                  </div>
                  <div style={styles.formRow}>
                    <Field label="Email Address" value={profile.email} placeholder="you@example.com" type="email" full readOnly />
                  </div>
                  <div className="profile-action-row" style={styles.actionRow}>
                    <button className="profile-btn-discard" style={styles.discardBtn} onClick={handleDiscard}>Discard</button>
                    <button
                      className="profile-btn-save"
                      style={profileLoading ? styles.saveBtnDisabled : styles.saveBtn}
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                    >
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {/* Change Password */}
                <div className="profile-card" style={styles.card}>
                  <div style={styles.cardTitleWrap}>
                    <div style={styles.cardTitleLeft}>
                      <div style={styles.cardTitleBar} />
                      <p style={styles.cardTitle}>Change Password</p>
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <Field label="Current Password" value={pw.current} onChange={setPwF('current')} type="password" placeholder="Enter current password" full />
                  </div>
                  <div style={styles.formRow}>
                    <Field label="New Password"     value={pw.newPw}   onChange={setPwF('newPw')}   type="password" placeholder="Min. 6 characters" />
                    <Field label="Confirm Password" value={pw.confirm} onChange={setPwF('confirm')} type="password" placeholder="Re-enter new password" />
                  </div>
                  <div className="profile-action-row" style={styles.actionRow}>
                    <button
                      className="profile-btn-save"
                      style={pwLoading ? styles.saveBtnDisabled : styles.saveBtn}
                      onClick={handleSavePassword}
                      disabled={pwLoading}
                    >
                      {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════
               TAB 2: ORDERS
            ══════════════════════════════════════════════════ */}
            {activeTab === 'orders' && (
              <div className="profile-card" style={styles.card}>
                <div style={styles.cardTitleWrap}>
                  <div style={styles.cardTitleLeft}>
                    <div style={styles.cardTitleBar} />
                    <p style={styles.cardTitle}>Order History ({myOrders?.length || 0})</p>
                  </div>
                  <button
                    style={{
                      background: 'none', border: 'none', color: C.brand,
                      fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: F.main, fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                    onClick={() => navigate('/orders')}
                  >
                    <span>Full Orders View</span>
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }} />
                  </button>
                </div>

                {!myOrders || myOrders.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🛍️</div>
                    <p style={styles.emptyTitle}>No Orders Yet</p>
                    <p style={styles.emptyText}>When you place your first order, it will appear here.</p>
                    <button style={styles.primaryBtn} onClick={() => navigate('/shop')}>
                      Explore Sarees
                    </button>
                  </div>
                ) : (
                  <div className="my-orders-list">
                    {myOrders.map((order) => {
                      const badge = statusStyle(order.status);
                      const itemCount = (order.items || []).reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
                      const firstItem = order.items?.[0];
                      return (
                        <article className="my-order-card" key={order.id}>
                          <div className="my-order-topline">
                            <div>
                              <span className="my-order-label">ORDER</span>
                              <strong>#{order.id}</strong>
                            </div>
                            <span className="my-order-status" style={{ color: badge.color, background: badge.bg }}>
                              <span className="my-order-status-dot" />{labelFor(order.status || 'Processing')}
                            </span>
                          </div>

                          <div className="my-order-summary">
                            {firstItem?.image ? (
                              <img
                                src={firstItem.image}
                                alt={firstItem?.name || ''}
                                className="my-order-image"
                                onError={(e) => {
                                  e.target.src = defaultLogo;
                                  e.target.style.objectFit = 'contain';
                                  e.target.style.background = '#126354';
                                  e.target.style.padding = '4px';
                                }}
                              />
                            ) : (
                              <div className="my-order-image-placeholder"><i className="fa-solid fa-bag-shopping" /></div>
                            )}
                            <div className="my-order-info">
                              <span className="my-order-date">Placed {order.date || 'Date unavailable'}</span>
                              <strong>{firstItem?.name || 'Order items'}</strong>
                              {order.items?.length > 1 && (
                                <span className="my-order-more">
                                  and {order.items.length - 1} more product{order.items.length > 2 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="my-order-total">
                              <span>Total</span>
                              <strong>₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            </div>
                          </div>

                          <div className="my-order-bottom">
                            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                            <button
                              type="button"
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
              </div>
            )}

            {/* ══════════════════════════════════════════════════
               TAB 3: WISHLIST
            ══════════════════════════════════════════════════ */}
            {activeTab === 'wishlist' && (
              <div className="profile-card" style={styles.card}>
                <div style={styles.cardTitleWrap}>
                  <div style={styles.cardTitleLeft}>
                    <div style={styles.cardTitleBar} />
                    <p style={styles.cardTitle}>My Wishlist ({wishlistCount || 0})</p>
                  </div>
                </div>

                {!wishlistItems || wishlistItems.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🤍</div>
                    <p style={styles.emptyTitle}>Your Wishlist is Empty</p>
                    <p style={styles.emptyText}>Explore our collections and save your favorite sarees here.</p>
                    <button style={styles.primaryBtn} onClick={() => navigate('/shop')}>
                      Browse Collections
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
                          borderRadius: '8px',
                          background: '#fff',
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
                            border: `1px solid ${C.border}`,
                            borderRadius: '4px',
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

                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: C.brand, fontFamily: F.main, fontWeight: 500 }}>
                            {item.name}
                          </h4>
                          {item.subtitle && (
                            <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.muted, fontFamily: F.sub }}>
                              {item.subtitle}
                            </p>
                          )}
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: C.brand }}>
                            ₹{(Number(item.price) || 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                          <button
                            className="item-action-btn"
                            style={{
                              padding: '8px 18px',
                              background: C.brand,
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              letterSpacing: '1.5px',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              fontFamily: F.main,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                            }}
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
                              showToast(`${item.name} moved to cart!`);
                            }}
                          >
                            <i className="fa-solid fa-bag-shopping" style={{ fontSize: '11px' }} />
                            <span>Move to Cart</span>
                          </button>

                          <button
                            style={{
                              padding: '8px 12px',
                              background: 'transparent',
                              border: `1px solid ${C.border}`,
                              borderRadius: '6px',
                              color: C.muted,
                              cursor: 'pointer',
                              fontSize: '12px',
                              transition: 'color 0.2s',
                            }}
                            title="Remove from Wishlist"
                            onClick={() => removeFromWishlist(item.id)}
                          >
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════
               TAB 4: CART
            ══════════════════════════════════════════════════ */}
            {activeTab === 'cart' && (
              <div className="profile-card" style={styles.card}>
                <div style={styles.cardTitleWrap}>
                  <div style={styles.cardTitleLeft}>
                    <div style={styles.cardTitleBar} />
                    <p style={styles.cardTitle}>Shopping Cart ({cartCount || 0})</p>
                  </div>
                </div>

                {!cartItems || cartItems.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🛒</div>
                    <p style={styles.emptyTitle}>Your Cart is Empty</p>
                    <p style={styles.emptyText}>Add some beautiful sarees to your cart and they will show up here.</p>
                    <button style={styles.primaryBtn} onClick={() => navigate('/shop')}>
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
                            borderRadius: '8px',
                            background: '#fff',
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
                              border: `1px solid ${C.border}`,
                              borderRadius: '4px',
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
                            <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: C.brand, fontFamily: F.main, fontWeight: 500 }}>
                              {item.name}
                            </h4>
                            {item.subtitle && (
                              <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.muted, fontFamily: F.sub }}>
                                {item.subtitle}
                              </p>
                            )}
                            <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>
                              Unit Price: ₹{(Number(item.price) || 0).toLocaleString('en-IN')}
                            </p>
                          </div>

                          {/* Quantity Selector */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              border: `1px solid ${C.border}`,
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              style={{
                                width: '28px', height: '28px', border: 'none', background: '#F8F6F1',
                                color: C.brand, cursor: 'pointer', fontSize: '14px',
                              }}
                              onClick={() => updateQty(item.id, -1)}
                            >
                              -
                            </button>
                            <span style={{ width: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: C.brand }}>
                              {item.qty}
                            </span>
                            <button
                              style={{
                                width: '28px', height: '28px', border: 'none', background: '#F8F6F1',
                                color: C.brand, cursor: 'pointer', fontSize: '14px',
                              }}
                              onClick={() => updateQty(item.id, 1)}
                            >
                              +
                            </button>
                          </div>

                          <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 600, color: C.brand, fontSize: '14px' }}>
                            ₹{((Number(item.price) || 0) * (Number(item.qty) || 1)).toLocaleString('en-IN')}
                          </div>

                          <button
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: C.muted,
                              cursor: 'pointer',
                              padding: '6px',
                              fontSize: '14px',
                            }}
                            title="Remove Item"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Cart Total & Checkout Bar */}
                    <div
                      style={{
                        padding: '20px',
                        background: '#FAF9F6',
                        border: `1px solid ${C.border}`,
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', color: C.muted, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block' }}>
                          Subtotal ({cartCount} item{cartCount > 1 ? 's' : ''})
                        </span>
                        <strong style={{ fontSize: '20px', color: C.brand, fontFamily: F.main }}>
                          ₹{(Number(subtotal) || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: C.brand,
                            border: `1px solid ${C.brand}`,
                            borderRadius: '8px',
                            fontSize: '11px',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            fontFamily: F.main,
                          }}
                          onClick={() => navigate('/shop')}
                        >
                          Continue Shopping
                        </button>
                        <button
                          style={{
                            padding: '12px 28px',
                            background: C.brand,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '11px',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            fontFamily: F.main,
                            fontWeight: 400,
                          }}
                          onClick={() => navigate('/checkout')}
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
