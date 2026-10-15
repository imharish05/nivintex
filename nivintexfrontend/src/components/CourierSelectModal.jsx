import React, { useState, useEffect, useMemo } from 'react';

const BRAND = '#0f5447';
const ACCENT = '#126354';
const GOLD = '#C9933A';
const BORDER = '#EAE4D6';

export default function CourierSelectModal({
  isOpen,
  onClose,
  couriers = [],
  selectedCourierId,
  onSelect,
  pincode = '',
  city = '',
}) {
  const [tempSelectedId, setTempSelectedId] = useState(selectedCourierId || '');

  // Sync internal selected ID when modal opens or selectedCourierId changes
  useEffect(() => {
    if (isOpen) {
      setTempSelectedId(selectedCourierId || (couriers[0]?.courierId ? String(couriers[0].courierId) : ''));
    }
  }, [isOpen, selectedCourierId, couriers]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && tempSelectedId) {
        onSelect(tempSelectedId);
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, onSelect, tempSelectedId]);

  // Identify lowest rate and fastest delivery badges
  const { cheapestId, fastestId } = useMemo(() => {
    if (!couriers || couriers.length === 0) return { cheapestId: null, fastestId: null };

    let lowestPrice = Infinity;
    let minPriceId = null;

    let minDays = Infinity;
    let minDaysId = null;

    couriers.forEach((c) => {
      const rate = Number(c.rate) || 0;
      if (rate < lowestPrice) {
        lowestPrice = rate;
        minPriceId = String(c.courierId);
      }

      const days = Number(c.estimatedDeliveryDays) || Infinity;
      if (days < minDays) {
        minDays = days;
        minDaysId = String(c.courierId);
      }
    });

    return { cheapestId: minPriceId, fastestId: minDaysId };
  }, [couriers]);

  if (!isOpen) return null;

  const currentSelectedCourier = couriers.find(
    (c) => String(c.courierId) === String(tempSelectedId)
  );

  const handleConfirm = () => {
    if (tempSelectedId) {
      onSelect(tempSelectedId);
    }
    onClose();
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="ck-courier-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'ckFadeIn 0.2s ease-out',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="courier-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="ck-courier-modal-dialog"
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 580,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 84, 71, 0.3), 0 0 0 1px rgba(15, 84, 71, 0.08)',
          overflow: 'hidden',
          animation: 'ckSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <header
          className="ck-courier-modal-header"
          style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFDF9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#EAF0E2',
                color: BRAND,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-truck-fast" />
            </div>
            <div>
              <h2
                id="courier-modal-title"
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  color: BRAND,
                  fontFamily: "'Josefin Sans', sans-serif",
                  letterSpacing: 0.5,
                }}
              >
                Choose Delivery Partner
              </h2>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 12,
                  color: '#64748b',
                  fontFamily: "'Raleway', sans-serif",
                }}
              >
                {pincode ? `Delivering to PIN ${pincode}${city ? ` · ${city}` : ''}` : 'Select your preferred courier service'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close courier selection"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: `1px solid ${BORDER}`,
              background: '#fff',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = BRAND;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        {/* Courier List (Clean, properly aligned cards, without sort bar) */}
        <div
          style={{
            padding: '18px 24px',
            overflowY: 'auto',
            maxHeight: '56vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
          className="ck-courier-list-scroll"
        >
          {couriers.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
              <i className="fa-solid fa-box-open" style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No courier services available for this location.</p>
            </div>
          ) : (
            couriers.map((courier) => {
              const isSelected = String(tempSelectedId) === String(courier.courierId);
              const isCheapest = String(courier.courierId) === String(cheapestId);
              const isFastest = String(courier.courierId) === String(fastestId) && !isCheapest;
              const isAir = (courier.courierName || '').toLowerCase().includes('air');

              return (
                <div
                  key={courier.courierId}
                  onClick={() => setTempSelectedId(String(courier.courierId))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${BRAND}` : '1.5px solid #EAE4D6',
                    background: isSelected ? 'rgba(15, 84, 71, 0.04)' : '#fff',
                    boxShadow: isSelected ? '0 4px 12px rgba(15, 84, 71, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    gap: 16,
                  }}
                  className="ck-courier-card-item"
                >
                  {/* Left: Radio + Text details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    {/* Custom Radio Button */}
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: isSelected ? `6px solid ${BRAND}` : '2px solid #CBD5E1',
                        background: '#fff',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        boxSizing: 'border-box',
                      }}
                    />

                    {/* Text Details */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#1E293B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3,
                        }}
                      >
                        {courier.courierName}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginTop: 4,
                        }}
                      >
                        {courier.estimatedDeliveryDays && (
                          <span
                            style={{
                              fontSize: 11,
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <i className="fa-regular fa-clock" style={{ fontSize: 10, color: '#94a3b8' }} />
                            {courier.estimatedDeliveryDays} days delivery
                          </span>
                        )}

                        {isAir && (
                          <span
                            style={{
                              background: '#E0F2FE',
                              color: '#0284C7',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              letterSpacing: 0.3,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <i className="fa-solid fa-plane-departure" style={{ fontSize: 9 }} /> Express Air
                          </span>
                        )}

                        {isCheapest && (
                          <span
                            style={{
                              background: '#DCFCE7',
                              color: '#15803D',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              letterSpacing: 0.3,
                            }}
                          >
                            ★ Best Price
                          </span>
                        )}

                        {isFastest && (
                          <span
                            style={{
                              background: '#FEF3C7',
                              color: '#B45309',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              letterSpacing: 0.3,
                            }}
                          >
                            ⚡ Fastest
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price */}
                  <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: isSelected ? BRAND : '#0F172A',
                        fontFamily: "'Josefin Sans', sans-serif",
                        letterSpacing: 0.5,
                      }}
                    >
                      ₹{Number(courier.rate).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Standard fee</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer
          className="ck-courier-modal-footer"
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${BORDER}`,
            background: '#FAFDF9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, color: '#475569', minWidth: 160, flex: '1 1 auto' }}>
            {currentSelectedCourier ? (
              <div>
                <span style={{ color: '#94A3B8' }}>Selected: </span>
                <strong style={{ color: BRAND }}>{currentSelectedCourier.courierName}</strong>
                <span style={{ color: BRAND, fontWeight: 700, marginLeft: 6 }}>
                  (₹{Number(currentSelectedCourier.rate).toFixed(2)})
                </span>
              </div>
            ) : (
              <span style={{ color: '#94A3B8' }}>No courier selected</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 6,
                border: `1px solid ${BORDER}`,
                background: '#fff',
                color: '#475569',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!tempSelectedId}
              style={{
                padding: '9px 22px',
                borderRadius: 6,
                border: 'none',
                background: BRAND,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
                cursor: tempSelectedId ? 'pointer' : 'not-allowed',
                opacity: tempSelectedId ? 1 : 0.6,
                transition: 'all 0.2s',
                boxShadow: tempSelectedId ? '0 2px 8px rgba(15, 84, 71, 0.25)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (tempSelectedId) e.currentTarget.style.background = ACCENT;
              }}
              onMouseLeave={(e) => {
                if (tempSelectedId) e.currentTarget.style.background = BRAND;
              }}
            >
              Confirm Courier
            </button>
          </div>
        </footer>

        {/* Responsive and Animation Styles */}
        <style>{`
          @keyframes ckFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes ckSlideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .ck-courier-card-item:hover {
            border-color: ${GOLD} !important;
            background: rgba(201, 147, 58, 0.03) !important;
          }
          .ck-courier-list-scroll::-webkit-scrollbar {
            width: 5px;
          }
          .ck-courier-list-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          .ck-courier-list-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          @media (max-width: 600px) {
            .ck-courier-modal-backdrop {
              padding: 0 !important;
              align-items: flex-end !important;
            }
            .ck-courier-modal-dialog {
              max-height: 88vh !important;
              border-radius: 18px 18px 0 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .ck-courier-card-item {
              padding: 12px 14px !important;
            }
            .ck-courier-modal-header {
              padding: 14px 16px !important;
            }
            .ck-courier-modal-footer {
              padding: 14px 16px !important;
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
            }
            .ck-courier-modal-footer > div:last-child {
              display: flex !important;
              width: 100% !important;
              gap: 8px !important;
            }
            .ck-courier-modal-footer > div:last-child button {
              flex: 1 !important;
              padding: 12px 16px !important;
              text-align: center !important;
              justify-content: center !important;
            }
          }
        `}</style>
      </section>
    </div>
  );
}
