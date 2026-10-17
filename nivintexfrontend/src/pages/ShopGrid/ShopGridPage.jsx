import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import defaultLogo from '../../assets/img/logo2.png';
import Footer from '../../components/Footer';
import { useShop } from '../../context/ShopContext';
import { productApi, categoryApi, subCategoryApi, billingCatalogApi, getImageUrl, comboApi, slugifyProductName } from '../../utils/api';
import Skeleton, { ProductCardSkeleton, SidebarItemSkeleton, ComboCardSkeleton } from '../../components/Skeleton';

const BRAND   = '#2C2F33';
const ACCENT  = '#0f5447';
const PER_PAGE = 12;

const billingAvailableStock = variant => {
  if (!variant || variant.in_stock === false || variant.in_stock === 0
    || ['false', '0', 'no', 'out of stock'].includes(String(variant.in_stock ?? '').trim().toLowerCase())) return 0;
  const fields = ['available_stock', 'available_quantity', 'available_qty', 'quantity_available', 'qty_available', 'current_stock', 'stock_qty', 'stock_quantity', 'qty', 'on_hand', 'balance_quantity', 'quantity', 'stock', 'total_stock'];
  for (const field of fields) {
    const raw = variant[field];
    if (raw === null || raw === undefined || raw === '') continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  }
  return null;
};

const syncProductsWithBillingStock = (products, billingProducts, stockByVariant = null) => {
  const productRows = Array.isArray(billingProducts) ? billingProducts : [];
  const billingVariants = productRows.flatMap(row => row?.variants || row?.product_variants || row?.product_varients || []);
  const variantsById = new Map(billingVariants.map(variant => [String(variant.id ?? variant.product_variant_id ?? variant.variant_id), variant]));
  const billingProductsById = new Map(productRows.map(row => [String(row.id ?? row.product_id), row]));

  return products.map(product => {
    const productBillingId = product.billingProductId || product.billing_product_id;
    const billingProduct = productBillingId ? billingProductsById.get(String(productBillingId)) : null;
    const localVariants = product.Variants || product.variants || [];
    const sourceVariants = localVariants.length ? localVariants : (billingProduct?.variants || billingProduct?.product_variants || billingProduct?.product_varients || []);
    const mappedVariants = sourceVariants.map(local => {
      const billingId = local.billingVariantId || local.billing_variant_id || local.id;
      const live = variantsById.get(String(billingId));
      const listQuantity = billingAvailableStock(live);
      const hasStockRow = stockByVariant?.has(String(billingId));
      const dedicatedQuantity = stockByVariant === null ? null : hasStockRow ? stockByVariant.get(String(billingId)) : 0;
      const quantities = [listQuantity, dedicatedQuantity].filter(value => value !== null && value !== undefined);
      const quantity = quantities.length ? Math.min(...quantities) : null;
      const stockVerified = listQuantity !== null && (stockByVariant === null || (stockByVariant instanceof Map && (hasStockRow ? dedicatedQuantity !== null : true)));
      return { ...local, billingVariantId: local.billingVariantId || local.billing_variant_id || live?.id || null, stock: stockVerified ? quantity : 0, billingStockVerified: stockVerified };
    });
    const verified = mappedVariants.length > 0 && mappedVariants.every(variant => variant.billingStockVerified);
    const stock = verified ? mappedVariants.reduce((total, variant) => total + variant.stock, 0) : 0;
    const productStock = billingProduct ? billingAvailableStock(billingProduct) : null;
    const resolvedStock = mappedVariants.length ? stock : productStock;

    return {
      ...product,
      Variants: mappedVariants,
      stock: resolvedStock ?? 0,
      billingStockVerified: mappedVariants.length ? verified : productStock !== null,
    };
  });
};

const F = {
  main: "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

// ── Heart SVG (used for "All" circles in sidebar) ────────────────
const HeartIcon = ({ size = 14, color = BRAND }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

// ── Small circular thumbnail for sidebar items ───────────────────
const SidebarThumb = ({ src, alt, active }) => {

  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src} alt={alt}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: `2px solid ${active ? BRAND : '#E0E8D8'}`,
          transition: 'border-color 0.2s',
        }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: active ? BRAND : '#EAF0E2',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, transition: 'background 0.2s',
    }}>
      <HeartIcon size={13} color={active ? '#fff' : BRAND} />
    </div>
  );
};

// ── Stars ────────────────────────────────────────────────────────
const Stars = ({ filled = 4 }) => (
  <div className="star">
    {[...Array(5)].map((_, i) => (
      <i key={i}
        className={i < filled ? 'fa-solid fa-star' : 'fa-regular fa-star'}
        style={{ color: ACCENT, fontSize: '12px' }}
      />
    ))}
  </div>
);

