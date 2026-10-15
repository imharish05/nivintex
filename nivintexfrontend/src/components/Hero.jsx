import React, { useEffect, useRef, useState } from "react";
import { getLocalImageUrl } from "../utils/api";

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const heroStyles = `
  .nalli-hero {
    position: relative;
    width: 100%;
    height: 50vh;
    min-height: 340px;
    overflow: hidden;
  }

  .nalli-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.9s ease;
    pointer-events: none;
  }
  .nalli-slide.active {
    opacity: 1;
    pointer-events: auto;
  }
  .nalli-slide-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .nalli-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(255,255,255,0.08) 0%,
      rgba(0,0,0,0.18) 50%,
      rgba(0,0,0,0.08) 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  @keyframes heroTextIn {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── STYLE 1: Center / Title-Script layout ── */
  .nalli-hero-text {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 24px;
    pointer-events: none;
    animation: heroTextIn 1.2s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hero-word-top {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: clamp(38px, 6vw, 72px);
    color: #0f5447;
    letter-spacing: 0.04em;
    line-height: 1;
    text-shadow: 0 2px 24px rgba(255,255,255,0.3);
  }
  .hero-word-script {
    font-family: 'Great Vibes', cursive;
    font-size: clamp(40px, 7vw, 80px);
    color: #C9A84C;
    line-height: 1.05;
    margin-top: -6px;
    text-shadow: 0 2px 16px rgba(255,255,255,0.25);
  }
  .hero-word-sub {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    font-size: clamp(14px, 1.8vw, 22px);
    letter-spacing: 0.35em;
    color: #0f5447;
    text-transform: uppercase;
    margin-top: 2px;
  }
  /* ── STYLE 2: Center / Big-word layout ── */
  .nalli-hero-text-2 {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 24px;
    pointer-events: none;
    animation: heroTextIn 1.2s cubic-bezier(0.22,1,0.36,1) both;
  }
  .s2-hero-word {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: clamp(42px, 7vw, 78px);
    color: #0b3a31;
    letter-spacing: 0.03em;
    line-height: 1;
    text-shadow: 0 2px 28px rgba(180,130,140,0.22);
  }
  .s2-subtitle {
    font-family: 'Great Vibes', cursive;
    font-weight: 400;
    font-size: clamp(18px, 2.5vw, 32px);
    letter-spacing: 0.05em;
    color: #8aab90;
    margin-top: 20px;
  }
  .s2-cta-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 40px;
    pointer-events: auto;
  }
  .s2-shop-btn {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    font-size: clamp(10px, 1.3vw, 14px);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #F0F7F4;
    background: linear-gradient(135deg, #0f5447 0%, #0b3a31 100%);
    padding: 12px 34px;
    border-radius: 2px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(176,112,128,0.32);
    transition: box-shadow 0.2s, transform 0.15s, background 0.2s;
  }
  .s2-shop-btn:hover {
    background: linear-gradient(135deg, #C9A84C 0%, #a88830 100%);
    box-shadow: 0 6px 24px rgba(176,112,128,0.48);
    transform: translateY(-1px);
  }

  /* ── STYLE 3: Left-aligned / New Collection layout ── */
  .nalli-hero-text-3 {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    text-align: left;
    padding: 0 6vw;
    pointer-events: none;
    animation: heroTextIn 1.2s cubic-bezier(0.22,1,0.36,1) both;
  }
  .s3-label {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    font-size: clamp(11px, 1.3vw, 14px);
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: #7a9e6e;
    margin-bottom: 10px;
  }
  .s3-headline {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: clamp(34px, 5.5vw, 68px);
    color: #3a5a6e;
    letter-spacing: 0.02em;
    line-height: 1;
    text-shadow: 0 3px 24px rgba(255,255,255,0.35);
  }
  .s3-headline-script {
    font-family: 'Great Vibes', cursive;
    font-size: clamp(38px, 6.2vw, 76px);
    color: #c8a04a;
    line-height: 1.05;
    margin-top: -4px;
    text-shadow: 0 2px 16px rgba(255,255,255,0.3);
  }
  .s3-rule {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 14px 0 12px;
    width: min(280px, 55vw);
  }
  .s3-rule-line {
    flex: 1;
    height: 1px;
    background: rgba(122,158,110,0.45);
  }
  .s3-rule-diamond {
    width: 6px;
    height: 6px;
    background: #7a9e6e;
    transform: rotate(45deg);
    flex-shrink: 0;
  }
  .s3-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(13px, 1.6vw, 18px);
    font-style: italic;
    color: #5a6e50;
    letter-spacing: 0.06em;
    margin-bottom: 32px;
  }
  .s3-cta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    pointer-events: auto;
  }
  .s3-shop-btn-primary {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    font-size: clamp(10px, 1.3vw, 14px);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #ffffff;
    background: linear-gradient(135deg, #8bbfd4 0%, #5a9ab8 100%);
    padding: 13px 34px;
    border-radius: 2px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(90,154,184,0.35);
    transition: box-shadow 0.2s, transform 0.15s;
  }
  .s3-shop-btn-primary:hover {
    box-shadow: 0 6px 26px rgba(90,154,184,0.52);
    transform: translateY(-1px);
  }
  .s3-shop-btn-ghost {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    font-size: clamp(10px, 1.3vw, 14px);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #4a7a5e;
    background: transparent;
    padding: 12px 30px;
    border-radius: 2px;
    border: 1px solid rgba(122,158,110,0.7);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }
  .s3-shop-btn-ghost:hover {
    background: rgba(122,158,110,0.12);
    border-color: #7a9e6e;
    color: #3a6a4e;
  }

  /* ── Dot nav ── */
  .nalli-dots {
    position: absolute;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    display: flex;
    gap: 10px;
  }
  .nalli-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    border: none;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
    padding: 0;
  }
  .nalli-dot.active {
    background: #fff;
    transform: scale(1.3);
  }

  /* ── Loading skeleton ── */
  .nalli-hero-skeleton {
    width: 100%;
    height: 50vh;
    min-height: 320px;
    background: linear-gradient(90deg, #e8e4de 25%, #f0ece6 50%, #e8e4de 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 768px) {
    .nalli-hero { height: 55vh; min-height: 380px; }
    .hero-divider { width: min(220px, 70vw); }
    .s2-cta-row { flex-direction: row; justify-content: center; gap: 10px; margin-top: 20px; }
    .s2-subtitle { margin-top: 12px; }
    .nalli-hero-text-3 { align-items: center; text-align: center; padding: 0 20px; }
    .s3-rule { width: min(220px, 70vw); margin: 10px 0; }
    .s3-desc { margin-bottom: 18px; }
    .s3-cta-row { flex-direction: row; justify-content: center; gap: 10px; flex-wrap: wrap; }
    .nalli-hero-skeleton { height: 55vh; min-height: 380px; }
  }
`;

