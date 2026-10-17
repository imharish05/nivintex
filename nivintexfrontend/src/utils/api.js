/**
 * api.js  —  Unified API client for Nivintex (Frontend + Admin)
 * Place at: src/utils/api.js
 */
import defaultLogo from '../assets/img/logo2.png';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const LOCAL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BILLING_ASSETS = process.env.REACT_APP_API_FROM_BILLING_URL;

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(method, path, body, useLocal = false) {
  const baseUrl = useLocal ? LOCAL : BASE;
  const url = `${baseUrl}${path}`;
  const isFormData = body instanceof FormData;

  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      `Cannot connect to server at ${baseUrl}. Is the backend running?\n(${networkErr.message})`
    );
  }

  // Parse response
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const errData = isJson ? await res.json() : { message: res.statusText };
    if (res.status === 401 && localStorage.getItem('adminToken')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.dispatchEvent(new Event('admin-auth-expired'));
    }
    const err = new Error(errData.message || errData.error || `${method} ${path} failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return isJson ? res.json() : res.text();
}

const get  = (path)        => request('GET',    path);
const post = (path, body)  => request('POST',   path, body);
const put  = (path, body)  => request('PUT',    path, body);
const patch= (path, body)  => request('PATCH',  path, body);
const del  = (path)        => request('DELETE', path);

const lGet  = (path)       => request('GET',    path, null, true);
const lPost = (path, body) => request('POST',   path, body, true);
const lPut  = (path, body) => request('PUT',    path, body, true);
const lPatch= (path, body) => request('PATCH',  path, body, true);
const lDel  = (path)       => request('DELETE', path, null, true);

// ─── Image URL helpers ────────────────────────────────────────────────────────
export const billingImageUrl = (path) => {
  if (!path || /^https?:\/\//i.test(path)) return path || null;
  const assetBase = (BILLING_ASSETS || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '').replace(/\/api$/i, '');
  return assetBase ? `${assetBase}/${String(path).replace(/^\/+/, '')}` : path;
};

export const getImageUrl = (imagePath) => {
  if (imagePath == null || imagePath === '') return null;
  if (typeof imagePath === 'object') imagePath = imagePath.url || imagePath.path || imagePath.src || imagePath.image;
  if (typeof imagePath !== 'string' || !imagePath.trim()) return null;
  const path = imagePath.trim().replace(/\\/g, '/');
  const apiBase = (BASE || LOCAL).replace(/\/+$/, '');
  const billingAssetBase = (BILLING_ASSETS || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '').replace(/\/api$/i, '');

  if (/^(https?:|data:|blob:)/i.test(path)) {
    // If it's a category/subcategory image or points to the billing server, preserve it as-is
    if (/(?:categories|category|subcategories|subcategory)\//i.test(path) || /billing\.fashionaura26\.com/i.test(path)) {
      return path;
    }
    // Product records can contain the old billing host even though the files
    // are served by this app's configured backend. Rebase upload URLs there.
    try {
      const absoluteUrl = new URL(path);
      if (/^(?:\/api)?\/(?:storage\/)?uploads\//i.test(absoluteUrl.pathname)) {
        const uploadPath = absoluteUrl.pathname.replace(/^(?:\/api)?\/(?:storage\/)?uploads\//i, '');
        return `${apiBase}/uploads/${uploadPath}${absoluteUrl.search}${absoluteUrl.hash}`;
      }
    } catch (_) {
      return path;
    }
    return path;
  }

  const cleanPath = path.replace(/^\/+/, '');

  // Category and subcategory images hosted on the billing server
  if (/(?:categories|category|subcategories|subcategory)\//i.test(cleanPath) || /^(?:images\/|categories\/)/i.test(cleanPath)) {
    return `${billingAssetBase}/${cleanPath}`;
  }

  if (/^(?:api\/)?(?:storage\/)?uploads\//i.test(cleanPath)) {
    const uploadPath = cleanPath.replace(/^(?:api\/)?(?:storage\/)?uploads\//i, '');
    return `${apiBase}/uploads/${uploadPath}`;
  }

  return `${apiBase}/uploads/${cleanPath.replace(/^uploads\//i, '')}`;
};

export const getLocalImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const billingAssetBase = (BILLING_ASSETS || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '').replace(/\/api$/i, '');
  if (/(?:categories|category|subcategories|subcategory)\//i.test(imagePath)) {
    return `${billingAssetBase}/${imagePath.replace(/^\/+/, '')}`;
  }
  if (imagePath.startsWith('storage/uploads/')) return `${LOCAL.replace('/api', '')}/${imagePath}`;
  const clean = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${LOCAL}/uploads/${clean}`;
};

// ─── Auth  →  /api/auth  &  /api/user ────────────────────────────────────────

export const authApi = {
  adminLogin:     (email, password) => post('/auth/admin/login', { email, password }),
  adminLogout:    ()                => { localStorage.removeItem('adminToken'); },
  userRegister:   (data)            => fetch(`${LOCAL}/user/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(async r => { const d = await r.json(); if (!r.ok || d.error) throw new Error(d.error || d.message || 'Registration failed'); return d; }),
  userLogin:      (email, password) => fetch(`${LOCAL}/user/login`,    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message || d.error || 'Login failed'); return d; }),
  userLogout:     ()                => { localStorage.removeItem('userToken'); },
  forgotPassword: (email)           => post('/password-reset/forgot-password', { email }),
  resetPassword:  (token, password) => post('/password-reset/reset-password', { token, password }),
};

