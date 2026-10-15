import { useParams, Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import Footer from '../../components/Footer';
import { useShop } from '../../context/ShopContext';
import { productApi, productSpecificationApi, sizeChartApi, stockApi, reviewApi, getImageUrl } from '../../utils/api';
import SizeChartModal from '../../components/SizeChartModal';
import defaultLogo from '../../assets/img/logo2.png';
import { ProductDetailsSkeleton } from '../../components/Skeleton';
/* ── Tokens ─────────────────────────────────────────────────────── */
const BRAND  = '#0f5447';
const GREEN  = '#0f5447';
const BG     = '#F4F0E8';
const BORDER = '#EAE4D6';
const CARD   = '#FFFFFF';
const GOLD   = '#C9933A';
const ACCENT = '#A2C579';

const F = {
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};


/* ── Stars ── */
const Stars = ({ rating = 0, count = null }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    {count > 0 && [...Array(5)].map((_, i) => (
      <i key={i}
        className={i < Math.round(rating) ? 'fa-solid fa-star' : 'fa-regular fa-star'}
        style={{ color: GOLD, fontSize: 11 }} />
    ))}
    {count !== null && (
      <span style={{ fontFamily: F.sub, color: '#888', fontSize: 11, fontWeight: 200, letterSpacing: 0.5 }}>
        {count > 0 ? `${rating.toFixed(1)} (${count} ${count === 1 ? 'review' : 'reviews'})` : 'No reviews yet'}
      </span>
    )}
  </div>
);

/* ── Feature pill ── */
const FeaturePill = ({ icon, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 6, padding: '10px 4px',
  }}>
    <i className={icon} style={{ fontSize: 18, color: GOLD }} />
    <span style={{ fontFamily: F.main, fontSize: 9.5, color: '#2C3E2B', textAlign: 'center', lineHeight: 1.3, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>
      {label}
    </span>
  </div>
);

/* ── Accordion ── */
const Accordion = ({ label, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 0',
        fontFamily: F.main, fontSize: 12, fontWeight: 600,
        color: BRAND, letterSpacing: 2, textTransform: 'uppercase',
      }}>
        {label}
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 11, color: GOLD }} />
      </button>
      {open && (
        <div style={{ paddingBottom: 16, fontFamily: F.sub, fontSize: 13, color: '#333', lineHeight: 1.7, fontWeight: 300, letterSpacing: 0.3 }}>
          {children}
        </div>
      )}
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────── */
const ProductDetailsPage = () => {
  const navigate = useNavigate();
  const goToProduct = (product) => {
    sessionStorage.setItem('selectedProduct', JSON.stringify({ id: product.id }));
    navigate('/product-details');
    window.scrollTo(0, 0);
  };
  const [qty, setQty]                         = useState(1);
  const [selectedImgIdx, setSelectedImgIdx]   = useState(0);
  const [showImageModal, setShowImageModal]   = useState(false);
  const [selectedSize, setSelectedSize]       = useState('');
  const [selectedColour, setSelectedColour]   = useState('');
  const [selectedFabric, setSelectedFabric]   = useState('');
  const [pincode, setPincode]                 = useState('');
  const [pincodeMsg, setPincodeMsg]           = useState('');
  const [product, setProduct]                 = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [addedToCart, setAddedToCart]         = useState(false);
  const [showSticky, setShowSticky]           = useState(false);
  const [hoveredThumb, setHoveredThumb]       = useState(null);
  const [showReviewForm, setShowReviewForm]   = useState(false);
  const [reviewRating, setReviewRating]       = useState(0);
  const [reviewHover, setReviewHover]         = useState(0);
  const [reviewName, setReviewName]           = useState('');
  const [reviewText, setReviewText]           = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError]         = useState('');
  const [reviews, setReviews]                 = useState([]);
  const [customSpecifications, setCustomSpecifications] = useState([]);
  const [sizeChart, setSizeChart] = useState(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const addToCartRef                          = useRef(null);

  const { addToCart, toggleWishlist, isWishlisted, user } = useShop();

  useEffect(() => {
    window.scrollTo(0, 0);
    const stored = sessionStorage.getItem('selectedProduct');
    if (!stored) { setLoading(false); return; }
    try {
      const parsed = JSON.parse(stored);
      const id = parsed.id;
      if (!id) { setProduct(parsed); setLoading(false); return; }
      productApi.getById(id)
        .then(async data => {
          // Attempt to fetch variants and stock from stock API
          try {
            const allStocks = await stockApi.getAll();
            const vars = allStocks.filter(s => String(s.product_id) === String(id));
            
            if (vars && vars.length > 0) {
              data.Variants = vars;
              
              // Map 'quantity' to 'stock' so it works natively with existing logic
              vars.forEach(v => {
                if (v.quantity !== undefined && v.stock === undefined) {
                  v.stock = v.quantity;
                }
              });
              
              // Update sizes and colors based on the variants
              const vSizes = [...new Set(vars.map(v => v.size).filter(Boolean))];
              const vColors = [...new Set(vars.map(v => v.color).filter(Boolean))];
              
              if (vSizes.length > 0) data.sizes = vSizes;
              if (vColors.length > 0) data.colors = vColors;
              
              // Update salesPrice and mrp
              const productFinal = [data.franchise_price_final, data.salesPrice, data.mrp].map(Number).find(price => Number.isFinite(price) && price > 0) || 0;
              const validVariantFinals = vars.map(variant => Number(variant.franchise_price_final)).filter(price => Number.isFinite(price) && price > 0);
              data.salesPrice = validVariantFinals.length ? Math.min(...validVariantFinals) : productFinal;
              data.Variants = vars.map(variant => ({
                ...variant,
                franchise_price_final: Number(variant.franchise_price_final) > 0 ? Number(variant.franchise_price_final) : null,
              }));
              data.franchise_price_final = data.salesPrice;
              data.mrp = data.salesPrice;
              
              // Total stock for the product
              data.stock = vars.reduce((sum, v) => sum + Number(v.stock || 0), 0);
            }
          } catch (err) {
            console.error("Failed to load variants/stock", err);
          }
          
          setProduct(data);
          productSpecificationApi.getByProduct(data.id)
            .then(setCustomSpecifications)
            .catch(error => { console.error('Failed to load product specifications:', error); setCustomSpecifications([]); });
          sizeChartApi.getForProduct(data.id)
            .then(setSizeChart)
            .catch(error => { console.error('Failed to load size chart:', error); setSizeChart(null); });
          productApi.getAll()
            .then(all => {
              if (data.categoryId) {
                setRelatedProducts(all.filter(p => p.categoryId === data.categoryId && p.id !== data.id).slice(0, 8));
              } else {
                setRelatedProducts([]);
              }
            })
            .catch(() => {
              setRelatedProducts([]);
            });
        })
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    } catch { setLoading(false); }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect();
        setShowSticky(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!product) return;
    if (product.sizes?.length)   setSelectedSize(product.sizes[0]);
    if (product.colors?.length)  setSelectedColour(product.colors[0]);
    if (product.fabrics?.length) setSelectedFabric(product.fabrics[0]);
    
    // Fetch approved reviews for this product
    let active = true;
    setReviews([]);
    if (product.id) {
      reviewApi.getByProduct(product.id).then(res => {
        if (active && Array.isArray(res)) setReviews(res);
      }).catch(err => { if (active) console.error('Failed to load reviews:', err); });
    }
    return () => { active = false; };
  }, [product]);

  const averageReviewRating = reviews.length
    ? reviews.reduce((total, review) => total + (Number(review.rating) || 0), 0) / reviews.length
    : 0;

  useEffect(() => {
    if (!product || !product.Variants) {
      setSelectedVariant(null);
      return;
    }
    const variant = product.Variants.find(v => 
       (!selectedSize || v.size === selectedSize) &&
       (!selectedColour || v.color === selectedColour) &&
       (!selectedFabric || v.fabric === selectedFabric)
    );
    setSelectedVariant(variant || null);
    setSelectedImgIdx(0);
  }, [product, selectedSize, selectedColour, selectedFabric]);

  const productName  = product?.productName      || '—';
  const selectedVariantFinal = Number(selectedVariant?.franchise_price_final);
  const productFinal = [product?.franchise_price_final, product?.salesPrice, product?.mrp].map(Number).find(price => Number.isFinite(price) && price > 0) || 0;
  const salesPrice   = selectedVariantFinal > 0 ? selectedVariantFinal : productFinal;
  const mrp          = selectedVariant ? Number(selectedVariant.mrp || 0) : Number(product?.mrp || 0);
  const showOldPrice = mrp > 0 && mrp > salesPrice;
  const categoryName = product?.Category?.name   || product?.SubCategory?.name || '';
  const brandName    = product?.Brand?.brandName  || '';
  const stock        = selectedVariant ? Number(selectedVariant.stock || 0) : Number(product?.stock || 0);
  const inStock      = stock > 0;
  const shortDesc    = product?.shortDescription  || '';
  const longDesc     = product?.longDescription   || '';

  const allImages = [];
  const variantImages = (selectedVariant?.images && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0)
    ? selectedVariant.images
    : (selectedVariant?.image ? [selectedVariant.image] : []);

  if (variantImages.length > 0) {
    variantImages.forEach(url => allImages.push({ url }));
  } else if (product?.image) {
    allImages.push({ url: product.image });
  }
  
  if (product?.Images?.length) {
    product.Images.forEach(img => { 
      if (img.url !== product.image && !variantImages.includes(img.url)) {
        allImages.push({ url: img.url }); 
      }
    });
  }
  
  const currentImgSrc = allImages[selectedImgIdx] ? getImageUrl(allImages[selectedImgIdx].url) : null;

  useEffect(() => {
    if (!showImageModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleModalKeys = event => {
      if (event.key === 'Escape') setShowImageModal(false);
      if (event.key === 'ArrowRight' && allImages.length > 1) {
        setSelectedImgIdx(index => (index + 1) % allImages.length);
      }
      if (event.key === 'ArrowLeft' && allImages.length > 1) {
        setSelectedImgIdx(index => (index - 1 + allImages.length) % allImages.length);
      }
    };
    window.addEventListener('keydown', handleModalKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleModalKeys);
    };
  }, [showImageModal, allImages.length]);

  const parseArrayField = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  };

  const sizeOptions   = parseArrayField(product?.sizes);
  const colourOptions = parseArrayField(product?.colors);
  const fabricOptions = parseArrayField(product?.fabrics);
  const selectedVariantSize = selectedVariant?.size || selectedSize;
  const selectedVariantColour = selectedVariant?.color || selectedColour;

  const handleAddToCart = () => {
    const parts = [];
    if (selectedColour) parts.push(selectedColour);
    if (selectedSize) parts.push(selectedSize);
    if (selectedFabric) parts.push(selectedFabric);
    const subtitle = parts.join(' - ') || categoryName;
    
    addToCart({
      id: product?.id || productName,
      productId: product?.id,
      variantId: selectedVariant?.id,
      billingVariantId: selectedVariant?.billingVariantId,
      name: productName,
      price: salesPrice,
      subtitle: subtitle,
      image: currentImgSrc,
      qty: qty,
      shippingWeightKg: selectedVariant?.weight || product?.shippingWeightKg || product?.weight || null,
      shippingLengthCm: product?.shippingLengthCm || null,
      shippingWidthCm: product?.shippingWidthCm || null,
      shippingHeightCm: product?.shippingHeightCm || null,
      isBuyOneGetOne: !!product?.isBuyOneGetOne,
    });
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    const parts = [];
    if (selectedColour) parts.push(selectedColour);
    if (selectedSize) parts.push(selectedSize);
    if (selectedFabric) parts.push(selectedFabric);
    const subtitle = parts.join(' - ') || categoryName;
    
    const item = {
      id: product?.id || productName,
      productId: product?.id,
      variantId: selectedVariant?.id,
      billingVariantId: selectedVariant?.billingVariantId,
      name: productName,
      price: salesPrice,
      subtitle: subtitle,
      image: currentImgSrc,
      img: currentImgSrc,
      qty: qty,
      shippingWeightKg: selectedVariant?.weight || product?.shippingWeightKg || product?.weight || null,
      shippingLengthCm: product?.shippingLengthCm || null,
      shippingWidthCm: product?.shippingWidthCm || null,
      shippingHeightCm: product?.shippingHeightCm || null,
      isBuyOneGetOne: !!product?.isBuyOneGetOne,
    };
    sessionStorage.setItem('buyNowItem', JSON.stringify(item));
    navigate('/checkout');
  };

  const wished = isWishlisted(product?.id || productName, selectedVariant?.id || null);

  if (loading) return (
    <div style={{ background: BG, minHeight: '100vh', padding: '24px 0' }}>
      <ProductDetailsSkeleton />
      <Footer />
    </div>
  );
  if (!product) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, gap: 12 }}>
      <p style={{ fontFamily: F.sub, color: '#888', fontWeight: 200, letterSpacing: 1 }}>Product not found.</p>
      <button onClick={() => navigate('/shop')}
        style={{ padding: '10px 28px', background: BRAND, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: F.main, fontSize: 11, fontWeight: 300, letterSpacing: 3, textTransform: 'uppercase' }}>
        Back to Shop
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        .pdp-gallery-sticky {
          position: sticky;
          top: 84px;
          align-self: flex-start;
          z-index: 2;
        }
        .pdp-gallery-wrap {
          display: flex;
          gap: 10px;
        }
        .pdp-thumbnails-strip {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 66px;
          flex-shrink: 0;
          max-height: 700px;
          overflow-y: auto;
          padding-right: 2px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pdp-thumbnails-strip::-webkit-scrollbar {
          display: none;
        }
        .pdp-thumbnail-item {
          width: 66px;
          height: 88px;
          overflow: hidden;
          cursor: pointer;
          flex-shrink: 0;
          position: relative;
          transition: border-color 0.2s, transform 0.18s;
        }
        .pdp-main-image {
          animation: pdp-image-enter 260ms ease both;
          height: min(700px, calc(100vh - 100px));
          cursor: zoom-in;
        }
        .pdp-action-btn-primary {
          flex: 1;
          padding: 12px 10px;
          border: none;
          font-family: ${F.main};
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: background 0.3s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }
        .pdp-action-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .pdp-action-btn-outline {
          flex: 1;
          padding: 12px 10px;
          border: 1.5px solid ${BRAND};
          background: #FAF8F4;
          color: ${BRAND};
          font-family: ${F.main};
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }
        .pdp-action-btn-outline:hover:not(:disabled) {
          background: ${BRAND};
          color: #fff;
          transform: translateY(-1px);
        }
        .pdp-zoom-backdrop {
          position: fixed; inset: 0; z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; background: rgba(16, 24, 22, 0.88);
          backdrop-filter: blur(5px); animation: pdp-modal-fade 180ms ease both;
        }
        .pdp-zoom-dialog {
          position: relative; width: min(1120px, 96vw); height: min(900px, 94vh);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 14px; animation: pdp-modal-rise 220ms ease both;
        }
        .pdp-zoom-photo-wrap {
          position: relative; width: 100%; min-height: 0; flex: 1;
          display: flex; align-items: center; justify-content: center;
        }
        .pdp-zoom-photo {
          max-width: 100%; max-height: 100%; width: auto; height: auto;
          object-fit: contain; border-radius: 6px; box-shadow: 0 16px 60px rgba(0,0,0,.38);
          animation: pdp-image-enter 220ms ease both;
        }
        .pdp-zoom-control {
          position: absolute; z-index: 1; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px; border: 1px solid rgba(255,255,255,.38);
          border-radius: 50%; color: #fff; background: rgba(15,84,71,.82);
          display: grid; place-items: center; font-size: 23px; cursor: pointer;
          transition: background .18s ease, transform .18s ease;
        }
        .pdp-zoom-control:hover { background: ${BRAND}; transform: translateY(-50%) scale(1.07); }
        .pdp-zoom-close {
          position: absolute; top: 0; right: 0; z-index: 2;
          width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.35);
          border-radius: 50%; background: rgba(255,255,255,.12); color: #fff;
          font-size: 25px; line-height: 1; cursor: pointer; transition: background .18s ease;
        }
        .pdp-zoom-close:hover { background: rgba(255,255,255,.24); }
        .pdp-zoom-thumbs { display: flex; justify-content: center; gap: 8px; max-width: 100%; overflow-x: auto; padding: 2px 4px 6px; }
        .pdp-zoom-thumb { width: 54px; height: 64px; flex: 0 0 auto; padding: 0; overflow: hidden; cursor: pointer; background: transparent; border: 1px solid rgba(255,255,255,.3); border-radius: 4px; opacity: .68; transition: opacity .18s ease, border-color .18s ease, transform .18s ease; }
        .pdp-zoom-thumb:hover { opacity: .9; transform: translateY(-2px); }
        .pdp-zoom-thumb.is-active { opacity: 1; border: 2px solid ${GOLD}; }
        .pdp-zoom-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        @keyframes pdp-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pdp-modal-rise { from { opacity: .7; transform: scale(.985) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pdp-image-enter {
          from { opacity: 0.72; transform: scale(0.995); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 991.98px) {
          .pdp-gallery-sticky { position: relative; top: auto; }
          .pdp-main-image { height: min(580px, 68vh); }
        }
        @media (max-width: 767.98px) {
          .pdp-gallery-wrap {
            flex-direction: column-reverse;
            gap: 10px;
          }
          .pdp-thumbnails-strip {
            flex-direction: row;
            width: 100%;
            max-height: none;
            overflow-x: auto;
            overflow-y: hidden;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
          }
          .pdp-thumbnail-item {
            width: 60px;
            height: 78px;
          }
          .pdp-main-image {
            height: min(440px, 60vh) !important;
          }
          .pdp-card-wrap {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 14px 2px !important;
          }
          .pdp-action-btn-primary, .pdp-action-btn-outline {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.2px;
            padding: 12px 6px;
            min-height: 44px;
          }
        }
        @media (max-width: 575.98px) {
          .pdp-zoom-backdrop { padding: 12px; }
          .pdp-zoom-dialog { width: 100%; height: 88vh; gap: 10px; }
          .pdp-zoom-control { width: 38px; height: 38px; font-size: 20px; }
          .pdp-zoom-close { width: 38px; height: 38px; }
          .pdp-zoom-thumb { width: 46px; height: 56px; }
          .pdp-card-wrap { padding: 10px 0 !important; }
          .pdp-summary-bar { padding: 16px 12px !important; gap: 16px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pdp-main-image, .pdp-zoom-backdrop, .pdp-zoom-dialog, .pdp-zoom-photo { animation: none; }
          .pdp-zoom-control, .pdp-zoom-thumb, .pdp-zoom-close { transition: none; }
        }
      `}</style>
      {/* ── Breadcrumb ── */}
      <div style={{ background: BG, padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.sub, fontSize: 11, color: '#888', fontWeight: 200, letterSpacing: 0.5 }}>
            <a href="#home" onClick={e => { e.preventDefault(); navigate('/home'); }}
              style={{ color: GOLD, textDecoration: 'none', fontFamily: F.main, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 400 }}>Home</a>
            <span style={{ color: GOLD }}>›</span>
            <span style={{ fontFamily: F.main, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: BRAND, fontWeight: 400 }}>{productName}</span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ background: BG, minHeight: '80vh', padding: '24px 0 60px' }}>
        <div className="container">
          <div className="row g-3">

            {/* ── Left: thumbnails + main image ── */}
            <div className="col-lg-6">
              <div className="pdp-gallery-sticky pdp-gallery-wrap">

                {allImages.length > 0 && (
                  <div className="pdp-thumbnails-strip">
                    {allImages.map((img, i) => (
                      <div key={i} onClick={() => setSelectedImgIdx(i)}
                        onMouseEnter={() => setHoveredThumb(i)}
                        onMouseLeave={() => setHoveredThumb(null)}
                        className="pdp-thumbnail-item"
                        style={{
                          border: `1.5px solid ${selectedImgIdx === i ? BRAND : hoveredThumb === i ? GOLD : BORDER}`,
                          transform: selectedImgIdx === i ? 'scale(1.03)' : 'scale(1)',
                        }}>
                        <img src={getImageUrl(img.url)} alt={`View ${i + 1}`}
                          loading="lazy" decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {selectedImgIdx === i && (
                          <div style={{ position: 'absolute', left: 0, top: '15%', width: 2, height: '70%', background: GOLD }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  role={currentImgSrc ? 'button' : undefined}
                  tabIndex={currentImgSrc ? 0 : undefined}
                  aria-label={currentImgSrc ? 'Open product image zoom' : undefined}
                  onClick={() => currentImgSrc && setShowImageModal(true)}
                  onKeyDown={event => {
                    if (currentImgSrc && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      setShowImageModal(true);
                    }
                  }}
                  style={{ flex: 1, overflow: 'hidden', background: '#fff', border: `1px solid ${BORDER}`, cursor: currentImgSrc ? 'zoom-in' : 'default' }}>
                  {currentImgSrc ? (
                    <img src={currentImgSrc} alt={productName}
                      key={selectedImgIdx}
                      className="pdp-main-image"
                      decoding="async"
                      style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div className="pdp-main-image" style={{ width: '100%', background: '#126354', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={defaultLogo} alt="Fashion Aura" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: product info ── */}
            <div className="col-lg-6">
              <div className="pdp-card-wrap" style={{ background: CARD, border: `1px solid ${BORDER}`, padding: '20px 22px', boxShadow: '0 2px 12px rgba(31,92,68,0.05)' }}>

                {/* Title */}
                <h1 style={{ fontFamily: F.main, fontSize: '1.2rem', fontWeight: 300, color: BRAND, marginBottom: 4, lineHeight: 1.4, letterSpacing: 3, textTransform: 'uppercase' }}>
                  {productName}
                </h1>

                {brandName && (
                  <p style={{ fontFamily: F.sub, fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 200, letterSpacing: 0.5 }}>
                    by <a href="#" style={{ color: GOLD, textDecoration: 'none', fontWeight: 300 }}>{brandName}</a>
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Stars rating={averageReviewRating} count={reviews.length} />
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: F.main, fontSize: '1.4rem', fontWeight: 300, color: BRAND, letterSpacing: 2 }}>
                    ₹{salesPrice.toLocaleString('en-IN')}.00
                  </span>
                  {showOldPrice && (
                    <del style={{ fontFamily: F.sub, fontSize: 13, color: '#aaa', fontWeight: 200 }}>₹{mrp.toLocaleString('en-IN')}</del>
                  )}
                </div>

                {/* Available Offers (Flipkart-style) */}
                {product?.isBuyOneGetOne && (
                  <div style={{
                    background: '#F9FCF7',
                    border: '1px solid #E0E8D8',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    fontFamily: F.sub
                  }}>
                    <h6 style={{
                      color: BRAND,
                      fontWeight: 600,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: 10,
                      fontFamily: F.main,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <i className="fa-solid fa-gift" style={{ color: ACCENT }} /> Available Offers
                    </h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, lineHeight: 1.4 }}>
                        <i className="fa-solid fa-tag" style={{ color: '#388E3C', marginTop: 3, fontSize: 12 }} />
                        <div>
                          <strong style={{ color: '#2E7D32' }}>Buy 1 Get 1 Free:</strong> Add 2 quantities of this item to the cart, and get one of them completely free!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <p style={{ fontFamily: F.sub, fontSize: 11, color: '#888', marginBottom: 12, fontWeight: 200, letterSpacing: 0.5 }}>
                  Tax included. <a href="#" style={{ color: GOLD }}>Shipping</a> calculated at checkout.
                </p>

                {/* Size selector */}
                {(sizeOptions.length > 0 || sizeChart) && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                      <p style={{ fontFamily: F.main, fontSize: 9, fontWeight: 400, color: BRAND, margin: 0, letterSpacing: 2.5, textTransform: 'uppercase' }}>
                        Size: <span style={{ color: GOLD }}>{selectedSize}</span>
                      </p>
                      <button type="button" onClick={() => setShowSizeChart(true)} style={{ background: 'transparent', border: 'none', fontFamily: F.sub, fontSize: 11, color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'underline', padding: 0 }}>
                        <i className="fa-solid fa-ruler-horizontal"></i> Size Chart
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {sizeOptions.map(size => (
                        <button key={size} onClick={() => setSelectedSize(size)} style={{
                          padding: '5px 12px',
                          fontFamily: F.main, fontSize: 10, fontWeight: 400,
                          letterSpacing: 1.5, textTransform: 'uppercase',
                          border: `1px solid ${selectedSize === size ? BRAND : BORDER}`,
                          cursor: 'pointer',
                          background: selectedSize === size ? BRAND : 'transparent',
                          color: selectedSize === size ? '#fff' : BRAND,
                          transition: 'all 0.15s',
                        }}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colour selector */}
                {colourOptions.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontFamily: F.main, fontSize: 9, fontWeight: 400, color: BRAND, marginBottom: 8, letterSpacing: 2.5, textTransform: 'uppercase' }}>
                      Colour: <span style={{ color: GOLD }}>{selectedColour}</span>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {colourOptions.map(col => (
                        <button key={col} onClick={() => setSelectedColour(col)} style={{
                          padding: '5px 12px',
                          fontFamily: F.main, fontSize: 10, fontWeight: 400,
                          letterSpacing: 1.5, textTransform: 'uppercase',
                          border: `1px solid ${selectedColour === col ? BRAND : BORDER}`,
                          cursor: 'pointer',
                          background: selectedColour === col ? BRAND : 'transparent',
                          color: selectedColour === col ? '#fff' : BRAND,
                          transition: 'all 0.15s',
                        }}>
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div style={{ marginBottom: 12 }} ref={addToCartRef}>
                  <p style={{ fontFamily: F.main, fontSize: 9, fontWeight: 400, color: BRAND, marginBottom: 8, letterSpacing: 2.5, textTransform: 'uppercase' }}>Quantity</p>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`, overflow: 'hidden', width: 'fit-content', background: 'transparent' }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      style={{ width: 34, height: 34, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: BRAND, fontFamily: F.main }}>−</button>
                    <span style={{ width: 42, textAlign: 'center', fontFamily: F.main, fontWeight: 400, color: BRAND, fontSize: 13, letterSpacing: 1 }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(stock || 99, q + 1))}
                      style={{ width: 34, height: 34, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: BRAND, fontFamily: F.main }}>+</button>
                  </div>
                </div>

                {/* Add to Cart + Buy Now + Wishlist */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                  <button onClick={handleAddToCart} disabled={!inStock}
                    className="pdp-action-btn-primary"
                    style={{
                      background: addedToCart ? GOLD : inStock ? BRAND : '#ccc',
                      color: '#fff',
                      cursor: inStock ? 'pointer' : 'not-allowed',
                    }}>
                    {addedToCart ? '✓ Added' : 'Add to Cart'}
                  </button>
                  <button onClick={handleBuyNow} disabled={!inStock}
                    className="pdp-action-btn-outline"
                    style={{
                      cursor: inStock ? 'pointer' : 'not-allowed',
                    }}>
                    Buy It Now
                  </button>
                  <button onClick={() => toggleWishlist({ id: product.id, productId: product.id, variantId: selectedVariant?.id || null, name: productName, price: salesPrice, image: currentImgSrc, subtitle: [selectedColour, selectedSize, selectedFabric].filter(Boolean).join(' - ') || categoryName, color: selectedColour, size: selectedSize, fabric: selectedFabric, isBuyOneGetOne: !!product.isBuyOneGetOne })}
                    aria-label="Wishlist"
                    style={{
                      width: 42, height: 42, flexShrink: 0,
                      border: `1px solid ${BORDER}`,
                      background: wished ? '#fce4e4' : 'transparent',
                      color: '#c0392b', cursor: 'pointer', fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <i className={`${wished ? 'fa-solid' : 'fa-regular'} fa-heart`} />
                  </button>
                </div>

                {/* Feature pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 12, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '8px 0' }}>
                  <FeaturePill icon="fa-solid fa-wind"    label="Breathable" />
                  <FeaturePill icon="fa-solid fa-gem"     label="Premium Fabric" />
                  <FeaturePill icon="fa-solid fa-shirt"   label="Everyday Wear" />
                  <FeaturePill icon="fa-solid fa-box"     label="Secured Packing" />
                  <FeaturePill icon="fa-solid fa-heart"   label="100% Genuine" />
                  <FeaturePill icon="fa-solid fa-headset" label="Dedicated Support" />
                </div>

                {/* Accordions */}
                <div style={{ marginBottom: 12 }}>
                  <Accordion label="Offers">
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 0',
                    }}>
                      <i className="fa-solid fa-tag" style={{ color: '#2E7D32', fontSize: 13 }} />
                      <span style={{ fontFamily: F.sub, fontSize: 13, color: '#2C3E2B' }}>
                        Use code <strong style={{ fontWeight: 700, color: BRAND, letterSpacing: '0.5px' }}>FIRST5</strong> to get 5% off your first purchase.
                      </span>
                    </div>
                  </Accordion>

                  <Accordion label="Specifications" defaultOpen={true}>
                    {(() => {
                      const specList = [
                        brandName && { label: 'Brand', value: brandName },
                        categoryName && { label: 'Category', value: categoryName },
                        (selectedVariant?.fabric || selectedFabric) && { label: 'Fabric', value: selectedVariant?.fabric || selectedFabric },
                        selectedVariantSize && { label: 'Size', value: selectedVariantSize },
                        selectedVariantColour && { label: 'Color', value: selectedVariantColour },
                        { label: 'SKU', value: `PROD-${product.id}` },
                        ...customSpecifications
                          .filter(item => !['size', 'sizes', 'available size', 'available sizes', 'color', 'colour', 'colors', 'colours', 'fabric'].includes(String(item.label || '').trim().toLowerCase()))
                          .map(item => ({ label: item.label, value: item.value })),
                        { 
                          label: 'Availability', 
                          value: inStock ? (stock ? `In Stock (${stock} units)` : 'In Stock') : 'Out of Stock',
                          isStock: true,
                          inStock: !!inStock,
                        },
                      ].filter(Boolean);

                      return (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '6px 0 2px',
                        }}>
                          {specList.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                justifyContent: 'space-between',
                                padding: '8px 0',
                                borderBottom: idx === specList.length - 1 ? 'none' : '1px solid rgba(234, 228, 214, 0.75)',
                                gap: '16px',
                              }}
                            >
                              <span style={{
                                fontFamily: F.main,
                                fontSize: '11px',
                                fontWeight: 600,
                                color: BRAND,
                                letterSpacing: '1.4px',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                              }}>
                                {item.label}
                              </span>
                              <span style={{
                                fontFamily: F.sub,
                                fontSize: '13px',
                                fontWeight: item.isStock ? 600 : 400,
                                color: item.isStock ? (item.inStock ? '#1B6B48' : '#C0392B') : '#2C3E2B',
                                textAlign: 'right',
                                letterSpacing: '0.3px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}>
                                {item.isStock && (
                                  <span style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: item.inStock ? '#27AE60' : '#E74C3C',
                                    display: 'inline-block',
                                  }} />
                                )}
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </Accordion>

                  <Accordion label="Description">
                    <div style={{
                      padding: '8px 0', fontFamily: F.sub, fontSize: 13,
                      color: '#3A483E', lineHeight: 1.8, letterSpacing: '0.2px',
                    }}>
                      {longDesc
                        ? <div dangerouslySetInnerHTML={{ __html: longDesc.replace(/\n/g, '<br/>') }} />
                        : shortDesc ? <p style={{ margin: 0 }}>{shortDesc}</p>
                        : <p style={{ color: '#888', margin: 0 }}>No description available.</p>
                      }
                    </div>
                  </Accordion>

                  <Accordion label="Feeding Friendly">
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '8px 0',
                    }}>
                      <i className="fa-solid fa-baby" style={{ color: GOLD, fontSize: 15, marginTop: 2 }} />
                      <span style={{ fontFamily: F.sub, fontSize: 13, color: '#3A483E', lineHeight: 1.6 }}>
                        This outfit is designed with convenience in mind. Features discreet and comfortable access for nursing mothers.
                      </span>
                    </div>
                  </Accordion>

                  <Accordion label="Wash Care">
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '8px 0',
                    }}>
                      <i className="fa-solid fa-shirt" style={{ color: GOLD, fontSize: 14, marginTop: 2 }} />
                      <span style={{ fontFamily: F.sub, fontSize: 13, color: '#3A483E', lineHeight: 1.6 }}>
                        Machine wash cold with similar colours. Do not bleach. Tumble dry low. Iron on low heat.
                      </span>
                    </div>
                  </Accordion>

                  <Accordion label="Shipping Information">
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 8,
                      padding: '8px 0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#3A483E' }}>
                        <i className="fa-solid fa-truck" style={{ color: GOLD, fontSize: 13 }} />
                        <span>Standard delivery: 3–5 business days</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#3A483E' }}>
                        <i className="fa-solid fa-bolt" style={{ color: GOLD, fontSize: 13 }} />
                        <span>Express delivery available at checkout</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#3A483E' }}>
                        <i className="fa-solid fa-gift" style={{ color: GOLD, fontSize: 13 }} />
                        <span>Free shipping on orders above ₹999</span>
                      </div>
                    </div>
                  </Accordion>

                  <Accordion label="Colour Disclaimer">
                    <div style={{
                      padding: '4px 2px', fontFamily: F.sub, fontSize: 12.5,
                      color: '#6B7A6B', lineHeight: 1.7, fontStyle: 'italic',
                    }}>
                      Actual colours may slightly vary from the images shown due to screen display settings and photography lighting.
                    </div>
                  </Accordion>
                </div>

                {/* Trust badges */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                  padding: '12px 0', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap',
                }}>
                  {[
                    { icon: 'fa-solid fa-heart',        text: 'Trusted by 1L+' },
                    { icon: 'fa-solid fa-truck-fast',   text: 'Fast Delivery' },
                    { icon: 'fa-solid fa-shield-check', text: 'Quality Guaranteed' },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.main, fontSize: 9, color: BRAND, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 400 }}>
                      <i className={icon} style={{ color: GOLD, fontSize: 12 }} />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>



          {/* ── Customer Reviews ── */}
          <div style={{ marginTop: 60, padding: '40px 0', borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
            <h3 style={{ fontFamily: F.main, color: BRAND, fontSize: '1.1rem', marginBottom: 28, fontWeight: 300, letterSpacing: 6, textTransform: 'uppercase' }}>
              Customer Reviews
            </h3>

            {/* Summary bar */}
            <div className="pdp-summary-bar" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 40, flexWrap: 'wrap',
              maxWidth: 620, margin: '0 auto',
              padding: '24px 32px',
              border: `1px solid ${BORDER}`,
              background: CARD,
              boxShadow: '0 2px 12px rgba(31,92,68,0.05)',
            }}>
              <div style={{ textAlign: 'left' }}>
                {reviews.length > 0 && <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[...Array(5)].map((_, i) => {
                    return (
                      <i key={i} className={i < Math.round(averageReviewRating) ? "fa-solid fa-star" : "fa-regular fa-star"} style={{ color: GOLD, fontSize: 18 }} />
                    );
                  })}
                  <span style={{ marginLeft: 8, fontSize: 14, color: '#333', fontWeight: 600 }}>
                    {reviews.length ? averageReviewRating.toFixed(1) : ''}
                  </span>
                </div>}
                <p style={{ fontFamily: F.sub, fontSize: 12, color: '#888', margin: 0, fontWeight: 200, letterSpacing: 0.5 }}>
                  {reviews.length ? '' : 'Be the first to write a review'}
                </p>
              </div>
              <div style={{ width: 1, height: 48, background: BORDER }} />
              <button
                onClick={() => { setShowReviewForm(o => !o); setReviewSubmitted(false); setReviewError(''); }}
                style={{
                  padding: '10px 28px', background: BRAND, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontFamily: F.main, fontSize: 10, fontWeight: 300,
                  letterSpacing: 2.5, textTransform: 'uppercase',
                }}>
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && !reviewSubmitted && (
              <div style={{
                maxWidth: 620, margin: '24px auto 0',
                padding: '32px',
                border: `1px solid ${BORDER}`,
                background: CARD,
                boxShadow: '0 2px 12px rgba(31,92,68,0.05)',
                textAlign: 'left',
              }}>
                <p style={{ fontFamily: F.main, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: BRAND, marginBottom: 20, fontWeight: 400 }}>
                  Your Review
                </p>

                {/* Star Rating */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: F.main, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Rating *</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <i
                        key={star}
                        className={star <= (reviewHover || reviewRating) ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                        style={{ fontSize: 22, color: GOLD, cursor: 'pointer', transition: 'transform 0.1s' }}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                      />
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: F.main, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Name *</p>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: `1px solid ${BORDER}`, background: '#fff',
                      fontFamily: F.sub, fontSize: 13, color: BRAND,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Review Text */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: F.main, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Review *</p>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: `1px solid ${BORDER}`, background: '#fff',
                      fontFamily: F.sub, fontSize: 13, color: BRAND,
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Error */}
                {reviewError && (
                  <p style={{ fontFamily: F.sub, fontSize: 12, color: '#c00', marginBottom: 12 }}>{reviewError}</p>
                )}

                {/* Submit */}
                <button
                  onClick={async () => {
                    if (!user || !user.id) return setReviewError('Please login to submit a review.');
                    if (!reviewRating) return setReviewError('Please select a star rating.');
                    if (!reviewName.trim()) return setReviewError('Please enter your name.');
                    if (!reviewText.trim()) return setReviewError('Please write your review.');
                    
                    try {
                      setReviewError('');
                      const res = await reviewApi.add({
                        customerId: user.id,
                        productId: product.id,
                        rating: reviewRating,
                        feedback: reviewText,
                        name: reviewName,
                        email: user.email || ''
                      });
                      
                      if (res && res.success) {
                        setReviewSubmitted(true);
                      } else {
                        setReviewError(res?.message || 'Failed to submit review.');
                      }
                    } catch (err) {
                      setReviewError(err.message || 'Server error. Please try again.');
                    }
                  }}
                  style={{
                    padding: '11px 32px', background: BRAND, color: '#fff',
                    border: 'none', cursor: 'pointer',
                    fontFamily: F.main, fontSize: 10, fontWeight: 300,
                    letterSpacing: 2.5, textTransform: 'uppercase',
                  }}>
                  Submit Review
                </button>
              </div>
            )}

            {/* Thank you message */}
            {reviewSubmitted && (
              <div style={{
                maxWidth: 620, margin: '24px auto 0',
                padding: '28px 32px',
                border: `1px solid ${BORDER}`,
                background: CARD,
                textAlign: 'center',
              }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: BRAND, marginBottom: 12 }} />
                <p style={{ fontFamily: F.main, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: BRAND, margin: 0 }}>
                  Thank you for your review!
                </p>
              </div>
            )}

            {/* Display Reviews */}
            {reviews.length > 0 && (
              <div style={{ maxWidth: 620, margin: '40px auto 0', textAlign: 'left' }}>
                <h4 style={{ fontFamily: F.main, fontSize: 14, color: BRAND, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
                  Recent Reviews
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {reviews.map((r, idx) => (
                    <div key={idx} style={{ 
                      padding: 24, 
                      background: '#fff', 
                      border: `1px solid ${BORDER}`, 
                      borderRadius: 8,
                      boxShadow: '0 4px 16px rgba(31,92,68,0.06)' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 2, color: GOLD, fontSize: 12 }}>
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={i < r.rating ? "fa-solid fa-star" : "fa-regular fa-star"} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: '#999' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#333', marginBottom: 4 }}>
                        {r.name || 'Customer'} {r.verifiedPurchase && <span style={{ color: '#10B981', fontSize: 10, marginLeft: 6, fontWeight: 400 }}>✓ Verified</span>}
                      </div>
                      <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>
                        {r.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {showImageModal && currentImgSrc && (
        <div className="pdp-zoom-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowImageModal(false); }}>
          <div className="pdp-zoom-dialog" role="dialog" aria-modal="true" aria-label={`${productName} image gallery`}>
            <button type="button" className="pdp-zoom-close" aria-label="Close image viewer" onClick={() => setShowImageModal(false)}>×</button>
            <div className="pdp-zoom-photo-wrap">
              {allImages.length > 1 && <button type="button" className="pdp-zoom-control" style={{ left: 12 }} aria-label="Previous image" onClick={() => setSelectedImgIdx(index => (index - 1 + allImages.length) % allImages.length)}>‹</button>}
              <img key={`zoom-${selectedImgIdx}`} className="pdp-zoom-photo" src={currentImgSrc} alt={`${productName} ${selectedImgIdx + 1}`} />
              {allImages.length > 1 && <button type="button" className="pdp-zoom-control" style={{ right: 12 }} aria-label="Next image" onClick={() => setSelectedImgIdx(index => (index + 1) % allImages.length)}>›</button>}
            </div>
            {allImages.length > 1 && (
              <div className="pdp-zoom-thumbs" aria-label="Product images">
                {allImages.map((image, index) => (
                  <button key={`${image.url}-${index}`} type="button" className={`pdp-zoom-thumb${selectedImgIdx === index ? ' is-active' : ''}`} aria-label={`Show image ${index + 1}`} onClick={() => setSelectedImgIdx(index)}>
                    <img src={getImageUrl(image.url)} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div style={{ color: 'rgba(255,255,255,.78)', fontFamily: F.sub, fontSize: 11, letterSpacing: 1 }}>
              {selectedImgIdx + 1} / {allImages.length} · Use ← → keys to browse · Esc to close
            </div>
          </div>
        </div>
      )}

      <SizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        productName={productName}
        productImage={currentImgSrc}
        chart={sizeChart}
      />

      <Footer />
    </>
  );
};

export default ProductDetailsPage;