// ─────────────────────────────────────────────
// Slide text layouts — chosen by sortOrder position (1st, 2nd, 3rd+)
// You can also use a custom field like slide.layout if your API supports it
// ─────────────────────────────────────────────
function SlideText({ slide, position }) {
  const handleClick = () => {
    if (slide.link) window.location.href = slide.link;
  };

  // Position 1 → Style 1 (centered title + script)
  if (position === 1) {
    return (
      <div className="nalli-hero-text">
        {slide.title && (
          <span className="hero-word-top">{slide.title}</span>
        )}
        {slide.subtitle && (
          <span className="hero-word-script">{slide.subtitle}</span>
        )}
        {slide.content && (
          <span className="hero-word-sub">{slide.content}</span>
        )}
      </div>
    );
  }

  // Position 2 → Style 2 (big word + script subtitle + CTA)
  if (position === 2) {
    return (
      <div className="nalli-hero-text-2">
        {slide.title && (
          <span className="s2-hero-word">{slide.title}</span>
        )}
        {slide.subtitle && (
          <span className="s2-subtitle">{slide.subtitle}</span>
        )}
        {slide.link && (
          <div className="s2-cta-row">
            <button className="s2-shop-btn" onClick={handleClick}>
              Shop Now
            </button>
          </div>
        )}
      </div>
    );
  }

  // Position 3+ → Style 3 (left-aligned + two CTAs)
  return (
    <div className="nalli-hero-text-3">
      {slide.title && (
        <>
          <span className="s3-label">New Arrivals</span>
          <span className="s3-headline">{slide.title}</span>
        </>
      )}
      {slide.subtitle && (
        <span className="s3-headline-script">{slide.subtitle}</span>
      )}
      <div className="s3-rule">
        <span className="s3-rule-line" />
        <span className="s3-rule-diamond" />
        <span className="s3-rule-line" />
      </div>
      {slide.content && (
        <span className="s3-desc">{slide.content}</span>
      )}
      {slide.link && (
        <div className="s3-cta-row">
          <button className="s3-shop-btn-primary" onClick={handleClick}>
            Shop Collection
          </button>
          <button className="s3-shop-btn-ghost" onClick={handleClick}>
            Explore Looks
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Hero component
// ─────────────────────────────────────────────
export default function Hero() {
  const [slides, setSlides]   = useState([]);
  const [active, setActive]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const timerRef              = useRef(null);

  // Fetch active hero banners from your API
  useEffect(() => {
    fetch(`${API}/banners`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch banners");
        return r.json();
      })
      .then((data) => {
        // Filter hero section + active status, then sort by sortOrder
        const heroSlides = data
          .filter((b) => b.section === "hero" && b.status === "Active")
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        setSlides(heroSlides);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  // Auto-advance slides — uses functional updater to avoid stale closure
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, [slides]);

  const go = (index) => {
    clearInterval(timerRef.current); // reset timer on manual nav
    setActive((index + slides.length) % slides.length);
  };

  // ── States ──
  if (loading) return <div className="nalli-hero-skeleton" />;
  if (error || slides.length === 0) return null;

  return (
    <>
      <style>{heroStyles}</style>

      <section className="nalli-hero">

        {/* Background images */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`nalli-slide ${index === active ? "active" : ""}`}
          >
            <img
              className="nalli-slide-bg"
              src={getLocalImageUrl(slide.image)}
              alt={slide.title || `Banner ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}

        {/* Dark overlay */}
        <div className="nalli-hero-overlay" />

        {/* Text overlay — layout depends on slide position */}
        {slides[active] && (
          <SlideText
            key={active} // re-mount on slide change to re-trigger animation
            slide={slides[active]}
            position={active + 1}
          />
        )}

        {/* Dot navigation */}
        {slides.length > 1 && (
          <div className="nalli-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`nalli-dot ${i === active ? "active" : ""}`}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

      </section>
    </>
  );
}
