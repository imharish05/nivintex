import React from 'react';

export const skeletonStyles = `
@keyframes fa-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.fa-skeleton {
  background: linear-gradient(
    90deg,
    #e8ede4 0%,
    #f5f7f2 40%,
    #e8ede4 80%
  );
  background-size: 200% 100%;
  animation: fa-shimmer 1.6s ease-in-out infinite;
  display: block;
}

.fa-skeleton-dark {
  background: linear-gradient(
    90deg,
    #dfe5db 0%,
    #edf1ea 40%,
    #dfe5db 80%
  );
  background-size: 200% 100%;
  animation: fa-shimmer 1.6s ease-in-out infinite;
  display: block;
}
`;

export default function Skeleton({ as: Component = 'div', width, height, borderRadius = 6, style = {}, dark = false, className = '' }) {
  return (
    <>
      <style>{skeletonStyles}</style>
      <Component
        className={`${dark ? 'fa-skeleton-dark' : 'fa-skeleton'} ${className}`}
        style={{
          width: width || '100%',
          height: height || '16px',
          borderRadius,
          display: Component === 'span' ? 'inline-block' : 'block',
          ...style,
        }}
      />
    </>
  );
}

// ── Product Card Skeleton (Used in Shop Grid, Best Sellers, New Arrivals) ──
export function ProductCardSkeleton({ style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 28, ...style }}>
      <style>{skeletonStyles}</style>
      {/* Product Image Box (3:4 aspect ratio) */}
      <div
        className="fa-skeleton"
        style={{
          width: '100%',
          aspectRatio: '3/4',
          borderRadius: 8,
          marginBottom: 12,
        }}
      />
      {/* Category / Brand pill */}
      <div
        className="fa-skeleton"
        style={{
          width: '35%',
          height: 12,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      {/* Product Name */}
      <div
        className="fa-skeleton"
        style={{
          width: '85%',
          height: 16,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      {/* Price line */}
      <div
        className="fa-skeleton"
        style={{
          width: '45%',
          height: 16,
          borderRadius: 4,
        }}
      />
    </div>
  );
}

// ── Category Circle Skeleton (Used in Category Carousel & Header) ──
export function CategoryCircleSkeleton({ size = 150 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <style>{skeletonStyles}</style>
      <div
        className="fa-skeleton-dark"
        style={{
          width: size,
          height: size,
          maxWidth: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
        }}
      />
      <div
        className="fa-skeleton"
        style={{
          width: Math.min(size * 0.7, 90),
          height: 12,
          borderRadius: 4,
        }}
      />
    </div>
  );
}

// ── Sidebar Category Row Skeleton (Used in Shop Grid Filter) ──
export function SidebarItemSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #EAF0E2' }}>
      <style>{skeletonStyles}</style>
      <div className="fa-skeleton" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
      <div className="fa-skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
      <div className="fa-skeleton" style={{ width: '60%', height: 14, borderRadius: 4 }} />
    </div>
  );
}

