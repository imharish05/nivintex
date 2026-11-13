import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartApi, wishlistApi, authApi, orderApi, productApi, billingCatalogApi, getImageUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

const ShopContext = createContext();
export const useShop = () => useContext(ShopContext);

/* ── Session helpers ─────────────────────────────────────────────────── */
const SESSION_COOKIE_NAME = 'nv_ephemeral_auth';
const hasEphemeralCookie = () =>
  typeof document !== 'undefined' &&
  document.cookie.split(';').some((part) => part.trim().startsWith(`${SESSION_COOKIE_NAME}=`));

const setEphemeralCookie = (enabled) => {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; Max-Age=0; SameSite=Lax`;
  }
};

const loadSession = () => {
  try {
    // If the user signed in with "Remember me" off, expire the session once
    // the browser has been closed (the session cookie is cleared on close).
    if (localStorage.getItem('nv_session_only') === '1' && !hasEphemeralCookie()) {
      localStorage.removeItem('nv_user');
      localStorage.removeItem('userToken');
      localStorage.removeItem('nv_session_only');
      sessionStorage.removeItem('nv_user');
      return null;
    }

    // User identity must be shared across tabs. Migrate the old tab-scoped
    // value once so users already logged in before this change stay signed in.
    const shared = localStorage.getItem('nv_user');
    if (shared) {
      sessionStorage.removeItem('nv_user');
      return JSON.parse(shared);
    }
    const legacy = sessionStorage.getItem('nv_user');
    if (!legacy) return null;
    localStorage.setItem('nv_user', legacy);
    sessionStorage.removeItem('nv_user');
    return JSON.parse(legacy);
  }
  catch { return null; }
};
const saveSession = (u, remember) => {
  if (u) {
    localStorage.setItem('nv_user', JSON.stringify(u));
    if (remember === false) {
      localStorage.setItem('nv_session_only', '1');
      setEphemeralCookie(true);
    } else if (remember === true) {
      localStorage.removeItem('nv_session_only');
      setEphemeralCookie(false);
    }
  } else {
    localStorage.removeItem('nv_user');
    localStorage.removeItem('nv_session_only');
    setEphemeralCookie(false);
  }
  // Do not leave stale tab-scoped identities behind after migrating.
  sessionStorage.removeItem('nv_user');
};

/* ── Guest cart/wishlist localStorage helpers ────────────────────────── */
const loadGuestCart      = () => { try { const s = localStorage.getItem('nv_guest_cart');     return s ? JSON.parse(s) : []; } catch { return []; } };
const saveGuestCart      = (i) => { try { localStorage.setItem('nv_guest_cart',     JSON.stringify(i)); } catch {} };
const loadGuestWishlist  = () => { try { const s = localStorage.getItem('nv_guest_wishlist'); return s ? JSON.parse(s) : []; } catch { return []; } };
const saveGuestWishlist  = (i) => { try { localStorage.setItem('nv_guest_wishlist', JSON.stringify(i)); } catch {} };

/* ── Helpers ─────────────────────────────────────────────────────────── */
const resolveImg = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return getImageUrl(img) || '';
};
const normId = (val) => (val === undefined || val === null) ? '' : String(val);
const storefrontPriceWithGst = (value, gstType) => {
  const price = Number(value) || 0;
  const inclusivePrice = String(gstType || 'With GST').toLowerCase() === 'without gst' ? price : price * 1.05;
  return Math.ceil(inclusivePrice - 1e-9);
};

const billingStock = (variant) => {
  if (variant?.in_stock === false || variant?.in_stock === 0 || ['false', '0', 'no', 'out of stock'].includes(String(variant?.in_stock ?? '').trim().toLowerCase())) return 0;
  for (const key of ['available_stock', 'available_quantity', 'available_qty', 'quantity_available', 'qty_available', 'current_stock', 'stock_qty', 'stock_quantity', 'qty', 'on_hand', 'balance_quantity', 'quantity', 'stock', 'total_stock']) {
    const value = variant?.[key];
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return null;
};

const billingStockWithDedicatedRows = (variant, stockByVariant) => {
  const listedStock = billingStock(variant);
  if (listedStock === null) return null;
  if (stockByVariant === null) return listedStock;
  const id = normId(variant?.id ?? variant?.product_variant_id ?? variant?.variant_id);
  if (!stockByVariant?.has(id)) return 0;
  const stock = stockByVariant.get(id);
  return stock === null || stock === undefined ? null : Math.min(listedStock, stock);
};

// ── Centralised Cart Totals Calculator (BOGO Offers) ──────────────────
export const calculateCartTotals = (cartItems = [], applyOffers = true) => {
  let total = 0;
  let originalTotal = 0;

  const bogoItems = [];
  const regularItems = [];

  cartItems.forEach(item => {
    const qty = parseInt(item.qty, 10) || 0;
    const price = parseFloat(item.price) || 0;
    originalTotal += price * qty;

    if (item.isBuyOneGetOne && applyOffers) {
      bogoItems.push(item);
    } else {
      regularItems.push(item);
    }
  });

  // Calculate BOGO Items (Buy 1 Get 1 Free)
  bogoItems.forEach(item => {
    const paidQty = Math.ceil(item.qty / 2);
    total += item.price * paidQty;
  });

  // Calculate Regular Items
  regularItems.forEach(item => {
    total += item.price * item.qty;
  });

  return {
    subtotal: total,
    savings: Math.max(0, originalTotal - total),
    originalTotal
  };
};

export const ShopProvider = ({ children }) => {
  const navigate = useNavigate();
  const [cartItems,     setCartItems]     = useState(() => loadSession() ? [] : loadGuestCart());
  const [wishlistItems, setWishlistItems] = useState(() => loadSession() ? [] : loadGuestWishlist());
  const [user,          setUser]          = useState(loadSession);
  const [myOrders,      setMyOrders]      = useState(() => {
    try { const s = sessionStorage.getItem('nv_orders'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [cartLoading, setCartLoading] = useState(false);
  const [toasts, setToasts]           = useState([]);
  const toastSequence = useRef(0);
  const toastTimers = useRef(new Map());
  const cartStockSyncKey = cartItems.map(item => `${normId(item.billingVariantId)}:${Number(item.qty) || 0}`).join('|');

  // Keep React auth state aligned when another tab logs in, updates the
  // profile, or logs out. The browser emits `storage` only in other tabs.
  useEffect(() => {
    const syncAuthAcrossTabs = (event) => {
      if (event.key === 'nv_user') {
        let nextUser = null;
        try { nextUser = event.newValue ? JSON.parse(event.newValue) : null; }
        catch { nextUser = null; }
        setUser(nextUser);
        if (!nextUser) {
          setMyOrders([]);
          setCartItems(loadGuestCart());
          setWishlistItems(loadGuestWishlist());
        }
      }
      if (event.key === 'userToken' && event.newValue === null) {
        setUser(null);
      }
    };
    window.addEventListener('storage', syncAuthAcrossTabs);
    return () => window.removeEventListener('storage', syncAuthAcrossTabs);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${++toastSequence.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      toastTimers.current.delete(id);
    }, 3000);
    toastTimers.current.set(id, timer);
  }, []);

  const dismissToast = (id) => {
    const timer = toastTimers.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => () => {
    toastTimers.current.forEach(timer => clearTimeout(timer));
    toastTimers.current.clear();
  }, []);

  /* Persist guest data */
  useEffect(() => { if (!user?.id) saveGuestCart(cartItems);        }, [cartItems,     user?.id]);
  useEffect(() => { if (!user?.id) saveGuestWishlist(wishlistItems); }, [wishlistItems, user?.id]);

  // Keep saved and guest cart availability aligned with Billing, including
  // after returning to a tab or leaving the cart open while inventory changes.
  useEffect(() => {
    if (!cartItems.some(item => item.billingVariantId)) return undefined;
    let active = true;
    let stockSyncPending = false;
    const syncStock = async () => {
      if (stockSyncPending) return;
      stockSyncPending = true;
      try {
        const products = await billingCatalogApi.getProductVariants();
        if (!active) return;
        const byVariantId = new Map(products.flatMap(product => (product?.variants || product?.product_variants || product?.product_varients || []).map(variant => [normId(variant.id), variant])));
        setCartItems(current => current.map(item => {
          if (!item.billingVariantId) return item;
          const variant = byVariantId.get(normId(item.billingVariantId));
          const availableStock = variant ? billingStockWithDedicatedRows(variant, null) : 0;
          const stockSyncStatus = availableStock === null ? 'unverified' : 'verified';
          if (item.availableStock === availableStock && item.stockSyncStatus === stockSyncStatus) return item;
          return { ...item, availableStock, stockSyncStatus };
        }));
      } catch (error) {
        if (!active) return;
        console.warn('[ShopContext] live Billing cart stock sync:', error.message);
        setCartItems(current => current.map(item => item.billingVariantId && (item.availableStock !== null || item.stockSyncStatus !== 'unverified')
          ? { ...item, availableStock: null, stockSyncStatus: 'unverified' }
          : item));
      } finally {
        stockSyncPending = false;
      }
    };
    syncStock();
    const interval = window.setInterval(syncStock, 30000);
    window.addEventListener('focus', syncStock);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', syncStock);
    };
  }, [user?.id, cartStockSyncKey]);

  // Refresh previously saved guest cart amounts from the current database catalog.
  useEffect(() => {
    if (user?.id || cartItems.length === 0) return undefined;
    let active = true;
    productApi.getAll().then(products => {
      if (!active || !Array.isArray(products)) return;
      const productMap = new Map(products.map(product => [normId(product.id), product]));
      setCartItems(current => current.map(item => {
        const product = productMap.get(normId(item.productId || item.id));
        if (!product) return item;
        const variant = (product.Variants || []).find(row => normId(row.id) === normId(item.variantId));
        const finalPrice = variant?.franchise_price_final ?? product.franchise_price_final;
        const resolvedGstPrice = finalPrice == null
          ? undefined
          : (product.storefrontGstInclusive === true
            ? Math.ceil((Number(finalPrice) || 0) - 1e-9)
            : storefrontPriceWithGst(finalPrice, product.mrpGstType || product.mrp_gst_type));
        return {
          ...item,
          ...(resolvedGstPrice === undefined ? {} : { price: resolvedGstPrice }),
          mrpGstType: product.mrpGstType || product.mrp_gst_type || 'With GST',
        };
      }));
    }).catch(error => console.warn('[ShopContext] refresh guest cart prices:', error.message));
    return () => { active = false; };
  }, [user?.id]);

  const persistUser   = (u, remember) => { setUser(u); saveSession(u, remember); };
  const persistOrders = (orders) => { setMyOrders(orders); sessionStorage.setItem('nv_orders', JSON.stringify(orders)); };

  const normaliseCartRow = (row) => ({
    id:        row.id,
    productId: normId(row.productId),
    billingProductId: row.Product?.billingProductId || null,
    variantId: row.variantId || null,
    billingVariantId: row.Variant?.billingVariantId || null,
    mrpGstType: row.Product?.mrpGstType || row.Product?.mrp_gst_type || 'With GST',
    color: row.color || '',
    size: row.size || '',
    fabric: row.fabric || '',
    name:      row.name   || 'Product',
    image:     resolveImg(row.img),
    subtitle:  row.weight || '',
    shippingWeightKg: row.shipping_weight_kg ?? row.shippingWeightKg ?? row.Product?.shipping_weight_kg ?? row.Product?.shippingWeightKg ?? null,
    shippingLengthCm: row.shipping_length_cm ?? row.shippingLengthCm ?? row.Product?.shipping_length_cm ?? row.Product?.shippingLengthCm ?? null,
    shippingWidthCm: row.shipping_width_cm ?? row.shippingWidthCm ?? row.Product?.shipping_width_cm ?? row.Product?.shippingWidthCm ?? null,
    shippingHeightCm: row.shipping_height_cm ?? row.shippingHeightCm ?? row.Product?.shipping_height_cm ?? row.Product?.shippingHeightCm ?? null,
    price:     storefrontPriceWithGst(row.Variant?.franchise_price_final ?? row.Product?.franchise_price_final, row.Product?.mrpGstType || row.Product?.mrp_gst_type),
    qty:       parseInt(row.quantity   || 1, 10),
    isBuyOneGetOne: row.Product ? !!row.Product.isBuyOneGetOne : !!row.isBuyOneGetOne,
  });

  const normaliseWishlistRow = (row) => ({
    id:        row.id,
    productId: normId(row.productId),
    variantId: row.variantId || null,
    color: row.color || '',
    size: row.size || '',
    fabric: row.fabric || '',
    name:      row.name    || 'Product',
    image:     resolveImg(row.img),
    subtitle:  row.weight  || '',
    price:     parseFloat(row.price    || 0),
    oldPrice:  null,
    rating:    row.rating  || 4.5,
    reviews:   row.reviews || 0,
    isBuyOneGetOne: !!row.isBuyOneGetOne,
  });

  const normaliseOrderRow = (row) => ({
    id:     row.id,
    date:   row.createdAt
      ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    status: (row.status || 'confirmed')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    total:  parseFloat(row.total || 0),
    subtotal: parseFloat(row.subtotal || 0),
    discount: parseFloat(row.discount || 0),
    tax: Number(row.tax) > 0 ? Number(row.tax) : (row.OrderItems || []).reduce((sum, item) => {
      const gstType = String(item.Product?.mrpGstType || item.Product?.mrp_gst_type || 'With GST').toLowerCase();
      if (gstType === 'without gst') return sum;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const paidQuantity = item.Product?.isBuyOneGetOne ? Math.ceil(quantity / 2) : quantity;
      return sum + ((Number(item.price) || 0) * paidQuantity * 5 / 105);
    }, 0),
    deliveryCharge: parseFloat(row.delivery_charge || 0),
    items: (row.OrderItems || []).map(it => {
      const variant = it.Variant || {};
      const size = variant.size || it.size || '';
      const color = variant.color || it.color || '';
      const fabric = variant.fabric || it.fabric || '';
      const variantLabel = [
        size && `Size: ${size}`,
        color && `Color: ${color}`,
        fabric && `Fabric: ${fabric}`,
      ].filter(Boolean).join(' · ') || (variant.variant_code || variant.sku ? `Variant code: ${variant.variant_code || variant.sku}` : '');
      return {
        name:     it.Product?.productName || it.name || 'Product',
        subtitle: variantLabel,
        price:    parseFloat(it.price || 0),
        qty:      parseInt(it.quantity || 1, 10),
        image:    resolveImg(it.image || it.Product?.image),
        mrpGstType: it.Product?.mrpGstType || it.Product?.mrp_gst_type || 'With GST',
        isBuyOneGetOne: !!it.Product?.isBuyOneGetOne,
      };
    }),
  });

  const fetchCart = useCallback(async (customerId) => {
    if (!customerId) return;
    setCartLoading(true);
    try {
      const rows = await cartApi.get(customerId);
      const normalized = Array.isArray(rows) ? rows.map(normaliseCartRow) : [];
      setCartItems(normalized);
    } catch (err) {
      console.warn('[ShopContext] fetchCart:', err.message);
    } finally {
      setCartLoading(false);
    }
  }, []);

  const fetchWishlist = useCallback(async (customerId) => {
    if (!customerId) return;
    try {
      const rows = await wishlistApi.get(customerId);
      setWishlistItems(Array.isArray(rows) ? rows.map(normaliseWishlistRow) : []);
    } catch (err) {
      console.warn('[ShopContext] fetchWishlist:', err.message);
    }
  }, []);

  const fetchOrders = useCallback(async (customerId) => {
    if (!customerId) return;
    try {
      const res  = await orderApi.getByCustomer(customerId);
      const rows = res?.orders || (Array.isArray(res) ? res : []);
      persistOrders(rows.map(normaliseOrderRow));
    } catch (err) {
      console.warn('[ShopContext] fetchOrders:', err.message);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchCart(user.id);
      fetchWishlist(user.id);
      fetchOrders(user.id);
    } else {
      setCartItems(loadGuestCart());
      setWishlistItems(loadGuestWishlist());
    }
  }, [user?.id]);

  /* ── Shared post-auth handler ─────────────────────────────────────── */
  const _onAuthSuccess = async (userData, token, { remember = true } = {}) => {
    if (token) localStorage.setItem('userToken', token);

    const u = {
      id:    userData.id,
      name:  userData.username || userData.name || userData.customerName || userData.email || '',
      email: userData.email || '',
      phone: userData.phone || '',
    };
    persistUser(u, remember);
    persistOrders([]);

    const guestCart     = loadGuestCart();
    const guestWishlist = loadGuestWishlist();
    localStorage.removeItem('nv_guest_cart');
    localStorage.removeItem('nv_guest_wishlist');

    await fetchCart(u.id);
    await fetchWishlist(u.id);

    for (const item of guestCart) {
      try {
        await cartApi.add({
          customerId: u.id,
          productId: item.productId || item.id,
          variantId: item.variantId || null,
          name: item.name,
          img: item.image,
          price: item.price,
          quantity: item.qty,
          weight: item.subtitle,
          color: item.color || '',
          size: item.size || '',
          fabric: item.fabric || '',
          shippingWeightKg: item.shippingWeightKg,
          shippingLengthCm: item.shippingLengthCm,
          shippingWidthCm: item.shippingWidthCm,
          shippingHeightCm: item.shippingHeightCm,
          isBuyOneGetOne: !!item.isBuyOneGetOne,
        });
      } catch (err) { console.warn('[ShopContext] merge cart:', err.message); }
    }
    for (const item of guestWishlist) {
      try {
        await wishlistApi.add({ customerId: u.id, productId: item.productId || item.id, variantId: item.variantId || null, billingVariantId: item.billingVariantId || null, color: item.color || '', size: item.size || '', fabric: item.fabric || '', name: item.name, img: item.image, price: item.price, weight: item.subtitle || '' });
      } catch (err) { console.warn('[ShopContext] merge wishlist:', err.message); }
    }
    if (guestCart.length > 0 || guestWishlist.length > 0) {
      await fetchCart(u.id);
      await fetchWishlist(u.id);
    }

    return u;
  };

  /* ── Auth ─────────────────────────────────────────────────────────── */
  const login = async (email, password, remember = true) => {
    const res      = await authApi.userLogin(email, password);
    const userData = res.user || res.customer || res;
    return _onAuthSuccess(userData, res.token, { remember });
  };

  const register = async ({ username, email, phone = '', password }) => {
    const res      = await authApi.userRegister({ username, email, phone, password });
    const userData = res.user || res.customer || res;
    return _onAuthSuccess(userData, res.token);
  };

  const loginWithGoogle = async () => {
    return new Promise((resolve, reject) => {
      const width = 500, height = 600;
      const left  = window.screenX + (window.outerWidth  - width)  / 2;
      const top   = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(`${BASE}/auth/google`, 'google_oauth',
        `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`);
      if (!popup) { reject(new Error('Popup blocked — please allow popups for this site.')); return; }

      const onMessage = async (event) => {
        if (!event.data?.token && !event.data?.user) return;
        window.removeEventListener('message', onMessage);
        popup.close();
        try { resolve(await _onAuthSuccess(event.data.user || event.data, event.data.token)); }
        catch (err) { reject(err); }
      };
      window.addEventListener('message', onMessage);

      const poll = setInterval(() => {
        if (popup.closed) {
          clearInterval(poll);
          window.removeEventListener('message', onMessage);
          reject(new Error('Google sign-in was cancelled.'));
        }
      }, 500);
    });
  };

  const logout = () => {
    authApi.userLogout();
    persistUser(null);
    persistOrders([]);
    setCartItems([]);
    setWishlistItems([]);
    localStorage.removeItem('nv_guest_cart');
    localStorage.removeItem('nv_guest_wishlist');
    localStorage.removeItem('ck_saved_addrs_guest');
    navigate('/home');
    window.location.reload();
  };

  /* ── Update Profile (saves to DB) ────────────────────────────────── */
  const updateUser = async ({ name, email, phone }) => {
    const res = await fetch(`${BASE}/user/update-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, username: name, email, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to update profile');

    const updated = {
      ...user,
      name:  data.user.username,
      email: data.user.email,
      phone: data.user.phone || '',
    };
    persistUser(updated);
    return updated;
  };

  /* ── Change Password (saves to DB) ───────────────────────────────── */
  const changePassword = async ({ currentPassword, newPassword }) => {
    const res = await fetch(`${BASE}/user/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to change password');
    return data;
  };

  /* ── Cart ─────────────────────────────────────────────────────────── */
  const addToCart = async (product) => {
    const productId = normId(product.productId || product.id);
    const name      = product.name      || product.productName || 'Product';
    const price     = Math.ceil((parseFloat(product.price || 0)) - 1e-9);
    const img       = product.img || product.image || '';
    const weight    = product.subtitle || product.weight || '';
    const shippingWeightKg = Number(product.shippingWeightKg || product.weightKg || 0) || null;
    const shippingLengthCm = Number(product.shippingLengthCm || 0) || null;
    const shippingWidthCm = Number(product.shippingWidthCm || 0) || null;
    const shippingHeightCm = Number(product.shippingHeightCm || 0) || null;
    const isBuyOneGetOne = !!product.isBuyOneGetOne;
    const mrpGstType = product.mrpGstType || product.mrp_gst_type || 'With GST';
    const billingVariantId = product.billingVariantId || null;
    const billingProductId = product.billingProductId || null;
    const addQty    = parseInt(product.qty || 1, 10);

    let availableStock = null;
    if (billingVariantId) {
      try {
        const products = await billingCatalogApi.getProductVariants();
        const variant = products.flatMap(row => row?.variants || row?.product_variants || row?.product_varients || []).find(row => normId(row.id) === normId(billingVariantId));
        availableStock = variant ? billingStockWithDedicatedRows(variant, null) : 0;
        const existingQty = cartItems.filter(item => normId(item.billingVariantId) === normId(billingVariantId)).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        if (availableStock === null) throw new Error('Billing did not return a usable stock quantity. Please try again.');
        if (availableStock < existingQty + addQty) throw new Error(`Only ${availableStock} unit${availableStock === 1 ? '' : 's'} are currently available for ${name}.`);
      } catch (error) {
        if (!product.silent) showToast(error.message || 'Could not verify current Billing stock.', 'error');
        return false;
      }
    }

    if (user?.id) {
      try {
        await cartApi.add({ customerId: user.id, productId, variantId: product.variantId || null, name, img, price, quantity: addQty, weight, color: product.color || '', size: product.size || '', fabric: product.fabric || '', shippingWeightKg, shippingLengthCm, shippingWidthCm, shippingHeightCm, isBuyOneGetOne });
        await fetchCart(user.id);
        if (!product.silent) showToast(`${name} added to cart!`, 'cart');
        return true;
      } catch (err) {
        console.warn('[ShopContext] addToCart:', err.message);
        if (!product.silent) showToast(err.message || 'Could not add this item to your cart.', 'error');
        return false;
      }
    } else {
      setCartItems(prev => {
        const ex = prev.find(i => i.productId === productId && normId(i.variantId) === normId(product.variantId));
        if (ex) return prev.map(i => i === ex ? { ...i, qty: i.qty + addQty, availableStock, stockSyncStatus: billingVariantId ? 'verified' : 'unverified' } : i);
        return [...prev, { id: `${productId}-${product.variantId || 'default'}`, productId, billingProductId, variantId: product.variantId || null, billingVariantId, availableStock, stockSyncStatus: billingVariantId ? 'verified' : 'unverified', color: product.color || '', size: product.size || '', fabric: product.fabric || '', name, image: resolveImg(img), subtitle: weight, price, qty: addQty, shippingWeightKg, shippingLengthCm, shippingWidthCm, shippingHeightCm, isBuyOneGetOne, mrpGstType }];
      });
      if (!product.silent) showToast(`${name} added to cart!`, 'cart');
      return true;
    }
  };

  const removeFromCart = async (cartRowId) => {
    setCartItems(prev => prev.filter(i => i.id !== cartRowId));
    if (user?.id) {
      try { await cartApi.remove(cartRowId); }
      catch (err) { console.warn('[ShopContext] removeFromCart:', err.message); await fetchCart(user.id); }
    }
  };

  const updateQty = async (cartRowId, delta) => {
    const item = cartItems.find(i => i.id === cartRowId);
    if (!item) return;
    const newQty = Math.max(1, item.qty + delta);
    if (delta > 0 && item.billingVariantId && (item.stockSyncStatus !== 'verified' || item.availableStock === null || item.availableStock === undefined)) {
      showToast('Current stock could not be verified. Refresh the cart and try again.', 'error');
      return;
    }
    if (delta > 0 && item.billingVariantId && newQty > item.availableStock) {
      showToast(`Only ${item.availableStock} unit${item.availableStock === 1 ? '' : 's'} are currently available.`, 'error');
      return;
    }
    setCartItems(prev => prev.map(i => i.id === cartRowId ? { ...i, qty: newQty } : i));
    if (user?.id) {
      try { await cartApi.update(cartRowId, { quantity: newQty }); }
      catch (err) { console.warn('[ShopContext] updateQty:', err.message); await fetchCart(user.id); }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (user?.id) {
      try { await cartApi.clear(user.id); }
      catch (err) { console.warn('[ShopContext] clearCart:', err.message); }
    }
  };

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  /* ── Wishlist ─────────────────────────────────────────────────────── */
  const addToWishlist = async (product) => {
    const productId = normId(product.productId || product.id);
    const variantId = product.variantId || null;
    const sameSelection = (i) => i.productId === productId && normId(i.variantId) === normId(variantId);
    if (wishlistItems.find(sameSelection)) return;
    const rawImg = product.img || product.image || '';
    const item   = {
      id: Date.now(),
      productId,
      variantId,
      billingVariantId: product.billingVariantId || product.billing_variant_id || null,
      color: product.color || '',
      size: product.size || '',
      fabric: product.fabric || '',
      name: product.name || 'Product',
      image: resolveImg(rawImg),
      subtitle: product.subtitle || product.weight || '',
      price: parseFloat(product.price || 0),
      isBuyOneGetOne: !!product.isBuyOneGetOne,
    };
    setWishlistItems(prev => [...prev, item]);
    showToast(`${item.name} added to wishlist!`, 'wishlist');
    if (user?.id) {
      try {
        await wishlistApi.add({ customerId: user.id, productId, variantId, billingVariantId: item.billingVariantId, color: item.color, size: item.size, fabric: item.fabric, name: item.name, img: rawImg, price: item.price, weight: item.subtitle });
        await fetchWishlist(user.id);
      } catch (err) { console.warn('[ShopContext] addToWishlist:', err.message); }
    }
  };

  const removeFromWishlist = async (wishlistRowId) => {
    const item = wishlistItems.find(i => i.id === wishlistRowId);
    setWishlistItems(prev => prev.filter(i => i.id !== wishlistRowId));
    if (item) {
      showToast(`${item.name} removed from wishlist!`, 'info');
    }
    if (user?.id) {
      try { await wishlistApi.remove(wishlistRowId); }
      catch (err) { console.warn('[ShopContext] removeFromWishlist:', err.message); await fetchWishlist(user.id); }
    }
  };

  const toggleWishlist = (product) => {
    const productId = normId(product.productId || product.id);
    const variantId = product.variantId || null;
    const existing  = wishlistItems.find(i => i.productId === productId && normId(i.variantId) === normId(variantId));
    if (existing) removeFromWishlist(existing.id);
    else addToWishlist(product);
  };

  const isWishlisted  = (productId, variantId = null) => !!wishlistItems.find(i => i.productId === normId(productId) && normId(i.variantId) === normId(variantId));
  const wishlistCount = wishlistItems.length;

  /* ── Orders ───────────────────────────────────────────────────────── */
  const placeOrder = (orderData) => {
    const totals = calculateCartTotals(cartItems);
    const order = {
      id:     `NV${Date.now()}`,
      date:   new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items:  [...cartItems],
      total:  totals.subtotal,
      status: 'Confirmed',
      ...orderData,
    };
    persistOrders([order, ...myOrders]);
    clearCart();
    return order;
  };

  const getCartTotals = (applyOffers = true) => calculateCartTotals(cartItems, applyOffers);

  return (
    <ShopContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartLoading,
      wishlistItems, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted, wishlistCount,
      user, login, logout, register, loginWithGoogle,
      updateUser,
      changePassword,
      myOrders, placeOrder,
      getCartTotals,
      fetchOrders:   () => fetchOrders(user?.id),
      fetchCart:     () => fetchCart(user?.id),
      fetchWishlist: () => fetchWishlist(user?.id),
      showToast,
    }}>
      {children}

      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(420px, calc(100vw - 24px))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        zIndex: 999999,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: t.type === 'error' ? '#a83232' : '#0f5447',
              color: '#fff',
              padding: '14px 40px 14px 20px',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(15, 84, 71, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: "'Raleway', sans-serif",
              animation: 'toastFadeInUp 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              pointerEvents: 'auto',
              minWidth: 0,
              maxWidth: '360px',
              width: '100%',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            <i 
              className={
                t.type === 'wishlist' 
                  ? 'fa-solid fa-heart toast-icon-wishlist' 
                  : t.type === 'error'
                    ? 'fa-solid fa-circle-exclamation'
                    : t.type === 'info' 
                    ? 'fa-solid fa-heart toast-icon-info' 
                    : t.type === 'cart'
                      ? 'fa-solid fa-bag-shopping toast-icon-cart'
                      : 'fa-solid fa-circle-check toast-icon-check'
              } 
              style={{ fontSize: '16px' }} 
            />
            <span style={{ flex: 1, color: '#fff', letterSpacing: '0.3px' }}>{t.message}</span>
            
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                transformOrigin: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastFadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        i.fa-solid.fa-heart.toast-icon-wishlist {
          color: #ff4d4d !important;
        }
        i.fa-solid.fa-heart.toast-icon-info {
          color: #ffffff !important;
        }
        i.fa-solid.fa-bag-shopping.toast-icon-cart {
          color: #ffffff !important;
        }
        i.fa-solid.fa-circle-check.toast-icon-check {
          color: #ffffff !important;
        }
      `}</style>
    </ShopContext.Provider>
  );
};

export default ShopContext;
