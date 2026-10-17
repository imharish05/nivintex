const axios = require('axios');
const { Op } = require('sequelize');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const orderFlowLog = require('../utils/orderFlowLogger');
const { billingRequestManager } = require('./billingRequestManager');
const { configuredStockLocationId, normalizeStockLocationId } = require('./billingInvoicePayload');

const getBaseUrl = () => (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
const getOptions = () => ({
  headers: {
    Accept: 'application/json',
    ...(process.env.BILLING_API_TOKEN ? { Authorization: `Bearer ${process.env.BILLING_API_TOKEN}` } : {}),
  },
  timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000,
  maxRedirects: 0,
});

async function billingGet(path, params = {}, options = {}) {
  const url = `${getBaseUrl()}${path}`;
  const queryKey = Object.keys(params).sort().map(key => `${key}=${String(params[key])}`).join('&');
  const key = `GET:${url}${queryKey ? `?${queryKey}` : ''}`;
  const configuredTtl = Number(process.env.BILLING_API_CATALOG_CACHE_TTL_MS);
  const cacheTtlMs = options.cache === false ? 0 : Number.isFinite(configuredTtl) && configuredTtl >= 0 ? configuredTtl : 10000;
  const response = await billingRequestManager.request({
    method: 'GET', key, label: path,
    cacheTtlMs,
    bypassCache: options.fresh === true,
    execute: () => axios.get(url, { ...getOptions(), ...(Object.keys(params).length ? { params } : {}) }),
  });
  return response.data;
}

async function getProductVariants(options = {}) {
  return billingGet('/product_varients', {}, { cache: options.cache !== false, fresh: options.fresh === true });
}

async function getProducts() {
  const firstPayload = await billingGet('/products');
  const lastPage = Math.max(1, Number(firstPayload?.meta?.last_page ?? firstPayload?.data?.meta?.last_page ?? 1) || 1);
  if (lastPage <= 1) return firstPayload;
  const pages = [];
  for (let page = 2; page <= lastPage; page += 1) {
    pages.push(await billingGet('/products', { page }));
  }
  return {
    ...firstPayload,
    products: [...productsFromResponse(firstPayload), ...pages.flatMap(productsFromResponse)],
    meta: { ...firstPayload.meta, pages_fetched: lastPage },
  };
}

async function getVariants() {
  return billingGet('/varients');
}

async function getStocks() {
  return billingGet('/stocks');
}

async function getProductDetails(productId) {
  return billingGet(`/product_details/${encodeURIComponent(productId)}`);
}

async function getEndpoint(path) {
  return billingGet(path, {}, { cache: false });
}

function productsFromResponse(payload) {
  if (Array.isArray(payload)) return payload;
  for (const candidate of [payload?.product_varients, payload?.products, payload?.product, payload?.data?.product_varients, payload?.data?.products, payload?.data?.product, payload?.data]) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') return [candidate];
  }
  return [];
}

function variantsFromResponse(payload) {
  return productsFromResponse(payload).flatMap(product => {
    const variants = product?.variants || product?.product_variants || product?.product_varients || [];
    return Array.isArray(variants) ? variants : [];
  });
}

function flatVariantsFromResponse(payload) {
  const candidates = [payload?.varients, payload?.variants, payload?.product_varients, payload?.data?.varients,
    payload?.data?.variants, payload?.data?.product_varients, payload?.data, payload];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    if (candidate.every(record => record && typeof record === 'object')) return candidate;
  }
  return [];
}

