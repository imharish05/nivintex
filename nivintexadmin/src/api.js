/**
 * adminApi.js
 * Centralised fetch-based API helpers for the Admin Panel.
 */
import { API_BASE_URL, BILLING_API_BASE_URL } from './config/api';

const BASE = API_BASE_URL;
const LIVE_API = API_BASE_URL;
const BILLING_API = BILLING_API_BASE_URL;

function handleExpiredAdmin(response) {
    if (response.status === 401 && localStorage.getItem('adminToken')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.dispatchEvent(new Event('admin-auth-expired'));
    }
}

// ─── Generic helpers ────────────────────────────────────────────────────────

const get = async (path, useLive = false, baseUrlOverride = null) => {
    const baseUrl = (baseUrlOverride || (useLive ? LIVE_API : BASE) || '').replace(/\/+$/, '');
    if (!baseUrl) throw new Error('API base URL is not configured.');
    const token = localStorage.getItem('adminToken') || '';
    const response = await fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    handleExpiredAdmin(response);
    if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
    return response.json();
};

const billingImageUrl = (path) => {
    if (!path || /^https?:\/\//i.test(path)) return path || null;
    const assetBase = (BILLING_API || '').replace(/\/+$/, '').replace(/\/api$/i, '');
    return assetBase ? `${assetBase}/${String(path).replace(/^\/+/, '')}` : path;
};

const unwrapBillingCollection = (payload, key) => {
    const candidates = [payload?.[key], payload?.data?.[key], payload?.data?.data?.[key], payload?.result?.[key], payload?.data, payload];
    const value = candidates.find(item => Array.isArray(item))
        || candidates.find(item => item && typeof item === 'object' && (item.id != null || item[`${key}_id`] != null));
    return Array.isArray(value) ? value : value ? [value] : [];
};

const getBillingCategories = async () => {
    const baseUrl = (BASE || '').replace(/\/+$/, '');
    if (!baseUrl) throw new Error('API base URL is not configured.');

    const response = await fetch(`${baseUrl}/billing/category`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
    });
    handleExpiredAdmin(response);
    if (!response.ok) throw new Error(`GET /billing/category failed: ${response.status}`);
    const data = await response.json();
    return unwrapBillingCollection(data, 'category').map(category => ({ ...category, image: billingImageUrl(category.image) }));
};