// ─── Categories  →  /api/category ──────────────────────────────────────────
export const categoryApi = {
  getAll: async () => {
    const baseUrl = (BASE || '').replace(/\/+$/, '');
    if (!baseUrl) throw new Error('REACT_APP_API_URL is not configured.');

    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}/billing/category`, {
      headers,
    });
    if (!response.ok) throw new Error(`GET ${baseUrl}/billing/category failed (${response.status})`);

    const data = await response.json();
    const candidates = [data?.category, data?.data?.category, data?.categories, data?.data?.data?.category, data?.data, data];
    const rows = candidates.find(Array.isArray) || candidates.find(value => value && typeof value === 'object' && (value.id != null || value.category_id != null));
    return (Array.isArray(rows) ? rows : rows ? [rows] : []).map(category => {
      const rawImage = category.image || category.image_url || category.imageUrl || category.category_image || category.categoryImage || category.photo || null;
      return {
        ...category,
        name: category.name || category.category_name || category.categoryName || '',
        image: billingImageUrl(rawImage),
      };
    });
  },
  getById: async (id) => {
    const categories = await categoryApi.getAll();
    return Array.isArray(categories)
      ? categories.find((category) => String(category.id) === String(id)) || null
      : null;
  },
  add:     (formData)         => post('/category/add', formData),
  update:  (id, formData)     => put(`/category/update/${id}`, formData),
  remove:  (id)               => del(`/category/delete/${id}`),
};

// ─── Sub-Categories  →  /api/subcategories ───────────────────────────────────
export const subCategoryApi = {
  getAll:       async ()      => {
    const response = await get('/subcategories/billing');
    const candidates = [response?.subcategory, response?.data?.subcategory, response?.subcategories, response?.data, response];
    const rows = candidates.find(Array.isArray) || [];
    return rows.map(sub => ({
      ...sub,
      image: billingImageUrl(sub.image || sub.image_url || null),
    }));
  },
  getById:      async (id)    => (await subCategoryApi.getAll()).find(row => String(row.id) === String(id)) || null,
  getByCategory:async (catId) => (await subCategoryApi.getAll()).filter(row => String(row.category_id || row.categoryId) === String(catId)),
};

// ─── Products  →  /api/products ──────────────────────────────────────────────

const mapProduct = (p) => {
  if (!p) return p;
  const sourceVariants = p.variants || p.Variants || p.product_varients || p.product_variants || [];
  const variants = sourceVariants.map(variant => {
    const rawFinal = variant.franchise_price_final ?? variant.prices?.franchise;
    const finalPrice = Number(rawFinal) || 0;
    return { ...variant, franchise_price_final: rawFinal ?? null, salesPrice: finalPrice, mrp: finalPrice };
  });
  const rawProductFinal = p.franchise_price_final ?? p.prices?.franchise ?? variants.find(variant => variant.franchise_price_final != null)?.franchise_price_final;
  const finalPrice = Number(rawProductFinal) || 0;
  let sizes = p.sizes || [];
  let colors = p.colors || [];
  let totalStock = p.stock || 0;
  
  if (variants.length > 0) {
    if (typeof sizes === 'string') { try { sizes = JSON.parse(sizes); } catch { sizes = []; } }
    if (typeof colors === 'string') { try { colors = JSON.parse(colors); } catch { colors = []; } }
    
    const vSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const vColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
    
    if (vSizes.length > 0 && (!sizes || sizes.length === 0)) sizes = vSizes;
    if (vColors.length > 0 && (!colors || colors.length === 0)) colors = vColors;
    
    // Some APIs use 'quantity', some use 'stock'
    const vStock = variants.reduce((sum, v) => sum + Number(v.stock || v.quantity || 0), 0);
    if (vStock > 0 && (!totalStock || totalStock === 0)) totalStock = vStock;
  }

  return {
    ...p,
    slug: p.slug || p.product_slug || slugifyProductName(p.productName || p.name, p.id),
    productName: p.name || p.productName,
    categoryId: p.billingCategoryId || p.Category?.billingCategoryId || p.category_id || p.categoryId,
    // Keep Billing's subcategory id and our local subcategory id distinct.
    subCategoryId: p.sub_category_id || p.subCategoryId || p.subcategoryId || p.SubCategory?.id || null,
    billingSubcategoryId: p.billing_subcategory_id || p.billingSubcategoryId || null,
    shippingWeightKg: p.shipping_weight_kg ?? p.shippingWeightKg ?? null,
    shippingLengthCm: p.shipping_length_cm ?? p.shippingLengthCm ?? null,
    shippingWidthCm: p.shipping_width_cm ?? p.shippingWidthCm ?? null,
    shippingHeightCm: p.shipping_height_cm ?? p.shippingHeightCm ?? null,
    brandId: p.brand_id || p.brandId,
    productCode: p.product_code || p.productCode,
    hsnCode: p.hsn_code || p.hsnCode,
    mainImage: p.main_image || p.mainImage,
    createdAt: p.created_at || p.createdAt,
    updatedAt: p.updated_at || p.updatedAt,
    shortDescription: p.description || p.short_description || p.shortDescription,
    longDescription: p.long_description || p.longDescription,
    Variants: variants,
    sizes: sizes,
    colors: colors,
    stock: totalStock,
    franchise_price_final: rawProductFinal ?? null,
    salesPrice: finalPrice,
    mrp: finalPrice,
    image: p.main_image || p.image
  };
};

export const slugifyProductName = (name, id) => {
  const base = String(name || 'product')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
  return `${base}-${id}`;
};

const mapProducts = (arr) => Array.isArray(arr) ? arr.map(mapProduct) : (arr ? mapProduct(arr) : arr);

const enrichProductsWithBillingPrices = async products => {
  const isArray = Array.isArray(products);
  const rows = Array.isArray(products) ? products : products ? [products] : [];
  if (!rows.length) return isArray ? [] : null;
  let billingRows;
  try {
    billingRows = await billingCatalogApi.getProducts();
  } catch (error) {
    console.warn('[Products] Live Billing price lookup failed; using the local catalog price:', error.message);
    return products;
  }
  const billingById = new Map(billingRows.map(row => [String(row.id ?? row.product_id), row]));
  const enriched = rows.map(row => {
    const billingId = row.billingProductId ?? row.billing_product_id ?? row.id;
    const billing = billingById.get(String(billingId));
    if (!billing) return row;
    const franchisePrice = billing.prices?.franchise ?? billing.franchise_price_final;
    const existingVariants = row.Variants || row.variants || [];
    const billingVariants = billing.variants || billing.product_variants || billing.product_varients || [];
    const billingVariantByCode = new Map(billingVariants.flatMap(variant =>
      [variant.variant_code, variant.sku, variant.barcode].filter(Boolean).map(code => [String(code).toLowerCase(), variant])
    ));
    const Variants = existingVariants.map(variant => {
      const matched = billingVariantByCode.get(String(variant.variant_code || variant.sku || variant.barcode || '').toLowerCase());
      const variantPrice = matched?.prices?.franchise ?? matched?.franchise_price_final ?? variant.franchise_price_final ?? franchisePrice;
      return { ...variant, franchise_price_final: variantPrice ?? null, salesPrice: Number(variantPrice) || 0, mrp: Number(variantPrice) || 0 };
    });
    return {
      ...row,
      prices: billing.prices || row.prices,
      franchise_price_final: franchisePrice ?? row.franchise_price_final ?? null,
      salesPrice: Number(franchisePrice ?? row.salesPrice) || 0,
      mrp: Number(franchisePrice ?? row.mrp) || 0,
      Variants,
    };
  });
  return isArray ? enriched : enriched[0];
};

export const productApi = {

  getAll:          async () => { const r = await get('/product_varients'); const arr = r?.product_varients || r?.products || r?.data || (Array.isArray(r) ? r : []); return mapProducts(await enrichProductsWithBillingPrices(mapProducts(arr))); },
  // Use on listing pages that should render before the optional live price lookup.
  getAllFast:      async () => { const r = await get('/product_varients'); const arr = r?.product_varients || r?.products || r?.data || (Array.isArray(r) ? r : []); return mapProducts(arr); },
  enrichWithBillingPrices: async products => enrichProductsWithBillingPrices(products),
  getById:         async (id) => { const r = await get(`/product_details/${id}`); return mapProducts(await enrichProductsWithBillingPrices(mapProducts(r?.products || r?.product || r))); },
  getBySlug:       async (slug) => { const r = await get(`/products/slug/${encodeURIComponent(slug)}`); return mapProducts(await enrichProductsWithBillingPrices(mapProducts(r?.product || r?.products || r))); },
  getByCategory:   async (catId) => { const r = await get(`/products/category/${catId}`); return mapProducts(await enrichProductsWithBillingPrices(mapProducts(r?.products || r))); },
  getBySubCategory:async (subCatId) => { const r = await get(`/products/subcategory/${subCatId}`); return mapProducts(await enrichProductsWithBillingPrices(mapProducts(r?.products || r))); },
  search:          async (query) => { const r = await get(`/products/search?q=${encodeURIComponent(query)}`); return mapProducts(await enrichProductsWithBillingPrices(mapProducts(r?.products || r))); },
  add:             (formData)      => post('/products/add', formData),
  update:          (id, formData)  => put(`/products/update/${id}`, formData),
  remove:          (id)            => del(`/products/delete/${id}`),
};

// Live Billing catalog endpoints; stock checks must not rely on a stale local sync.
export const billingCatalogApi = {
  getProducts: async () => {
    const response = await get('/billing/products');
    const products = response?.products || response?.data?.products || response?.data || response;
    if (!Array.isArray(products)) throw new Error(response?.message || 'Billing returned an invalid products response.');
    return products;
  },
  getProductVariants: async () => {
    const response = await get('/billing/product-varients');
    const products = response?.product_varients || response?.products || response?.data?.product_varients || response?.data?.products || response?.data || response;
    if (!Array.isArray(products)) throw new Error(response?.message || 'Billing returned an invalid product variants response.');
    return products;
  },
  getProductDetails: async billingProductId => {
    const response = await get(`/billing/product-details/${encodeURIComponent(billingProductId)}`);
    const candidates = [response?.product_details, response?.product, response?.products, response?.data?.product_details, response?.data?.product, response?.data?.products, response?.data?.data, response?.data, response];
    const result = candidates.find(value => Array.isArray(value) || (value && typeof value === 'object' && (value.id != null || value.product_id != null)));
    return Array.isArray(result) ? result[0] : result;
  },
  getStocksByVariant: async () => {
    let response;
    try {
      response = await get('/billing/stocks');
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
    if (Number(response?.status) === 404) return null;
    if (Number(response?.status) >= 400) throw new Error(response.message || 'Billing stock list returned an error.');
    const candidates = [response?.stocks, response?.data?.stocks, response?.data?.data?.stocks, response?.data, response];
    const rows = candidates.find(Array.isArray);
    if (!rows) throw new Error(response?.message || 'Billing returned an invalid stock list response.');
    const stockByVariant = new Map();
    for (const row of rows) {
      const id = row?.product_variant_id ?? row?.product_varient_id ?? row?.variant_id ?? row?.productVariantId ?? row?.id;
      if (id === undefined || id === null) continue;
      const outOfStock = row.in_stock === false || row.in_stock === 0
        || ['false', '0', 'no', 'out of stock'].includes(String(row.in_stock ?? '').trim().toLowerCase());
      const raw = row.available_stock ?? row.available_quantity ?? row.available_qty ?? row.quantity_available
        ?? row.qty_available ?? row.current_stock ?? row.stock_qty ?? row.stock_quantity ?? row.qty
        ?? row.on_hand ?? row.balance_quantity ?? row.quantity ?? row.stock ?? row.total_stock;
      const quantity = outOfStock ? 0 : raw === null || raw === undefined || raw === '' ? null : Number(raw);
      const value = Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : null;
      const key = String(id);
      if (!stockByVariant.has(key)) stockByVariant.set(key, value);
      else {
        const previous = stockByVariant.get(key);
        stockByVariant.set(key, previous === null || value === null ? null : Math.min(previous, value));
      }
    }
    return stockByVariant;
  },
};

export const productSpecificationApi = {
  getByProduct: async (productId) => {
    const result = await get(`/product-specifications/product/${encodeURIComponent(productId)}`);
    return Array.isArray(result?.specifications) ? result.specifications : [];
  },
};

export const sizeChartApi = {
  getForProduct: async productId => {
    const result = await get(`/size-charts/product/${encodeURIComponent(productId)}`);
    return result?.chart || null;
  },
};

// ─── Brands  →  /api/brands ──────────────────────────────────────────────────
export const brandApi = {
  getAll:  ()             => get('/brands'),
  getById: (id)           => get(`/brands/${id}`),
  add:     (formData)     => post('/brands/add', formData),
  update:  (id, formData) => put(`/brands/update/${id}`, formData),
  remove:  (id)           => del(`/brands/delete/${id}`),
};

// ─── Stock  →  /api/stocks ───────────────────────────────────────────────────
export const stockApi = {
  getAll:  async ()          => { const r = await get('/stocks'); return r?.stocks || r; },
  getById: async (id)        => { const r = await get(`/stocks/${id}`); return r?.stocks || r; },
  add:     (data)      => post('/stocks/add', data),
  update:  (id, data)  => put(`/stocks/update/${id}`, data),
  remove:  (id)        => del(`/stocks/delete/${id}`),
};

// ─── Customers  →  /api/customers ────────────────────────────────────────────
export const customerApi = {
  getAll:  ()   => get('/customers'),
  getById: (id) => get(`/customers/${id}`),
  remove:  (id) => del(`/customers/delete/${id}`),
};

// ─── Reviews  →  /api/reviews ────────────────────────────────────────────────
export const reviewApi = {
  getAll:        (adminMode = false) => get(`/reviews${adminMode ? '?admin=1' : ''}`),
  getByProduct:  (productId)         => get(`/reviews/product/${productId}`),
  add:           (data)              => post('/reviews/add', data),
  update:        (id, data)          => put(`/reviews/update/${id}`, data),
  remove:        (id)                => del(`/reviews/delete/${id}`),
};

// ─── Cart  →  /api/cart ──────────────────────────────────────────────────────
export const cartApi = {
  get:    (userId) => lGet(`/cart/customer/${userId}`),
  add:    (data)   => lPost('/cart/add', data),
  update: (id, data) => lPut(`/cart/update/${id}`, data),
  remove: (id)     => lDel(`/cart/${id}`),
  clear:  (userId) => lDel(`/cart/clear/${userId}`),
};

// ─── Wishlist  →  /api/wishlist ──────────────────────────────────────────────
export const wishlistApi = {
  get:    (userId) => lGet(`/wishlist/${userId}`),
  add:    (data)   => lPost('/wishlist/add', data),
  remove: (id)     => lDel(`/wishlist/${id}`),
};

// ─── Orders  →  /api/orders ──────────────────────────────────────────────────
export const orderApi = {
  getAll:        ()                => lGet('/orders'),
  getById:       (id)              => lGet(`/orders/${id}`),
  getByStatus:   (status)          => lGet(`/orders?status=${status}`),
  getByCustomer: (customerId)      => lGet(`/orders/customer/${customerId}`),
  place:         (data)            => lPost('/orders/save', data),
  updateStatus:  (id, data)        => lPatch(`/orders/${id}/status`, data),
  remove:        (id)              => lDel(`/orders/delete/${id}`),
};

// ─── Returns  →  /api/returns ────────────────────────────────────────────────
export const returnApi = {
  getAll:  ()          => lGet('/returns'),
  getById: (id)        => lGet(`/returns/${id}`),
  request: (data)      => lPost('/returns/request', data),
  update:  (id, data)  => lPut(`/returns/update/${id}`, data),
};

// ─── Coupons  →  /api/coupons ────────────────────────────────────────────────
export const couponApi = {
  getAll:   ()          => lGet('/coupons'),
  getById:  (id)        => lGet(`/coupons/${id}`),
  validate: (code)      => lPost('/coupons/validate', { code }),
  add:      (data)      => lPost('/coupons/add', data),
  update:   (id, data)  => lPut(`/coupons/update/${id}`, data),
  remove:   (id)        => lDel(`/coupons/delete/${id}`),
};

// ─── Razorpay  →  /api/razorpay ──────────────────────────────────────────────
export const razorpayApi = {
  createOrder:   (data) => lPost('/razorpay/create-order', data),
  verifyPayment: (data) => lPost('/razorpay/verify-payment', data),
};

// ─── Banners  →  /api/banners ────────────────────────────────────────────────
export const bannerApi = {
  getAll:  ()            => lGet('/banners'),
  getById: (id)          => lGet(`/banners/${id}`),
  add:     (formData)    => lPost('/banners/add', formData),
  update:  (id, formData)=> lPut(`/banners/update/${id}`, formData),
  remove:  (id)          => lDel(`/banners/delete/${id}`),
};

// ─── Offer Banners  →  /api/offer-banners ────────────────────────────────────
export const offerBannerApi = {
  getAll:  ()            => lGet('/offer-banners'),
  getById: (id)          => lGet(`/offer-banners/${id}`),
  add:     (formData)    => lPost('/offer-banners/add', formData),
  update:  (id, formData)=> lPut(`/offer-banners/update/${id}`, formData),
  remove:  (id)          => lDel(`/offer-banners/delete/${id}`),
};

// ─── Live Products  →  /api/live-products ────────────────────────────────────
export const liveProductApi = {
  getAll:  ()                 => get('/live-products'),
  getById: (id)               => get(`/live-products/${id}`),
  add:     (formData)         => post('/live-products/add', formData),
  update:  (id, formData)     => put(`/live-products/update/${id}`, formData),
  remove:  (id)               => del(`/live-products/delete/${id}`),
};

// ─── Instagram Posts  →  /api/instagram-posts ────────────────────────────────
export const instagramApi = {
  getAll:      ()                 => lGet('/instagram-posts'),
  getAllAdmin: ()                 => lGet('/instagram-posts/admin'),
  getById:     (id)               => lGet(`/instagram-posts/${id}`),
  add:         (formData)         => lPost('/instagram-posts/add', formData),
  update:      (id, formData)     => lPut(`/instagram-posts/update/${id}`, formData),
  remove:      (id)               => lDel(`/instagram-posts/delete/${id}`),
};

// ─── Promo Bar  →  /api/promo-bar ────────────────────────────────────────────
export const promoBarApi = {
  get:    ()      => get('/promo-bar'),
  update: (data)  => put('/promo-bar/update', data),
};


// ─── Contact  →  /api/contact ────────────────────────────────────────────────
export const contactApi = {
  getAll:  () => get('/contact'),
  getById: (id) => get(`/contact/${id}`),
  send:    (data) => post('/contact/submit', data),
  remove:  (id) => del(`/contact/delete/${id}`),
};

// ─── Product Variants  →  /api/variants ──────────────────────────────────────
export const variantApi = {
  getAll: async () => { const r = await get('/product_varients'); const arr = r?.product_varients || r?.products || r?.data || (Array.isArray(r) ? r : []); return mapProducts(arr); },
  getByProduct: async (productId) => { 
    const all = await get('/product_varients');
    const arr = all?.product_varients || all?.products || all?.data || (Array.isArray(all) ? all : []);
    const prods = mapProducts(arr);
    const prod = prods.find(p => p.id === Number(productId) || p.id === String(productId));
    return prod?.variants || prod?.Variants || prod?.product_varients || [];
  },
  getById: (id) => get(`/variants/${id}`),
  add: (productId, formData) => post(`/variants/product/${productId}/add`, formData),
  bulkSet: (productId, formData) => post(`/variants/product/${productId}/bulk`, formData),
  update: (id, formData) => put(`/variants/update/${id}`, formData),
  remove: (id) => del(`/variants/${id}`),
};

// ─── Combos  →  /api/combos ──────────────────────────────────────────────────
export const comboApi = {
  getStorefront: () => get('/combos/storefront'),
  getAllRoot:    () => get('/combos'),
  addRoot:       (formData) => post('/combos/add', formData),
  updateRoot:    (id, formData) => put(`/combos/update/${id}`, formData),
  removeRoot:    (id) => del(`/combos/${id}`),
  getChildren:   (rootId) => get(`/combos/${rootId}/children`),
  addChild:      (formData) => post('/combos/children/add', formData),
  updateChild:   (id, formData) => put(`/combos/children/update/${id}`, formData),
  removeChild:   (id) => del(`/combos/children/${id}`),
};

// ─── Dashboard  →  /api/dashboard ────────────────────────────────────────────
export const dashboardApi = {
  getStats:       ()                    => get('/dashboard/stats'),
  getStockAlerts: (threshold = 10)      => get(`/dashboard/stock-alerts?threshold=${threshold}`),
};

// ─── Default export (optional — use named imports instead) ───────────────────
export default {
  auth:          authApi,
  category:      categoryApi,
  subCategory:   subCategoryApi,
  product:       productApi,
  brand:         brandApi,
  stock:         stockApi,
  customer:      customerApi,
  review:        reviewApi,
  cart:          cartApi,
  wishlist:      wishlistApi,
  order:         orderApi,
  return:        returnApi,
  coupon:        couponApi,
  razorpay:      razorpayApi,
  banner:        bannerApi,
  offerBanner:   offerBannerApi,
  liveProduct:   liveProductApi,
  instagram:     instagramApi,
  promoBar:      promoBarApi,
  contact:       contactApi,
  dashboard:     dashboardApi,
  variant:       variantApi,
  combo:         comboApi,
};

// ─── Site Settings ────────────────────────────────────────────────────────────
export const siteSettingsApi = {
  getPublic: () => fetch(`${BASE}/site-settings/public`).then(r => r.json()),
  getAll:    () => fetch(`${BASE}/site-settings`).then(r => r.json()),
  bulkUpdate: (data) => fetch(`${BASE}/site-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
};
