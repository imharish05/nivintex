import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getLocalImageUrl } from "../utils/api";
import banner1 from "../assets/img/img31.png";
import banner2 from "../assets/img/img32.png";
import banner3 from "../assets/img/img33.png";
import { HeroBannerSkeleton } from "./Skeleton";

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Physical Slides (Local High-Resolution Assets) ─────────────────────────────
const PHYSICAL_SLIDES = [
  {
    id: 1,
    image: banner1,
    tag: "Spring / Summer 2026",
    title: "Everyday Elegance",
    subtitle: "The Fashion Aura Edit",
    content: "Discover your next favourite look",
    link: "/shop",
    btnText: "Shop Collection",
    secondaryBtnText: "Explore Looks",
    secondaryLink: "/shop",
    layout: "left",
  },
  {
    id: 2,
    image: banner2,
    tag: "Signature Styles",
    title: "Keep It Effortless",
    subtitle: "Style for your everyday",
    content: "Curated designs tailored for effortless grace",
    link: "/shop",
    btnText: "Shop Now",
    secondaryBtnText: null,
    secondaryLink: null,
    layout: "center",
  },
  {
    id: 3,
    image: banner3,
    tag: "New Arrivals",
    title: "Dress Your Way",
    subtitle: "Make it your own",
    content: "Find inspiration for every occasion",
    link: "/shop",
    btnText: "Explore Collection",
    secondaryBtnText: null,
    secondaryLink: null,
    layout: "left",
  },
];