// ── Placeholder when no product image ───────────────────────────
const PlaceholderImg = ({ style }) => (
  <div style={{ ...style, background: '#126354', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <img src={defaultLogo} alt="Fashion Aura" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
  </div>
);

const qvStyles = `
  .qv-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(44, 47, 51, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: qvFadeIn 0.25s ease-out;
  }
  @keyframes qvFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .qv-content {
    background: #fff;
    border-radius: 16px;
    width: 90%;
    max-width: 900px;
    max-height: 85vh;
    overflow-y: auto;
    border: 1px solid #E0E8D8;
    position: relative;
    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
    animation: qvScaleUp 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    display: flex;
    flex-direction: column;
    padding: 32px;
  }
  @keyframes qvScaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .product-card-image-wrap:hover .product-card-actions {
    /* No longer needed since opacity is always 1 */
  }
  .product-badge {
    position: absolute;
    bottom: 12px;
    left: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 10;
  }
  .product-badge span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px 5px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #fff;
    clip-path: polygon(10px 0%, 100% 0%, 100% 100%, 10px 100%, 0% 50%);
    border-radius: 0 3px 3px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  }
  .badge-new   { background: #E05252; }
  .badge-sale  { background: #E05252; }
  .badge-combo { background: #0f5447; }
  .badge-bogo  { background: #C47D00; }
  .qv-close-btn {
    position: absolute;
    top: 20px; right: 20px;
    background: #F4F8F0;
    border: none;
    width: 36px; height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2C2F33;
    font-size: 16px;
    transition: all 0.2s ease;
    z-index: 10;
  }
  .qv-close-btn:hover {
    background: #0f5447;
    color: #fff;
    transform: rotate(90deg);
  }
  .qv-thumb {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    object-fit: cover;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }
  .qv-thumb.active {
    border-color: #0f5447;
  }
  .qv-size-pill, .qv-color-pill, .qv-fabric-pill {
    padding: 6px 14px;
    border: 1px solid #E0E8D8;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fff;
    color: #4a5a44;
  }
  .qv-size-pill.active, .qv-color-pill.active, .qv-fabric-pill.active {
    border-color: #2C2F33;
    background: #2C2F33;
    color: #fff;
  }
  .qv-size-pill:hover:not(.active), .qv-color-pill:hover:not(.active), .qv-fabric-pill:hover:not(.active) {
    border-color: #0f5447;
    color: #0f5447;
  }
  .custom-range-slider::-webkit-slider-thumb {
    appearance: none;
    pointer-events: auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #F4F8F0;
    border: 1px solid #4a5a44;
    cursor: pointer;
    position: relative;
    z-index: 2;
  }
  .custom-range-slider::-moz-range-thumb {
    pointer-events: auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #F4F8F0;
    border: 1px solid #4a5a44;
    cursor: pointer;
    position: relative;
    z-index: 2;
  }
  @media (max-width: 768px) {
    .qv-content {
      padding: 20px 16px;
      width: 95%;
      max-height: 90vh;
      border-radius: 12px;
    }
    .qv-close-btn {
      top: 12px; right: 12px;
      width: 32px; height: 32px;
      font-size: 14px;
    }
  }
  .mobile-filter-backdrop {
    position: fixed; inset: 0;
    background: rgba(44, 47, 51, 0.5);
    backdrop-filter: blur(2px);
    z-index: 1050;
    animation: qvFadeIn 0.2s ease-out;
  }
  .mobile-filter-drawer {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: 85%; max-width: 340px;
    background: #fff; z-index: 1051;
    display: flex; flex-direction: column;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
    animation: slideRight 0.25s ease-out;
    overflow: hidden;
  }
  @keyframes slideRight {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  .product-action-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: #fff; color: #333; border: 1px solid #eee;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  @media (max-width: 576px) {
    .product-action-btn { width: 30px; height: 30px; }
    .product-action-btn i { font-size: 13px !important; }
    .product-card-actions { top: 6px !important; right: 6px !important; gap: 5px !important; }
    .product-badge span { font-size: 9px; padding: 3px 8px 3px 10px; }
  }
`;

export default function ShopGridPage({ saleOnly = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || params.get('q') || sessionStorage.getItem('shopSearchQuery') || '';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || params.get('q') || sessionStorage.getItem('shopSearchQuery') || '';
    if (q !== searchTerm) {
      setSearchTerm(q);
      setPage(1);
    }
  }, [location.search]);

  const goToProduct = (product) => {
    navigate(`/product/${product.slug || slugifyProductName(product.productName || product.name, product.id)}`);
    window.scrollTo(0, 0);
  };

  const [activeTab, setActiveTab]         = useState('grid');
  const [sortBy, setSortBy]               = useState('default');
  const [priceMin, setPriceMin]           = useState(0);
  const [priceMax, setPriceMax]           = useState(10000);
  const [showFullDesc, setShowFullDesc]   = useState(false);
  const [page, setPage]                   = useState(1);

  const [products, setProducts]           = useState([]);
  const [categories, setCategories]       = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const [activeCategoryId, setActiveCategoryId]       = useState('all');
  const [activeSubCategoryId, setActiveSubCategoryId] = useState('all');
  const [filterSale, setFilterSale]                   = useState(false);
  const [selectedSizes, setSelectedSizes]             = useState([]);
  const [showAllSizes, setShowAllSizes]               = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen]     = useState(false);

  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileFiltersOpen]);

  const [saleViewMode, setSaleViewMode]               = useState('single'); // 'single' or 'combos'
  const [storefrontCombos, setStorefrontCombos]       = useState([]);
  const [combosLoading, setCombosLoading]             = useState(false);
  const [selectedComboRootId, setSelectedComboRootId] = useState('all');
  const [addedCombosFeedback, setAddedCombosFeedback] = useState({});

  const { addToCart, toggleWishlist: ctxToggleWishlist, isWishlisted, showToast } = useShop();

  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewCombo, setQuickViewCombo]     = useState(null);
  const [qvSize, setQvSize]                     = useState('');
  const [qvColor, setQvColor]                   = useState('');
  const [qvFabric, setQvFabric]                 = useState('');
  const [qvImgIdx, setQvImgIdx]                 = useState(0);

  const handleOpenQuickView = (p) => {
    setQuickViewProduct(p);
    setQvImgIdx(0);
    const parseField = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
      }
      return [];
    };
    const szs = parseField(p.sizes);
    const cls = parseField(p.colors);
    const fbs = parseField(p.fabrics);
    setQvSize(szs.length > 0 ? szs[0] : '');
    setQvColor(cls.length > 0 ? cls[0] : '');
    setQvFabric(fbs.length > 0 ? fbs[0] : '');
  };

  const addComboToCart = async (childCombo) => {
    const products = childCombo.ComboProducts || [];
    if (products.length === 0) return;

    // Calculate total original price of all products in combo
    let totalOriginal = products.reduce((sum, cp) => {
      const pPrice = Number(cp.Product?.salesPrice || cp.Product?.mrp || 0);
      return sum + (pPrice * (cp.quantity || 1));
    }, 0);

    if (totalOriginal <= 0) {
      totalOriginal = products.length; // fallback
    }

    // Set feedback loading
    setAddedCombosFeedback(prev => ({ ...prev, [childCombo.id]: true }));

    // For each product, add to cart with proportional discounted price
    for (const cp of products) {
      const product = cp.Product;
      if (!product) continue;

      const pPrice = Number(product.salesPrice || product.mrp || 0);
      const ratio = totalOriginal > 0 ? (pPrice / totalOriginal) : (1 / products.length);
      const discountedPrice = Math.round((ratio * Number(childCombo.comboPrice)) * 100) / 100;

      await addToCart({
        id: product.id,
        productId: product.id,
        name: `${product.productName} (${childCombo.name})`,
        img: product.image,
        price: discountedPrice,
        subtitle: product.Brand?.brandName || childCombo.name,
        qty: cp.quantity || 1,
        silent: true,
      });
    }

    // Show a single common toast notification for the whole combo pack
    showToast(`${childCombo.name} added to cart!`, 'cart');

    // Reset feedback after a brief delay
    setTimeout(() => {
      setAddedCombosFeedback(prev => ({ ...prev, [childCombo.id]: false }));
    }, 2000);
  };

  // ── Fetch on mount ───────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);

    Promise.all([
      productApi.getAllFast(),
      categoryApi.getAll(),
      subCategoryApi.getAll(),
    ])
      .then(([prods, cats, subs]) => {
        const arr = Array.isArray(prods) ? prods : [];
        const processed = arr.map(p => {
          const productFinal = [p.franchise_price_final, p.salesPrice, p.mrp]
            .map(Number).find(price => Number.isFinite(price) && price > 0) || 0;
          const validVariantFinals = (p.Variants || [])
            .map(variant => Number(variant.franchise_price_final))
            .filter(price => Number.isFinite(price) && price > 0);
          const salesPrice = validVariantFinals.length ? Math.min(...validVariantFinals) : productFinal;
          const mrp = salesPrice;
          return { ...p, franchise_price_final: salesPrice, mrp, salesPrice };
        });
        // Render the local catalog immediately; live Billing lookups can be slow.
        setProducts(processed);
        setCategories(Array.isArray(cats) ? cats : []);
        setSubcategories(Array.isArray(subs) ? subs : []);
        if (processed.length) {
          const max = Math.max(...processed.map(p => Number(p.salesPrice || p.mrp || 0)));
          if (max > 0) setPriceMax(Math.ceil(max / 100) * 100);
        }

        // ── Apply category selected from Header's Collections dropdown ──
        const sel = sessionStorage.getItem('selectedCategory');
        if (sel) {
          try {
            const { id } = JSON.parse(sel);
            if (id !== undefined && id !== null) {
              setActiveCategoryId(id);
              
              setPage(1);
            }
          } catch {
            // ignore malformed value
          }
          sessionStorage.removeItem('selectedCategory');
        }

        // ── Apply category selected from CategorySection on Home page ──
        const catId = sessionStorage.getItem('shopCategoryId');
        if (catId !== null) {
          setActiveCategoryId(catId);
          setActiveSubCategoryId('all');
          setPage(1);
          sessionStorage.removeItem('shopCategoryId');
        }
        const subCategoryId = sessionStorage.getItem('shopSubCategoryId');
        if (subCategoryId !== null) {
          setActiveSubCategoryId(subCategoryId);
          setPage(1);
          sessionStorage.removeItem('shopSubCategoryId');
        }

        // ── Apply Sale filter if clicked from Header ──
        const saleFilter = sessionStorage.getItem('shopFilterSale');
        if (saleFilter === 'true') {
          setFilterSale(true);
          setActiveCategoryId('all');
          
          setPage(1);
          sessionStorage.removeItem('shopFilterSale');
        }

        // Fetch storefront combos
        setCombosLoading(true);
        comboApi.getStorefront()
          .then(data => {
            const comboList = Array.isArray(data) ? data : [];
            setStorefrontCombos(comboList);
            // Expand priceMax to cover all combo prices too
            const allChildPrices = comboList.flatMap(root =>
              (root.ChildCombos || []).map(c => Number(c.comboPrice || 0))
            );
            if (allChildPrices.length > 0) {
              const maxComboPrice = Math.max(...allChildPrices);
              setPriceMax(prev => Math.max(prev, Math.ceil(maxComboPrice / 100) * 100));
            }
          })
          .catch(err => console.error('Failed to load combos:', err))
          .finally(() => setCombosLoading(false));

        // Update live prices and stock after cards are already visible.
        Promise.all([
          productApi.enrichWithBillingPrices(processed),
          billingCatalogApi.getProductVariants(),
          billingCatalogApi.getStocksByVariant(),
        ]).then(([pricedProducts, billingProducts, stockByVariant]) => {
          const priced = Array.isArray(pricedProducts) ? pricedProducts : processed;
          setProducts(syncProductsWithBillingStock(priced, billingProducts, stockByVariant));
          if (priced.length) {
            const max = Math.max(...priced.map(p => Number(p.salesPrice || p.mrp || 0)));
            if (max > 0) setPriceMax(current => Math.max(current, Math.ceil(max / 100) * 100));
          }
        }).catch(billingError => {
          console.warn('[ShopGrid] Could not verify live Billing prices/stock:', billingError.message);
          setProducts(current => current.map(product => ({
            ...product,
            stock: 0,
            billingStockVerified: false,
            Variants: (product.Variants || []).map(variant => ({ ...variant, stock: 0, billingStockVerified: false })),
          })));
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Keep listing availability current while the shop is left open. Billing
  // stock may change in another channel without a local database refresh.
  useEffect(() => {
    if (!products.length) return undefined;
    let active = true;
    let stockRefreshInProgress = false;
    const refreshStock = async () => {
      if (stockRefreshInProgress) return;
      stockRefreshInProgress = true;
      try {
        const [billingProducts, stockByVariant] = await Promise.all([
          billingCatalogApi.getProductVariants(),
          billingCatalogApi.getStocksByVariant(),
        ]);
        if (active) setProducts(current => syncProductsWithBillingStock(current, billingProducts, stockByVariant));
      } catch (stockError) {
        console.warn('[ShopGrid] Live stock refresh failed:', stockError.message);
        if (active) setProducts(current => current.map(product => ({
          ...product,
          stock: 0,
          billingStockVerified: false,
          Variants: (product.Variants || []).map(variant => ({ ...variant, stock: 0, billingStockVerified: false })),
        })));
      } finally {
        stockRefreshInProgress = false;
      }
    };
    const interval = window.setInterval(refreshStock, 60000);
    window.addEventListener('focus', refreshStock);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshStock);
    };
  }, [products.length]);

  useEffect(() => {
    const handleSaleClicked = () => {
      setFilterSale(true);
      setActiveCategoryId('all');
      
      setPage(1);
    };
    const handleClearSaleClicked = () => {
      setFilterSale(false);
      setPage(1);
    };
    const handleCatSelected = (e) => {
      setActiveCategoryId(e.detail);
      setActiveSubCategoryId('all');
      setSelectedSizes([]);
      setPage(1);
    };

    window.addEventListener('shopFilterSaleClicked', handleSaleClicked);
    window.addEventListener('shopClearSaleFilterClicked', handleClearSaleClicked);
    window.addEventListener('categorySelected', handleCatSelected);
    
    return () => {
      window.removeEventListener('shopFilterSaleClicked', handleSaleClicked);
      window.removeEventListener('shopClearSaleFilterClicked', handleClearSaleClicked);
      window.removeEventListener('categorySelected', handleCatSelected);
    };
  }, []);

  // ── Filter + sort ────────────────────────────────────────────────
  const getSizes = (p) => {
    if (!p || !p.sizes) return [];
    if (Array.isArray(p.sizes)) return p.sizes;
    if (typeof p.sizes === "string") {
      try { return JSON.parse(p.sizes); } catch { return []; }
    }
    return [];
  };

  let filtered = products.filter(p => {
    const price      = Number(p.franchise_price_final ?? p.salesPrice ?? p.mrp ?? 0);
    const matchCat   = activeCategoryId    === 'all' || String(p.billingCategoryId || p.Category?.billingCategoryId || p.categoryId || p.category_id) === String(activeCategoryId);
    const matchSubCategory = activeSubCategoryId === 'all' || [p.subCategoryId, p.subcategory_id, p.billingSubcategoryId, p.billing_subcategory_id].some(id => id != null && String(id) === String(activeSubCategoryId));
        const matchPrice = price >= priceMin && price <= priceMax;
    const matchSale  = (saleOnly || filterSale) ? p.isBuyOneGetOne : true;
    
    let matchSize = true;
    if (selectedSizes.length > 0) {
      const pSizes = getSizes(p);
      matchSize = selectedSizes.some(s => pSizes.includes(s));
    }

    const matchSearch = !searchTerm.trim() || [
      p.productName,
      p.name,
      p.product_code,
      p.productCode,
      p.barcode,
      p.hsn_code,
      p.shortDescription,
      p.description,
      p.longDescription,
      p.Category?.name,
      p.SubCategory?.name,
    ].some(val => val && String(val).toLowerCase().includes(searchTerm.toLowerCase().trim()));

    return matchCat && matchSubCategory && matchPrice && matchSale && matchSize && matchSearch;
  });

  if (sortBy === 'price-asc')  filtered = [...filtered].sort((a, b) => Number(a.franchise_price_final ?? a.salesPrice ?? a.mrp ?? 0) - Number(b.franchise_price_final ?? b.salesPrice ?? b.mrp ?? 0));
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => Number(b.franchise_price_final ?? b.salesPrice ?? b.mrp ?? 0) - Number(a.franchise_price_final ?? a.salesPrice ?? a.mrp ?? 0));
  if (sortBy === 'name')       filtered = [...filtered].sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
  if (sortBy === 'newest')     filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetFilters = () => {
    setActiveCategoryId('all');
    setActiveSubCategoryId('all');
    setSelectedSizes([]);
    setFilterSale(saleOnly ? true : false);
    setSortBy('default');
    setSearchTerm('');
    sessionStorage.removeItem('shopSearchQuery');
    if (window.location.search) {
      navigate('/shop', { replace: true });
    }
    const productMax = products.length ? Math.max(...products.map(p => Number(p.franchise_price_final ?? p.salesPrice ?? p.mrp ?? 0))) : 0;
    const comboMax = storefrontCombos.flatMap(root =>
      (root.ChildCombos || []).map(c => Number(c.comboPrice || 0))
    ).reduce((a, b) => Math.max(a, b), 0);
    const max = Math.max(productMax, comboMax, 1000);
    setPriceMin(0);
    setPriceMax(Math.ceil(max / 100) * 100);
    setPage(1);
  };

  const handleCategoryChange = (catId) => {
    setActiveCategoryId(catId);
    setActiveSubCategoryId('all');
    setSelectedSizes([]);
    setPage(1);
  };

  const handleSubCategoryChange = (subCategoryId) => {
    setActiveSubCategoryId(subCategoryId);
    setSelectedSizes([]);
    setPage(1);
  };

  // ── Helpers ──────────────────────────────────────────────────────
  const getProductImage = (p) => {
    const raw = p.image || p.Images?.[0]?.url || null;
    return raw ? getImageUrl(raw) : null;
  };

  const getEntityImage = (entity) => {
    if (!entity) return null;
    const raw = entity.image || entity.image_url || entity.imageUrl || entity.category_image || entity.categoryImage || entity.photo || null;
    return raw ? getImageUrl(raw) : null;
  };

  const formatPrice = (p) => {
    const n = Number(p.salesPrice || p.mrp || 0);
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const formatOldPrice = (p) => {
    const sale = Number(p.franchise_price_final ?? p.salesPrice ?? 0);
    const mrp  = Number(p.mrp || 0);
    return (mrp > 0 && mrp > sale) ? `₹${mrp.toLocaleString('en-IN')}` : null;
  };

  const getCategoryName = (p) => {
    if (p.Category?.name) return p.Category.name;
    return categories.find(c => String(c.id) === String(p.categoryId || p.category_id))?.name || '';
  };

  const getAvgRating = (p) => Math.round(Number(p.avgRating || p.rating || 4));

  // ── Calculate active children combos for storefront ─────────────
  const activeRoots = storefrontCombos.filter(root =>
    selectedComboRootId === 'all' || root.id === selectedComboRootId
  );
  const activeChildren = [];
  activeRoots.forEach(root => {
    if (Array.isArray(root.ChildCombos)) {
      root.ChildCombos.forEach(child => {
        if (!activeChildren.some(c => c.id === child.id)) {
          activeChildren.push({ ...child, rootName: root.name });
        }
      });
    }
  });

  // ── Filter, sort + paginate children combos ──────────────────────
  let filteredChildren = activeChildren.filter(child => {
    const price = Number(child.comboPrice);
    return price >= priceMin && price <= priceMax;
  });

  if (sortBy === 'price-asc')  filteredChildren = [...filteredChildren].sort((a, b) => Number(a.comboPrice) - Number(b.comboPrice));
  if (sortBy === 'price-desc') filteredChildren = [...filteredChildren].sort((a, b) => Number(b.comboPrice) - Number(a.comboPrice));
  if (sortBy === 'name')       filteredChildren = [...filteredChildren].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (sortBy === 'newest')     filteredChildren = [...filteredChildren].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalComboPages = Math.ceil(filteredChildren.length / PER_PAGE);
  const paginatedChildren = filteredChildren.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Loading / Error ──────────────────────────────────────────────

  const baseFilteredProducts = products.filter(p => {
    const matchCat   = activeCategoryId    === 'all' || String(p.billingCategoryId || p.Category?.billingCategoryId || p.categoryId || p.category_id) === String(activeCategoryId);
    const matchSubCategory = activeSubCategoryId === 'all' || [p.subCategoryId, p.subcategory_id, p.billingSubcategoryId, p.billing_subcategory_id].some(id => id != null && String(id) === String(activeSubCategoryId));
        const matchSale  = (saleOnly || filterSale) ? p.isBuyOneGetOne : true;
    return matchCat && matchSubCategory && matchSale;
  });

  const productMaxVal = baseFilteredProducts.length > 0 
    ? Math.max(...baseFilteredProducts.map(p => Number(p.salesPrice || p.mrp || 0))) 
    : 0;

  const comboMaxVal = activeChildren.length > 0 
    ? Math.max(...activeChildren.map(c => Number(c.comboPrice || 0))) 
    : 0;

  const maxComputedValue = (saleViewMode === 'combos' ? comboMaxVal : productMaxVal) || 0;

  useEffect(() => {
    setPriceMin(0);
    setPriceMax(maxComputedValue || 0);
  }, [activeCategoryId, activeSubCategoryId, saleViewMode, filterSale, selectedComboRootId, products.length, storefrontCombos.length]);

  if (error) return (
    <>
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <p style={{ color: '#c00', fontFamily: F.sub }}>Failed to load products: {error}</p>
        <button onClick={() => window.location.reload()} className="theme-btn" style={{ fontFamily: F.main }}>Retry</button>
      </div>
      <Footer />
    </>
  );

  const activeCategoryObj = activeCategoryId !== 'all'
    ? categories.find(c => String(c.id) === String(activeCategoryId))
    : null;
  const activeSubCategoryObj = activeSubCategoryId !== 'all'
    ? subcategories.find(sub => String(sub.id) === String(activeSubCategoryId))
    : null;

  const activeFilterCount = (activeCategoryId !== 'all' ? 1 : 0) +
    (activeSubCategoryId !== 'all' ? 1 : 0) +
    selectedSizes.length +
    (priceMin > 0 || (maxComputedValue > 0 && priceMax < maxComputedValue) ? 1 : 0) +
    (saleOnly && selectedComboRootId !== 'all' ? 1 : 0);

  const renderSidebarFilters = () => (
    <>
      {/* Category */}
      {saleOnly && saleViewMode === 'combos' ? (
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ color: ACCENT, fontWeight: 700, marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontFamily: F.main }}>
            Combo Groups
          </h6>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #EAF0E2' }}>
            <input type="radio" name="comboGroup" checked={selectedComboRootId === 'all'} onChange={() => { setSelectedComboRootId('all'); setPage(1); }} style={{ accentColor: BRAND }} />
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: selectedComboRootId === 'all' ? BRAND : '#EAF0E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HeartIcon size={13} color={selectedComboRootId === 'all' ? '#fff' : BRAND} />
            </div>
            <span style={{ color: selectedComboRootId === 'all' ? BRAND : '#4a5a44', fontWeight: selectedComboRootId === 'all' ? 700 : 400, fontSize: 14, fontFamily: F.sub }}>All Combos</span>
          </label>
          {combosLoading ? (
            <>
              <SidebarItemSkeleton />
              <SidebarItemSkeleton />
              <SidebarItemSkeleton />
            </>
          ) : (
            storefrontCombos.map(root => {
              const active = selectedComboRootId === root.id;
              const rootImgUrl = root.image ? getImageUrl(root.image) : null;
              return (
                <label key={root.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #EAF0E2' }}>
                  <input type="radio" name="comboGroup" checked={active} onChange={() => { setSelectedComboRootId(root.id); setPage(1); }} style={{ accentColor: BRAND }} />
                  <SidebarThumb src={rootImgUrl} alt={root.name} active={active} />
                  <span style={{ color: active ? BRAND : '#4a5a44', fontWeight: active ? 700 : 400, fontSize: 14, fontFamily: F.sub }}>{root.name}</span>
                </label>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <h6 style={{ color: ACCENT, fontWeight: 700, marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontFamily: F.main }}>
            Category
          </h6>

          {/* All */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #EAF0E2' }}>
            <input type="radio" name="category" checked={activeCategoryId === 'all'} onChange={() => handleCategoryChange('all')} style={{ accentColor: BRAND }} />
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: activeCategoryId === 'all' ? BRAND : '#EAF0E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HeartIcon size={13} color={activeCategoryId === 'all' ? '#fff' : BRAND} />
            </div>
            <span style={{ color: activeCategoryId === 'all' ? BRAND : '#4a5a44', fontWeight: activeCategoryId === 'all' ? 700 : 400, fontSize: 14, fontFamily: F.sub }}>All</span>
          </label>

          {loading ? (
            <>
              <SidebarItemSkeleton />
              <SidebarItemSkeleton />
              <SidebarItemSkeleton />
              <SidebarItemSkeleton />
              <SidebarItemSkeleton />
            </>
          ) : (
            categories.map(cat => {
            const categoryIds = [cat.id, cat.billingCategoryId, cat.billing_category_id, cat.category_id]
              .filter(id => id !== undefined && id !== null)
              .map(String);
            const active = categoryIds.includes(String(activeCategoryId));
            const childCategories = subcategories.filter(sub => {
              const parentId = sub.category_id ?? sub.categoryId ?? sub.cat_id ??
                sub.Category?.billingCategoryId ?? sub.Category?.id ??
                sub.category?.id ?? sub.category?.category_id;
              const isActive = sub.status == null || String(sub.status).toLowerCase() === 'active';
              return parentId != null && categoryIds.includes(String(parentId)) && isActive;
            });
            return (
              <div key={cat.id} style={{ borderBottom: '1px solid #EAF0E2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
                  <input type="radio" name="category" checked={active} onChange={() => handleCategoryChange(cat.id)} style={{ accentColor: BRAND }} />
                  <SidebarThumb src={getEntityImage(cat)} alt={cat.name} active={active} />
                  <span style={{ color: active ? BRAND : '#4a5a44', fontWeight: active ? 700 : 400, fontSize: 14, fontFamily: F.sub }}>{cat.name}</span>
                </label>
                {active && childCategories.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0 8px 40px', cursor: 'pointer' }}>
                    <input type="radio" name="subcategory" checked={activeSubCategoryId === 'all'} onChange={() => handleSubCategoryChange('all')} style={{ accentColor: BRAND }} />
                    <span style={{ color: activeSubCategoryId === 'all' ? BRAND : '#4a5a44', fontWeight: activeSubCategoryId === 'all' ? 700 : 400, fontSize: 12, fontFamily: F.sub }}>All in {cat.name}</span>
                  </label>
                )}
                {active && childCategories.map(sub => {
                  const subActive = String(activeSubCategoryId) === String(sub.id);
                  return (
                    <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0 8px 40px', cursor: 'pointer' }}>
                      <input type="radio" name="subcategory" checked={subActive} onChange={() => handleSubCategoryChange(sub.id)} style={{ accentColor: BRAND }} />
                      <span style={{ color: subActive ? BRAND : '#4a5a44', fontWeight: subActive ? 700 : 400, fontSize: 12, fontFamily: F.sub }}>{sub.name}</span>
                    </label>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Size Filter */}
      {(!saleOnly || saleViewMode !== 'combos') && (() => {
        const availableSizesMap = {};
        baseFilteredProducts.forEach(p => {
          getSizes(p).forEach(s => {
            if (s) availableSizesMap[s] = (availableSizesMap[s] || 0) + 1;
          });
        });
        
        const sizeOrder = {
          'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, '2XL': 6, '3XL': 7, '4XL': 8, '5XL': 9, 'FS': 10
        };
        const getSortWeight = (sizeStr) => {
          const upper = (sizeStr || '').toString().trim().toUpperCase();
          if (sizeOrder[upper]) return sizeOrder[upper];
          for (const key in sizeOrder) {
            if (upper.startsWith(key + '-') || upper.startsWith(key + ' ')) return sizeOrder[key];
          }
          return 99;
        };

        const availableSizes = Object.entries(availableSizesMap).sort((a, b) => {
          const weightA = getSortWeight(a[0]);
          const weightB = getSortWeight(b[0]);
          if (weightA !== weightB) return weightA - weightB;
          return a[0].localeCompare(b[0]);
        });

        if (availableSizes.length === 0) return null;
        
        return (
          <div style={{ marginBottom: 24 }}>
            <h6 style={{ color: BRAND, fontWeight: 700, margin: '0 0 12px 0', fontSize: 15, fontFamily: F.main }}>
              Size
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {availableSizes.slice(0, showAllSizes ? availableSizes.length : 5).map(([sizeName, count]) => {
                const checked = selectedSizes.includes(sizeName);
                return (
                  <label key={sizeName} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSizes([...selectedSizes, sizeName]);
                        else setSelectedSizes(selectedSizes.filter(s => s !== sizeName));
                        setPage(1);
                      }} 
                      style={{ accentColor: BRAND, width: 16, height: 16, cursor: 'pointer' }} 
                    />
                    <span style={{ fontSize: 13, color: '#4a5a44', fontFamily: F.sub }}>
                      {sizeName}
                    </span>
                  </label>
                );
              })}
              {availableSizes.length > 5 && (
                <span 
                  onClick={() => setShowAllSizes(!showAllSizes)}
                  style={{ fontSize: 13, color: BRAND, textDecoration: 'underline', cursor: 'pointer', fontFamily: F.sub, marginTop: 4 }}
                >
                  {showAllSizes ? 'Show less' : 'Show more'}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Price Range */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h6 style={{ color: BRAND, fontWeight: 700, margin: 0, fontSize: 15, fontFamily: F.main }}>Price</h6>
          <span onClick={() => { setPriceMin(0); setPriceMax(maxComputedValue); setPage(1); }} style={{ fontSize: 13, color: '#888', textDecoration: 'underline', cursor: 'pointer', fontFamily: F.sub }}>Reset</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 14 }}>₹</span>
            <input 
              type="number" 
              value={priceMin}
              onChange={(e) => { 
                let val = Number(e.target.value);
                if (val < 0) val = 0;
                if (val <= priceMax) setPriceMin(val);
                setPage(1); 
              }}
              style={{ width: '100%', padding: '8px 8px 8px 24px', border: '1px solid #E0E8D8', borderRadius: 4, outline: 'none', fontSize: 14, fontFamily: F.sub, background: 'transparent', color: '#2C2F33' }}
            />
          </div>
          <span style={{ color: '#4a5a44', fontSize: 14, fontFamily: F.sub }}>to</span>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 14 }}>₹</span>
            <input 
              type="number" 
              value={priceMax}
              onChange={(e) => { 
                let val = Number(e.target.value);
                if (val > (maxComputedValue || 1)) val = maxComputedValue;
                if (val >= priceMin) setPriceMax(val);
                setPage(1); 
              }}
              style={{ width: '100%', padding: '8px 8px 8px 24px', border: '1px solid #E0E8D8', borderRadius: 4, outline: 'none', fontSize: 14, fontFamily: F.sub, background: 'transparent', color: '#2C2F33' }}
            />
          </div>
        </div>

        {/* Range Slider Container */}
        <div style={{ position: 'relative', height: 4, background: '#E0E8D8', borderRadius: 4, marginBottom: 16, marginTop: 10 }}>
          {/* Active Track */}
          <div style={{ 
            position: 'absolute', 
            height: '100%', 
            background: '#4a5a44', 
            left: `${Math.max(0, Math.min(100, (priceMin / (maxComputedValue || 1)) * 100))}%`, 
            right: `${Math.max(0, Math.min(100, 100 - (priceMax / (maxComputedValue || 1)) * 100))}%` 
          }} />
          
          {/* Min Thumb */}
          <input 
            type="range" min="0" step="10" 
            max={maxComputedValue} value={priceMin} 
            onChange={e => {
              const val = Math.min(Number(e.target.value), priceMax - 10);
              setPriceMin(val);
              setPage(1);
            }}
            style={{ 
              position: 'absolute', top: -8, left: 0, width: '100%', 
              appearance: 'none', background: 'transparent', pointerEvents: 'none', margin: 0
            }}
            className="custom-range-slider"
          />
          
          {/* Max Thumb */}
          <input 
            type="range" min="0" step="10" 
            max={maxComputedValue} value={priceMax} 
            onChange={e => {
              const val = Math.max(Number(e.target.value), priceMin + 10);
              setPriceMax(val);
              setPage(1);
            }}
            style={{ 
              position: 'absolute', top: -8, left: 0, width: '100%', 
              appearance: 'none', background: 'transparent', pointerEvents: 'none', margin: 0
            }}
            className="custom-range-slider"
          />
        </div>

        <p style={{ fontSize: 13, color: '#4a5a44', fontFamily: F.sub, margin: 0 }}>
          The highest price is ₹{maxComputedValue.toLocaleString('en-IN')}.00
        </p>
      </div>
    </>
  );

  return (
    <>
      <div className="mouse-cursor cursor-outer" />
      <div className="mouse-cursor cursor-inner" />

      {/* ── Page Header / Banner ─────────────────────────────────── */}
      <div className="shop-page-header" style={{ background: '#F4F8F0', padding: '70px 0 40px' }}>
        <div className="container-fluid shop-page-container">
          <p style={{ fontSize: 14, color: '#4a5a44', marginBottom: 8, fontFamily: F.sub, letterSpacing: '1px' }}>
           <span style={{ color: ACCENT, fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/home')}>Home</span> &nbsp;/&nbsp; {saleOnly ? (saleViewMode === 'combos' ? 'Combo Deals' : 'Sale') : (activeCategoryObj ? activeCategoryObj.name : 'Shop')}
          </p>
          <h1 style={{ fontFamily: F.main, fontWeight: 400, fontSize: 'clamp(24px, 5vw, 44px)', color: BRAND, marginBottom: 16, letterSpacing: 2 }}>
            {saleOnly ? (saleViewMode === 'combos' ? 'Combo Deals' : 'Sale Collection') : (activeSubCategoryObj?.name || (activeCategoryObj ? activeCategoryObj.name : 'FASHION AURA'))}
          </h1>
          <p style={{ 
            fontSize: 17, color: '#4a5a44', maxWidth: 800, lineHeight: 1.8, fontFamily: F.sub, fontWeight: 300,
            display: showFullDesc ? 'block' : '-webkit-box', WebkitLineClamp: showFullDesc ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 
          }}>
            {saleOnly ? (
              saleViewMode === 'combos' ? (
                <>
                  Shop our exclusive <strong>Combo Deal Packs</strong> at <strong>Fashion Aura</strong>. Mix and match curated ethnic and contemporary sets — bundled together at unbeatable prices. Stock up on your favourite styles and <strong>save more when you buy together</strong>!
                </>
              ) : (
                <>
                  Explore our exclusive discounts and special offers at <strong>Fashion Aura</strong>. Discover incredible deals on our curated ready-to-wear ethnic and contemporary collections — featuring <strong>Buy One Get One Free</strong>. Elevate your wardrobe for less today!
                </>
              )
            ) : (
              activeCategoryObj && activeCategoryObj.description ? (
                activeCategoryObj.description
              ) : activeCategoryObj ? (
                <>
                  Explore modern <strong>ready to wear {activeCategoryObj.name.toLowerCase()} for women</strong> designed for effortless styling. Our <strong>ready made {activeCategoryObj.name.toLowerCase()}</strong> feature perfectly matched silhouettes, comfortable fabrics, and a premium finish—ideal for daily wear, office look...
                </>
              ) : (
                <>
                  Discover elegant <strong>ready-to-wear ethnic and contemporary fashion</strong> at{' '}
                  <strong>Fashion Aura</strong>. Our curated collection blends comfort, modern silhouettes, and
                  premium handloom fabrics — perfect for everyday wear, festive occasions, and office looks.
                  Each piece celebrates the craftsmanship of Indian weaving traditions, reimagined with a
                  contemporary touch for today's woman.
                </>
              )
            )}
          </p>
          {activeCategoryObj && !activeCategoryObj.description && !saleOnly && (
             <p onClick={() => setShowFullDesc(!showFullDesc)} style={{ fontSize: 15, textDecoration: 'underline', cursor: 'pointer', fontFamily: F.sub, marginTop: 10, color: BRAND }}>{showFullDesc ? 'Show less' : 'Show more'}</p>
          )}
        </div>
      </div>

      <section className="section-padding fix shop-page-content" style={{ background: '#F4F8F0', paddingTop: 20 }}>
        <div className="container-fluid shop-page-container">
          <div className="row g-4">

            {/* ── Desktop Sidebar ─────────────────────────────────── */}
            <div className="col-lg-3 d-none d-lg-block">
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E0E8D8', position: 'sticky', top: 90 }}>
                <h5 style={{ color: BRAND, fontWeight: 400, marginBottom: 20, fontFamily: F.main, letterSpacing: '3px', textTransform: 'uppercase', fontSize: 15 }}>Filter By</h5>
                {renderSidebarFilters()}
              </div>
            </div>

            {/* ── Products Area ─────────────────────────────────── */}
            <div className="col-lg-9">

              {/* ── Active Filters ── */}
              {(selectedSizes.length > 0 || priceMin > 0 || priceMax < (maxComputedValue || 1) || activeCategoryId !== 'all' || Boolean(searchTerm) || (saleOnly && selectedComboRootId !== 'all')) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  {searchTerm && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f5447', padding: '6px 14px', borderRadius: 20, fontSize: 13, color: '#ffffff', fontFamily: F.sub }}>
                      <span>Search: <strong>"{searchTerm}"</strong></span>
                      <span onClick={() => { setSearchTerm(''); sessionStorage.removeItem('shopSearchQuery'); navigate('/shop', { replace: true }); setPage(1); }} style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 6, fontSize: 16 }}>&times;</span>
                    </div>
                  )}
                  {selectedSizes.map(sz => (
                    <div key={sz} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EAF0E2', padding: '6px 14px', borderRadius: 20, fontSize: 13, color: BRAND, fontFamily: F.sub }}>
                      {sz}
                      <span onClick={() => { setSelectedSizes(selectedSizes.filter(s => s !== sz)); setPage(1); }} style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 4 }}>&times;</span>
                    </div>
                  ))}
                  <span onClick={resetFilters} style={{ fontSize: 13, color: '#4a5a44', textDecoration: 'underline', cursor: 'pointer', fontFamily: F.sub, padding: '6px 4px' }}>Clear all</span>
                </div>
              )}

              {saleOnly && (
                <div style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 28,
                  borderBottom: '1px solid #E0E8D8',
                  paddingBottom: 6
                }}>
                  <button
                    onClick={() => { setSaleViewMode('single'); setPage(1); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderRadius: 0,
                      color: saleViewMode === 'single' ? BRAND : '#888',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderBottom: saleViewMode === 'single' ? `2px solid ${BRAND}` : '2px solid transparent',
                      fontFamily: F.main,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      transition: 'color 0.2s, border-bottom 0.2s'
                    }}
                  >
                    Single Product Offers
                  </button>
                  <button
                    onClick={() => { setSaleViewMode('combos'); setPage(1); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderRadius: 0,
                      color: saleViewMode === 'combos' ? BRAND : '#888',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderBottom: saleViewMode === 'combos' ? `2px solid ${BRAND}` : '2px solid transparent',
                      fontFamily: F.main,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      transition: 'color 0.2s, border-bottom 0.2s'
                    }}
                  >
                    Combo Deal Packs
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <p style={{ color: '#4a5a44', margin: 0, fontSize: 14, fontFamily: F.sub }}>
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      Loading <Skeleton as="span" width={90} height={14} style={{ display: 'inline-block' }} />
                    </span>
                  ) : saleViewMode === 'combos' ? (
                    <>Showing <strong>{paginatedChildren.length}</strong> of <strong>{filteredChildren.length}</strong> combo packs</>
                  ) : (
                    <>Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> products</>
                  )}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="d-lg-none"
                    onClick={() => setMobileFiltersOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      background: '#fff',
                      border: '1px solid #E0E8D8',
                      borderRadius: 6,
                      color: BRAND,
                      fontSize: 12,
                      fontFamily: F.main,
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-sliders" style={{ color: ACCENT }} />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span style={{
                        background: ACCENT,
                        color: '#fff',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        marginLeft: 2,
                      }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#4a5a44', fontFamily: F.sub }}>Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #E0E8D8',
                        borderRadius: 6,
                        background: '#fff',
                        color: BRAND,
                        fontSize: 12,
                        fontFamily: F.sub,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="default">Default</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name">Name: A to Z</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Grid / Loading / Empty state */}
              {loading ? (
                <div className={activeTab === 'grid' ? 'row g-3' : 'd-flex flex-column gap-3'}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="col-xxl-3 col-xl-4 col-md-6 col-6">
                      <ProductCardSkeleton />
                    </div>
                  ))}
                </div>
              ) : (saleViewMode === 'combos' && combosLoading) ? (
                <div className="row g-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="col-xxl-3 col-xl-4 col-md-6 col-6">
                      <ComboCardSkeleton />
                    </div>
                  ))}
                </div>
              ) : (saleViewMode === 'combos' ? paginatedChildren.length : paginated.length) === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa', fontFamily: F.sub }}>
                  <i className="fa-regular fa-face-sad-cry" style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
                  <p>No {saleViewMode === 'combos' ? 'combo deals' : 'products'} found for the selected filters.</p>
                  <button onClick={resetFilters} className="theme-btn" style={{ background: BRAND, borderColor: BRAND, fontFamily: F.main }}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className={activeTab === 'grid' ? 'row g-3' : ''}>
                  {saleViewMode === 'combos' ? (
                    paginatedChildren.map((child) => {
                      const childImgSrc = child.image ? getImageUrl(child.image) : null;
                      const discount = child.originalPrice && Number(child.originalPrice) > Number(child.comboPrice)
                        ? Math.round(((Number(child.originalPrice) - Number(child.comboPrice)) / Number(child.originalPrice)) * 100)
                        : 0;

                      return (
                        <div key={child.id} className="col-xxl-3 col-xl-4 col-md-6 col-6">
                          <div
                            style={{ transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', height: '100%', marginBottom: '28px' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            <div onClick={() => setQuickViewCombo(child)} style={{ position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '3/4', cursor: 'pointer', background: '#f5f5f5', borderRadius: '8px' }}>
                              {childImgSrc ? (
                                <img src={childImgSrc} alt={child.name || ''}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                                  onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <PlaceholderImg style={{ width: '100%', height: '100%' }} />
                              )}

                              {/* Badges */}
                              <div className="product-badge">
                                <span className="badge-combo">
                                  <i className="fa-solid fa-bag-shopping" style={{ fontSize: 9 }} /> Combo Pack
                                </span>
                                {discount > 0 && (
                                  <span className="badge-sale">
                                    <i className="fa-solid fa-tag" style={{ fontSize: 9 }} /> Save {discount}%
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ padding: '12px 0 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <h5
                                onClick={() => setQuickViewCombo(child)}
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: BRAND,
                                  marginBottom: 6,
                                  lineHeight: 1.3,
                                  fontFamily: F.main,
                                  letterSpacing: '1.5px',
                                  textTransform: 'uppercase',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                              >
                                {child.name}
                              </h5>
                              
                              {child.rootName && (
                                <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: F.main, marginBottom: 8, display: 'block' }}>
                                  Group: {child.rootName}
                                </span>
                              )}

                              {child.shortDescription && (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: '#666',
                                    fontFamily: F.sub,
                                    margin: '4px 0 10px',
                                    fontWeight: 300,
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    height: '2.8em',
                                  }}
                                >
                                  {child.shortDescription}
                                </p>
                              )}

                              {/* Products List in Combo */}
                              <div style={{ flex: 1, margin: '8px 0 12px', borderTop: '1px dashed #E0E8D8', paddingTop: 8 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontFamily: F.main }}>
                                  Pack includes:
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {child.ComboProducts?.map((cp, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#555', fontFamily: F.sub }}>
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (cp.Product) goToProduct(cp.Product);
                                        }}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          maxWidth: '80%',
                                          cursor: 'pointer',
                                          transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#0f5447';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#555';
                                        }}
                                      >
                                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#0f5447', flexShrink: 0 }} />
                                        {cp.Product?.productName || 'Product'}
                                      </span>
                                      <span style={{ fontWeight: 600, color: BRAND, flexShrink: 0 }}>Qty: {cp.quantity || 1}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EAF0E2', paddingTop: 12, marginTop: 'auto' }}>
                                <div>
                                  <span style={{ color: BRAND, fontWeight: 700, fontSize: 15, fontFamily: F.sub, letterSpacing: '0.5px' }}>
                                    ₹{Number(child.comboPrice).toLocaleString('en-IN')}
                                  </span>
                                  {child.originalPrice && Number(child.originalPrice) > Number(child.comboPrice) && (
                                    <del style={{ color: '#aaa', fontSize: 12, marginLeft: 6, fontFamily: F.sub, fontWeight: 300 }}>
                                      ₹{Number(child.originalPrice).toLocaleString('en-IN')}
                                    </del>
                                  )}
                                </div>
                                <button
                                  onClick={() => addComboToCart(child)}
                                  disabled={addedCombosFeedback[child.id]}
                                  onMouseEnter={e => { if (!addedCombosFeedback[child.id]) e.currentTarget.style.background = '#0b3a31'; }}
                                  onMouseLeave={e => { if (!addedCombosFeedback[child.id]) e.currentTarget.style.background = '#0f5447'; }}
                                  style={{
                                    background: addedCombosFeedback[child.id] ? '#C9A84C' : '#0f5447',
                                    color: addedCombosFeedback[child.id] ? BRAND : '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '8px 14px',
                                    cursor: addedCombosFeedback[child.id] ? 'default' : 'pointer',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fontFamily: F.main,
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {addedCombosFeedback[child.id] ? (
                                    <><i className="fa-solid fa-check" style={{ marginRight: 6 }} /> Added!</>
                                  ) : (
                                    <><i className="fa-solid fa-bag-shopping" style={{ marginRight: 6 }} /> Buy Pack</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    paginated.map((p) => {
                      const imgSrc   = getProductImage(p);
                      const price    = formatPrice(p);
                      const oldPrice = formatOldPrice(p);
                      const catName  = getCategoryName(p);
                      const rating   = getAvgRating(p);
                      const wished   = isWishlisted(p.id);
                      const mrp      = Number(p.mrp        ?? 0);
                      const sale     = Number(p.franchise_price_final ?? p.salesPrice ?? mrp);
                      const discount = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;

                      // ── cartItem includes image for cart drawer thumbnail ──
                      const cartItem = {
                        id:       p.id,
                        name:     p.productName,
                        price:    Number(p.franchise_price_final ?? p.salesPrice ?? p.mrp ?? 0),
                        billingProductId: p.billingProductId || p.billing_product_id || null,
                        subtitle: catName,
                        image:    imgSrc,
                        isBuyOneGetOne: !!p.isBuyOneGetOne,
                      };

                      // ── wishItem NOW includes image ────────────────────────
                      const wishItem = {
                        id:       p.id,
                        name:     p.productName,
                        price:    Number(p.franchise_price_final ?? p.salesPrice ?? p.mrp ?? 0),
                        subtitle: catName,
                        image:    imgSrc,
                        isBuyOneGetOne: !!p.isBuyOneGetOne,
                      };

                      return activeTab === 'grid' ? (
                        /* ── Grid card ── */
                        <div key={p.id} className="col-xxl-3 col-xl-4 col-md-6 col-6">
                          <div
                            onClick={() => goToProduct(p)}
                            style={{ transition: 'transform 0.2s', cursor: 'pointer', marginBottom: '28px' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            <div className="product-card-image-wrap" style={{ position: 'relative', overflow: 'hidden', background: '#f5f5f5', width: '100%', borderRadius: '8px' }}>
                              {imgSrc ? (
                                <img src={imgSrc} alt={p.productName || ''}
                                  loading="lazy"
                                  decoding="async"
                                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block', transition: 'transform 0.4s ease' }}
                                  onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <PlaceholderImg style={{ width: '100%', aspectRatio: '3/4' }} />
                              )}

                              {/* Badges */}
                              <div className="product-badge">
                                {!p.billingStockVerified ? (
                                  <span style={{ background: '#9A6B24' }}>Stock Unavailable</span>
                                ) : p.stock <= 0 ? (
                                  <span style={{ background: '#A83232' }}>Out of Stock</span>
                                ) : null}
                                {p.isBuyOneGetOne && (
                                  <span className="badge-bogo">
                                    <i className="fa-solid fa-gift" style={{ fontSize: 9 }} /> Buy 1 Get 1
                                  </span>
                                )}
                              </div>

                              <div className="product-card-actions" style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, opacity: 1, zIndex: 10 }}>
                                <button
                                  className="product-action-btn"
                                  onClick={(e) => { e.stopPropagation(); ctxToggleWishlist(wishItem); }}
                                  style={{
                                    color: wished ? '#E05252' : '#333',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#FCE8E8'; e.currentTarget.style.color = '#E05252'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = wished ? '#E05252' : '#333'; }}
                                >
                                  <i className={wished ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ fontSize: 15 }} />
                                </button>
                                <button
                                  className="product-action-btn"
                                  onClick={(e) => { e.stopPropagation(); if (p.billingStockVerified && p.stock > 0) addToCart({ ...cartItem, qty: 1 }); }}
                                  disabled={!p.billingStockVerified || p.stock <= 0}
                                  aria-label={!p.billingStockVerified ? 'Stock unavailable' : p.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                                  title={!p.billingStockVerified ? 'Stock unavailable' : p.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                                  style={{ opacity: !p.billingStockVerified || p.stock <= 0 ? 0.45 : 1, cursor: !p.billingStockVerified || p.stock <= 0 ? 'not-allowed' : 'pointer' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#333'; }}
                                >
                                  <i className="fa-solid fa-cart-plus" style={{ fontSize: 15 }} />
                                </button>
                              </div>
                            </div>
                            <div style={{ padding: '12px 0 0' }}>
                              {p.Brand?.brandName && (
                                <p style={{ fontSize: '11px', color: '#999', margin: '0 0 3px', letterSpacing: '0.2px', textTransform: 'uppercase', fontFamily: F.sub }}>
                                  {p.Brand.brandName}
                                </p>
                              )}
                              <h5
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: BRAND,
                                  marginBottom: 6,
                                  lineHeight: 1.3,
                                  fontFamily: F.main,
                                  letterSpacing: '1.5px',
                                  textTransform: 'uppercase',
                                  cursor: 'pointer',
                                }}
                              >
                                {p.productName}
                              </h5>

                              {p.shortDescription && (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: '#666',
                                    fontFamily: F.sub,
                                    margin: '0 0 10px',
                                    fontWeight: 300,
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    height: '2.8em',
                                  }}
                                >
                                  {p.shortDescription}
                                </p>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                                <div>
                                  <span style={{ color: BRAND, fontWeight: 700, fontSize: 15, fontFamily: F.sub, letterSpacing: '0.5px' }}>{price}</span>
                                  {oldPrice && (
                                    <del style={{ color: '#aaa', fontSize: 12, marginLeft: 6, fontFamily: F.sub, fontWeight: 300 }}>{oldPrice}</del>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── List row ── */
                        <div
                          key={p.id}
                          onClick={() => goToProduct(p)}
                          style={{ display: 'flex', gap: 20, alignItems: 'center', padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #E0E8D8', marginBottom: 12, cursor: 'pointer' }}
                        >
                          <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                            {imgSrc
                              ? <img src={imgSrc} alt={p.productName || ''} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} onError={e => { e.target.style.display = 'none'; }} />
                              : <PlaceholderImg style={{ width: '100%', height: '100%' }} />
                            }
                          </div>

                          <div style={{ flex: 1 }}>
                            <h5
                              style={{
                                fontSize: 14, fontWeight: 500, color: BRAND, margin: '6px 0 6px',
                                fontFamily: F.main, letterSpacing: '1.5px', textTransform: 'uppercase',
                              }}
                            >
                              {p.productName}
                            </h5>

                            {p.shortDescription && (
                              <p style={{ fontSize: 12, color: '#666', fontFamily: F.sub, margin: '6px 0 0', fontWeight: 300, lineHeight: 1.5 }}>
                                {p.shortDescription}
                              </p>
                            )}
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div style={{ color: BRAND, fontWeight: 700, fontSize: 17, fontFamily: F.sub, letterSpacing: '0.5px' }}>{price}</div>
                            {oldPrice && <del style={{ color: '#aaa', fontSize: 12, fontFamily: F.sub, fontWeight: 300, marginBottom: 12 }}>{oldPrice}</del>}
                            <div style={{ display: 'flex', gap: '8px', marginTop: 12 }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); ctxToggleWishlist(wishItem); }}
                                style={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: wished ? '#FCE8E8' : '#F4F8F0',
                                  color: wished ? '#E05252' : BRAND,
                                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = wished ? '#FCE8E8' : '#EAF0E2'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = wished ? '#FCE8E8' : '#F4F8F0'; }}
                              >
                                <i className={wished ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ fontSize: 14 }} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); if (p.billingStockVerified && p.stock > 0) addToCart({ ...cartItem, qty: 1 }); }}
                                disabled={!p.billingStockVerified || p.stock <= 0}
                                aria-label={!p.billingStockVerified ? 'Stock unavailable' : p.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                                title={!p.billingStockVerified ? 'Stock unavailable' : p.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                                style={{
                                  width: 32, height: 32, borderRadius: '50%', background: '#F4F8F0', color: BRAND, border: 'none',
                                  opacity: !p.billingStockVerified || p.stock <= 0 ? 0.45 : 1,
                                  cursor: !p.billingStockVerified || p.stock <= 0 ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#EAF0E2'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#F4F8F0'; }}
                              >
                                <i className="fa-solid fa-cart-plus" style={{ fontSize: 14 }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Pagination */}
              {(saleViewMode === 'combos' ? totalComboPages : totalPages) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ width: 38, height: 38, border: '1px solid #E0E8D8', borderRadius: 8, background: page === 1 ? '#F4F8F0' : '#fff', color: page === 1 ? '#ccc' : BRAND, cursor: page === 1 ? 'default' : 'pointer', fontSize: 14 }}>
                    <i className="fa-solid fa-chevron-left" />
                  </button>
                  {[...Array(saleViewMode === 'combos' ? totalComboPages : totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      style={{ width: 38, height: 38, border: `1px solid ${page === i + 1 ? BRAND : '#E0E8D8'}`, borderRadius: 8, background: page === i + 1 ? BRAND : '#fff', color: page === i + 1 ? '#fff' : '#4a5a44', cursor: 'pointer', fontWeight: page === i + 1 ? 700 : 400, fontFamily: F.sub }}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(saleViewMode === 'combos' ? totalComboPages : totalPages, p + 1))} disabled={page === (saleViewMode === 'combos' ? totalComboPages : totalPages)}
                    style={{ width: 38, height: 38, border: '1px solid #E0E8D8', borderRadius: 8, background: page === (saleViewMode === 'combos' ? totalComboPages : totalPages) ? '#F4F8F0' : '#fff', color: page === (saleViewMode === 'combos' ? totalComboPages : totalPages) ? '#ccc' : BRAND, cursor: page === (saleViewMode === 'combos' ? totalComboPages : totalPages) ? 'default' : 'pointer', fontSize: 14 }}>
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── Mobile Filter Drawer ── */}
      {mobileFiltersOpen && (
        <div className="mobile-filter-backdrop" onClick={() => setMobileFiltersOpen(false)}>
          <div className="mobile-filter-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E0E8D8', background: '#F4F8F0' }}>
              <h5 style={{ margin: 0, color: BRAND, fontFamily: F.main, fontSize: 14, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </h5>
              <button onClick={() => setMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: BRAND, cursor: 'pointer', padding: 4 }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {renderSidebarFilters()}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E0E8D8', display: 'flex', gap: 10, background: '#fff' }}>
              <button onClick={resetFilters} style={{ flex: 1, padding: '10px', background: '#F4F8F0', border: '1px solid #E0E8D8', borderRadius: 8, color: BRAND, fontFamily: F.main, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>
                Reset
              </button>
              <button onClick={() => setMobileFiltersOpen(false)} style={{ flex: 1, padding: '10px', background: BRAND, border: 'none', borderRadius: 8, color: '#fff', fontFamily: F.main, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* ── Quick View CSS Styles ── */}
      <style>{qvStyles}</style>

      {/* ── Quick View Modal ── */}
      {quickViewProduct && (() => {
        const p = quickViewProduct;
        const parseField = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
          }
          return [];
        };
        const sizes = parseField(p.sizes);
        const colors = parseField(p.colors);
        const fabrics = parseField(p.fabrics);
        
        const qvImages = [];
        if (p.image) qvImages.push(p.image);
        if (p.Images && Array.isArray(p.Images)) {
          p.Images.forEach(img => {
            if (img.url && img.url !== p.image) qvImages.push(img.url);
          });
        }
        
        const selectedVariant = (p.Variants || p.variants || []).find(v => 
          (!qvSize || v.size === qvSize) && 
          (!qvColor || v.color === qvColor) && 
          (!qvFabric || v.fabric === qvFabric)
        );
        const selectedVariantStock = selectedVariant ? Number(selectedVariant.stock) : Number(p.stock);
        const selectedVariantStockVerified = selectedVariant ? selectedVariant.billingStockVerified : p.billingStockVerified;
        
        const currentQvImg = (selectedVariant?.image)
          ? getImageUrl(selectedVariant.image)
          : (qvImages[qvImgIdx] ? getImageUrl(qvImages[qvImgIdx]) : null);
        const variantFinal = Number(selectedVariant?.franchise_price_final);
        const salePrice = variantFinal > 0 ? variantFinal : Number(p.franchise_price_final || p.salesPrice || 0);
        const mrpPrice = Number(p.mrp || 0);
        const discount = mrpPrice > salePrice ? Math.round(((mrpPrice - salePrice) / mrpPrice) * 100) : 0;
        const wished = isWishlisted(p.id);
        const catName = getCategoryName(p);
        
        // Item structures for Cart & Wishlist
        const cartItem = {
          id: p.id,
          name: p.productName,
          price: salePrice,
          variantId: selectedVariant?.id || null,
          billingVariantId: selectedVariant?.billingVariantId || null,
          billingProductId: p.billingProductId || p.billing_product_id || null,
          subtitle: catName,
          image: p.image ? getImageUrl(p.image) : null,
          size: qvSize,
          color: qvColor,
          fabric: qvFabric,
          isBuyOneGetOne: !!p.isBuyOneGetOne,
        };
        
        const wishItem = {
          id: p.id,
          name: p.productName,
          price: salePrice,
          subtitle: catName,
          image: p.image ? getImageUrl(p.image) : null,
          isBuyOneGetOne: !!p.isBuyOneGetOne,
        };

        return (
          <div className="qv-overlay" onClick={() => setQuickViewProduct(null)}>
            <div className="qv-content" onClick={e => e.stopPropagation()}>
              <button className="qv-close-btn" onClick={() => setQuickViewProduct(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
              
              <div className="row g-4">
                {/* Image Section */}
                <div className="col-md-6 d-flex flex-column gap-3">
                  <div style={{ width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', background: '#f5f5f5', border: '1px solid #E0E8D8' }}>
                    {currentQvImg ? (
                      <img src={currentQvImg} alt={p.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <PlaceholderImg style={{ width: '100%', height: '100%' }} />
                    )}
                  </div>
                  
                  {/* Thumbnails */}
                  {qvImages.length > 1 && (
                    <div className="d-flex gap-2 flex-wrap">
                      {qvImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(img)}
                          alt=""
                          className={`qv-thumb${qvImgIdx === idx ? ' active' : ''}`}
                          onClick={() => setQvImgIdx(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Details Section */}
                <div className="col-md-6 d-flex flex-column justify-content-between">
                  <div>
                    {/* Brand & Category */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      {p.Brand?.brandName && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: F.main }}>
                          {p.Brand.brandName}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 style={{ fontFamily: F.main, fontWeight: 400, fontSize: 24, color: BRAND, marginBottom: 12, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                      {p.productName}
                    </h3>
                    
                    {/* Rating */}
                    <div style={{ marginBottom: 16 }}>
                      <Stars filled={getAvgRating(p)} />
                    </div>
                    
                    {/* Pricing */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: BRAND, fontFamily: F.sub }}>
                        ₹{salePrice.toLocaleString('en-IN')}
                      </span>
                      {mrpPrice > salePrice && (
                        <>
                          <del style={{ fontSize: 15, color: '#aaa', fontFamily: F.sub }}>
                            ₹{mrpPrice.toLocaleString('en-IN')}
                          </del>
                          <span style={{ fontSize: 12, background: ACCENT, color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontFamily: F.main }}>
                            {discount}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Stock Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, fontFamily: F.sub, color: !selectedVariantStockVerified ? '#9a6b24' : selectedVariantStock > 0 ? '#4a5a44' : '#c00' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: !selectedVariantStockVerified ? '#c9933a' : selectedVariantStock > 0 ? ACCENT : '#c00' }} />
                      {!selectedVariantStockVerified ? 'Stock unavailable' : selectedVariantStock > 0 ? `In Stock (${selectedVariantStock} units)` : 'Out of Stock'}
                    </div>

                    {/* Description */}
                    {(p.shortDescription || p.description) && (
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, fontFamily: F.sub, marginBottom: 20, fontWeight: 300 }}>
                        {p.shortDescription || p.description}
                      </p>
                    )}
                    
                    {/* Options: Sizes */}
                    {sizes.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: BRAND, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: F.main }}>Size</span>
                        <div className="d-flex gap-2 flex-wrap">
                          {sizes.map(s => (
                            <button key={s} className={`qv-size-pill${qvSize === s ? ' active' : ''}`} onClick={() => setQvSize(s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Options: Colors */}
                    {colors.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: BRAND, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: F.main }}>Color</span>
                        <div className="d-flex gap-2 flex-wrap">
                          {colors.map(c => (
                            <button key={c} className={`qv-color-pill${qvColor === c ? ' active' : ''}`} onClick={() => setQvColor(c)}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Options: Fabrics */}
                    {fabrics.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: BRAND, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: F.main }}>Fabric</span>
                        <div className="d-flex gap-2 flex-wrap">
                          {fabrics.map(f => (
                            <button key={f} className={`qv-fabric-pill${qvFabric === f ? ' active' : ''}`} onClick={() => setQvFabric(f)}>
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div style={{ borderTop: '1px solid #E0E8D8', paddingTop: 20, marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button
                        onClick={() => { addToCart(cartItem); setQuickViewProduct(null); }}
                        disabled={!selectedVariantStockVerified || selectedVariantStock <= 0}
                        onMouseEnter={e => { if (selectedVariantStockVerified && selectedVariantStock > 0) e.currentTarget.style.background = '#0b3a31'; }}
                        onMouseLeave={e => { if (selectedVariantStockVerified && selectedVariantStock > 0) e.currentTarget.style.background = ACCENT; }}
                        style={{
                          flex: 1,
                          padding: '12px 24px',
                          background: selectedVariantStockVerified && selectedVariantStock > 0 ? ACCENT : '#ccc',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          cursor: selectedVariantStockVerified && selectedVariantStock > 0 ? 'pointer' : 'not-allowed',
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: F.main,
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          transition: 'background 0.2s'
                        }}
                      >
                        <i className="fa-solid fa-cart-shopping" style={{ marginRight: 8 }} />
                        {!selectedVariantStockVerified ? 'Stock Unavailable' : selectedVariantStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                      
                      <button
                        onClick={() => ctxToggleWishlist(wishItem)}
                        onMouseEnter={e => e.currentTarget.style.background = '#0b3a31'}
                        onMouseLeave={e => e.currentTarget.style.background = ACCENT}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 8,
                          border: 'none',
                          background: ACCENT,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title={wished ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                          <path
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                            fill={wished ? "#fff" : "none"}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        </svg>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => { goToProduct(p); setQuickViewProduct(null); }}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: ACCENT,
                        fontFamily: F.main,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginTop: 14,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      View Full Details <i className="fa-solid fa-arrow-right" style={{ marginLeft: 4 }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Combo Quick View Modal ── */}
      {quickViewCombo && (() => {
        const child = quickViewCombo;
        const childImgSrc = child.image ? getImageUrl(child.image) : null;
        const discount = child.originalPrice && Number(child.originalPrice) > Number(child.comboPrice)
          ? Math.round(((Number(child.originalPrice) - Number(child.comboPrice)) / Number(child.originalPrice)) * 100)
          : 0;

        return (
          <div className="qv-overlay" onClick={() => setQuickViewCombo(null)}>
            <div className="qv-content" onClick={e => e.stopPropagation()}>
              <button className="qv-close-btn" onClick={() => setQuickViewCombo(null)}>
                <i className="fa-solid fa-xmark" />
              </button>

              <div className="row g-4">
                {/* Left Side: Combo Cover Image */}
                <div className="col-md-6">
                  <div style={{ width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', background: '#f5f5f5', border: '1px solid #E0E8D8' }}>
                    {childImgSrc ? (
                      <img src={childImgSrc} alt={child.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <PlaceholderImg style={{ width: '100%', height: '100%' }} />
                    )}
                  </div>
                </div>

                {/* Right Side: Combo Information */}
                <div className="col-md-6 d-flex flex-column justify-content-between" style={{ minHeight: 380 }}>
                  <div>
                    {/* Root Combo Tag */}
                    {child.rootName && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: F.main }}>
                          Group: {child.rootName}
                        </span>
                      </div>
                    )}

                    {/* Combo Title */}
                    <h3 style={{ fontFamily: F.main, fontWeight: 400, fontSize: 24, color: BRAND, marginBottom: 12, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                      {child.name}
                    </h3>

                    {/* Pricing */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: BRAND, fontFamily: F.sub }}>
                        ₹{Number(child.comboPrice).toLocaleString('en-IN')}
                      </span>
                      {child.originalPrice && Number(child.originalPrice) > Number(child.comboPrice) && (
                        <>
                          <del style={{ fontSize: 15, color: '#aaa', fontFamily: F.sub }}>
                            ₹{Number(child.originalPrice).toLocaleString('en-IN')}
                          </del>
                          <span style={{ fontSize: 12, background: '#0f5447', color: '#fff', border: '1px solid #C9A84C', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontFamily: F.main }}>
                            Save {discount}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    {(child.shortDescription || child.fullDescription) && (
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, fontFamily: F.sub, marginBottom: 20, fontWeight: 300 }}>
                        {child.fullDescription || child.shortDescription}
                      </p>
                    )}

                    {/* Products List with Thumbnails */}
                    <div style={{ borderTop: '1px dashed #E0E8D8', paddingTop: 16, marginTop: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontFamily: F.main }}>
                        Pack includes the following products:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {child.ComboProducts?.map((cp, idx) => {
                          const pImg = cp.Product?.image ? getImageUrl(cp.Product.image) : null;
                          return (
                            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', border: '1px solid #E0E8D8', flexShrink: 0 }}>
                                {pImg ? (
                                  <img src={pImg} alt={cp.Product?.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <PlaceholderImg style={{ width: '100%', height: '100%' }} />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <span
                                  onClick={() => {
                                    setQuickViewCombo(null);
                                    if (cp.Product) goToProduct(cp.Product);
                                  }}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 13,
                                    color: BRAND,
                                    cursor: 'pointer',
                                    fontFamily: F.main,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.color = '#0f5447';
                                    e.currentTarget.style.textDecoration = 'underline';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.color = BRAND;
                                    e.currentTarget.style.textDecoration = 'none';
                                  }}
                                >
                                  {cp.Product?.productName || 'Product'}
                                </span>
                                <span style={{ display: 'block', fontSize: 11, color: '#666', fontFamily: F.sub, marginTop: 2 }}>
                                  Quantity: {cp.quantity || 1} &middot; ₹{Number(cp.Product?.salesPrice || cp.Product?.mrp || 0).toLocaleString('en-IN')} each
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Actions */}
                  <div style={{ borderTop: '1px solid #E0E8D8', paddingTop: 20, marginTop: 24 }}>
                    <button
                      onClick={() => {
                        addComboToCart(child);
                        setQuickViewCombo(null);
                      }}
                      disabled={addedCombosFeedback[child.id]}
                      onMouseEnter={e => { if (!addedCombosFeedback[child.id]) e.currentTarget.style.background = '#0b3a31'; }}
                      onMouseLeave={e => { if (!addedCombosFeedback[child.id]) e.currentTarget.style.background = '#0f5447'; }}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        background: addedCombosFeedback[child.id] ? '#C9A84C' : '#0f5447',
                        color: addedCombosFeedback[child.id] ? BRAND : '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: addedCombosFeedback[child.id] ? 'default' : 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: F.main,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        transition: 'background 0.2s'
                      }}
                    >
                      {addedCombosFeedback[child.id] ? (
                        <><i className="fa-solid fa-check" style={{ marginRight: 8 }} /> Added to Cart!</>
                      ) : (
                        <><i className="fa-solid fa-cart-shopping" style={{ marginRight: 8 }} /> Add Combo Pack to Cart</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
