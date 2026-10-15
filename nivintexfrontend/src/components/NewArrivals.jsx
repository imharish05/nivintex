import React, { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { getImageUrl, getLocalImageUrl } from "../utils/api";
import logo from "../assets/img/logo2.png";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";



const styles = `
  .na-wrapper {
    display: flex;
    flex-direction: row;
    width: 100%;
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
    background: #EAF0E2;
  }

  .na-left {
    flex: 0 0 55%;
    width: 55%;
    padding: clamp(20px, 3vw, 28px) clamp(16px, 2.5vw, 40px);
    box-sizing: border-box;
    min-width: 0;
  }

  .na-heading {
    font-family: 'Cormorant Garamond', 'Playfair Display', serif;
    font-size: clamp(20px, 2.5vw, 32px);
    color: #0f5447;
    text-align: left;
    margin: 0 0 20px 0;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 8px;
    display: inline-block;
  }

  .na-heading::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 2px;
    background: #C9A84C;
  }

  .na-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(10px, 1.5vw, 14px);
  }

  .na-card {
    position: relative;
    cursor: pointer;
    min-width: 0;
  }

  .na-img-wrap {
    position: relative;
    overflow: hidden;
    background: #f5f5f5;
    width: 100%;
  }

  .na-img-wrap img {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    object-position: top;
    display: block;
    transition: transform 0.4s ease;
  }

  .na-card:hover .na-img-wrap img {
    transform: scale(1.04);
  }

  .na-badge {
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

  .na-info { padding: 10px 0 0; }

  .na-brand {
    font-size: 11px;
    color: #999;
    margin: 0 0 3px;
    letter-spacing: 0.2px;
  }

  .na-name {
    font-size: 13px;
    color: #2C2F33;
    margin: 0 0 6px;
    line-height: 1.4;
    font-weight: 400;
  }
  .na-short-desc {
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

  .na-price-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    margin: 0 0 8px;
  }

  .na-sale-price {
    font-size: 14px;
    font-weight: 700;
    color: #2C2F33;
  }

  .na-mrp {
    font-size: 12px;
    color: #aaa;
    text-decoration: line-through;
    font-weight: 400;
  }

  .na-placeholder {
    width: 100%;
    aspect-ratio: 3/4;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #ccc;
  }

  .na-right {
    flex: 0 0 45%;
    width: 45%;
    padding: clamp(24px, 4vw, 60px) clamp(20px, 3vw, 50px);
    box-sizing: border-box;
    display: flex;
  }

  .na-right-inner {
    width: 100%;
    min-height: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    background: #2b1a14;
  }

  .na-right-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
    opacity: 0.85;
  }

  .na-banner-fallback {
    width: 100%;
    height: 100%;
    background: linear-gradient(160deg, #FFFFFF 0%, #2C2F33 100%);
  }

  .na-banner-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
  }

  .na-banner-content {
    position: absolute;
    bottom: clamp(20px, 4vw, 48px);
    left: clamp(16px, 3.5vw, 40px);
    right: clamp(16px, 3.5vw, 40px);
  }

  .na-banner-title {
    font-family: 'Josefin Sans', 'Raleway', sans-serif;
    font-size: clamp(24px, 4vw, 48px);
    font-weight: 700;
    color: #fff;
    margin: 0 0 clamp(8px, 2vw, 16px);
    text-shadow: 0 2px 12px rgba(0,0,0,0.3);
    line-height: 1.1;
  }

  .na-banner-btn {
    background: #2C2F33;
    color: #fff;
    border: none;
    padding: clamp(10px, 2vw, 14px) clamp(24px, 3vw, 36px);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s;
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
  }

  .na-banner-btn:hover { background: #1E2022; }

  .na-loading, .na-empty {
    padding: 40px 0;
    color: #aaa;
    font-size: 14px;
    text-align: center;
    grid-column: span 3;
  }

  @media (max-width: 1024px) {
    .na-wrapper { flex-direction: column-reverse; }
    .na-left { flex: none; width: 100%; padding: 20px 16px; }
    .na-right { flex: none; width: 100%; min-height: 320px; aspect-ratio: 16/9; max-height: 480px; padding: 16px; }
    .na-right-inner { height: 100%; }
  }

  @media (max-width: 640px) {
    .na-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .na-right { min-height: 260px; aspect-ratio: 4/3; max-height: 360px; padding: 12px; }
    .na-loading, .na-empty { grid-column: span 2; }
  }
`;

import { useNavigate } from 'react-router-dom';

export default function NewArrivalsSection() {
  const navigate = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [bannerData, setBannerData] = useState(null);

  const goToShop = () => { navigate("/shop"); };

  const goToProduct = (product) => {
    sessionStorage.setItem('selectedProduct', JSON.stringify({ id: product.id }));
    navigate('/product-details');
    window.scrollTo(0, 0);
  };

  // ✅ Connect to ShopContext
  const { addToCart, toggleWishlist, isWishlisted, cartItems } = useShop();

  // ✅ Track locally which items were just added to cart (instant UI feedback)
  const [addedToCart, setAddedToCart] = useState(new Set());

  useEffect(() => {
    fetch(`${BASE}/products/new-arrivals`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    fetch(`${BASE}/banners/section/new_arrivals`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) setBannerData(list[0]);
      })
      .catch(() => {});
  }, []);

  // ✅ Check if product is in cart (local set OR context cartItems)
  const isInCart = (productId) =>
    addedToCart.has(productId) ||
    cartItems.some(c => c.productId === productId || c.id === productId);

  // ✅ Handle cart button click
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
      id:       p.id,
      productId: p.id,
      name:     p.productName,
      img:      p.image,
      image:    getImageUrl(p.image),
      price:    Number(p.franchise_price_final ?? p.salesPrice ?? p.mrp ?? 0),
      subtitle: p.Brand?.brandName || "",
    });
  };

  const getSizes = (product) => {
    if (Array.isArray(product.sizes)) return product.sizes;
    if (typeof product.sizes === "string") {
      try { return JSON.parse(product.sizes); } catch { return []; }
    }
    return [];
  };

  return (
    <>
      <style>{styles}</style>
      <div className="na-wrapper">

        <div className="na-left">
          <h2 className="na-heading">New Arrivals</h2>
          <div className="na-grid">
            {loading && <div className="na-loading">Loading new arrivals…</div>}
            {!loading && products.length === 0 && (
              <div className="na-empty">No new arrivals yet.</div>
            )}
            {!loading && products.map((p) => {
              const imgSrc   = getImageUrl(p.image);
              const mrp      = Number(p.mrp       ?? 0);
              const sale     = Number(p.franchise_price_final ?? p.salesPrice ?? mrp);
              const discount = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;
              const sizes    = getSizes(p);
              const brand    = p.Brand?.brandName ?? "";
              const wished   = isWishlisted(p.id);
              const inCart   = isInCart(p.id);

              return (
                <div key={p.id} className="na-card" onClick={() => goToProduct(p)}>
                  <div className="na-img-wrap">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={p.productName}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.target.src = logo; e.target.style.objectFit = 'contain'; e.target.style.background = '#126354'; e.target.style.padding = '8px'; }}
                      />
                    ) : (
                      <div className="na-placeholder" style={{ background: '#126354', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden' }}>
                        <img src={logo} alt="Fashion Aura" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                        <img src={logo} alt="Default Logo" style={{ width: '75%', height: 'auto', objectFit: 'contain' }} />
                      </div>
                    )}

                    {discount > 0 && (
                      <span className="na-badge">{discount}% OFF</span>
                    )}


                  </div>

                  <div className="na-info">
                    {brand && <p className="na-brand">{brand}</p>}
                    <p className="na-name">{p.productName}</p>
                    {p.shortDescription && (
                      <p className="na-short-desc">{p.shortDescription}</p>
                    )}
                    <div className="na-price-row">
                      <span className="na-sale-price">₹{sale.toFixed(2)}</span>
                      {discount > 0 && (
                        <span className="na-mrp">₹{mrp.toFixed(2)}</span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="na-right">
          <div className="na-right-inner">
            {bannerData?.image
              ? <img src={getLocalImageUrl(bannerData.image)} alt="New Arrivals" loading="lazy" decoding="async" />
              : <div className="na-banner-fallback" />
            }
            <div className="na-banner-overlay" />
            <div className="na-banner-content">
              <h2 className="na-banner-title">{bannerData?.title || "New Arrivals"}</h2>
              {bannerData?.subtitle && (
                <p className="na-banner-sub" style={{ fontSize: '15px', color: '#fff', margin: '-10px 0 20px', opacity: 0.95, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '500', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                  {bannerData.subtitle}
                </p>
              )}
              <button 
                className="na-banner-btn" 
                onClick={(e) => {
                  e.stopPropagation();
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
                }}
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
