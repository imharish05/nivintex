import React, { useEffect, useState } from "react";
import { categoryApi, getImageUrl } from "../utils/api";
import logo from "../assets/img/logo2.png";
import { CategoryCircleSkeleton } from "./Skeleton";

const catStyles = `
  .cat-section {
    padding: 16px 24px 12px;
    position: relative;
    background: #EAF0E2;
  }
  @media (min-width: 769px) {
    .cat-section {
      padding: 18px 32px 14px;
    }
  }

  .cat-title {
    font-family: 'Cormorant Garamond', 'Playfair Display', serif;
    font-size: clamp(16px, 1.8vw, 22px);
    color: #0f5447;
    text-align: center;
    margin-bottom: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 6px;
    width: 100%;
  }
  .cat-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 2px;
    background: #C9A84C;
  }
  .cat-track-wrapper {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 4px 2px 6px;
  }
  .cat-track-wrapper::-webkit-scrollbar {
    display: none;
  }
  .cat-track {
    display: flex;
    gap: clamp(12px, 1.8vw, 24px);
    width: max-content;
    margin: 0 auto;
  }
  .cat-item {
    flex: 0 0 clamp(100px, 9.5vw, 125px);
    width: clamp(100px, 9.5vw, 125px);
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    outline: none;
  }
  .cat-circle {
    width: 100%;
    max-width: clamp(80px, 8vw, 100px);
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid transparent;
    background: #f5f5f5;
    transition: border-color 0.3s, box-shadow 0.3s;
    margin: 0 auto;
  }
  .cat-item:hover .cat-circle {
    border-color: #2C2F33;
    box-shadow: 0 6px 20px rgba(44, 47, 51, 0.13);
  }
  /* Image zooms inside the fixed circle */
  .cat-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
    transition: transform 0.4s ease;
  }
  .cat-item:hover .cat-circle img {
    transform: scale(1.1);
  }
  .cat-circle-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center;
    justify-content: center;
    font-size: 26px; background: #f0f0f0;
  }
  .cat-label {
    font-size: clamp(11px, 1vw, 13px);
    color: #2C2F33;
    text-align: center;
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
    line-height: 1.25;
    font-weight: 500;
    letter-spacing: 0.3px;
    transition: color 0.2s;
  }
  .cat-item:hover .cat-label {
    color: #A2C579;
  }
  .cat-arr {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 36px; height: 36px;
    border-radius: 50% !important;
    border: 1px solid #d4ddd0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(44,47,51,0.15);
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }
  .cat-arr:hover {
    background: #0f5447;
    border-color: #0f5447;
    color: #fff;
    transform: translateY(-50%) scale(1.08);
  }
  .cat-arr:hover svg { color: #fff; stroke: #fff; }
  .cat-arr.prev { left: 8px; }
  .cat-arr.next { right: 8px; }
  .cat-arr svg { width: 14px; height: 14px; color: #0f5447; stroke: #0f5447; stroke-width: 2.2; }
  .cat-loading {
    text-align: center; padding: 24px;
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
    color: #6B7A6B; font-size: 13px;
  }
  @media (max-width: 768px) {
    .cat-section { padding: 18px 16px 14px; }
    .cat-title { font-size: 19px; margin-bottom: 14px; padding-bottom: 5px; }
    .cat-item { flex: 0 0 120px; width: 120px; gap: 8px; }
    .cat-circle { width: 105px; max-width: 105px; }
    .cat-label { font-size: 12px; font-weight: 600; line-height: 1.3; }
    .cat-track { gap: 16px; }
    .cat-arr {
      width: 30px;
      height: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .cat-arr.prev { left: 4px; }
    .cat-arr.next { right: 4px; }
    .cat-arr svg { width: 12px; height: 12px; }
  }
  @media (max-width: 480px) {
    .cat-section { padding: 16px 12px 12px; }
    .cat-item { flex: 0 0 110px; width: 110px; gap: 8px; }
    .cat-circle { width: 100px; max-width: 100px; }
    .cat-label { font-size: 11.5px; font-weight: 600; line-height: 1.3; }
    .cat-track { gap: 12px; }
  }
`;

import { useNavigate } from 'react-router-dom';

export default function CategorySection() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const scrollRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const goToShopCategory = (cat) => {
    sessionStorage.setItem('shopCategoryId', String(cat.id));
    sessionStorage.removeItem('shopSubCategoryId');
    navigate('/shop');
  };

  useEffect(() => {
    categoryApi.getAll()
      .then((categoryData) => {
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      })
      .catch((err) => console.error('[CategorySection]', err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  if (loading) return (
    <>
      <style>{catStyles}</style>
      <section className="cat-section">
        <h2 className="cat-title">Shop by Category</h2>
        <div className="cat-track-wrapper">
          <div className="cat-track">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="cat-item">
                <CategoryCircleSkeleton size={150} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  if (!categories.length) return null;

  return (
    <>
      <style>{catStyles}</style>
      <section className="cat-section">
        <h2 className="cat-title">Shop by Category</h2>

        <div style={{ position: 'relative' }}>
          {canScrollLeft && (
            <button className="cat-arr prev" onClick={() => scroll(-1)} aria-label="Previous categories">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <div className="cat-track-wrapper touch-scroll" ref={scrollRef} onScroll={checkScroll}>
            <div className="cat-track">
              {categories.map((cat) => {
                const imgUrl = getImageUrl(cat.image || cat.image_url || cat.imageUrl || cat.category_image || cat.categoryImage || cat.photo);
                return (
                  <div
                    key={cat.id}
                    className="cat-item"
                    onClick={() => goToShopCategory(cat)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') goToShopCategory(cat); }}
                    aria-label={`Browse ${cat.name}`}
                  >
                    <div className="cat-circle">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={cat.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="cat-circle-placeholder"
                        style={{ display: imgUrl ? 'none' : 'flex', background: '#126354' }}
                      >
                        <img src={logo} alt="Default Logo" style={{ width: '75%', height: 'auto', objectFit: 'contain' }} />
                      </div>
                    </div>
                    <span className="cat-label">{cat.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {canScrollRight && (
            <button className="cat-arr next" onClick={() => scroll(1)} aria-label="Next categories">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </section>
    </>
  );
}