function stocksFromResponse(payload) {
  const candidates = [payload?.stocks, payload?.data?.stocks, payload?.data?.data?.stocks, payload?.data, payload];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function productDetailsFromResponse(payload) {
  const candidates = [
    payload?.product_details,
    payload?.product,
    payload?.products,
    payload?.data?.product_details,
    payload?.data?.product,
    payload?.data?.products,
    payload?.data?.data,
    payload?.data,
    payload,
  ];
  for (const candidate of candidates) {
    const product = Array.isArray(candidate) ? candidate[0] : candidate;
    if (product && typeof product === 'object'
      && ['variants', 'product_variants', 'product_varients'].some(key => Array.isArray(product[key]))) {
      return product;
    }
  }
  return null;
}

function stockValue(variant) {
  const availability = variant?.in_stock;
  if (availability === false || availability === 0 || ['false', '0', 'no', 'out of stock'].includes(String(availability ?? '').trim().toLowerCase())) return 0;
  for (const key of ['available_stock', 'available_quantity', 'available_qty', 'quantity_available', 'qty_available', 'current_stock', 'stock_qty', 'stock_quantity', 'qty', 'on_hand', 'balance_quantity', 'quantity', 'stock', 'total_stock']) {
    if (variant?.[key] === null || variant?.[key] === undefined || variant[key] === '') continue;
    const value = Number(variant[key]);
    if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  }
  return null;
}

// The product catalog's total_stock is aggregated across locations. Billing's
// invoice controller deducts Stock.quantity for one franchise_location_id, so
// checkout only trusts a row that identifies both the variant and exact location.
function locationStockValue(variant, requestedLocationId) {
  if (!variant || !Object.prototype.hasOwnProperty.call(variant, 'franchise_location_id')) return null;
  const rowLocationId = variant.franchise_location_id == null || variant.franchise_location_id === ''
    ? null : String(variant.franchise_location_id);
  const expectedLocationId = requestedLocationId == null || requestedLocationId === ''
    ? null : String(requestedLocationId);
  if (rowLocationId !== expectedLocationId) return null;
  const variantId = variant.product_variant_id ?? variant.product_varient_id ?? variant.variant_id ?? variant.id;
  if (variantId == null || !/^\d+$/.test(String(variantId))) return null;
  const quantity = Number(variant.quantity);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null;
}

function assertResponseStatus(payload, endpoint) {
  const status = Number(payload?.status);
  if (Number.isFinite(status) && status >= 400) {
    const error = new Error(payload?.message || `Billing GET ${endpoint} returned status ${status}.`);
    error.status = status;
    throw error;
  }
}

function variantIdOf(variant) {
  const id = variant?.id ?? variant?.product_variant_id ?? variant?.product_varient_id ?? variant?.variant_id;
  return id === undefined || id === null || String(id).trim() === '' ? null : String(id).trim();
}

async function assertBillingStock(items, { locationId = configuredStockLocationId() } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Add at least one product variant before starting payment.');
    error.status = 400;
    throw error;
  }

  const stockUrl = `${getBaseUrl()}/product_varients`;
  orderFlowLog.logRequest('Billing stock preflight', 'GET', stockUrl, {});
  let payload;
  try {
    payload = await getProductVariants({ fresh: true });
    assertResponseStatus(payload, '/product_varients');
    orderFlowLog.logResponse('Billing stock preflight /product_varients', Number(payload?.status) || 200, requestedVariantSnapshot(payload, items));
  } catch (cause) {
    orderFlowLog.logFailure('Billing stock preflight /product_varients', cause);
    const upstreamStatus = cause.response?.status || cause.status;
    const error = new Error(upstreamStatus
      ? Number(upstreamStatus) === 429
        ? 'Billing is receiving too many stock requests. Please wait a few seconds and try again.'
        : `Billing stock check failed (HTTP ${upstreamStatus}). Please try again.`
      : 'Could not reach Billing to verify live stock. Please try again before payment.');
    error.status = 503;
    error.billingHttpStatus = upstreamStatus || null;
    error.retryAfter = cause.response?.headers?.['retry-after'] || null;
    error.retryAfterMs = cause.retryAfterMs ?? null;
    error.cause = cause;
    throw error;
  }

  const nestedVariants = variantsFromResponse(payload);
  const flatVariants = flatVariantsFromResponse(payload);
  const variants = nestedVariants.length ? nestedVariants : flatVariants;
  if (!variants.length) {
    const error = new Error('Billing returned no product variants, so stock could not be verified. Payment was not started.');
    error.status = 503;
    throw error;
  }

  // Use one live variant-list request at checkout. The previous fan-out to
  // /products, /varients, /stocks and one /product_details request per product
  // triggered Billing's HTTP 429 limit and did not reserve inventory.
  const allProducts = productsFromResponse(payload);
  const auxiliaryVariants = flatVariants;
  const variantsById = new Map();
  const locationStockRows = stocksFromResponse(payload);
  for (const variant of [...variants, ...auxiliaryVariants, ...locationStockRows]) {
    const id = variantIdOf(variant);
    if (id) {
      variantsById.set(id, [...(variantsById.get(id) || []), variant]);
    }
  }
  const byId = new Map();
  const byCode = new Map();
  const productIdByVariant = new Map();
  for (const variant of variants) {
    const variantId = variantIdOf(variant);
    if (variantId) byId.set(variantId, variant);
    for (const code of [variant?.variant_code, variant?.sku, variant?.barcode]) {
      if (code) byCode.set(String(code).trim().toLowerCase(), variant);
    }
  }
  for (const product of allProducts) {
    const parentProductId = product?.id ?? product?.product_id;
    for (const variant of product?.variants || product?.product_variants || product?.product_varients || []) {
      const variantId = variantIdOf(variant);
      if (variantId && parentProductId !== undefined && parentProductId !== null) {
        productIdByVariant.set(variantId, String(parentProductId));
      }
    }
  }
  for (const variant of flatVariants) {
    const variantId = variantIdOf(variant);
    const productId = variant?.product_id ?? variant?.productId;
    if (variantId !== undefined && variantId !== null && productId !== undefined && productId !== null) {
      productIdByVariant.set(String(variantId), String(productId));
    }
  }

  const requested = new Map();
  const stockLocationId = locationId === undefined ? configuredStockLocationId() : normalizeStockLocationId(locationId);
  for (const item of items) {
    const variantId = item?.product_variant_id ?? item?.billingVariantId ?? item?.billing_variant_id;
    const variantCode = item?.variant_code ?? item?.sku;
    const key = variantId !== undefined && variantId !== null && String(variantId).trim()
      ? `id:${String(variantId).trim()}`
      : variantCode ? `code:${String(variantCode).trim().toLowerCase()}` : '';
    const quantity = Number(item?.quantity);
    if (!key || !Number.isInteger(quantity) || quantity < 1) {
      const error = new Error('A cart item is missing its Billing variant ID or a valid quantity. Refresh the cart before payment.');
      error.status = 400;
      throw error;
    }
    const productId = item?.product_id ?? item?.billingProductId ?? item?.billing_product_id
      ?? (variantId !== undefined && variantId !== null ? productIdByVariant.get(String(variantId)) : undefined);
    const current = requested.get(key) || { variantId, variantCode, productId, quantity: 0 };
    if (current.productId != null && productId != null && String(current.productId) !== String(productId)) {
      const error = new Error('The same Billing variant was submitted under different products. Refresh your cart before payment.');
      error.status = 409;
      throw error;
    }
    if (current.productId == null && productId != null) current.productId = productId;
    current.quantity += quantity;
    requested.set(key, current);
  }

  const issues = [];
  for (const item of requested.values()) {
    const variant = item.variantId !== undefined && item.variantId !== null
      ? byId.get(String(item.variantId))
      : byCode.get(String(item.variantCode).trim().toLowerCase());
    const label = variant?.variant_code || variant?.sku || item.variantCode || `variant ${item.variantId}`;
    if (!variant) {
      issues.push({ variantId: item.variantId ?? null, label, requested: item.quantity, available: 0, reason: 'Variant is no longer listed by Billing.' });
      continue;
    }
    const mappedVariantId = variantIdOf(variant);
    const mappedProductId = productIdByVariant.get(mappedVariantId);
    if (item.productId !== undefined && item.productId !== null && mappedProductId !== undefined && String(item.productId) !== mappedProductId) {
      const error = new Error(`${label} does not belong to the selected Billing product. Refresh your cart before payment.`);
      error.status = 409;
      throw error;
    }
    const availabilityValues = (variantsById.get(mappedVariantId) || [variant])
      .map(row => locationStockValue(row, stockLocationId))
      .filter(value => value !== null);
    const available = availabilityValues.length ? Math.min(...availabilityValues) : null;
    if (available === null) {
      const locationLabel = stockLocationId === null ? 'Central Admin' : `stock location ${stockLocationId}`;
      const error = new Error(`Billing returned aggregate product stock, but no sellable quantity for ${label} at ${locationLabel}. Payment was not started.`);
      error.status = 503;
      error.code = 'BILLING_LOCATION_STOCK_UNAVAILABLE';
      throw error;
    }
    item.quantityAvailable = available;
    if (available < item.quantity) {
      issues.push({ variantId: mappedVariantId, label, requested: item.quantity, available, reason: 'Insufficient stock.' });
    }
  }

  if (issues.length) {
    const error = new Error(issues.map(issue => `${issue.label}: ${issue.available} available, ${issue.requested} requested.`).join(' '));
    error.status = 409;
    error.stockIssues = issues;
    throw error;
  }

  const result = { checkedAt: new Date().toISOString(), stockLocationId, variantsChecked: requested.size, stockSourcesChecked: ['product_varients'], items: [...requested.values()].map(item => ({ product_id: item.productId ?? productIdByVariant.get(String(item.variantId)) ?? null, product_variant_id: item.variantId ?? null, variant_code: item.variantCode || null, quantity_requested: item.quantity, quantity_available: item.quantityAvailable ?? null })) };
  orderFlowLog.logResponse('Billing stock preflight result', 200, result);
  return result;
}

