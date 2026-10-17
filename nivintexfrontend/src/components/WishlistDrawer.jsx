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

const normId = (val) => (val === undefined || val === null) ? '' : String(val);

const WishlistDrawer = ({ open, onClose, onOpenCart }) => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, addToCart, wishlistCount, cartItems } = useShop();
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

  const handleMoveToCart = (item) => {
    addToCart({
      productId: item.productId || item.id,
      variantId: item.variantId,
      name:      item.name,
      img:       item.image,
      image:     item.image,
      price:     item.price,
      subtitle:  item.subtitle,
      weight:    item.subtitle,
      color: item.color,
      size: item.size,
      fabric: item.fabric,
      isBuyOneGetOne: !!item.isBuyOneGetOne,
    });
  };

  const handleMoveAll = () => {
    wishlistItems.forEach(item => addToCart({
      productId: item.productId || item.id,
      variantId: item.variantId,
      name:      item.name,
      img:       item.image,
      image:     item.image,
      price:     item.price,
      subtitle:  item.subtitle,
      weight:    item.subtitle,
      color: item.color,
      size: item.size,
      fabric: item.fabric,
      isBuyOneGetOne: !!item.isBuyOneGetOne,
    }));
    onClose();
    if (onOpenCart) onOpenCart();
  };

  const isInCart = (item) => {
    const wid = normId(item.productId || item.id);
    return cartItems.some(c => normId(c.productId || c.id) === wid && normId(c.variantId) === normId(item.variantId));
  };

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
            <i className="fa-solid fa-heart" style={{ fontSize: '15px', color: C.gold }} />
            <span style={{
              fontFamily: F.main, fontWeight: 300, fontSize: '16px',
              color: C.brand, letterSpacing: '4px', textTransform: 'uppercase',
            }}>
              Wishlist
            </span>
            {wishlistCount > 0 && (
              <span style={{
                background: C.gold, color: '#fff',
                borderRadius: '2px',
                width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 400, flexShrink: 0,
                fontFamily: F.main, letterSpacing: '0',
              }}>{wishlistCount}</span>
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
          {wishlistItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: C.muted }}>
              <div style={{
                width: '80px', height: '80px', background: C.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '32px', color: C.border,
                border: `1px solid ${C.border}`,
              }}>
                <i className="fa-regular fa-heart" />
              </div>
              <p style={{
                fontWeight: 300, fontSize: '14px', color: C.brand,
                margin: '0 0 8px', letterSpacing: '3px',
                textTransform: 'uppercase', fontFamily: F.main,
              }}>Your wishlist is empty</p>
              <p style={{
                fontSize: '12px', margin: '0 0 24px', fontFamily: F.sub,
                fontWeight: 300, letterSpacing: '1px', color: C.muted,
              }}>Save your favourite items here!</p>
              <button onClick={() => { navigate('/shop'); onClose(); }} style={{
                background: C.brand, color: '#fff', border: 'none',
                padding: '11px 28px', fontWeight: 300, fontSize: '11px',
                letterSpacing: '3px', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: F.main,
                borderRadius: '8px',
              }}>
                Explore Dresses
              </button>
            </div>
          ) : (
            wishlistItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} style={{
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
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
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
                    <button onClick={() => removeFromWishlist(item.id)} style={{
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
                      margin: '3px 0 8px', fontSize: '11px', color: C.muted,
                      fontFamily: F.sub, fontWeight: 300, letterSpacing: '0.5px',
                    }}>{item.subtitle}</p>
                  )}
                  {(item.color || item.size || item.fabric) && (
                    <p style={{ margin: '0 0 8px', fontSize: '11px', color: C.muted, fontFamily: F.sub }}>
                      {[item.color && `Colour: ${item.color}`, item.size && `Size: ${item.size}`, item.fabric && `Fabric: ${item.fabric}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <div>
                      <span style={{
                        fontWeight: 400, fontSize: '14px', color: C.brand,
                        fontFamily: F.main, letterSpacing: '1px',
                      }}>{fmt(item.price)}</span>
                      {item.oldPrice && (
                        <del style={{
                          fontSize: '11px', color: C.muted, marginLeft: '6px',
                          fontFamily: F.sub, fontWeight: 300,
                        }}>{fmt(item.oldPrice)}</del>
                      )}
                    </div>

                    {isInCart(item) ? (
                      <button
                        onClick={() => { onClose(); if (onOpenCart) onOpenCart(); }}
                        style={{
                          background: C.brand, color: '#fff', border: 'none',
                          padding: '7px 14px', fontSize: '10px', fontWeight: 300,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                          letterSpacing: '2px', textTransform: 'uppercase',
                          fontFamily: F.main, transition: 'opacity 0.2s',
                          borderRadius: '8px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <i className="fa-solid fa-bag-shopping" style={{ fontSize: '10px' }} />
                        Go to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMoveToCart(item)}
                        style={{
                          background: 'transparent', color: C.brand,
                          border: `1px solid ${C.brand}`,
                          padding: '7px 14px', fontSize: '10px', fontWeight: 300,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                          letterSpacing: '2px', textTransform: 'uppercase',
                          fontFamily: F.main, transition: 'all 0.2s',
                          borderRadius: '8px',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = C.brand;
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = C.brand;
                        }}
                      >
                        <i className="fa-solid fa-bag-shopping" style={{ fontSize: '10px' }} />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {wishlistItems.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
            flexShrink: 0,
          }}>
            <button onClick={handleMoveAll} style={{
              display: 'block', width: '100%', padding: '14px',
              background: C.brand, color: '#fff', border: 'none',
              fontWeight: 300, fontSize: '11px', letterSpacing: '3px',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: F.main, transition: 'opacity 0.2s',
              borderRadius: '8px',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <i className="fa-solid fa-bag-shopping" style={{ marginRight: '8px' }} />
              Add All to Cart
            </button>
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

export default WishlistDrawer;
