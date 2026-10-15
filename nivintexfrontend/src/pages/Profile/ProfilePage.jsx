import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';





const F = {
  main:    "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif",
  sub:     "'Raleway', 'Josefin Sans', sans-serif",
};

const C = {
  brand:   '#0f5447',
  accent:  '#0f5447',
  border:  '#EAE4D6',
  surface: '#FFFFFF',
  muted:   '#6B6B8A',
  bg:      '#EAF0E2',
  success: '#2E9E6B',
  danger:  '#E05252',
  gold:    '#C9933A',
};

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
    background: active ? 'rgba(31,92,68,0.05)' : 'transparent',
    borderLeft: `2px solid ${active ? C.brand : 'transparent'}`,
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
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '28px', paddingBottom: '16px',
    borderBottom: `1px solid ${C.border}`,
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
  input: (focused) => ({
    width: '100%', padding: '11px 2px', fontSize: '14px',
    color: C.brand, background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${focused ? C.brand : C.border}`,
    borderRadius: 0, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.25s',
    fontFamily: F.sub, fontWeight: 300, letterSpacing: '1px',
  }),

  actionRow: {
    display: 'flex', gap: '12px', justifyContent: 'flex-end',
    marginTop: '8px', paddingTop: '22px',
    borderTop: `1px solid ${C.border}`,
  },
  saveBtn: {
    padding: '12px 36px',
    background: C.brand, color: '#fff',
    border: 'none', borderRadius: 0,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '3px', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: F.main,
    transition: 'opacity 0.2s',
  },
  saveBtnDisabled: {
    padding: '12px 36px',
    background: '#aaa', color: '#fff',
    border: 'none', borderRadius: 0,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '3px', textTransform: 'uppercase',
    cursor: 'not-allowed', fontFamily: F.main,
  },
  discardBtn: {
    padding: '12px 28px',
    background: 'transparent', color: C.muted,
    border: `1px solid ${C.border}`, borderRadius: 0,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '2.5px', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: F.main,
  },

  toast: (show, isError) => ({
    position: 'fixed', bottom: '32px', right: '32px',
    background: isError ? C.danger : C.brand,
    color: '#fff',
    padding: '14px 28px',
    borderRadius: 0,
    borderLeft: `3px solid ${isError ? '#c0392b' : C.gold}`,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '2px', textTransform: 'uppercase',
    fontFamily: F.main,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.3s, transform 0.3s',
    pointerEvents: 'none', zIndex: 9999,
  }),
};

const Field = ({ label, value, onChange, type = 'text', placeholder = '', full = false }) => {

  const [focused, setFocused] = useState(false);
  return (
    <div style={full ? styles.fieldWrapFull : styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input(focused)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, changePassword, cartCount, wishlistCount, myOrders } = useShop();

  // Removed redundant runtime font injection

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user.username ? user.username[0].toUpperCase() : '?');

  const [profile, setProfile] = useState({
    name:  user.name || user.username || '',
    phone: user.phone || '',
    email: user.email || '',
  });
  const setP = (key) => (val) => setProfile(p => ({ ...p, [key]: val }));

  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const setPwF = (key) => (val) => setPw(p => ({ ...p, [key]: val }));

  const [toast, setToast] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const [toastError, setToastError] = useState(false);

  const showToast = (msg, isError = false) => {
    setToast(msg); setToastError(isError); setToastShow(true);
    setTimeout(() => setToastShow(false), 3000);
  };

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
    { icon: 'fa-regular fa-user',        label: 'My Profile', hash: '#profile',  badge: null },
    { icon: 'fa-solid fa-truck',         label: 'My Orders',  hash: '#orders',   badge: myOrders?.length || 0 },
    { icon: 'fa-regular fa-heart',       label: 'Wishlist',   hash: '#wishlist', badge: wishlistCount || 0 },
    { icon: 'fa-solid fa-cart-shopping', label: 'Cart',       hash: '#cart',     badge: cartCount || 0 },
  ];

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
      `}</style>
      <Header />
      <div className="profile-inner" style={styles.inner}>

        {/* ── Page Heading ── */}
        <div style={styles.topRow}>
          <div style={styles.headingWrap}>
            <span style={styles.headingLine} />
            <div>
              <h1 style={styles.heading}>My Profile</h1>
              <p style={styles.subHead}>Manage your personal information</p>
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
              {navLinks.map(({ icon, label, hash, badge }, i) => {
                const active = window.location.hash === hash;
                const isLast = i === navLinks.length - 1;
                return (
                  <div
                    key={hash}
                    style={{
                      ...styles.navItem(active),
                      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                    }}
                    onClick={() => navigate(hash)}
                  >
                    <i className={icon} style={styles.navIcon(active)} />
                    {label}
                    {badge > 0 && <span style={styles.navBadge}>{badge}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Main Content ── */}
          <div style={styles.main}>

            {/* Edit Profile */}
            <div className="profile-card" style={styles.card}>
              <div style={styles.cardTitleWrap}>
                <div style={styles.cardTitleBar} />
                <p style={styles.cardTitle}>Edit Profile</p>
              </div>
              <div style={styles.formRow}>
                <Field label="Full Name"    value={profile.name}  onChange={setP('name')}  placeholder="Your full name" />
                <Field label="Phone Number" value={profile.phone} onChange={setP('phone')} placeholder="+91 00000 00000" type="tel" />
              </div>
              <div style={styles.formRow}>
                <Field label="Email Address" value={profile.email} onChange={setP('email')} placeholder="you@example.com" type="email" full />
              </div>
              <div style={styles.actionRow}>
                <button style={styles.discardBtn} onClick={handleDiscard}>Discard</button>
                <button
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
                <div style={styles.cardTitleBar} />
                <p style={styles.cardTitle}>Change Password</p>
              </div>
              <div style={styles.formRow}>
                <Field label="Current Password" value={pw.current} onChange={setPwF('current')} type="password" placeholder="Enter current password" full />
              </div>
              <div style={styles.formRow}>
                <Field label="New Password"     value={pw.newPw}   onChange={setPwF('newPw')}   type="password" placeholder="Min. 6 characters" />
                <Field label="Confirm Password" value={pw.confirm} onChange={setPwF('confirm')} type="password" placeholder="Re-enter new password" />
              </div>
              <div style={styles.actionRow}>
                <button
                  style={pwLoading ? styles.saveBtnDisabled : styles.saveBtn}
                  onClick={handleSavePassword}
                  disabled={pwLoading}
                >
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
      <div style={styles.toast(toastShow, toastError)}>{toast}</div>
    </div>
  );
};

export default ProfilePage;
