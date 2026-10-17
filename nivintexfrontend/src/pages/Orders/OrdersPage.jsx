import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import defaultLogo from '../../assets/img/logo2.png';
import { useShop } from '../../context/ShopContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';





const F = {
  main: "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

const C = {
  brand:   '#0f5447',
  gold:    '#C9933A',
  border:  '#EAE4D6',
  surface: '#FFFFFF',
  muted:   '#6B6B8A',
  bg:      '#EAF0E2',
  danger:  '#E05252',
};

const STATUS_COLORS = {
  Pending:          { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  pending:          { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  Confirmed:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', dot: '#16A34A' },
  confirmed:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', dot: '#16A34A' },
  Processing:       { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#EA580C' },
  processing:       { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#EA580C' },
  Shipped:          { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' },
  shipped:          { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' },
  out_for_delivery: { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE', dot: '#7C3AED' },
  Delivered:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', dot: '#16A34A' },
  delivered:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', dot: '#16A34A' },
  Cancelled:        { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#DC2626' },
  cancelled:        { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#DC2626' },
};

const labelFor = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Flipkart-style order steps
const STEPS = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered'];
const stepIndex = (status) => {
  const map = {
    pending: 0, Pending: 0,
    confirmed: 0, shipped: 1, out_for_delivery: 2, delivered: 3,
    Confirmed: 0, Shipped: 1, Out_for_delivery: 2, Delivered: 3, Cancelled: -1, cancelled: -1,
  };
  return map[status] ?? 0;
};

const styles = {
  page:  { background: C.bg, minHeight: '100vh', fontFamily: F.main },
  inner: { maxWidth: '960px', margin: '0 auto', padding: '36px 20px 80px' },

  // ── Top heading ──
  topRow: {
    display: 'flex', alignItems: 'center', gap: '14px',
    marginBottom: '28px', paddingBottom: '18px',
    borderBottom: `1px solid ${C.border}`,
  },
  headingLine: { width: '32px', height: '1px', background: C.gold },
  heading: {
    margin: 0, fontSize: '24px', fontWeight: 300,
    color: C.brand, letterSpacing: '6px', textTransform: 'uppercase',
    fontFamily: F.main,
  },
  subHead: {
    margin: '5px 0 0', fontSize: '12px', color: C.muted,
    letterSpacing: '2px', fontWeight: 300, fontFamily: F.sub,
  },

  sectionLabel: {
    fontSize: '10px', fontWeight: 400, color: C.gold,
    letterSpacing: '3px', textTransform: 'uppercase',
    fontFamily: F.main, marginBottom: '16px',
  },

  // ── Empty state ──
  emptyCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    padding: '64px 24px', textAlign: 'center',
    boxShadow: '0 2px 12px rgba(31,92,68,0.06)',
  },
  emptyIcon:  { fontSize: '44px', marginBottom: '16px', opacity: 0.3 },
  emptyTitle: {
    margin: '0 0 8px', fontSize: '16px', fontWeight: 300,
    color: C.brand, letterSpacing: '3px', textTransform: 'uppercase', fontFamily: F.main,
  },
  emptySub: {
    margin: '0 0 24px', fontSize: '12px', color: C.muted,
    letterSpacing: '1px', fontFamily: F.sub, fontWeight: 300,
  },
  shopBtn: {
    display: 'inline-block', padding: '11px 32px',
    background: C.brand, color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: '11px', fontWeight: 300,
    letterSpacing: '3px', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: F.main,
  },

  // ── Order card (Flipkart-style) ──
  orderCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    marginBottom: '16px', overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(31,92,68,0.06)',
  },

  // Header bar — like Flipkart's blue bar
  orderHeader: {
    background: C.brand, padding: '12px 20px',
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: '8px',
  },
  orderHeaderLeft: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  orderHeaderItem: {
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  headerLabel: {
    fontSize: '9px', color: 'rgba(255,255,255,0.6)',
    letterSpacing: '2px', textTransform: 'uppercase', fontFamily: F.main, fontWeight: 300,
  },
  headerValue: {
    fontSize: '12px', color: '#fff',
    letterSpacing: '1px', fontFamily: F.main, fontWeight: 300,
  },
  statusBadge: (status) => ({
    padding: '4px 12px',
    fontSize: '10px', fontWeight: 400,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    fontFamily: F.main,
    background: (STATUS_COLORS[status] || STATUS_COLORS.confirmed).bg,
    color:      (STATUS_COLORS[status] || STATUS_COLORS.confirmed).color,
    border: `1px solid ${(STATUS_COLORS[status] || STATUS_COLORS.confirmed).border}`,
  }),

  // Items section
  orderBody: { padding: '0' },

  orderItem: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '18px 20px',
  },
  itemThumb: {
    width: '64px', height: '72px',
    objectFit: 'cover', objectPosition: 'top',
    border: `1px solid ${C.border}`, flexShrink: 0,
    background: C.bg,
  },
  itemThumbFallback: {
    width: '64px', height: '72px',
    background: C.bg, border: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '24px', flexShrink: 0,
  },
  itemDetails: { flex: 1, minWidth: 0 },
  itemName: {
    margin: '0 0 4px', fontSize: '13px', fontWeight: 400,
    color: C.brand, letterSpacing: '1px', fontFamily: F.main,
  },
  itemSub: {
    margin: '0 0 6px', fontSize: '11px', color: C.muted,
    letterSpacing: '0.5px', fontFamily: F.sub, fontWeight: 300,
  },
  itemQtyPrice: {
    fontSize: '11px', color: C.muted,
    letterSpacing: '1px', fontFamily: F.sub, fontWeight: 300,
  },
  itemPriceRight: {
    textAlign: 'right', flexShrink: 0,
  },
  itemPrice: {
    fontSize: '14px', fontWeight: 400, color: C.brand,
    letterSpacing: '1px', fontFamily: F.main,
  },

  // ── Flipkart-style progress tracker ──
  trackerWrap: {
    padding: '20px 24px 24px',
    borderTop: `1px solid ${C.border}`,
    background: '#FAFAF7',
  },
  trackerLabel: {
    fontSize: '9px', fontWeight: 400, color: C.gold,
    letterSpacing: '2.5px', textTransform: 'uppercase',
    fontFamily: F.main, marginBottom: '16px',
  },
  steps: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', position: 'relative',
  },
  stepItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    flex: 1, position: 'relative', zIndex: 1,
  },
  stepDot: (done, current) => ({
    width: '14px', height: '14px', borderRadius: '50%',
    background: done ? C.brand : current ? C.gold : C.border,
    border: `2px solid ${done ? C.brand : current ? C.gold : C.border}`,
    marginBottom: '8px', flexShrink: 0,
    boxShadow: current ? `0 0 0 3px rgba(201,147,58,0.2)` : 'none',
    transition: 'all 0.3s',
  }),
  stepLabel: (done, current) => ({
    fontSize: '9px', fontWeight: done || current ? 400 : 300,
    color: done ? C.brand : current ? C.gold : C.muted,
    letterSpacing: '1px', textTransform: 'uppercase',
    fontFamily: F.main, textAlign: 'center', lineHeight: '1.4',
  }),

  // ── Order footer ──
  orderFooter: {
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
    gap: '10px', padding: '14px 20px',
    borderTop: `1px solid ${C.border}`,
    background: '#FEFEFE',
  },
  totalLabel: {
    fontSize: '11px', color: C.muted,
    letterSpacing: '2px', textTransform: 'uppercase',
    fontFamily: F.main, fontWeight: 300,
  },
  totalAmount: {
    fontSize: '16px', fontWeight: 400, color: C.brand,
    letterSpacing: '1px', fontFamily: F.main,
  },
};

// Progress bar line connecting dots
const TrackerLine = ({ currentStep, totalSteps }) => (
  <div style={{
    position: 'absolute', top: '6px', left: '7%', right: '7%', height: '2px',
    background: C.border, zIndex: 0,
  }}>
    <div style={{
      height: '100%',
      width: `${Math.max(0, (currentStep / (totalSteps - 1)) * 100)}%`,
      background: C.brand, transition: 'width 0.4s ease',
    }} />
  </div>
);

const OrdersPage = () => {
  const navigate = useNavigate();

  const { user, myOrders, logout } = useShop();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div style={styles.page}>
      <style>{`
        @media (max-width: 600px) {
          .orders-header-bar { padding: 10px 14px !important; }
          .orders-header-left { gap: 14px !important; }
          .orders-tracker-wrap { padding: 16px 10px 18px !important; }
          .orders-item-row { padding: 14px 12px !important; gap: 12px !important; }
          .orders-item-thumb { width: 52px !important; height: 60px !important; }
          .orders-step-label { font-size: 8px !important; letter-spacing: 0.5px !important; }
        }
      `}</style>
      <Header />
      <div style={styles.inner}>

        {/* ── Page Heading ── */}
        <div style={styles.topRow}>
          <span style={styles.headingLine} />
          <div>
            <h1 style={styles.heading}>My Orders</h1>
            <p style={styles.subHead}>Track and manage your purchases</p>
          </div>
        </div>

        <p style={styles.sectionLabel}>Order History</p>

        {myOrders.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>🛍️</div>
            <p style={styles.emptyTitle}>No orders yet</p>
            <p style={styles.emptySub}>When you place your first order, it will appear here.</p>
            <button style={styles.shopBtn} onClick={() => navigate('/shop')}>
              Browse Sarees
            </button>
          </div>
        ) : (
          myOrders.map(order => {
            const cancelled = ['Cancelled', 'cancelled'].includes(order.status);
            const currentStep = stepIndex(order.status);

            return (
              <div key={order.id} style={styles.orderCard}>

                {/* ── Flipkart-style green header bar ── */}
                <div className="orders-header-bar" style={styles.orderHeader}>
                  <div className="orders-header-left" style={styles.orderHeaderLeft}>
                    <div style={styles.orderHeaderItem}>
                      <span style={styles.headerLabel}>Order ID</span>
                      <span style={styles.headerValue}>#{order.id}</span>
                    </div>
                    <div style={styles.orderHeaderItem}>
                      <span style={styles.headerLabel}>Date</span>
                      <span style={styles.headerValue}>{order.date}</span>
                    </div>
                    <div style={styles.orderHeaderItem}>
                      <span style={styles.headerLabel}>Items</span>
                      <span style={styles.headerValue}>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <span style={styles.statusBadge(order.status)}>
                    {labelFor(order.status || 'Processing')}
                  </span>
                </div>

                {/* ── Items ── */}
                <div style={styles.orderBody}>
                  {order.items.map((item, idx) => {
                    const isLast = idx === order.items.length - 1;
                    return (
                      <div
                        key={idx}
                        className="orders-item-row"
                        style={{
                          ...styles.orderItem,
                          borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="orders-item-thumb"
                            style={styles.itemThumb}
                            onError={e => { e.target.src = defaultLogo; e.target.style.objectFit = 'contain'; e.target.style.background = '#126354'; e.target.style.padding = '4px'; }}
                          />
                        ) : null}
                        <div
                          className="orders-item-thumb"
                          style={{
                            ...styles.itemThumbFallback,
                            display: item.image ? 'none' : 'flex',
                          }}>🛍️</div>

                        <div style={styles.itemDetails}>
                          <p style={styles.itemName}>{item.name}</p>
                          {item.subtitle && <p style={styles.itemSub}>{item.subtitle}</p>}
                          <p style={styles.itemQtyPrice}>Qty: {item.qty}</p>
                        </div>

                        <div style={styles.itemPriceRight}>
                          <p style={styles.itemPrice}>
                            ₹{(item.price * item.qty).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Order breakdown ── */}
                <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, background: '#FEFEFE', fontSize: '11px', color: C.muted, fontFamily: F.main, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginBottom: '8px' }}>
                    <span>Subtotal:</span>
                    <span style={{ minWidth: '70px', textAlign: 'right', fontWeight: 400, color: C.brand }}>₹{order.subtotal?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  {order.deliveryCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginBottom: '8px' }}>
                    <span>Shipping:</span>
                    <span style={{ minWidth: '70px', textAlign: 'right', fontWeight: 400, color: C.brand }}>₹{order.deliveryCharge?.toLocaleString('en-IN')}</span>
                  </div>
                  )}
                  {order.tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginBottom: '8px' }}>
                    <span>GST (5%):</span>
                    <span style={{ minWidth: '70px', textAlign: 'right', fontWeight: 400, color: C.brand }}>₹{order.tax?.toLocaleString('en-IN')}</span>
                  </div>
                  )}
                </div>

                {/* ── Order total footer ── */}
                <div style={styles.orderFooter}>
                  <span style={styles.totalLabel}>Order Total</span>
                  <span style={styles.totalAmount}>
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* ── Flipkart-style progress tracker ── */}
                {!cancelled && (
                  <div className="orders-tracker-wrap" style={styles.trackerWrap}>
                    <p style={styles.trackerLabel}>Order Progress</p>
                    <div style={styles.steps}>
                      <TrackerLine currentStep={currentStep} totalSteps={STEPS.length} />
                      {STEPS.map((label, i) => {
                        const done    = i <= currentStep;
                        const current = i === currentStep;
                        return (
                          <div key={label} style={styles.stepItem}>
                            <div style={styles.stepDot(done, current)} />
                            <span className="orders-step-label" style={styles.stepLabel(done, current)}>
                              {label.split(' ').map((w, wi) => (
                                <span key={wi} style={{ display: 'block' }}>{w}</span>
                              ))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrdersPage;