// ── Combo Card Skeleton (Used in Shop Grid Combo view) ──
export function ComboCardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 28 }}>
      <style>{skeletonStyles}</style>
      <div className="fa-skeleton" style={{ width: '100%', aspectRatio: '3/4', borderRadius: 8, marginBottom: 12 }} />
      <div className="fa-skeleton" style={{ width: '50%', height: 16, borderRadius: 4, marginBottom: 8 }} />
      <div className="fa-skeleton" style={{ width: '80%', height: 12, borderRadius: 4, marginBottom: 12 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div className="fa-skeleton" style={{ width: '40%', height: 18, borderRadius: 4 }} />
        <div className="fa-skeleton" style={{ width: '35%', height: 32, borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ── Product Details Skeleton (Used on /product-details) ──
export function ProductDetailsSkeleton() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 20px', minHeight: '80vh' }}>
      <style>{skeletonStyles}</style>
      <div className="row g-4 g-lg-5">
        {/* Left Gallery */}
        <div className="col-lg-6 col-12">
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Thumbnails strip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 70, flexShrink: 0 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="fa-skeleton" style={{ width: 66, height: 88, borderRadius: 6 }} />
              ))}
            </div>
            {/* Main Image */}
            <div className="fa-skeleton" style={{ flex: 1, minHeight: 480, height: '70vh', maxHeight: 650, borderRadius: 10 }} />
          </div>
        </div>

        {/* Right Info */}
        <div className="col-lg-6 col-12" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="fa-skeleton" style={{ width: '30%', height: 14, borderRadius: 4 }} />
          <div className="fa-skeleton" style={{ width: '80%', height: 28, borderRadius: 6 }} />
          <div className="fa-skeleton" style={{ width: '25%', height: 18, borderRadius: 4 }} />
          <div className="fa-skeleton" style={{ width: '40%', height: 32, borderRadius: 6, margin: '8px 0' }} />
          <div className="fa-skeleton" style={{ width: '100%', height: 60, borderRadius: 6 }} />

          {/* Sizes */}
          <div style={{ margin: '16px 0 8px' }}>
            <div className="fa-skeleton" style={{ width: '20%', height: 14, borderRadius: 4, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="fa-skeleton" style={{ width: 44, height: 40, borderRadius: 6 }} />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <div className="fa-skeleton" style={{ flex: 1, height: 46, borderRadius: 6 }} />
            <div className="fa-skeleton" style={{ flex: 1, height: 46, borderRadius: 6 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hero Banner Skeleton (Used in Hero.jsx) ──
export function HeroBannerSkeleton() {
  return (
    <section
      className="hero-skeleton-container"
      style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(380px, calc(100vh - 68px - 215px), 540px)',
        overflow: 'hidden',
        background: '#FAF7F2',
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(20px, 5.5vw, 64px)',
        boxSizing: 'border-box',
      }}
      aria-label="Loading banner..."
    >
      <style>{`
        ${skeletonStyles}
        @media (max-width: 768px) {
          .hero-skeleton-container {
            height: clamp(420px, 62vh, 520px) !important;
            justify-content: center !important;
            align-items: flex-end !important;
            padding: 0 20px 40px !important;
          }
          .hero-skeleton-card-inner {
            align-items: center !important;
            text-align: center !important;
          }
          .hero-skeleton-btn-ghost {
            display: none !important;
          }
        }
      `}</style>

      {/* Shimmering background covering entire hero space */}
      <div
        className="fa-skeleton"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.5,
        }}
      />

      {/* Subtle overlay gradient matching the real hero */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(250, 247, 242, 0.85) 0%, rgba(250, 247, 242, 0.5) 45%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Hero content card placeholders */}
      <div
        className="hero-skeleton-card-inner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 520,
          zIndex: 2,
          gap: 12,
        }}
      >
        {/* Eyebrow / Tag */}
        <div className="fa-skeleton-dark" style={{ width: 140, height: 14, borderRadius: 4, marginBottom: 4 }} />
        {/* Title */}
        <div className="fa-skeleton" style={{ width: '85%', height: 42, borderRadius: 6, marginBottom: 2 }} />
        {/* Subtitle */}
        <div className="fa-skeleton" style={{ width: '60%', height: 32, borderRadius: 6, marginBottom: 4 }} />
        {/* Rule / Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 140, margin: '6px 0 8px' }}>
          <div className="fa-skeleton" style={{ flex: 1, height: 2, borderRadius: 1 }} />
          <div className="fa-skeleton" style={{ width: 6, height: 6, borderRadius: '50%' }} />
          <div className="fa-skeleton" style={{ flex: 1, height: 2, borderRadius: 1 }} />
        </div>
        {/* Content line */}
        <div className="fa-skeleton" style={{ width: '75%', height: 16, borderRadius: 4, marginBottom: 12 }} />
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="fa-skeleton" style={{ width: 150, height: 44, borderRadius: 4 }} />
          <div className="hero-skeleton-btn-ghost fa-skeleton-dark" style={{ width: 130, height: 44, borderRadius: 4 }} />
        </div>
      </div>

      {/* Dots navigation placeholder */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          zIndex: 2,
        }}
      >
        <div className="fa-skeleton" style={{ width: 22, height: 8, borderRadius: 4 }} />
        <div className="fa-skeleton" style={{ width: 8, height: 8, borderRadius: '50%' }} />
        <div className="fa-skeleton" style={{ width: 8, height: 8, borderRadius: '50%' }} />
      </div>
    </section>
  );
}

// ── Offer Banner Skeleton (Used in OfferBanner.jsx) ──
export function OfferBannerSkeleton() {
  return (
    <section className="fa-offers-section" style={{ background: '#EAF0E2', padding: '48px 0 56px' }}>
      <style>{`
        ${skeletonStyles}
        .offer-skel-grid {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: calc(50% - 14px);
          gap: clamp(14px, 2.5vw, 28px);
          overflow: hidden;
        }
        @media (max-width: 820px) {
          .offer-skel-grid {
            grid-auto-columns: 100%;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px, 3.5vw, 32px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div className="fa-skeleton-dark" style={{ width: 180, height: 28, borderRadius: 4 }} />
          <div className="fa-skeleton-dark" style={{ width: 90, height: 28, borderRadius: 20 }} />
        </div>
        <div className="offer-skel-grid">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="fa-skeleton-dark"
              style={{
                height: 'clamp(340px, 50vh, 480px)',
                borderRadius: 4,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 'clamp(20px, 3.5vw, 36px)',
                boxSizing: 'border-box',
              }}
            >
              <div className="fa-skeleton" style={{ width: '35%', height: 14, borderRadius: 4, marginBottom: 12 }} />
              <div className="fa-skeleton" style={{ width: '65%', height: 28, borderRadius: 6, marginBottom: 16 }} />
              <div className="fa-skeleton" style={{ width: '25%', height: 18, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section Banner Skeleton (Used in BestSeller.jsx & NewArrivals.jsx side banners) ──
export function SectionBannerSkeleton({ style = {} }) {
  return (
    <div
      className="fa-skeleton-dark"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 380,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 24,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <style>{skeletonStyles}</style>
      <div className="fa-skeleton" style={{ width: '50%', height: 18, borderRadius: 4, marginBottom: 10 }} />
      <div className="fa-skeleton" style={{ width: '70%', height: 14, borderRadius: 4, marginBottom: 16 }} />
      <div className="fa-skeleton" style={{ width: 110, height: 38, borderRadius: 4 }} />
    </div>
  );
}

