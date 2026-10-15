import React, { useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';



const F = {
  main: "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

const C = {
  brand:     '#0f5447',
  accent:    '#0f5447',
  accentHov: '#0b3a31',
  gold:      '#C9933A',
  muted:     '#6B6B8A',
  border:    '#EAE4D6',
  surface:   '#FFFFFF',
  bg:        '#F4F0E8',
  danger:    '#E05252',
};

const CartDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQty, cartCount, getCartTotals } = useShop();
  const drawerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const { subtotal, savings } = getCartTotals(false);
  const fmt = (n) => '₹' + n.toLocaleString('en-IN');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(15,84,71,0.25)',
          backdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '420px', maxWidth: '100vw',
          background: C.surface,
          zIndex: 1201,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.38s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: open ? '-8px 0 48px rgba(15,84,71,0.15)' : 'none',
          fontFamily: F.main,
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: `1px solid ${C.border}`,
          borderTop: `3px solid ${C.brand}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '3px', height: '20px', background: C.gold, flexShrink: 0 }} />
            <i className="fa-solid fa-bag-shopping" style={{ fontSize: '15px', color: C.gold }} />
            <span style={{
              fontFamily: F.main, fontWeight: 300, fontSize: '16px',
              color: C.brand, letterSpacing: '4px', textTransform: 'uppercase',
            }}>
              Your Cart
            </span>
            {cartCount > 0 && (
              <span style={{
                background: C.gold, color: '#fff',
                borderRadius: '2px',
                width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 400, flexShrink: 0,
                fontFamily: F.main,
              }}>{cartCount}</span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: C.bg, border: `1px solid ${C.border}`,
            width: '32px', height: '32px', cursor: 'pointer', color: C.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.border}
            onMouseLeave={e => e.currentTarget.style.background = C.bg}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── Items ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: C.muted }}>
              <div style={{
                width: '80px', height: '80px', background: C.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '32px', color: C.border,
                border: `1px solid ${C.border}`,
              }}>
                <i className="fa-solid fa-bag-shopping" />
              </div>
              <p style={{
                fontWeight: 300, fontSize: '14px', color: C.brand,
                margin: '0 0 8px', letterSpacing: '3px',
                textTransform: 'uppercase', fontFamily: F.main,
              }}>Your cart is empty</p>
              <p style={{
                fontSize: '12px', margin: '0 0 24px', fontFamily: F.sub,
                fontWeight: 300, letterSpacing: '1px', color: C.muted,
              }}>Browse our beautiful dress collection!</p>
              <button onClick={() => { navigate('/shop'); onClose(); }} style={{
                background: C.brand, color: '#fff', border: 'none',
                padding: '11px 28px', fontWeight: 300, fontSize: '11px',
                letterSpacing: '3px', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: F.main,
              }}>
                Explore Dresses
              </button>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={item.id} style={{
                display: 'flex', gap: '14px', padding: '18px 24px',
                borderBottom: `1px solid ${C.border}`,
                animation: `slideIn 0.25s ease ${idx * 0.05}s both`,
              }}>
                {/* Thumb */}
                <div style={{
                  width: '72px', height: '80px', flexShrink: 0,
                  background: C.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                  border: `1px solid ${C.border}`, overflow: 'hidden',
                }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '👗'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <p style={{
                      margin: 0, fontWeight: 400, fontSize: '13px',
                      color: C.brand, lineHeight: 1.4,
                      fontFamily: F.main, letterSpacing: '1px',
                    }}>{item.name}</p>
                    <button onClick={() => removeFromCart(item.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.muted, fontSize: '13px', padding: '2px', flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = C.danger}
                      onMouseLeave={e => e.currentTarget.style.color = C.muted}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                  {item.subtitle && (
                    <p style={{
                      margin: '3px 0 4px', fontSize: '11px', color: C.muted,
                      fontFamily: F.sub, fontWeight: 300, letterSpacing: '0.5px',
                    }}>{item.subtitle}</p>
                  )}
                  {(item.color || item.size || item.fabric) && (
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: C.muted, fontFamily: F.sub }}>
                      {[item.color && `Colour: ${item.color}`, item.size && `Size: ${item.size}`, item.fabric && `Fabric: ${item.fabric}`].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    {/* Qty stepper */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden',
                    }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{
                        width: '30px', height: '30px', border: 'none', background: C.bg,
                        cursor: 'pointer', fontSize: '16px', color: C.brand,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: F.main,
                      }}>−</button>
                      <span style={{
                        width: '32px', textAlign: 'center', fontSize: '13px',
                        fontWeight: 400, color: C.brand, fontFamily: F.main,
                        letterSpacing: '1px',
                      }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{
                        width: '30px', height: '30px', border: 'none', background: C.bg,
                        cursor: 'pointer', fontSize: '16px', color: C.brand,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: F.main,
                      }}>+</button>
                    </div>
                    <span style={{
                      fontWeight: 400, fontSize: '14px', color: C.brand,
                      fontFamily: F.main, letterSpacing: '1px',
                    }}>
                      {fmt(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
            flexShrink: 0,
          }}>
            {savings > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '8px', alignItems: 'center',
              }}>
                <span style={{
                  color: C.danger, fontSize: '10px', fontFamily: F.main,
                  fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
                }}>Offer Discount</span>
                <span style={{
                  fontSize: '12px', fontWeight: 600,
                  color: C.danger,
                  fontFamily: F.main, letterSpacing: '1px',
                }}>
                  -{fmt(savings)}
                </span>
              </div>
            )}

            {/* Gold divider */}
            <div style={{ height: '1px', background: C.border, margin: '10px 0' }} />

            {/* Subtotal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: '20px', alignItems: 'center',
            }}>
              <span style={{
                fontWeight: 300, fontSize: '11px', color: C.muted,
                fontFamily: F.main, letterSpacing: '3px', textTransform: 'uppercase',
              }}>Total</span>
              <span style={{
                fontWeight: 400, fontSize: '18px', color: C.brand,
                fontFamily: F.main, letterSpacing: '1px',
              }}>{fmt(subtotal)}</span>
            </div>
            <p style={{ margin: '-12px 0 14px', textAlign: 'right', color: C.muted, fontSize: 10, fontFamily: F.sub }}>
              Product prices include GST.
            </p>

            <button onClick={() => { 
              sessionStorage.removeItem('buyNowItem');
              navigate('/checkout'); 
              onClose(); 
            }} style={{
              display: 'block', width: '100%', padding: '14px',
              background: C.brand, color: '#fff', border: 'none',
              fontWeight: 300, fontSize: '11px', letterSpacing: '3px',
              textTransform: 'uppercase', cursor: 'pointer',
              marginBottom: '10px', fontFamily: F.main,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Proceed to Checkout
            </button>

            <p style={{
              textAlign: 'center', fontSize: '10px', color: C.muted,
              margin: '12px 0 0', fontFamily: F.sub,
              fontWeight: 300, letterSpacing: '1.5px',
            }}>
              <i className="fa-solid fa-lock" style={{ color: C.gold, marginRight: '6px' }} />
              Secure checkout — UPI, Cards, Net Banking
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default CartDrawer;
