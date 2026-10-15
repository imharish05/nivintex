import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import { categoryApi, subCategoryApi, productApi, getImageUrl } from '../utils/api';
import logo from '../assets/img/logo2.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Skeleton, { CategoryCircleSkeleton } from './Skeleton';

// Fonts are loaded via index.html

const BASE_API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const F = {
  main: "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

// Default fallback colors (used before API response)
const DEFAULT_COLORS = {
  brand:   '#0f5447',
  accent:  '#126354',
  green:   '#A2C579',
  navHover: '#A2C579',
  text:    '#ffffff',
  gold:    '#C9933A',
  border:  'rgba(255,255,255,0.25)',
  surface: '#FFFFFF',
  muted:   '#6B7A6B',
  bg:      '#F4F0E8',
  bgBorder:'#EAE4D6',
  danger:  '#E05252',
};

const TRENDING_SEARCHES = [
  'Co-ord Sets',
  'Cotton Maxi',
  '3PCS',
  'Chanderi Silk',
  'Rayon Frock',
  'Handloom Maxi',
  'Cotton Salwars',
  'Jamdani Maxi',
];

const styles = {
  // ── Announcement bar ──────────────────────────────────────────────────────
  topBar: {
    background: '#0f5447',
    padding: '7px 0',
    fontSize: '11px',
    letterSpacing: '1.5px',
    fontFamily: F.main,
  },
  topInner: {
    maxWidth: '1400px', margin: '0 auto', padding: '0 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  topLeft:  { display: 'flex', gap: '24px', listStyle: 'none', margin: 0, padding: 0 },
  topItem:  {
    color: 'rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontFamily: F.main, letterSpacing: '1.5px', fontWeight: 300,
  },
  topLink:  { color: 'rgba(255,255,255,0.82)', textDecoration: 'none', fontFamily: F.main },

  // ── Header ──
  headerWrap: () => ({
    background: '#0f5447',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 999,
    transition: 'background 0.35s ease, box-shadow 0.35s ease',
    fontFamily: F.main,
  }),
  headerInner: {
    maxWidth: '1400px', margin: '0 auto',
    padding: '0 clamp(16px, 3vw, 40px)',
    display: 'flex', alignItems: 'center',
    height: '68px', gap: '0',
  },

  logoLink: { flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: 'clamp(12px, 3vw, 40px)' },
  logoImg:  { height: 'clamp(38px, 5vw, 50px)', width: 'auto', display: 'block' },

  nav:     { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  navList: { display: 'flex', gap: '2px', listStyle: 'none', margin: 0, padding: 0, position: 'relative', alignItems: 'center' },

  navLink: (active) => ({
    color: active ? '#A2C579' : '#fff',
    fontWeight: active ? 400 : 300,
    fontSize: '12px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    textDecoration: 'none',
    padding: '8px 16px',
    display: 'flex', alignItems: 'center', gap: '5px',
    transition: 'color 0.2s, background 0.2s',
    background: active ? 'rgba(162,197,121,0.1)' : 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: F.main,
  }),

  // ── Collections dropdown ──────────────────────────────────────────────────
  collectionsWrap: { position: 'relative' },
  collDropdown: (visible) => ({
    position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
    transform: visible
      ? 'translateX(-50%) translateY(0) scale(1)'
      : 'translateX(-50%) translateY(-8px) scale(0.97)',
    minWidth: 'min(680px, calc(100vw - 32px))',
    maxWidth: 'calc(100vw - 32px)',
    background: '#FFFFFF',
    border: '1px solid #EAE4D6',
    boxShadow: '0 16px 48px rgba(31,92,68,0.14)',
    overflow: 'hidden', zIndex: 1200,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'all' : 'none',
    transition: 'opacity 0.22s ease, transform 0.22s ease',
  }),
  collHeader: {
    padding: '14px 20px 10px', borderBottom: '1px solid #EAE4D6',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  collHeaderTitle: {
    margin: 0, fontSize: '10px', fontWeight: 400, color: '#C9933A',
    letterSpacing: '3px', textTransform: 'uppercase', fontFamily: F.main,
  },
  collViewAll: {
    fontSize: '11px', color: '#0f5447', textDecoration: 'none', fontWeight: 300,
    display: 'flex', alignItems: 'center', gap: '4px',
    letterSpacing: '2px', textTransform: 'uppercase', fontFamily: F.main,
  },
  collGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2px', padding: '12px', maxHeight: '380px', overflowY: 'auto',
  },
  collItem: (hovered) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', padding: '12px 8px', cursor: 'pointer',
    textDecoration: 'none', transition: 'background 0.15s',
    background: hovered ? 'rgba(31,92,68,0.05)' : 'transparent',
  }),
  collCircle: {
    width: '64px', height: '64px', borderRadius: '50%',
    overflow: 'hidden', border: '2px solid #EAE4D6',
    background: '#F4F0E8', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  collCircleImg:      { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' },
  collCircleFallback: { fontSize: '22px' },
  collLabel: {
    fontSize: '11px', color: '#0f5447', fontWeight: 300,
    textAlign: 'center', lineHeight: 1.3,
    fontFamily: F.main, letterSpacing: '1px',
  },
  collLoading: {
    padding: '32px', textAlign: 'center', fontSize: '12px',
    color: '#6B7A6B', fontFamily: F.main, letterSpacing: '1px',
  },
  collEmpty: {
    padding: '32px', textAlign: 'center', fontSize: '12px',
    color: '#6B7A6B', fontFamily: F.main, letterSpacing: '1px',
  },

  // ── Right actions ─────────────────────────────────────────────────────────
  actions: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: 'clamp(8px, 2vw, 32px)' },

  iconBtn: (active) => ({
    position: 'relative', width: '38px', height: '38px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', background: 'transparent',
    cursor: 'pointer', color: active ? '#A2C579' : '#fff',
    fontSize: '15px', transition: 'color 0.2s',
    fontFamily: F.main,
  }),

  // ── Badge (cart/wishlist count circle) ──────────────────────────────────
  badge: () => ({
    position: 'absolute', top: '-6px', right: '-6px',
    background: '#C9933A', color: '#fff',
    borderRadius: '50%',
    minWidth: '18px', height: '18px', padding: '0 4px',
    fontSize: '10px', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #0f5447',
    lineHeight: 1,
    fontFamily: F.main,
    boxSizing: 'border-box',
    transition: 'border-color 0.35s ease',
  }),

  accountWrap: { position: 'relative' },
  accountBtn: (open) => ({
    display: 'flex', alignItems: 'center',
    padding: '0',
    border: 'none', background: 'transparent',
    cursor: 'pointer', color: open ? '#A2C579' : '#fff',
    fontSize: '15px', transition: 'color 0.2s',
    width: '38px', height: '38px', justifyContent: 'center',
    fontFamily: F.main,
  }),

  dropdown: (visible) => ({
    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
    minWidth: '230px', maxWidth: 'calc(100vw - 24px)', background: '#FFFFFF',
    border: '1px solid #EAE4D6',
    boxShadow: '0 12px 40px rgba(31,92,68,0.14)',
    overflow: 'hidden', zIndex: 1100,
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
    pointerEvents: visible ? 'all' : 'none',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    fontFamily: F.main,
    borderTop: '3px solid #0f5447',
  }),
  profileCard: {
    padding: '16px 18px 14px', borderBottom: '1px solid #EAE4D6',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  profileAvatar: {
    width: '38px', height: '38px', background: '#0f5447',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 300, flexShrink: 0,
    fontFamily: F.main, letterSpacing: '1px',
  },
  profileName: {
    margin: 0, fontSize: '13px', fontWeight: 400, color: '#0f5447',
    fontFamily: F.main, letterSpacing: '1.5px', textTransform: 'uppercase',
  },
  profileEmail: {
    margin: 0, fontSize: '11px', color: '#6B7A6B',
    fontFamily: F.sub, fontWeight: 300, letterSpacing: '0.3px',
  },
  dropItem: (danger) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 18px', fontSize: '11px', fontWeight: 300,
    letterSpacing: '2px', textTransform: 'uppercase',
    color: danger ? '#E05252' : '#0f5447', cursor: 'pointer',
    textDecoration: 'none', transition: 'background 0.15s',
    background: 'transparent', width: '100%', border: 'none',
    textAlign: 'left', boxSizing: 'border-box',
    fontFamily: F.main,
  }),
  dropIcon: (danger) => ({
    width: '28px', height: '28px',
    background: danger ? 'rgba(224,82,82,0.09)' : 'rgba(15,84,71,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', color: danger ? '#E05252' : '#0f5447', flexShrink: 0,
  }),
  dropDivider:  { height: '1px', background: '#EAE4D6', margin: '4px 0' },

  guestPanel: {
    padding: '20px 18px', borderBottom: '1px solid #EAE4D6',
    textAlign: 'center',
  },
  guestIcon: {
    width: '48px', height: '48px', background: '#F4F0E8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px', fontSize: '20px', color: '#6B7A6B',
    border: '1px solid #EAE4D6',
  },
  guestTitle: {
    margin: '0 0 4px', fontSize: '13px', fontWeight: 300, color: '#0f5447',
    fontFamily: F.main, letterSpacing: '3px', textTransform: 'uppercase',
  },
  guestSub: {
    margin: '0 0 14px', fontSize: '11px', color: '#6B7A6B',
    fontFamily: F.sub, fontWeight: 300, letterSpacing: '0.5px',
  },
  signInBtn: {
    display: 'block', width: '100%', padding: '10px 0',
    background: '#0f5447', color: '#fff', border: 'none',
    fontSize: '11px', fontWeight: 300, cursor: 'pointer',
    textDecoration: 'none', textAlign: 'center',
    letterSpacing: '3px', textTransform: 'uppercase',
    fontFamily: F.main,
  },
  registerLink: {
    display: 'block', marginTop: '10px', fontSize: '11px', color: '#6B7A6B',
    textDecoration: 'none', fontFamily: F.sub, fontWeight: 300, letterSpacing: '1px',
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────
const DropItem = ({ icon, label, onClick, danger }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        ...styles.dropItem(danger),
        background: hovered ? (danger ? 'rgba(224,82,82,0.05)' : 'rgba(31,92,68,0.05)') : 'transparent',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={styles.dropIcon(danger)}><i className={icon} /></span>
      {label}
    </button>
  );
};

const CollItem = ({ cat, onNavigate }) => {
  const [hovered, setHovered] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const imgUrl = getImageUrl(cat.image || cat.image_url || cat.imageUrl || cat.category_image || cat.categoryImage || cat.photo);
  return (
    <div
      style={styles.collItem(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate(cat)}
      role="link" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(cat); }}
    >
      <div style={styles.collCircle}>
        {imgUrl && !imgErr
          ? <img src={imgUrl} alt={cat.name} style={styles.collCircleImg} onError={() => setImgErr(true)} />
          : (
            <div style={{ ...styles.collCircleFallback, background: '#126354', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <img src={logo} alt="Fashion Aura" style={{ width: '75%', height: 'auto', objectFit: 'contain' }} />
            </div>
          )}
      </div>
      <span style={styles.collLabel}>{cat.name}</span>
    </div>
  );
};

const NavLinkCmp = ({ label, path, active, onClick, children, asSpan, hoverColor, textColor }) => {
  const [hovered, setHovered] = useState(false);
  const navHover = hoverColor || '#A2C579';
  const navText  = textColor  || '#ffffff';
  const computed = {
    ...styles.navLink(active),
    color: (hovered || active) ? navHover : navText,
    background: (hovered || active) ? 'rgba(162,197,121,0.1)' : 'transparent',
  };
  if (asSpan) {
    return (
      <span style={computed} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {children || label}
      </span>
    );
  }
  const handleClick = (event) => {
    onClick?.(event);
    if ((path || '/') === '/') window.scrollTo(0, 0);
  };
  return (
    <Link to={path || '/'} style={computed} onClick={handleClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {label || children}
    </Link>
  );
};

const IconBtn = ({ active, title, onClick, children, hoverColor, textColor }) => {
  const [hovered, setHovered] = useState(false);
  const navHover = hoverColor || '#A2C579';
  const navText  = textColor  || '#ffffff';
  return (
    <button onClick={onClick} title={title}
      style={{ ...styles.iconBtn(active), color: (hovered || active) ? navHover : navText }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
    </button>
  );
};

// ── Main Header ───────────────────────────────────────────────────────────────
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSaleProducts, setHasSaleProducts] = useState(false);
  const [cartOpen, setCartOpen]       = useState(false);
  const [wishOpen, setWishOpen]       = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [collOpen, setCollOpen]       = useState(false);
  const [collHovered, setCollHovered] = useState(false);
  const [categories, setCategories]   = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [catLoading, setCatLoading]   = useState(false);
  const [catFetched, setCatFetched]   = useState(false);
  const [accHovered, setAccHovered]   = useState(false);
  const [mobileNavOpen, setMobileNavOpen]   = useState(false);
  const [mobileCollOpen, setMobileCollOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const page = location.pathname;

  useEffect(() => {
    setMobileNavOpen(false);
    setAccountOpen(false);
    setCollOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
      fetchCategories();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  // ── Dynamic site colors from admin settings ──
  const [C, setC] = useState(DEFAULT_COLORS);

  useEffect(() => {
    fetch(`${BASE_API}/site-settings/public`)
      .then(r => r.json())
      .then(data => {
        setC(prev => ({
          ...prev,
          brand:    data.headerBgColor      || prev.brand,
          accent:   data.headerAccentColor  || prev.accent,
          text:     data.headerTextColor    || prev.text,
          navHover: data.headerNavHoverColor || prev.navHover,
        }));
      })
      .catch(() => {}); // silently fall back to defaults
  }, []);

  useEffect(() => {
    productApi.getAll()
      .then((data) => {
        const hasSale = Array.isArray(data) && data.some(p => p.isBuyOneGetOne);
        setHasSaleProducts(hasSale);
      })
      .catch((err) => console.error('[Header] check sale products:', err));
  }, []);

  const accountRef = useRef(null);
  const collRef    = useRef(null);
  const collListRef = useRef(null);
  const accTimer   = useRef(null);
  const collTimer  = useRef(null);
  const searchRef  = useRef(null);
  const searchModalRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchSequence = useRef(0);

  const { cartCount, wishlistCount, user, logout } = useShop();

  useEffect(() => {
    const handleClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (collRef.current    && !collRef.current.contains(e.target))    { setCollOpen(false); setCollHovered(false); }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (!mobileNavOpen) {
      document.body.style.overflow = '';
    }
    return () => {
      if (!mobileNavOpen) document.body.style.overflow = '';
    };
  }, [searchOpen, mobileNavOpen]);

  useEffect(() => {
    const sequence = ++searchSequence.current;
    const query = searchQuery.trim();
    if (!searchOpen || query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return undefined;
    }

    const timer = setTimeout(() => {
      setSearchLoading(true);
      setSearchError('');
      productApi.search(query)
        .then(results => {
          if (searchSequence.current === sequence) setSearchResults(Array.isArray(results) ? results : []);
        })
        .catch(error => {
          if (searchSequence.current === sequence) {
            setSearchResults([]);
            setSearchError(error.message || 'Search is unavailable right now.');
          }
        })
        .finally(() => {
          if (searchSequence.current === sequence) setSearchLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchOpen, searchQuery]);

  const openProductFromSearch = (product) => {
    sessionStorage.setItem('selectedProduct', JSON.stringify({ id: product.id }));
    setSearchOpen(false);
    setSearchQuery('');
    navigate('/product-details');
    window.scrollTo(0, 0);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    setMobileNavOpen(false);
    sessionStorage.setItem('shopSearchQuery', query);
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    window.scrollTo(0, 0);
  };

  const handleSelectTrending = (term) => {
    setSearchQuery(term);
    searchInputRef.current?.focus();
  };

  const fetchCategories = () => {
    if (catFetched) return;
    setCatLoading(true); setCatFetched(true);
    categoryApi.getAll()
      .then((categoryData) => {
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        subCategoryApi.getAll()
          .then((subcategoryData) => setSubcategories(Array.isArray(subcategoryData) ? subcategoryData : []))
          .catch((err) => {
            setSubcategories([]);
            console.error('[Header] subcategories:', err.message);
          });
      })
      .catch((err) => {
        setCatFetched(false);
        console.error('[Header] categories:', err.message);
      })
      .finally(() => setCatLoading(false));
  };

  const handleCollEnter = () => {
    clearTimeout(collTimer.current);
    fetchCategories();
    if (collListRef.current) collListRef.current.scrollTop = 0;
    setCollOpen(true);
    setCollHovered(true);
  };
  const handleCollLeave = () => { collTimer.current = setTimeout(() => { setCollOpen(false); setCollHovered(false); }, 160); };
  const handleAccEnter  = () => { clearTimeout(accTimer.current); setAccountOpen(true); };
  const handleAccLeave  = () => { accTimer.current = setTimeout(() => setAccountOpen(false), 160); };

  // ── Navigate to Shop page pre-filtered by the chosen category ──
  const handleCatNav = (cat) => {
    setCollOpen(false);
    sessionStorage.setItem('selectedCategory', JSON.stringify({ id: cat.id, name: cat.name }));
    sessionStorage.removeItem('shopCategoryId');
    sessionStorage.removeItem('shopSubCategoryId');
    window.dispatchEvent(new CustomEvent('categorySelected', { detail: cat.id }));
    navigate('/shop');
  };

  const handleSubCategoryNav = (cat, subcategory) => {
    setCollOpen(false);
    sessionStorage.setItem('selectedCategory', JSON.stringify({ id: cat.id, name: cat.name }));
    sessionStorage.removeItem('shopCategoryId');
    sessionStorage.setItem('shopSubCategoryId', String(subcategory.id));
    navigate('/shop');
  };

  const navItems = [
    { label: 'Home',    path: '/'    },
    { label: 'About',   path: '/about'   },
    { label: 'Shop',    path: '/shop'    },
    { label: 'Contact', path: '/contact' },
  ];

  if (hasSaleProducts) {
    navItems.push({ label: 'Sale', path: '/sale' });
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <>
      <div style={{ height: '68px' }} />

      <header style={{ ...styles.headerWrap(), background: C.brand }} id="header-sticky">
        <div style={styles.headerInner}>

          {/* Logo */}
          <Link to="/" style={styles.logoLink}>
            <img src={logo} alt="Fashion Aura" style={styles.logoImg} />
          </Link>

          {/* Nav */}
          <nav className="d-none d-xl-flex" style={styles.nav}>
            <ul style={styles.navList}>
              {navItems.map(({ label, path }) => (
                <React.Fragment key={path}>
                  <li>
                    <NavLinkCmp
                      label={label} path={path}
                      active={page === path || (path === '/' && page === '/home')}
                      hoverColor={C.navHover}
                      textColor={C.text}
                    />
                  </li>

                  {/* Collections dropdown, placed right after About */}
                  {path === '/about' && (
                    <li
                      ref={collRef}
                      style={styles.collectionsWrap}
                      onMouseEnter={handleCollEnter}
                      onMouseLeave={handleCollLeave}
                    >
                      <NavLinkCmp asSpan active={collOpen || collHovered} hoverColor={C.navHover} textColor={C.text}>
                        Collections&nbsp;
                        <i className="fa-solid fa-chevron-down" style={{
                          fontSize: '8px', transition: 'transform 0.25s',
                          transform: collOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }} />
                      </NavLinkCmp>

                      <div style={styles.collDropdown(collOpen)}>
                        <div style={styles.collHeader}>
                          <p style={styles.collHeaderTitle}>All Collections</p>
                          <Link to="/shop" style={styles.collViewAll}
                            onClick={() => setCollOpen(false)}>
                            View All <i className="fa-solid fa-arrow-right" style={{ fontSize: '9px' }} />
                          </Link>
                        </div>
                        {catLoading ? (
                          <div style={styles.collGrid}>
                            {[...Array(8)].map((_, i) => (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 8px' }}>
                                <CategoryCircleSkeleton size={64} />
                              </div>
                            ))}
                          </div>
                        ) : categories.length === 0 ? (
                          <div style={styles.collEmpty}>No collections found.</div>
                        ) : (
                          <div ref={collListRef} style={styles.collGrid}>
                            {categories.map(cat => (
                              <CollItem key={cat.id} cat={cat} onNavigate={handleCatNav} />
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div style={styles.actions}>

            {/* Database-backed product search */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <IconBtn
                active={searchOpen}
                title="Search products"
                hoverColor={C.navHover}
                textColor={C.text}
                onClick={() => {
                  setSearchOpen(open => !open);
                  fetchCategories();
                }}
              >
                <i className="fa-solid fa-magnifying-glass" />
              </IconBtn>
            </div>

            {/* Wishlist */}
            <IconBtn active={wishOpen} title="Wishlist" hoverColor={C.navHover} textColor={C.text} onClick={() => { setWishOpen(true); setCartOpen(false); }}>
              <i className="fa-regular fa-heart" />
              {wishlistCount > 0 && <span style={styles.badge()}>{wishlistCount}</span>}
            </IconBtn>

            {/* Cart */}
            <IconBtn active={cartOpen} title="Cart" hoverColor={C.navHover} textColor={C.text} onClick={() => { setCartOpen(true); setWishOpen(false); }}>
              <i className="fa-solid fa-bag-shopping" />
              {cartCount > 0 && <span style={styles.badge()}>{cartCount}</span>}
            </IconBtn>

            {/* Account */}
            <div ref={accountRef} style={styles.accountWrap}
              onMouseEnter={handleAccEnter} onMouseLeave={handleAccLeave}>
              <button
                style={{
                  ...styles.accountBtn(accountOpen),
                  color: (accountOpen || accHovered) ? C.navHover : C.text,
                }}
                onClick={() => setAccountOpen(o => !o)}
                onMouseEnter={() => setAccHovered(true)}
                onMouseLeave={() => setAccHovered(false)}
              >
                {user
                  ? <span style={{
                      fontSize: '12px', fontWeight: 300,
                      background: C.accent,
                      width: '28px', height: '28px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontFamily: F.main, letterSpacing: '1px',
                    }}>
                      {initials || <i className="fa-solid fa-user" style={{ fontSize: '11px' }} />}
                    </span>
                  : <i className="fa-regular fa-user" />
                }
              </button>

              <div style={styles.dropdown(accountOpen)}>
                {user ? (
                  <>
                    <div style={styles.profileCard}>
                      <div style={styles.profileAvatar}>{initials}</div>
                      <div>
                        <p style={styles.profileName}>{user.name}</p>
                        <p style={styles.profileEmail}>{user.email}</p>
                      </div>
                    </div>
                    <DropItem icon="fa-solid fa-user"               label="My Profile" onClick={() => { navigate('/profile'); setAccountOpen(false); }} />
                    <DropItem icon="fa-solid fa-truck"              label="My Orders"  onClick={() => { navigate('/orders');  setAccountOpen(false); }} />
                    <div style={styles.dropDivider} />
                    <DropItem icon="fa-solid fa-right-from-bracket" label="Logout"     onClick={() => { setAccountOpen(false); logout(); }} danger />
                  </>
                ) : (
                  <div style={styles.guestPanel}>
                    <div style={styles.guestIcon}><i className="fa-regular fa-user" /></div>
                    <p style={styles.guestTitle}>Welcome</p>
                    <p style={styles.guestSub}>Sign in for orders, wishlist & more</p>
                    <Link to="/login" style={styles.signInBtn}
                      onClick={() => setAccountOpen(false)}>
                      Sign In
                    </Link>
                    <Link to="/register" style={styles.registerLink}
                      onClick={() => setAccountOpen(false)}>
                      New customer? Create account
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="d-xl-none"
              aria-label="Toggle Navigation Menu"
              onClick={() => setMobileNavOpen(true)}
              style={{ ...styles.iconBtn(false), color: C.text }}
            >
              <i className="fas fa-bars" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={`mobile-nav-backdrop ${mobileNavOpen ? 'open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside
        className={`mobile-nav-drawer ${mobileNavOpen ? 'open' : ''}`}
        style={{ fontFamily: F.main }}
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: C.brand, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Link to="/" onClick={() => setMobileNavOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src={logo} alt="Fashion Aura" style={{ height: '36px', width: 'auto' }} />
          </Link>
          <button
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close Navigation Menu"
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: '15px' }} />
          </button>
        </div>

        {/* User Card if logged in */}
        {user ? (
          <div style={{ padding: '16px 20px', background: '#F4F0E8', borderBottom: '1px solid #EAE4D6', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: C.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
              {initials || <i className="fa-solid fa-user" />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.brand, textTransform: 'uppercase', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7A6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        ) : null}

        {/* Mobile search bar inside drawer */}
        <div style={{ padding: '12px 18px', background: '#F8F6F0', borderBottom: '1px solid #EAE4D6' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                handleSearchSubmit(e);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1px solid #D9D2C5',
              borderRadius: '24px',
              padding: '8px 14px',
              gap: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ color: C.brand, fontSize: '14px' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setMobileNavOpen(false);
                setSearchOpen(true);
                fetchCategories();
              }}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '14px',
                fontFamily: F.main,
                color: '#2C2F33',
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '13px',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            ) : null}
          </form>
        </div>

        {/* Navigation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {navItems.map(({ label, path }) => (
            <React.Fragment key={path}>
              <Link
                to={path}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', textDecoration: 'none',
                  color: (page === path || (path === '/' && page === '/home')) ? C.brand : '#2C2F33',
                  fontWeight: (page === path || (path === '/' && page === '/home')) ? 600 : 400,
                  fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase',
                  borderLeft: (page === path || (path === '/' && page === '/home')) ? `3px solid ${C.brand}` : '3px solid transparent',
                  background: (page === path || (path === '/' && page === '/home')) ? 'rgba(15,84,71,0.06)' : 'transparent',
                }}
              >
                <span>{label}</span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', opacity: 0.4 }} />
              </Link>

              {/* Collections Accordion after About */}
              {path === '/about' && (
                <div style={{ borderTop: '1px solid #F4F0E8', borderBottom: '1px solid #F4F0E8' }}>
                  <button
                    type="button"
                    onClick={() => {
                      fetchCategories();
                      setMobileCollOpen(!mobileCollOpen);
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 20px', background: 'none', border: 'none', textAlign: 'left',
                      color: mobileCollOpen ? C.brand : '#2C2F33',
                      fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: F.main,
                    }}
                  >
                    <span>Collections</span>
                    <i className={`fa-solid fa-chevron-${mobileCollOpen ? 'up' : 'down'}`} style={{ fontSize: '10px', color: C.gold }} />
                  </button>

                  {mobileCollOpen && (
                    <div style={{ background: '#FAF8F5', padding: '8px 16px 12px' }}>
                      {catLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                          {[...Array(4)].map((_, i) => (
                            <div key={i} style={{ height: 36, background: '#e8ede4', borderRadius: 4 }} className="fa-skeleton" />
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                          {categories.map(cat => (
                            <div
                              key={cat.id}
                              onClick={() => { setMobileNavOpen(false); handleCatNav(cat); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px', background: '#fff', borderRadius: '4px',
                                cursor: 'pointer', border: '1px solid #EAE4D6',
                              }}
                            >
                              <span style={{ fontSize: '11px', color: C.brand, letterSpacing: '0.5px' }}>
                                {cat.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Link
                        to="/shop"
                        onClick={() => setMobileNavOpen(false)}
                        style={{
                          display: 'block', textAlign: 'center', marginTop: '10px',
                          fontSize: '11px', color: C.brand, letterSpacing: '1.5px',
                          textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600
                        }}
                      >
                        View All Collections &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Account shortcuts */}
          <div style={{ borderTop: '1px solid #EAE4D6', marginTop: '12px', paddingTop: '12px' }}>
            <div style={{ padding: '4px 20px 8px', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>
              Account & Shortcuts
            </div>
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileNavOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#2C2F33', textDecoration: 'none', fontSize: '12px', letterSpacing: '1px' }}
                >
                  <i className="fa-solid fa-user" style={{ width: '16px', color: C.brand }} /> My Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileNavOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#2C2F33', textDecoration: 'none', fontSize: '12px', letterSpacing: '1px' }}
                >
                  <i className="fa-solid fa-truck" style={{ width: '16px', color: C.brand }} /> My Orders
                </Link>
                <button
                  onClick={() => { setMobileNavOpen(false); logout(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#E05252', background: 'none', border: 'none', textAlign: 'left', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', fontFamily: F.main }}
                >
                  <i className="fa-solid fa-right-from-bracket" style={{ width: '16px' }} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileNavOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#2C2F33', textDecoration: 'none', fontSize: '12px', letterSpacing: '1px' }}
                >
                  <i className="fa-regular fa-user" style={{ width: '16px', color: C.brand }} /> Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileNavOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#2C2F33', textDecoration: 'none', fontSize: '12px', letterSpacing: '1px' }}
                >
                  <i className="fa-solid fa-user-plus" style={{ width: '16px', color: C.brand }} /> Create Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom quick actions */}
        <div style={{ padding: '14px 20px', background: '#F4F0E8', borderTop: '1px solid #EAE4D6', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setMobileNavOpen(false); setWishOpen(true); }}
            style={{
              flex: 1, padding: '10px 12px', background: '#fff', border: '1px solid #EAE4D6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              color: C.brand, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.main,
            }}
          >
            <i className="fa-regular fa-heart" /> Wishlist ({wishlistCount})
          </button>
          <button
            onClick={() => { setMobileNavOpen(false); setCartOpen(true); }}
            style={{
              flex: 1, padding: '10px 12px', background: C.brand, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              color: '#fff', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: F.main,
            }}
          >
            <i className="fa-solid fa-bag-shopping" /> Cart ({cartCount})
          </button>
        </div>
      </aside>

      {/* ── Search Overlay / Modal (Responsive: Phone + Laptop) ── */}
      {searchOpen && (
        <div
          ref={searchModalRef}
          className="search-overlay-wrapper"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSearchOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Product Search"
        >
          <div className="search-modal-container" style={{ fontFamily: F.main }}>
            {/* Search Input Bar */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #EAE4D6',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#FFFFFF',
            }}>
              <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '18px', color: C.brand, flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, collections, styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit(e);
                }}
                autoFocus
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontFamily: F.main,
                  color: '#1b332b',
                  background: 'transparent',
                  padding: '4px 0',
                }}
              />

              {searchLoading && (
                <i className="fa-solid fa-circle-notch fa-spin" style={{ color: C.brand, fontSize: '16px' }} />
              )}

              {searchQuery && !searchLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search"
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#8A998A',
                    cursor: 'pointer',
                    fontSize: '15px',
                    padding: '4px 8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                title="Close search (Esc)"
                aria-label="Close search"
                style={{
                  border: '1px solid #EAE4D6',
                  background: '#F4F0E8',
                  color: C.brand,
                  cursor: 'pointer',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="search-results-list" style={{
              maxHeight: 'min(500px, 60vh)',
              overflowY: 'auto',
              background: '#FFFFFF',
              WebkitOverflowScrolling: 'touch',
            }}>
              {/* Error Message */}
              {searchError && (
                <div style={{
                  padding: '16px 20px',
                  background: '#FDF2F2',
                  color: '#D32F2F',
                  fontSize: '13px',
                  borderBottom: '1px solid #FFCDD2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Live Results State */}
              {searchResults.length > 0 ? (
                <div>
                  <div style={{
                    padding: '10px 20px',
                    background: '#FBF9F5',
                    borderBottom: '1px solid #EAE4D6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: '#6B7A6B',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}>
                    <span>Products found ({searchResults.length})</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>Press Enter to view all</span>
                  </div>

                  <div>
                    {searchResults.map((product) => {
                      const img = product.image || product.main_image || product.Images?.[0]?.url;
                      const imgUrl = img ? getImageUrl(img) : null;
                      const price = Number(product.franchise_price_final ?? product.salesPrice ?? product.mrp ?? 0);
                      const mrp = Number(product.mrp || 0);
                      const catName = product.Category?.name || '';

                      return (
                        <div
                          key={product.id}
                          className="search-result-item"
                          onClick={() => openProductFromSearch(product)}
                        >
                          {/* Image thumbnail */}
                          <div style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#F4F0E8',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #EAE4D6',
                          }}>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.productName || product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div style={{
                              display: imgUrl ? 'none' : 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%',
                              background: '#126354',
                            }}>
                              <img src={logo} alt="Fashion Aura" style={{ width: '70%', height: 'auto', objectFit: 'contain' }} />
                            </div>
                          </div>

                          {/* Product Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#1b332b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.3px',
                            }}>
                              {product.productName || product.name}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '3px',
                            }}>
                              {catName && (
                                <span style={{
                                  fontSize: '10px',
                                  color: C.gold,
                                  background: 'rgba(201, 147, 58, 0.1)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                  letterSpacing: '1px',
                                  textTransform: 'uppercase',
                                }}>
                                  {catName}
                                </span>
                              )}
                              <span style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: C.brand,
                              }}>
                                ₹{price.toLocaleString('en-IN')}
                              </span>
                              {mrp > price && (
                                <span style={{
                                  fontSize: '11px',
                                  color: '#999',
                                  textDecoration: 'line-through',
                                }}>
                                  ₹{mrp.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow CTA */}
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(15, 84, 71, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: C.brand,
                            fontSize: '12px',
                            flexShrink: 0,
                          }}>
                            <i className="fa-solid fa-chevron-right" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : searchQuery.trim().length >= 2 && !searchLoading ? (
                /* No Results Found State */
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#F4F0E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#8A998A',
                    fontSize: '22px',
                  }}>
                    <i className="fa-solid fa-magnifying-glass" />
                  </div>
                  <h4 style={{ fontSize: '16px', color: '#1b332b', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px' }}>
                    No products found for "{searchQuery}"
                  </h4>
                  <p style={{ fontSize: '12px', color: '#6B7A6B', margin: '0 0 20px', fontFamily: F.sub }}>
                    Try checking your spelling or use popular keywords below.
                  </p>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/shop');
                    }}
                    style={{
                      background: C.brand,
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 22px',
                      fontSize: '11px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontFamily: F.main,
                    }}
                  >
                    Browse All Products
                  </button>
                </div>
              ) : (
                /* Default State: Popular & Category Suggestions */
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '18px' }}>
                    <p style={{
                      margin: '0 0 10px',
                      fontSize: '11px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: C.gold,
                      fontWeight: 600,
                    }}>
                      Trending Searches
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          className="search-trending-chip"
                          onClick={() => handleSelectTrending(term)}
                        >
                          <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: '10px', opacity: 0.7 }} />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {categories.length > 0 && (
                    <div style={{ borderTop: '1px solid #EAE4D6', paddingTop: '16px' }}>
                      <p style={{
                        margin: '0 0 10px',
                        fontSize: '11px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        color: C.gold,
                        fontWeight: 600,
                      }}>
                        Explore Collections
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                        {categories.slice(0, 8).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSearchOpen(false);
                              handleCatNav(cat);
                            }}
                            style={{
                              padding: '9px 12px',
                              background: '#FAF8F5',
                              border: '1px solid #EAE4D6',
                              borderRadius: '6px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '11px',
                              letterSpacing: '0.5px',
                              color: C.brand,
                              fontFamily: F.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.18s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#FFFFFF';
                              e.currentTarget.style.borderColor = C.brand;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FAF8F5';
                              e.currentTarget.style.borderColor = '#EAE4D6';
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cat.name}
                            </span>
                            <i className="fa-solid fa-chevron-right" style={{ fontSize: '9px', opacity: 0.5 }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {searchResults.length > 0 && (
              <div style={{
                padding: '12px 20px',
                background: '#FAF8F5',
                borderTop: '1px solid #EAE4D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  style={{
                    background: C.brand,
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: F.main,
                    fontWeight: 500,
                  }}
                >
                  <span>View All Results for "{searchQuery}"</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }} />
                </button>
                <span className="d-none d-md-inline" style={{ fontSize: '11px', color: '#8A998A' }}>
                  Press <kbd style={{ padding: '2px 5px', background: '#fff', border: '1px solid #ccc', borderRadius: '3px', fontSize: '10px' }}>ESC</kbd> to exit
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawers */}
      <CartDrawer     open={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer open={wishOpen} onClose={() => setWishOpen(false)} onOpenCart={() => { setCartOpen(true); setWishOpen(false); }} />
    </>
  );
};

export default Header;
