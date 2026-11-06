import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const BRAND = '#0f5447';
const MUTED = '#6B6B8A';
const BORDER = '#EAE4D6';
const BG = '#EAF0E2';
const FONT = "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif";

const statusStyle = status => {
  const value = String(status || 'Processing').toLowerCase();
  if (value.includes('cancel')) return { color: '#B91C1C', bg: '#FEF2F2' };
  if (value.includes('deliver')) return { color: '#15803D', bg: '#F0FDF4' };
  if (value.includes('ship')) return { color: '#1D4ED8', bg: '#EFF6FF' };
  if (value.includes('pending')) return { color: '#B45309', bg: '#FFFBEB' };
  return { color: BRAND, bg: '#EAF5F0' };
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user, myOrders } = useShop();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: BRAND }}>
      <Header />
      <main className="my-orders-page">
        <header className="my-orders-heading">
          <div>
            <p className="my-orders-eyebrow">YOUR ACCOUNT</p>
            <h1>My Orders</h1>
            <p className="my-orders-subtitle">A quick overview of your purchases and delivery status.</p>
          </div>
          <span className="my-orders-count">{myOrders.length} {myOrders.length === 1 ? 'order' : 'orders'}</span>
        </header>

        {myOrders.length === 0 ? (
          <section className="my-orders-empty">
            <div className="my-orders-empty-icon"><i className="fa-solid fa-box-open" /></div>
            <h2>No orders yet</h2>
            <p>Your orders will appear here after checkout.</p>
            <button type="button" onClick={() => navigate('/shop')}>Explore the shop</button>
          </section>
        ) : (
          <section className="my-orders-list" aria-label="Order history">
            {myOrders.map(order => {
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
                      <span className="my-order-status-dot" />{order.status || 'Processing'}
                    </span>
                  </div>

                  <div className="my-order-summary">
                    {firstItem?.image ? (
                      <img src={firstItem.image} alt="" className="my-order-image" />
                    ) : (
                      <div className="my-order-image-placeholder"><i className="fa-solid fa-bag-shopping" /></div>
                    )}
                    <div className="my-order-info">
                      <span className="my-order-date">Placed {order.date || 'Date unavailable'}</span>
                      <strong>{firstItem?.name || 'Order items'}</strong>
                      {order.items?.length > 1 && <span className="my-order-more">and {order.items.length - 1} more product{order.items.length > 2 ? 's' : ''}</span>}
                    </div>
                    <div className="my-order-total">
                      <span>Total</span>
                      <strong>₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>

                  <div className="my-order-bottom">
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <button type="button" onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)}>
                      Track Order <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
      <Footer />

      <style>{`
        .my-orders-page { width: min(960px, calc(100% - 40px)); margin: 0 auto; padding: 42px 0 70px; }
        .my-orders-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; padding-bottom:24px; margin-bottom:24px; border-bottom:1px solid ${BORDER}; }
        .my-orders-eyebrow { margin:0 0 8px; color:#C9933A; font-size:10px; letter-spacing:3px; }
        .my-orders-heading h1 { margin:0; font-size:30px; font-weight:500; letter-spacing:1px; }
        .my-orders-subtitle { margin:8px 0 0; color:${MUTED}; font-size:14px; }
        .my-orders-count { color:${BRAND}; background:#fff; border:1px solid ${BORDER}; border-radius:30px; padding:9px 16px; font-size:12px; white-space:nowrap; }
        .my-orders-list { display:grid; gap:16px; }
        .my-order-card { background:#fff; border:1px solid ${BORDER}; border-radius:14px; padding:20px 22px 0; box-shadow:0 5px 18px rgba(31,92,68,.05); }
        .my-order-topline { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:16px; border-bottom:1px solid #F0EEE8; }
        .my-order-topline > div { display:flex; align-items:center; gap:10px; }
        .my-order-label { color:${MUTED}; font-size:10px; letter-spacing:1.5px; }
        .my-order-topline strong { font-size:14px; }
        .my-order-status { display:inline-flex; align-items:center; gap:7px; border-radius:20px; padding:7px 11px; font-size:11px; font-weight:600; }
        .my-order-status-dot { width:7px; height:7px; border-radius:50%; background:currentColor; }
        .my-order-summary { display:flex; align-items:center; gap:16px; padding:18px 0; }
        .my-order-image, .my-order-image-placeholder { width:64px; height:74px; border-radius:8px; object-fit:cover; object-position:top; background:${BG}; flex-shrink:0; }
        .my-order-image-placeholder { display:grid; place-items:center; color:${BRAND}; font-size:20px; }
        .my-order-info { display:grid; gap:5px; min-width:0; flex:1; }
        .my-order-date, .my-order-more { color:${MUTED}; font-size:12px; }
        .my-order-info strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:500; }
        .my-order-total { display:grid; justify-items:end; gap:5px; padding-left:14px; }
        .my-order-total span { color:${MUTED}; font-size:11px; }
        .my-order-total strong { font-size:15px; white-space:nowrap; }
        .my-order-bottom { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:13px 0; border-top:1px solid #F0EEE8; color:${MUTED}; font-size:12px; }
        .my-order-bottom button { display:inline-flex; align-items:center; gap:9px; border:0; background:transparent; color:${BRAND}; font:600 12px ${FONT}; cursor:pointer; padding:7px 0 7px 10px; }
        .my-order-bottom button:hover { color:#C9933A; }
        .my-orders-empty { background:#fff; border:1px solid ${BORDER}; border-radius:14px; text-align:center; padding:56px 20px; }
        .my-orders-empty-icon { color:${BRAND}; font-size:34px; opacity:.7; }
        .my-orders-empty h2 { margin:16px 0 6px; font-size:19px; font-weight:500; }
        .my-orders-empty p { margin:0 0 20px; color:${MUTED}; font-size:13px; }
        .my-orders-empty button { border:0; border-radius:6px; background:${BRAND}; color:#fff; padding:11px 20px; font:500 12px ${FONT}; cursor:pointer; }
        @media (max-width:600px) {
          .my-orders-page { width:calc(100% - 28px); padding:24px 0 44px; }
          .my-orders-heading { align-items:flex-start; padding-bottom:18px; margin-bottom:18px; }
          .my-orders-heading h1 { font-size:24px; }
          .my-orders-subtitle {line-height:1.5; font-size:12px; }
          .my-orders-count { padding:7px 10px; font-size:10px; }
          .my-order-card { padding:15px 14px 0; }
          .my-order-summary { gap:11px; padding:14px 0; }
          .my-order-image, .my-order-image-placeholder { width:54px; height:64px; }
          .my-order-info strong { font-size:12px; }
          .my-order-date, .my-order-more { font-size:10px; }
          .my-order-total { padding-left:4px; }
          .my-order-total strong { font-size:12px; }
          .my-order-total span, .my-order-bottom { font-size:10px; }
          .my-order-bottom button { font-size:10px; }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;