const heroStyles = `
  .nalli-hero {
    position: relative;
    width: 100%;
    height: clamp(380px, calc(100vh - 68px - 215px), 540px);
    overflow: hidden;
    background: #FAF7F2;
  }

  .nalli-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.85s ease-in-out;
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
    object-position: center top;
    display: block;
  }

  .nalli-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(250, 247, 242, 0.88) 0%,
      rgba(250, 247, 242, 0.65) 32%,
      rgba(250, 247, 242, 0.2) 58%,
      transparent 85%
    );
    pointer-events: none;
    z-index: 1;
  }

  @keyframes heroTextIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Slide Text Containers ── */
  .hero-slide-wrapper {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    padding: 0 clamp(20px, 5.5vw, 64px);
    pointer-events: none;
    animation: heroTextIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .hero-slide-wrapper.layout-center {
    justify-content: center;
    text-align: center;
  }

  .hero-slide-wrapper.layout-left {
    justify-content: flex-start;
    text-align: left;
  }

  .hero-content-card {
    display: flex;
    flex-direction: column;
    max-width: 560px;
    pointer-events: auto;
  }

  .layout-center .hero-content-card {
    align-items: center;
  }
  .layout-left .hero-content-card {
    align-items: flex-start;
  }

  /* ── Typography & Crisp Brand Colors ── */
  .hero-tag {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(11px, 1.1vw, 13px);
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #0F4E42;
    margin-bottom: 8px;
    text-shadow: none;
  }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-weight: 800;
    font-size: clamp(32px, 4.2vw, 54px);
    color: #0A332B;
    letter-spacing: 0.01em;
    line-height: 1.12;
    margin: 0 0 4px 0;
    text-shadow: none;
  }

  .hero-subtitle {
    font-family: 'Great Vibes', cursive;
    font-size: clamp(32px, 4.4vw, 54px);
    color: #8C5F18;
    line-height: 1.18;
    margin: 4px 0 6px 0;
    text-shadow: none;
  }

  .hero-rule {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 0 14px;
    width: 140px;
  }
  .layout-center .hero-rule {
    margin-left: auto;
    margin-right: auto;
  }
  .hero-rule-line {
    flex: 1;
    height: 1px;
    background: rgba(15, 78, 66, 0.35);
  }
  .hero-rule-diamond {
    width: 6px;
    height: 6px;
    background: #8C5F18;
    transform: rotate(45deg);
    flex-shrink: 0;
  }

  .hero-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(14px, 1.3vw, 17px);
    font-weight: 500;
    font-style: normal;
    color: #2D3A30;
    letter-spacing: 0.02em;
    line-height: 1.5;
    margin: 0 0 22px 0;
    text-shadow: none;
  }

  /* ── Buttons ── */
  .hero-cta-row {
    display: flex;
    align-items: center;
    gap: 14px;
    pointer-events: auto;
  }

  .hero-btn-primary {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(11px, 1.1vw, 13px);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #ffffff !important;
    background: #0F4E42;
    padding: 12px 32px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(15, 78, 66, 0.25);
    transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .hero-btn-primary:hover {
    background: #0B3A31;
    color: #ffffff !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(15, 78, 66, 0.35);
  }

  .hero-btn-ghost {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(11px, 1.1vw, 13px);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #0F4E42 !important;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(4px);
    padding: 11px 26px;
    border-radius: 8px;
    border: 1.5px solid #0F4E42;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .hero-btn-ghost:hover {
    background: #0F4E42;
    color: #ffffff !important;
    transform: translateY(-2px);
  }

  /* ── Dot Navigation ── */
  .nalli-dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    display: flex;
    gap: 8px;
  }
  .nalli-dot {
    width: 8px;
    height: 8px;
    border-radius: 50% !important;
    background: rgba(15, 78, 66, 0.3);
    border: none;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
    padding: 0;
  }
  .nalli-dot.active {
    background: #0F4E42;
    transform: scale(1.35);
  }

  /* ── Mobile Placement & Responsive Layout ── */
  @media (max-width: 768px) {
    .nalli-hero {
      height: clamp(420px, 62vh, 520px);
    }
    .nalli-slide-bg {
      object-position: center top;
    }
    .nalli-hero-overlay {
      background: linear-gradient(
        to top,
        rgba(250, 247, 242, 0.95) 0%,
        rgba(250, 247, 242, 0.65) 45%,
        rgba(250, 247, 242, 0.2) 75%,
        transparent 100%
      );
    }
    .hero-slide-wrapper {
      padding: 0 20px 32px;
      justify-content: center !important;
      align-items: flex-end !important;
      text-align: center !important;
    }
    .hero-content-card {
      align-items: center !important;
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      max-width: 100%;
    }
    .hero-tag {
      font-size: 11px;
      letter-spacing: 0.24em;
      margin-bottom: 4px;
      text-shadow: none;
    }
    .hero-title {
      font-size: clamp(24px, 6.8vw, 32px);
      line-height: 1.15;
      text-shadow: none;
    }
    .hero-subtitle {
      font-size: clamp(24px, 6.2vw, 32px);
      margin-top: 2px;
      margin-bottom: 6px;
      text-shadow: none;
    }
    .hero-rule {
      display: none;
    }
    .hero-desc {
      display: block;
      font-size: 13px;
      margin-bottom: 14px;
      text-shadow: none;
      max-width: 320px;
    }
    .hero-cta-row {
      margin-top: 8px;
      gap: 10px;
      justify-content: center;
    }
    .hero-btn-primary {
      padding: 10px 28px;
      font-size: 11px;
      letter-spacing: 0.2em;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(15, 78, 66, 0.25);
    }
    .hero-btn-ghost {
      display: none;
    }
    .nalli-dots {
      bottom: 8px;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 26px;
    }
    .hero-subtitle {
      font-size: 24px;
    }
    .hero-btn-primary {
      padding: 10px 24px;
    }
  }
`;