const send = async (method, path, body) => {
    const options = {
        method,
        headers: {},
    };
    
    if (body instanceof FormData) {
        options.body = body;
    } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const token = localStorage.getItem('adminToken') || '';
    if (token) options.headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${BASE}${path}`, options);
    handleExpiredAdmin(response);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error || data.message || `${method} ${path} failed`);
    return data;
};

const del = async (path) => {
    const token = localStorage.getItem('adminToken') || '';
    const response = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    handleExpiredAdmin(response);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || `DELETE ${path} failed`);
    return data;
};

// ─── Stock API ─────────────────────────────────────────────────────────────────
export const stockApi = {
    getAll: async () => { const r = await get('/stocks', true); return r?.stocks || r; },
    getById: async (id) => { const r = await get(`/stocks/${id}`, true); return r?.stocks || r; },
    add: (data) => send('POST', '/stocks/add', data),
    update: (id, data) => send('PUT', `/stocks/update/${id}`, data),
    remove: (id) => del(`/stocks/${id}`),
};

// ─── Banners ─────────────────────────────────────────────────────────────────
export const bannerApi = {
    getAll: () => get('/banners'),
    getById: (id) => get(`/banners/${id}`),
    add: (formData) => send('POST', '/banners/add', formData),
    update: (id, formData) => send('PUT', `/banners/update/${id}`, formData),
    remove: (id) => del(`/banners/${id}`),
};

// ─── Offer Banners ────────────────────────────────────────────────────────────
export const offerBannerApi = {
    getAll: () => get('/offer-banners'),
    getById: (id) => get(`/offer-banners/${id}`),
    add: (formData) => send('POST', '/offer-banners/add', formData),
    update: (id, formData) => send('PUT', `/offer-banners/update/${id}`, formData),
    remove: (id) => del(`/offer-banners/${id}`),
};

// ─── Instagram Posts ──────────────────────────────────────────────────────────
export const instagramApi = {
    getAllPublic: () => get('/instagram-posts'),
    getAllAdmin: () => get('/instagram-posts/admin'),
    getById: (id) => get(`/instagram-posts/${id}`),
    add: (formData) => send('POST', '/instagram-posts/add', formData),
    update: (id, formData) => send('PUT', `/instagram-posts/update/${id}`, formData),
    remove: (id) => del(`/instagram-posts/${id}`),
};

// ─── Live Products ────────────────────────────────────────────────────────────
export const liveProductApi = {
    getAll: () => get('/live-products'),
    getById: (id) => get(`/live-products/${id}`),
    add: (formData) => send('POST', '/live-products/add', formData),
    update: (id, formData) => send('PUT', `/live-products/update/${id}`, formData),
    remove: (id) => del(`/live-products/${id}`),
};

// ─── Brands ───────────────────────────────────────────────────────────────────
export const brandApi = {
    getAll: () => get('/brands'),
    getById: (id) => get(`/brands/${id}`),
    add: (formData) => send('POST', '/brands/add', formData),
    update: (id, formData) => send('PUT', `/brands/update/${id}`, formData),
    remove: (id) => del(`/brands/${id}`),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoryApi = {
    getAll: getBillingCategories,
    getById: async (id) => {
        const categories = await getBillingCategories();
        return Array.isArray(categories)
            ? categories.find(category => String(category.id) === String(id)) || null
            : null;
    },
    add: (formData) => send('POST', '/category/add', formData),
    update: (id, formData) => send('PUT', `/category/update/${id}`, formData),
    remove: (id) => del(`/category/delete/${id}`),
};

// ─── Sub-Categories ───────────────────────────────────────────────────────────
export const subCategoryApi = {
    getAll: async () => unwrapBillingCollection(await get('/subcategories/billing'), 'subcategory'),
    getById: async (id) => (await subCategoryApi.getAll()).find(row => String(row.id) === String(id)) || null,
};

// ─── Products ─────────────────────────────────────────────────────────────────

const mapProduct = (p, allStocks = []) => {
  if (!p) return p;
  const sourceVariants = p.variants || p.Variants || p.product_varients || p.product_variants || [];
  const variantFinals = sourceVariants.map(variant => Number(variant.franchise_price_final ?? variant.prices?.franchise)).filter(price => Number.isFinite(price) && price > 0);
  const productFinal = Number(p.franchise_price_final ?? p.prices?.franchise);
  const finalPrice = Number.isFinite(productFinal) && productFinal > 0 ? productFinal : (variantFinals.length ? Math.min(...variantFinals) : 0);
  const variants = sourceVariants.map(variant => {
    const variantFinal = Number(variant.franchise_price_final ?? variant.prices?.franchise);
    const price = Number.isFinite(variantFinal) && variantFinal > 0 ? variantFinal : finalPrice;
    return { ...variant, franchise_price_final: price || null, salesPrice: price, mrp: price };
  });
  let sizes = p.sizes || [];
  let colors = p.colors || [];
  let totalStock = p.stock || 0;
  
  if (variants.length > 0) {
    if (allStocks && allStocks.length > 0) {
      variants.forEach(v => {
        const matched = allStocks.find(s => 
          String(s.product_id) === String(p.id) && 
          String(s.size) === String(v.size) && 
          String(s.color) === String(v.color)
        );
        if (matched && matched.quantity !== undefined) {
          v.stock = matched.quantity;
          v.quantity = matched.quantity;
        }
      });
    }

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
    productName: p.name || p.productName,
    categoryId: p.category_id || p.categoryId,
    subCategoryId: p.sub_category_id || p.subCategoryId,
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
    franchise_price_final: finalPrice || null,
    salesPrice: finalPrice,
    mrp: finalPrice,
    image: p.main_image || p.image
  };
};
const mapProducts = (arr, allStocks = []) => Array.isArray(arr) ? arr.map(p => mapProduct(p, allStocks)) : (arr ? mapProduct(arr, allStocks) : arr);

let billingProductSyncPromise = null;
const syncBillingProducts = () => {
    if (!billingProductSyncPromise) {
        billingProductSyncPromise = (async () => {
            const token = localStorage.getItem('adminToken') || '';
            const response = await fetch(`${BASE}/sync/billing/products`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Could not refresh products from Billing API.');
            if (Array.isArray(result.warnings) && result.warnings.length) console.warn('Billing sync warning:', result.warnings.join(' '));
            return result;
        })().finally(() => {
            billingProductSyncPromise = null;
        });
    }
    return billingProductSyncPromise;
};

const saveProductCustomization = async (billingProductId, body) => {
    const token = localStorage.getItem('adminToken') || '';
    const response = await fetch(`${BASE}/products/billing/${encodeURIComponent(billingProductId)}/customization`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || 'Could not save product image and settings.');
    return result;
};

const saveVariantImage = async (billingVariantId, body) => {
    const token = localStorage.getItem('adminToken') || '';
    const response = await fetch(`${BASE}/products/billing-variants/${encodeURIComponent(billingVariantId)}/image`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || 'Could not save variant image.');
    return result;
};

export const productApi = {

    getAll: async (forceSync = false) => { 
        if (forceSync) {
            await syncBillingProducts();
        }
        const r = await get('/products');
        return mapProducts(r?.products || r?.data || r);
    },
    sync: syncBillingProducts,
    getById: async (id, forceSync = false) => { 
        if (forceSync) {
            await syncBillingProducts();
        }
        const r = await get(`/products/${id}`);
        return mapProducts(r?.products || r?.product || r);
    },
    updateCustomization: saveProductCustomization,
    add: (formData) => send('POST', '/products/add', formData),
    update: (id, formData) => send('PUT', `/products/update/${id}`, formData),
    updateSaleStatus: (id, data) => send('PUT', `/products/update-sale-status/${id}`, data),
    remove: (id) => del(`/products/${id}`),
};

export const productSpecificationApi = {
    getByProduct: async (productId) => {
        const response = await fetch(`${BASE}/product-specifications/product/${encodeURIComponent(productId)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load specifications.');
        return result.specifications || [];
    },
    save: async (productId, specifications) => {
        const token = localStorage.getItem('adminToken') || '';
        const response = await fetch(`${BASE}/product-specifications/product/${encodeURIComponent(productId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ specifications }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not save specifications.');
        return result.specifications || [];
    },
};

export const sizeChartApi = {
    getAll: async () => {
        const token = localStorage.getItem('adminToken') || '';
        const response = await fetch(`${BASE}/size-charts`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load size charts.');
        return result.charts || [];
    },
    getForProduct: async productId => {
        const response = await fetch(`${BASE}/size-charts/product/${encodeURIComponent(productId)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load product size chart.');
        return result.chart || null;
    },
    getAssignment: async productId => {
        const token = localStorage.getItem('adminToken') || '';
        const response = await fetch(`${BASE}/size-charts/assignment/${encodeURIComponent(productId)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load chart assignment.');
        return result.sizeChartId || '';
    },
    assign: async (productId, sizeChartId) => {
        const token = localStorage.getItem('adminToken') || '';
        const response = await fetch(`${BASE}/size-charts/assignment/${encodeURIComponent(productId)}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ sizeChartId: sizeChartId || null }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not assign size chart.');
        return result;
    },
    save: async (chart, id = null) => {
        const token = localStorage.getItem('adminToken') || '';
        const response = await fetch(`${BASE}/size-charts${id ? `/${id}` : ''}`, {
            method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(chart),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not save size chart.');
        return result.chart;
    },
    remove: async id => {
        const token = localStorage.getItem('adminToken') || '';
        const response = await fetch(`${BASE}/size-charts/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not delete size chart.');
    },
};

// ─── Variants ─────────────────────────────────────────────────────────────────
export const variantApi = {
    getAll: async (forceSync = false) => productApi.getAll(forceSync),
    getByProduct: async (productId) => { 
      const prods = await productApi.getAll(false);
      const prod = prods.find(p => p.id === Number(productId) || p.id === String(productId));
      return prod?.variants || prod?.Variants || [];
    },
    updateImage: saveVariantImage,
    add: (productId, formData) => send('POST', `/variants/product/${productId}/add`, formData),
    update: (id, formData) => send('PUT', `/variants/update/${id}`, formData),
    remove: (id) => del(`/variants/${id}`),
};


// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewApi = {
    getAll: async (includeAdmin = false) => {
        const url = includeAdmin ? `${BASE}/reviews?admin=1` : `${BASE}/reviews`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch reviews: ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },
    add: async (data) => {
        const response = await fetch(`${BASE}/reviews/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to add review');
        return result;
    },
    update: async (id, data) => {
        const response = await fetch(`${BASE}/reviews/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to update review');
        return result;
    },
    remove: async (id) => {
        const response = await fetch(`${BASE}/reviews/${id}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to delete review');
        return result;
    },
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customerApi = {
    getAll: () => get('/customers'),
    getById: (id) => get(`/customers/${id}`),
    remove: (id) => del(`/customers/${id}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderApi = {
    getAll: () => get('/orders'),
    getByStatus: (status) => get(`/orders?status=${status}`),
    getById: (id) => get(`/orders/${id}`),
    updateStatus: (id, data) => send('PUT', `/orders/status/${id}`, data),
    getBillingPayload: id => get(`/orders/${encodeURIComponent(id)}/billing-payload`),
    updateBillingPayload: (id, billingPayload) => send('PUT', `/orders/${encodeURIComponent(id)}/billing-payload`, { billingPayload }),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const couponApi = {
    getAll: () => get('/coupons'),
    getById: (id) => get(`/coupons/${id}`),
    add: (data) => send('POST', '/coupons/add', data),
    update: (id, data) => send('PUT', `/coupons/update/${id}`, data),
    remove: (id) => del(`/coupons/${id}`),
};


// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contactApi = {
    getAll: () => get('/contacts'),
    getById: (id) => get(`/contacts/${id}`),
    remove: (id) => del(`/contacts/${id}`),
};

// ─── Image URL helper ───────────────────────────────────────────────────────
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('storage/uploads/')) return `${BASE}/${imagePath.replace(/^storage\//, '')}`;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    if (cleanPath.startsWith('uploads/')) return `${BASE}/${cleanPath}`;
    return `${BASE}/uploads/${cleanPath}`;
};