function requestedVariantSnapshot(payload, items) {
  const requestedIds = new Set((items || []).map(item => String(item?.product_variant_id ?? item?.billingVariantId ?? item?.billing_variant_id ?? item?.variantId ?? '')).filter(Boolean));
  const candidateRows = [
    ...productsFromResponse(payload),
    ...flatVariantsFromResponse(payload),
    ...stocksFromResponse(payload),
    ...variantsFromResponse(payload),
  ];
  const rows = candidateRows.flatMap(record => {
    const children = record?.variants || record?.product_variants || record?.product_varients;
    return Array.isArray(children) ? children.map(child => ({ ...child, product_id: child.product_id ?? record.id ?? record.product_id })) : [record];
  });
  const matchedById = new Map();
  for (const row of rows) {
    const id = row?.product_variant_id ?? row?.product_varient_id ?? row?.variant_id ?? row?.id;
    if (id !== undefined && requestedIds.has(String(id)) && !matchedById.has(String(id))) matchedById.set(String(id), row);
  }
  return { status: payload?.status ?? null, message: payload?.message ?? null, requested_variant_ids: [...requestedIds], matched_variants: [...matchedById.values()] };
}

async function refreshLocalStockFromBilling(billingVariantIds) {
  const ids = [...new Set((billingVariantIds || []).map(value => String(value || '').trim()).filter(Boolean))];
  if (!ids.length) return { updatedVariants: 0, updatedProducts: 0 };
  const payload = await getProductVariants({ fresh: true });
  const billingById = new Map(variantsFromResponse(payload).map(variant => [String(variant.id), variant]));
  const localVariants = await ProductVariant.findAll({ where: { billingVariantId: { [Op.in]: ids } } });
  const touchedProducts = new Set();
  let updatedVariants = 0;
  for (const local of localVariants) {
    const current = billingById.get(String(local.billingVariantId));
    const stock = current ? stockValue(current) : null;
    if (stock === null) continue;
    await local.update({ stock }, { hooks: false });
    touchedProducts.add(local.productId);
    updatedVariants += 1;
  }
  let updatedProducts = 0;
  for (const productId of touchedProducts) {
    const [product, variants] = await Promise.all([
      Product.findByPk(productId),
      ProductVariant.findAll({ where: { productId }, attributes: ['stock'] }),
    ]);
    if (!product) continue;
    await product.update({ stock: variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0) });
    updatedProducts += 1;
  }
  return { updatedVariants, updatedProducts };
}

module.exports = { getProductVariants, getProducts, getVariants, getStocks, getProductDetails, getEndpoint, productsFromResponse, variantsFromResponse, flatVariantsFromResponse, stocksFromResponse, productDetailsFromResponse, stockValue, locationStockValue, assertBillingStock, refreshLocalStockFromBilling };
