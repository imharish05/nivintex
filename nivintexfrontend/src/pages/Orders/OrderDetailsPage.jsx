import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import defaultLogo from '../../assets/img/logo2.png';
import { useShop } from '../../context/ShopContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const BRAND = '#0f5447';
const MUTED = '#6B6B8A';
const BORDER = '#EAE4D6';
const BG = '#EAF0E2';
const FONT = "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif";
const STEPS = ['Order placed', 'Shipped', 'Out for delivery', 'Delivered'];

const normalizeStatus = status => String(status || 'processing').toLowerCase().replace(/[\s-]+/g, '_');
const getStep = status => ({ pending: 0, confirmed: 0, processing: 0, shipped: 1, out_for_delivery: 2, delivered: 3 })[normalizeStatus(status)] ?? 0;
const formatMoney = value => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, myOrders, fetchOrders } = useShop();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return undefined;
    }
    let active = true;
    Promise.resolve(fetchOrders()).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id, orderId]);

  const order = useMemo(
    () => myOrders.find(row => String(row.id) === decodeURIComponent(String(orderId || ''))),
    [myOrders, orderId],
  );

  if (!user) return null;

  const cancelled = ['cancelled', 'canceled'].includes(normalizeStatus(order?.status));
  const currentStep = getStep(order?.status);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: BRAND, fontFamily: FONT }}>
      <Header />
      <main className="order-detail-page">
        <button type="button" className="order-detail-back" onClick={() => navigate('/orders')}>
          <i className="fa-solid fa-arrow-left" /> Back to My Orders
        </button>

        {loading && !order ? (
          <section className="order-detail-state">Loading order details…</section>
        ) : !order ? (
          <section className="order-detail-state">
            <i className="fa-solid fa-box-open" />
            <h1>Order not found</h1>
            <p>This order may have been removed or may not belong to your account.</p>
            <button type="button" onClick={() => navigate('/orders')}>Return to My Orders</button>
          </section>
        ) : (
          <>
            <header className="order-detail-heading">
              <div className="order-detail-heading-copy">
                <p className="order-detail-eyebrow">ORDER DETAILS</p>
                <h1>Order #{order.id}</h1>
                <p className="order-detail-date">Placed {order.date || 'Date unavailable'}</p>
              </div>
              <span className={`order-detail-status ${cancelled ? 'is-cancelled' : ''}`}>{order.status || 'Processing'}</span>
            </header>

            {!cancelled && (
              <section className="order-progress-card">
                <h2>Delivery progress</h2>
                <div className="order-progress">
                  <div className="order-progress-line"><span style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} /></div>
                  {STEPS.map((step, index) => (
                    <div className="order-progress-step" key={step}>
                      <span className={`order-progress-dot ${index <= currentStep ? 'is-done' : ''}`}>{index < currentStep ? '✓' : ''}</span>
                      <span className={index <= currentStep ? 'is-active' : ''}>{step}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="order-detail-card">
              <div className="order-section-heading">
                <h2>Items in this order</h2>
                <span>{order.items?.length || 0} product{order.items?.length === 1 ? '' : 's'}</span>
              </div>
              <div className="order-detail-items">
                {(order.items || []).map((item, index) => (
                  <article className="order-detail-item" key={`${item.name}-${index}`}>
                    <img
                      src={item.image || defaultLogo}
                      alt={item.name}
                      onError={event => { event.currentTarget.src = defaultLogo; }}
                    />
                    <div className="order-detail-item-info">
                      <strong>{item.name}</strong>
                      {item.subtitle && <span>{item.subtitle}</span>}
                      <span>Quantity: {item.qty}</span>
                    </div>
                    <strong className="order-detail-item-price">{formatMoney(Number(item.price) * Number(item.qty))}</strong>
                  </article>
                ))}
              </div>
              <div className="order-detail-totals">
                <div><span>Subtotal</span><strong>{formatMoney(order.subtotal)}</strong></div>
                {Number(order.discount) > 0 && <div><span>Discount</span><strong>−{formatMoney(order.discount)}</strong></div>}
                {Number(order.tax) > 0 && <div><span>GST</span><strong>{formatMoney(order.tax)}</strong></div>}
                {Number(order.deliveryCharge) > 0 && <div><span>Shipping</span><strong>{formatMoney(order.deliveryCharge)}</strong></div>}
                <div className="order-detail-grand-total"><span>Order total</span><strong>{formatMoney(order.total)}</strong></div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
      <style>{`
        .order-detail-page { width:min(960px,calc(100% - 40px)); margin:0 auto; padding:20px 0 42px; }
        .order-detail-back { display:inline-flex; align-items:center; gap:8px; padding:8px 0; min-height:40px; margin-bottom:10px; border:0; background:transparent; color:${BRAND}; font:500 12px ${FONT}; cursor:pointer; }
        .order-detail-back:hover { color:#C9933A; }
        .order-detail-heading { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px 18px; padding:12px 18px; background:#fff; border:1px solid ${BORDER}; border-radius:14px; }
        .order-detail-heading-copy { display:grid; justify-items:start; gap:4px; }
        .order-detail-heading-copy > p, .order-detail-heading-copy > h1 { margin:0 !important; line-height:1.2 !important; }
        .order-detail-eyebrow { color:#C9933A; font-size:10px; letter-spacing:2px; }
        .order-detail-heading h1 { font-size:23px; font-weight:500; }
        .order-detail-heading .order-detail-date { color:${MUTED}; font-size:12px; }
        .order-detail-status { padding:8px 14px; border-radius:30px; background:#EAF5F0; color:${BRAND}; font-size:12px; font-weight:600; white-space:nowrap; }
        .order-detail-status.is-cancelled { background:#FEF2F2; color:#B91C1C; }
        .order-progress-card, .order-detail-card, .order-detail-state { margin-top:10px; padding:16px 18px; background:#fff; border:1px solid ${BORDER}; border-radius:14px; }
        .order-progress-card h2, .order-section-heading h2 { margin:0; font-size:16px; font-weight:500; }
        .order-progress { position:relative; display:flex; justify-content:space-between; margin:16px 8px 0; }
        .order-progress-line { position:absolute; top:12px; left:8%; right:8%; height:2px; background:${BORDER}; }
        .order-progress-line span { display:block; height:100%; background:${BRAND}; transition:width .3s; }
        .order-progress-step { z-index:1; display:flex; flex:1; flex-direction:column; align-items:center; gap:8px; color:${MUTED}; font-size:11px; text-align:center; }
        .order-progress-dot { display:grid; place-items:center; width:26px; height:26px; border:2px solid ${BORDER}; border-radius:50%; background:#fff; color:#fff; }
        .order-progress-dot.is-done { border-color:${BRAND}; background:${BRAND}; }
        .order-progress-step .is-active { color:${BRAND}; font-weight:600; }
        .order-section-heading { display:flex; justify-content:space-between; gap:12px; align-items:center; padding-bottom:16px; border-bottom:1px solid #F0EEE8; }
        .order-section-heading > span { color:${MUTED}; font-size:12px; }
        .order-detail-item { display:flex; align-items:center; gap:12px; padding:9px 0; border-bottom:1px solid #F0EEE8; }
        .order-detail-item img { width:50px; height:60px; flex-shrink:0; border-radius:6px; object-fit:cover; object-position:top; background:${BG}; }
        .order-detail-item-info { display:grid; gap:3px; flex:1; min-width:0; }
        .order-detail-item-info strong { font-size:12px; font-weight:500; }
        .order-detail-item-info span { color:${MUTED}; font-size:10px; }
        .order-detail-item-price { font-size:12px; white-space:nowrap; }
        .order-detail-totals { width:min(420px,100%); margin:10px 0 0 auto; }
        .order-detail-totals > div { display:flex; justify-content:space-between; gap:16px; padding:6px 0; color:${MUTED}; font-size:13px; }
        .order-detail-totals strong { color:${BRAND}; font-size:13px; font-weight:500; text-align:right; }
        .order-detail-totals .order-detail-grand-total { margin-top:6px; padding-top:10px; border-top:1px solid ${BORDER}; color:${BRAND}; font-size:15px; }
        .order-detail-totals .order-detail-grand-total strong { font-size:18px; font-weight:600; }
        .order-detail-state { text-align:center; padding:56px 20px; color:${MUTED}; }
        .order-detail-state > i { color:${BRAND}; font-size:34px; }
        .order-detail-state h1 { color:${BRAND}; font-size:20px; font-weight:500; }
        .order-detail-state p { font-size:13px; }
        .order-detail-state button { margin-top:10px; padding:10px 16px; border:0; border-radius:6px; color:#fff; background:${BRAND}; font:500 12px ${FONT}; cursor:pointer; }
        @media(max-width:600px) {
          .order-detail-page { width:calc(100% - 28px); padding:16px 0 34px; }
          .order-detail-heading { padding:10px 12px; align-items:center; }
          .order-detail-heading-copy { gap:3px; }
          .order-detail-heading h1 { font-size:19px; }
          .order-detail-heading .order-detail-date { font-size:10px; }
          .order-detail-status { padding:7px 9px; font-size:10px; }
          .order-progress-card, .order-detail-card { margin-top:8px; padding:13px 12px; }
          .order-progress { margin:14px 0 0; }
          .order-progress-line { left:9%; right:9%; }
          .order-progress-step { font-size:9px; line-height:1.25; padding:0 2px; }
          .order-progress-dot { width:23px; height:23px; }
          .order-detail-state button { min-height:44px; padding:12px 20px; }
          .order-detail-item { gap:9px; padding:8px 0; }
          .order-detail-item img { width:44px; height:54px; }
          .order-detail-item-info strong { font-size:11px; }
          .order-detail-item-price { font-size:11px; }
          .order-detail-totals > div, .order-detail-totals strong { font-size:12px; }
          .order-detail-totals .order-detail-grand-total { font-size:14px; }
          .order-detail-totals .order-detail-grand-total strong { font-size:16px; }
        }
      `}</style>
    </div>
  );
};

export default OrderDetailsPage;