function SlideText({ slide }) {
  const isCenter = slide.layout === "center";
  const hasText = slide.tag || slide.title || slide.subtitle || slide.content;

  if (!hasText && !slide.btnText) return null;

  return (
    <div className={`hero-slide-wrapper ${isCenter ? "layout-center" : "layout-left"}`}>
      <div className="hero-content-card">
        {slide.tag && <span className="hero-tag">{slide.tag}</span>}
        {slide.title && <h1 className="hero-title">{slide.title}</h1>}
        {slide.subtitle && <span className="hero-subtitle">{slide.subtitle}</span>}

        {(slide.title || slide.subtitle) && (
          <div className="hero-rule">
            <span className="hero-rule-line" />
            <span className="hero-rule-diamond" />
            <span className="hero-rule-line" />
          </div>
        )}

        {slide.content && <p className="hero-desc">{slide.content}</p>}

        {(slide.link || slide.btnText) && (
          <div className="hero-cta-row">
            {slide.btnText && (
              <Link to={slide.link || "/shop"} className="hero-btn-primary">
                {slide.btnText}
              </Link>
            )}
            {slide.secondaryBtnText && (
              <Link to={slide.secondaryLink || "/shop"} className="hero-btn-ghost">
                {slide.secondaryBtnText}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  // Fetch active hero banners from API and display admin-uploaded images dynamically
  useEffect(() => {
    let isMounted = true;

    const finishLoading = (finalSlides) => {
      if (!isMounted) return;
      setSlides(finalSlides);
      setLoading(false);
    };

    fetch(`${API}/banners`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (!Array.isArray(data)) {
          finishLoading(PHYSICAL_SLIDES);
          return;
        }

        const heroSlides = data
          .filter((b) => b.section === "hero" && b.status === "Active")
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (heroSlides.length > 0) {
          const mapped = heroSlides.map((apiItem, idx) => {
            const fallback = PHYSICAL_SLIDES[idx % PHYSICAL_SLIDES.length];
            const resolvedImg = apiItem.image ? getLocalImageUrl(apiItem.image) : fallback.image;
            return {
              id: apiItem.id || fallback.id,
              image: resolvedImg || fallback.image,
              tag: apiItem.tag || apiItem.label || "",
              title: apiItem.title || "",
              subtitle: apiItem.subtitle || "",
              content: apiItem.content || "",
              link: apiItem.link || fallback.link || "/shop",
              btnText: apiItem.btnText || "Shop Collection",
              secondaryBtnText: apiItem.secondaryBtnText || null,
              secondaryLink: apiItem.secondaryLink || null,
              layout: apiItem.layout || "left",
            };
          });

          // Preload the first slide image so it appears instantly without flicker
          const firstImgUrl = mapped[0]?.image;
          if (firstImgUrl) {
            const img = new Image();
            let resolved = false;
            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                finishLoading(mapped);
              }
            }, 1800);

            img.onload = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                finishLoading(mapped);
              }
            };
            img.onerror = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                finishLoading(mapped);
              }
            };
            img.src = firstImgUrl;
          } else {
            finishLoading(mapped);
          }
        } else {
          finishLoading(PHYSICAL_SLIDES);
        }
      })
      .catch(() => {
        // Silently use physical slides on network failure
        finishLoading(PHYSICAL_SLIDES);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-advance slides every 4.5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [slides]);

  const go = (index) => {
    clearInterval(timerRef.current);
    setActive((index + slides.length) % slides.length);
  };

  if (loading) {
    return <HeroBannerSkeleton />;
  }

  return (
    <>
      <style>{heroStyles}</style>

      <section className="nalli-hero" aria-label="Featured Promotions">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`nalli-slide ${index === active ? "active" : ""}`}
            aria-hidden={index !== active}
          >
            <img
              className="nalli-slide-bg"
              src={slide.image}
              alt={slide.title || `Hero banner ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => {
                const fallback = PHYSICAL_SLIDES[index % PHYSICAL_SLIDES.length]?.image;
                if (fallback && e.target.src !== fallback) {
                  e.target.src = fallback;
                }
              }}
            />
          </div>
        ))}

        <div className="nalli-hero-overlay" />

        {slides[active] && (
          <SlideText key={slides[active].id || active} slide={slides[active]} />
        )}

        {slides.length > 1 && (
          <div className="nalli-dots" role="tablist">
            {slides.map((slide, i) => (
              <button
                key={slide.id || i}
                type="button"
                className={`nalli-dot ${i === active ? "active" : ""}`}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                role="tab"
                aria-selected={i === active}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
