import React, { useEffect, useState } from "react";
import { categoryApi, getImageUrl } from "../utils/api";
import logo from "../assets/img/logo2.png";

const catStyles = `
  .cat-section {
    padding: 28px 24px 20px;
    position: relative;
    background: #EAF0E2;
    min-height: 240px;
  }
  @media (min-width: 769px) {
    .cat-section {
      padding: 32px 32px 24px;
    }
  }

  .cat-title {
    font-family: 'Cormorant Garamond', 'Playfair Display', serif;
    font-size: clamp(20px, 2.5vw, 32px);
    color: #0f5447;
    text-align: center;
    margin-bottom: 20px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 8px;
    width: 100%;
  }
  .cat-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
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
    padding: 8px 4px 16px;
  }
  .cat-track-wrapper::-webkit-scrollbar {
    display: none;
  }
  .cat-track {
    display: flex;
    gap: 24px;
    width: max-content;
    margin: 0 auto;
  }
  .cat-item {
    flex: 0 0 170px;
    width: 170px;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    outline: none;
  }
  .cat-circle {
    width: 100%;
    max-width: 150px;
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
    font-size: 32px; background: #f0f0f0;
  }
  .cat-label {
    font-size: 13px;
    color: #2C2F33;
    text-align: center;
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
    line-height: 1.3;
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
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 1.5px solid #E0E8D8;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(44,47,51,0.12);
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }
  .cat-arr:hover {
    background: #f5f8f2;
    border-color: #A2C579;
    transform: translateY(-50%) scale(1.05);
  }
  .cat-arr.prev { left: 8px; }
  .cat-arr.next { right: 8px; }
  .cat-arr svg { width: 16px; height: 16px; color: #2C2F33; }
  .cat-loading {
    text-align: center; padding: 40px;
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
    color: #6B7A6B; font-size: 14px;
  }
  @media (max-width: 768px) {
    .cat-section { padding: 24px 16px 14px; }
    .cat-item { flex: 0 0 135px; width: 135px; gap: 8px; }
    .cat-circle { max-width: 120px; }
    .cat-track { gap: 16px; }
  }
  @media (max-width: 480px) {
    .cat-section { padding: 20px 12px 12px; }
    .cat-item { flex: 0 0 115px; width: 115px; gap: 6px; }
    .cat-circle { max-width: 100px; }
    .cat-label { font-size: 12px; }
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
    <><style>{catStyles}</style><div className="cat-loading">Loading categories…</div></>
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
