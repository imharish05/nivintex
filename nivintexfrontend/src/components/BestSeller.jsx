import React, { useRef, useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { getImageUrl, getLocalImageUrl } from "../utils/api";
import logo from "../assets/img/logo2.png";
import { ProductCardSkeleton } from "./Skeleton";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CARD_WIDTH = 240;
const CARD_GAP   = 16;

const styles = `
  :root {
    --green: #0f5447;
    --green-dark: #0b3a31;
    --text: #2C2F33;
    --muted: #888;
    --border: #e8e8e8;
    --bg: #EAF0E2;
    --card-bg: #fafafa;
    --card-width: ${CARD_WIDTH}px;
    --card-gap: ${CARD_GAP}px;
    --hero-width: 300px;
  }

  .bs-section {
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
    padding: 48px 0 56px;
    background: var(--bg);
  }

  .bs-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0 clamp(16px, 3.5vw, 32px) 24px;
  }

  .bs-title {
    font-family: 'Cormorant Garamond', 'Playfair Display', serif;
    font-size: clamp(20px, 2.5vw, 32px);
    color: var(--green);
    text-align: left;
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 8px;
    display: inline-block;
  }

  .bs-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 2px;
    background: #C9A84C;
  }

  .bs-viewall {
    font-size: 13px;
    font-weight: 500;
    color: var(--green);
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--green);
    padding-bottom: 2px;
    transition: opacity 0.2s;
    cursor: pointer;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
  }

  .bs-viewall:hover { opacity: 0.7; }

  .bs-carousel-outer {
    position: relative;
    overflow: hidden;
    padding: 0 clamp(16px, 3vw, 42px);
    box-sizing: border-box;
  }

  .bs-track-wrap {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 0 20px;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .bs-track-wrap::-webkit-scrollbar { display: none; }

  .bs-track {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--card-gap);
    width: max-content;
  }

  .bs-hero {
    flex: 0 0 var(--hero-width);
    width: var(--hero-width);
    height: 480px;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    background: #2C2F33;
    cursor: pointer;
  }

  .bs-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
    opacity: 0.82;
  }

  .bs-hero-fallback {
    width: 100%;
    height: 100%;
    background: linear-gradient(160deg, #FFFFFF 0%, #2C2F33 100%);
  }

  .bs-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%);
  }

  .bs-hero-content {
    position: absolute;
    top: 28px;
    left: 24px;
  }

  .bs-hero-label {
    font-family: 'Josefin Sans', 'Raleway', sans-serif;
    font-size: 56px;
    font-weight: 700;
    color: #fff;
    display: block;
    line-height: 1.05;
    text-shadow: 0 2px 12px rgba(0,0,0,0.4);
  }

  .bs-hero-sub {
    margin-top: 8px;
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.4px;
  }

  .bs-hero-btn {
    display: inline-block;
    margin-top: 14px;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    letter-spacing: 1px;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(255,255,255,0.7);
    padding-bottom: 2px;
    cursor: pointer;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    transition: opacity 0.2s;
  }

  .bs-hero-btn:hover { opacity: 0.75; }

  .bs-card {
    flex: 0 0 var(--card-width);
    width: var(--card-width);
    scroll-snap-align: start;
    cursor: pointer;
  }

  .bs-img-wrap {
    position: relative;
    overflow: hidden;
    background: var(--card-bg);
    border-radius: 4px;
  }

  .bs-img-wrap img {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    object-position: top;
    display: block;
    transition: transform 0.45s ease;
  }

  .bs-card:hover .bs-img-wrap img {
    transform: scale(1.04);
  }

  .bs-placeholder {
    width: 100%;
    aspect-ratio: 3/4;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: #ccc;
  }

  .bs-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: #0f5447;
    color: #FFFFFF;
    border: 1px solid rgba(201, 168, 76, 0.4);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 5px 10px;
    border-radius: 4px;
    line-height: 1;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .bs-action-btns {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bs-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--green);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }

  .bs-icon-btn:hover {
    background: var(--green-dark);
    transform: scale(1.08);
  }

  .bs-icon-btn svg {
    width: 15px;
    height: 15px;
    stroke: #fff;
    fill: none;
    stroke-width: 2;
  }

  .bs-icon-btn.wished svg { fill: #fff; }

  .bs-icon-btn.in-cart {
    background: var(--green);
  }

  .bs-icon-btn.in-cart:hover {
    background: var(--green-dark);
  }

  .bs-info { padding: 12px 2px 0; }

  .bs-brand {
    font-size: 11px;
    color: var(--muted);
    margin: 0 0 4px;
    letter-spacing: 0.3px;
  }

  .bs-name {
    font-size: 13px;
    color: var(--text);
    margin: 0 0 8px;
    line-height: 1.45;
    font-weight: 400;
  }

  .bs-short-desc {
    font-size: 11px;
    color: #666;
    margin: 0 0 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    height: 2.8em;
  }

  .bs-price-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    margin: 0 0 10px;
  }

  .bs-sale-price {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .bs-mrp {
    font-size: 12px;
    color: #aaa;
    text-decoration: line-through;
    font-weight: 400;
  }

  .bs-sizes {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 8px;
  }

  .bs-size {
    font-size: 10px;
    border: 1px solid var(--border);
    padding: 3px 8px;
    border-radius: 3px;
    color: #555;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    white-space: nowrap;
  }

  .bs-size:hover {
    border-color: var(--green);
    color: var(--green);
  }

  .bs-stock {
    font-size: 12px;
    color: var(--green);
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
  }

  .bs-stock-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--green);
    flex-shrink: 0;
  }

  .bs-arrow {
    position: absolute;
    top: 38%;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid var(--border);
    box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: background 0.2s;
  }

  .bs-arrow:hover { background: var(--green); border-color: var(--green); }
  .bs-arrow:hover svg { stroke: #fff; }

  .bs-arrow svg {
    width: 18px;
    height: 18px;
    stroke: var(--text);
    fill: none;
    stroke-width: 2;
    transition: stroke 0.2s;
  }

  .bs-arrow-prev { left: 0; }
  .bs-arrow-next { right: 0; }

  .bs-loading, .bs-empty {
    padding: 40px 20px;
    color: #aaa;
    font-size: 14px;
  }

  @media (max-width: 1100px) {
    :root { --card-width: 200px; --hero-width: 340px; }
  }
  @media (max-width: 900px) {
    :root { --card-width: 180px; --hero-width: 280px; }
    .bs-title { font-size: 26px; }
  }
  @media (max-width: 600px) {
    :root { --card-width: 155px; --hero-width: 220px; --card-gap: 12px; }
    .bs-hero { height: 350px; }
    .bs-hero-label { font-size: 38px; }
    .bs-header { padding: 0 16px 20px; }
    .bs-carousel-outer { padding: 0 16px; }
    .bs-arrow { display: none; }
  }
`;

import { useNavigate } from 'react-router-dom';

export default function BestSellersSection() {
  const navigate = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [bannerData, setBannerData] = useState(null);
  const scrollRef = useRef(null);

  const goToShop = () => { navigate('/shop'); };

  const goToProduct = (product) => {
    sessionStorage.setItem('selectedProduct', JSON.stringify({ id: product.id }));
    navigate('/product-details');
    window.scrollTo(0, 0);
  };

  // ✅ Connect to ShopContext
  const { addToCart, toggleWishlist, isWishlisted, cartItems } = useShop();

  // ✅ Track locally which items were just added (instant UI feedback)
  const [addedToCart, setAddedToCart] = useState(new Set());

  useEffect(() => {
    fetch(`${BASE}/products/best-sellers`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    fetch(`${BASE}/banners/section/best_sellers`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) setBannerData(list[0]);
      })
      .catch(() => {});
  }, []);

  // ✅ Check cart via local set OR context
  const isInCart = (productId) =>
    addedToCart.has(productId) ||
    cartItems.some(c => c.productId === productId || c.id === productId);

  const handleCartClick = (e, p) => {
    e.stopPropagation();
    const productId = p.id;
    if (isInCart(productId)) {
      navigate("/shop");
      return;
    }
    addToCart({
      productId,
      name:     p.productName,
      img:      p.image,
      image:    getImageUrl(p.image),
      price:    Number(p.franchise_price_final ?? p.salesPrice ?? p.mrp ?? 0),
      billingVariantId: p.Variants?.[0]?.billingVariantId || null,
      subtitle: p.Brand?.brandName || "",
      weight:   p.Brand?.brandName || "",
      isBuyOneGetOne: !!p.isBuyOneGetOne,
    });
    setAddedToCart(prev => new Set([...prev, productId]));
  };

  // ✅ Handle wishlist toggle
  const handleWishlistClick = (e, p) => {
    e.stopPropagation();
    toggleWishlist({
      id:        p.id,
      productId: p.id,
      name:      p.productName,
      img:       p.image,
      image:     getImageUrl(p.image),
      price:     Number(p.franchise_price_final ?? p.salesPrice ?? p.mrp ?? 0),
      subtitle:  p.Brand?.brandName || "",
    });
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * (CARD_WIDTH + CARD_GAP), behavior: "smooth" });
  };

  const getSizes = (p) => {
    if (Array.isArray(p.sizes)) return p.sizes;
    if (typeof p.sizes === "string") {
      try { return JSON.parse(p.sizes); } catch { return []; }
    }
    return [];
  };

  return (
    <>
      <style>{styles}</style>
      <section className="bs-section">
        <div className="bs-header">
          <h2 className="bs-title">Best Sellers</h2>
          <button className="bs-viewall" onClick={goToShop}>View all</button>
        </div>

        <div className="bs-carousel-outer">
          <button className="bs-arrow bs-arrow-prev" onClick={() => scroll(-1)} aria-label="Previous">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <div className="bs-track-wrap" ref={scrollRef}>
            <div className="bs-track">

              <div className="bs-hero" onClick={(e) => {
                  if (bannerData?.link) {
                    const link = bannerData.link;
                    if (link.startsWith("http://") || link.startsWith("https://")) {
                      window.open(link, "_blank", "noopener,noreferrer");
                    } else {
                      navigate(link.replace(/^#/, "/").startsWith("/") ? link.replace(/^#/, "/") : `/${link.replace(/^#/, "/")}`);
                    }
                  } else {
                    goToShop();
                  }
              }}>
                {bannerData?.image
                  ? <img src={getLocalImageUrl(bannerData.image)} alt="Best Sellers" loading="lazy" decoding="async" />
                  : <div className="bs-hero-fallback" />
                }
                <div className="bs-hero-overlay" />
                <div className="bs-hero-content">
                  <span className="bs-hero-label">{bannerData?.title || "Best Sellers"}</span>
                  <p className="bs-hero-sub">{bannerData?.subtitle || "Customer favourites"}</p>
                  <button
                    className="bs-hero-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bannerData?.link) {
                        const link = bannerData.link;
                        if (link.startsWith("http://") || link.startsWith("https://")) {
                          window.open(link, "_blank", "noopener,noreferrer");
                        } else {
                          window.location.hash = link.startsWith("#") ? link : `#${link.replace(/^\//, "")}`;
                        }
                      } else {
                        goToShop();
                      }
                    }}
                  >
                    Shop all
                  </button>
                </div>
              </div>

              {loading && (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ width: 'var(--card-width)', flexShrink: 0 }}>
                      <ProductCardSkeleton />
                    </div>
                  ))}
                </>
              )}
              {!loading && products.length === 0 && (
                <div className="bs-empty">No best sellers found.</div>
              )}

              {!loading && products.map((p) => {
                const imgSrc   = getImageUrl(p.image);
                const mrp      = Number(p.mrp       ?? 0);
                const sale     = Number(p.franchise_price_final ?? p.salesPrice ?? mrp);
                const discount = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;
                const brand    = p.Brand?.brandName ?? "";
                const sizes    = getSizes(p);
                const wished   = isWishlisted(p.id);
                const inCart   = isInCart(p.id);

                return (
                  <div key={p.id} className="bs-card" onClick={() => goToProduct(p)}>
                    <div className="bs-img-wrap">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={p.productName}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.target.src = logo; e.target.style.objectFit = 'contain'; e.target.style.background = '#126354'; e.target.style.padding = '8px'; }}
                        />
                      ) : (
                        <div className="bs-placeholder" style={{ background: '#126354', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden' }}>
                        <img src={logo} alt="Fashion Aura" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                          <img src={logo} alt="Default Logo" style={{ width: '75%', height: 'auto', objectFit: 'contain' }} />
                        </div>
                      )}

                      {discount > 0 && (
                        <span className="bs-badge">{discount}% OFF</span>
                      )}


                    </div>

                    <div className="bs-info">
                      {brand && <p className="bs-brand">{brand}</p>}
                      <p className="bs-name">{p.productName}</p>
                      {p.shortDescription && (
                        <p className="bs-short-desc">{p.shortDescription}</p>
                      )}
                      <div className="bs-price-row">
                        <span className="bs-sale-price">₹{sale.toFixed(2)}</span>
                        {discount > 0 && (
                          <span className="bs-mrp">₹{mrp.toFixed(2)}</span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          <button className="bs-arrow bs-arrow-next" onClick={() => scroll(1)} aria-label="Next">
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </section>
    </>
  );
}
