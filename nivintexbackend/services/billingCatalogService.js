const axios = require('axios');
const { Op } = require('sequelize');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const orderFlowLog = require('../utils/orderFlowLogger');

const getBaseUrl = () => (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
const getOptions = () => ({
  headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
  timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000,
  maxRedirects: 0,
});

async function getProductVariants() {
  const response = await axios.get(`${getBaseUrl()}/product_varients`, getOptions());
  return response.data;
}

async function getProducts() {
  const firstResponse = await axios.get(`${getBaseUrl()}/products`, getOptions());
  const firstPayload = firstResponse.data;
  const lastPage = Math.max(1, Number(firstPayload?.meta?.last_page ?? firstPayload?.data?.meta?.last_page ?? 1) || 1);
  if (lastPage <= 1) return firstPayload;
  const pages = await Promise.all(Array.from({ length: lastPage - 1 }, (_, index) =>
    axios.get(`${getBaseUrl()}/products`, { ...getOptions(), params: { page: index + 2 } }).then(response => response.data)
  ));
  return {
    ...firstPayload,
    products: [...productsFromResponse(firstPayload), ...pages.flatMap(productsFromResponse)],
    meta: { ...firstPayload.meta, pages_fetched: lastPage },
  };
}

async function getVariants() {
  const response = await axios.get(`${getBaseUrl()}/varients`, getOptions());
  return response.data;
}

async function getStocks() {
  const response = await axios.get(`${getBaseUrl()}/stocks`, getOptions());
  return response.data;
}

async function getProductDetails(productId) {
  const response = await axios.get(`${getBaseUrl()}/product_details/${encodeURIComponent(productId)}`, getOptions());
  return response.data;
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

function assertResponseStatus(payload, endpoint) {
  const status = Number(payload?.status);
  if (Number.isFinite(status) && status >= 400) {
    const error = new Error(payload?.message || `Billing GET ${endpoint} returned status ${status}.`);
    error.status = status;
    throw error;
  }
}

async function assertBillingStock(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Add at least one product variant before starting payment.');
    error.status = 400;
    throw error;
  }

  let payload;
  try {
    payload = await getProductVariants();
    orderFlowLog.logRequest('Billing stock preflight', 'GET', `${getBaseUrl()}/product_varients`, {
      requested_items: items.map(item => ({ product_id: item.product_id ?? item.billingProductId ?? item.billing_product_id ?? null, product_variant_id: item.product_variant_id ?? item.billingVariantId ?? item.billing_variant_id ?? null, quantity: Number(item.quantity) })),
    });
    orderFlowLog.logResponse('Billing stock preflight /product_varients', 200, requestedVariantSnapshot(payload, items));
  } catch (cause) {
    orderFlowLog.logRequest('Billing stock preflight', 'GET', `${getBaseUrl()}/product_varients`, {
      requested_items: items.map(item => ({ product_id: item.product_id ?? item.billingProductId ?? item.billing_product_id ?? null, product_variant_id: item.product_variant_id ?? item.billingVariantId ?? item.billing_variant_id ?? null, quantity: Number(item.quantity) })),
    });
    orderFlowLog.logFailure('Billing stock preflight /product_varients', cause);
    const error = new Error(cause.response?.status
      ? `Billing stock check failed (HTTP ${cause.response.status}). Please try again.`
      : 'Could not reach Billing to verify live stock. Please try again before payment.');
    error.status = 503;
    error.cause = cause;
    throw error;
  }

  const variants = variantsFromResponse(payload);
  if (!variants.length) {
    const error = new Error('Billing returned no product variants, so stock could not be verified. Payment was not started.');
    error.status = 503;
    throw error;
  }

  // Read the other inventory-bearing Billing GETs as well. `/stocks` is known
  // to return 404 for some Billing setups, so only that endpoint may be absent;
  // other failures make the pre-payment stock check fail closed.
  let productsPayload;
  let flatVariantsPayload;
  let stocksPayload = null;
  orderFlowLog.logRequest('Billing stock cross-check', 'GET', `${getBaseUrl()}/products`, { requested_product_ids: items.map(item => item.product_id ?? item.billingProductId ?? item.billing_product_id ?? null) });
  orderFlowLog.logRequest('Billing stock cross-check', 'GET', `${getBaseUrl()}/varients`, { requested_variant_ids: items.map(item => item.product_variant_id ?? item.billingVariantId ?? item.billing_variant_id ?? null) });
  try {
    [productsPayload, flatVariantsPayload] = await Promise.all([getProducts(), getVariants()]);
    orderFlowLog.logResponse('Billing stock cross-check /products', 200, requestedVariantSnapshot(productsPayload, items));
    orderFlowLog.logResponse('Billing stock cross-check /varients', 200, requestedVariantSnapshot(flatVariantsPayload, items));
    assertResponseStatus(productsPayload, '/products');
    assertResponseStatus(flatVariantsPayload, '/varients');
  } catch (cause) {
    orderFlowLog.logFailure('Billing stock cross-check /products', cause);
    orderFlowLog.logFailure('Billing stock cross-check /varients', cause);
    const error = new Error(cause.response?.status
      ? `Billing inventory cross-check failed (HTTP ${cause.response.status}). Please try again.`
      : 'Could not reach Billing to cross-check product and variant stock. Please try again before payment.');
    error.status = 503;
    error.cause = cause;
    throw error;
  }
  try {
    stocksPayload = await getStocks();
    orderFlowLog.logRequest('Billing stock cross-check', 'GET', `${getBaseUrl()}/stocks`, { requested_variant_ids: items.map(item => item.product_variant_id ?? item.billingVariantId ?? item.billing_variant_id ?? null) });
    orderFlowLog.logResponse('Billing stock cross-check /stocks', 200, requestedVariantSnapshot(stocksPayload, items));
    assertResponseStatus(stocksPayload, '/stocks');
  } catch (cause) {
    orderFlowLog.logRequest('Billing stock cross-check', 'GET', `${getBaseUrl()}/stocks`, { requested_variant_ids: items.map(item => item.product_variant_id ?? item.billingVariantId ?? item.billing_variant_id ?? null) });
    orderFlowLog.logFailure('Billing stock cross-check /stocks', cause);
    if (cause.response?.status !== 404 && cause.status !== 404) {
      const error = new Error(cause.response?.status
        ? `Billing stock endpoint check failed (HTTP ${cause.response.status}). Please try again.`
        : 'Could not reach Billing stock endpoint. Please try again before payment.');
      error.status = 503;
      error.cause = cause;
      throw error;
    }
    stocksPayload = null;
  }

  const allProducts = [...productsFromResponse(payload), ...productsFromResponse(productsPayload)];
  const auxiliaryVariants = [...variantsFromResponse(productsPayload), ...flatVariantsFromResponse(flatVariantsPayload)];
  const variantsById = new Map();
  for (const variant of [...variants, ...auxiliaryVariants]) {
    if (variant?.id !== undefined && variant?.id !== null) {
      const id = String(variant.id);
      variantsById.set(id, [...(variantsById.get(id) || []), variant]);
    }
  }
  const stockRowsByVariant = new Map();
  const stockRows = stocksFromResponse(stocksPayload);
  if (stocksPayload !== null && !stockRows.length) {
    const error = new Error('Billing GET /stocks returned no stock rows, so variant availability could not be confirmed. Payment was not started.');
    error.status = 503;
    throw error;
  }
  for (const row of stockRows) {
    const id = row?.product_variant_id ?? row?.product_varient_id ?? row?.variant_id ?? row?.productVariantId ?? row?.id;
    if (id === undefined || id === null) continue;
    const key = String(id);
    stockRowsByVariant.set(key, [...(stockRowsByVariant.get(key) || []), row]);
  }

  const byId = new Map();
  const byCode = new Map();
  const productIdByVariant = new Map();
  for (const variant of variants) {
    if (variant?.id !== undefined && variant?.id !== null) byId.set(String(variant.id), variant);
    for (const code of [variant?.variant_code, variant?.sku, variant?.barcode]) {
      if (code) byCode.set(String(code).trim().toLowerCase(), variant);
    }
  }
  for (const product of allProducts) {
    const parentProductId = product?.id ?? product?.product_id;
    for (const variant of product?.variants || product?.product_variants || product?.product_varients || []) {
      if (variant?.id !== undefined && variant?.id !== null && parentProductId !== undefined && parentProductId !== null) {
        productIdByVariant.set(String(variant.id), String(parentProductId));
      }
    }
  }
  for (const variant of flatVariantsFromResponse(flatVariantsPayload)) {
    const variantId = variant?.id ?? variant?.product_variant_id ?? variant?.variant_id;
    const productId = variant?.product_id ?? variant?.productId;
    if (variantId !== undefined && variantId !== null && productId !== undefined && productId !== null) {
      productIdByVariant.set(String(variantId), String(productId));
    }
  }

  const requested = new Map();
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
    if (item.productId !== undefined && item.productId !== null && String(item.productId) !== String(productIdByVariant.get(String(variant.id)))) {
      const error = new Error(`${label} does not belong to the selected Billing product. Refresh your cart before payment.`);
      error.status = 409;
      throw error;
    }
    const availabilityValues = (variantsById.get(String(variant.id)) || [variant])
      .map(stockValue)
      .filter(value => value !== null);
    const dedicatedStockRows = stockRowsByVariant.get(String(variant.id)) || [];
    if (stocksPayload !== null && !dedicatedStockRows.length) {
      issues.push({ variantId: variant.id, label, requested: item.quantity, available: 0, reason: 'Variant is missing from Billing /stocks.' });
      continue;
    }
    for (const stockRow of dedicatedStockRows) {
      const stock = stockValue(stockRow);
      if (stock === null) {
        const error = new Error(`Billing /stocks returned an unusable stock quantity for ${label}. Payment was not started.`);
        error.status = 503;
        throw error;
      }
      availabilityValues.push(stock);
    }
    const available = availabilityValues.length ? Math.min(...availabilityValues) : null;
    if (available === null) {
      const error = new Error(`Billing did not return a usable stock quantity for ${label}. Payment was not started.`);
      error.status = 503;
      throw error;
    }
    if (available < item.quantity) {
      issues.push({ variantId: variant.id, label, requested: item.quantity, available, reason: 'Insufficient stock.' });
    }
  }

  if (issues.length) {
    const error = new Error(issues.map(issue => `${issue.label}: ${issue.available} available, ${issue.requested} requested.`).join(' '));
    error.status = 409;
    error.stockIssues = issues;
    throw error;
  }

  // Recheck each cart product through Billing's single-product endpoint too.
  // The list response can lag or expose a different stock snapshot; checkout
  // proceeds only when both Billing reads show enough units for the same IDs.
  const detailedProducts = new Map();
  for (const item of requested.values()) {
    if (item.productId === undefined || item.productId === null || String(item.productId).trim() === '') {
      const error = new Error(`Billing could not map variant ${item.variantId} to its product, so detailed stock could not be verified. Payment was not started.`);
      error.status = 503;
      throw error;
    }
    const productId = String(item.productId).trim();
    if (detailedProducts.has(productId)) continue;
    let detailPayload;
    try {
      detailPayload = await getProductDetails(productId);
      orderFlowLog.logRequest('Billing product stock detail', 'GET', `${getBaseUrl()}/product_details/${encodeURIComponent(productId)}`, { requested_variant_ids: [...requested.values()].filter(item => String(item.productId) === productId).map(item => item.variantId) });
      orderFlowLog.logResponse(`Billing product stock detail /product_details/${productId}`, 200, requestedVariantSnapshot(detailPayload, [...requested.values()].filter(item => String(item.productId) === productId)));
    } catch (cause) {
      orderFlowLog.logRequest('Billing product stock detail', 'GET', `${getBaseUrl()}/product_details/${encodeURIComponent(productId)}`, { requested_variant_ids: [...requested.values()].filter(item => String(item.productId) === productId).map(item => item.variantId) });
      orderFlowLog.logFailure(`Billing product stock detail /product_details/${productId}`, cause);
      const error = new Error(cause.response?.status
        ? `Billing product detail check failed for product ${productId} (HTTP ${cause.response.status}). Please try again.`
        : `Could not reach Billing to verify product ${productId} stock. Please try again before payment.`);
      error.status = 503;
      error.cause = cause;
      throw error;
    }
    const detailedProduct = productDetailsFromResponse(detailPayload);
    const detailVariants = detailedProduct?.variants || detailedProduct?.product_variants || detailedProduct?.product_varients || [];
    if (!Array.isArray(detailVariants) || detailVariants.length === 0) {
      const error = new Error(`Billing returned no variants for product ${productId}; stock could not be verified. Payment was not started.`);
      error.status = 503;
      throw error;
    }
    detailedProducts.set(productId, new Map(detailVariants.map(variant => [String(variant.id), variant])));
  }

  for (const item of requested.values()) {
    const detailedVariant = detailedProducts.get(String(item.productId).trim())?.get(String(item.variantId));
    const listVariant = byId.get(String(item.variantId));
    const label = listVariant?.variant_code || listVariant?.sku || `variant ${item.variantId}`;
    if (!detailedVariant) {
      const error = new Error(`${label} is not listed under Billing product ${item.productId}. Refresh the cart before payment.`);
      error.status = 409;
      throw error;
    }
    const detailedStock = stockValue(detailedVariant);
    if (detailedStock === null) {
      const error = new Error(`Billing product details did not return a usable stock quantity for ${label}. Payment was not started.`);
      error.status = 503;
      throw error;
    }
    if (detailedStock < item.quantity) {
      issues.push({ variantId: item.variantId, label, requested: item.quantity, available: detailedStock, reason: 'Insufficient stock in Billing product details.' });
    }
  }

  if (issues.length) {
    const error = new Error(issues.map(issue => `${issue.label}: ${issue.available} available, ${issue.requested} requested.`).join(' '));
    error.status = 409;
    error.stockIssues = issues;
    throw error;
  }

  const result = { checkedAt: new Date().toISOString(), variantsChecked: requested.size, stockSourcesChecked: ['product_varients', 'products', 'varients', ...(stocksPayload ? ['stocks'] : [])], items: [...requested.values()].map(item => ({ product_id: item.productId ?? null, product_variant_id: item.variantId ?? null, variant_code: item.variantCode || null, quantity_requested: item.quantity, quantity_available: stockValue(byId.get(String(item.variantId))) })) };
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
    return Array.isArray(children) ? [...children.map(child => ({ ...child, product_id: child.product_id ?? record.id ?? record.product_id })), record] : [record];
  });
  const matched = rows.filter(row => {
    const id = row?.product_variant_id ?? row?.product_varient_id ?? row?.variant_id ?? row?.id;
    return id !== undefined && requestedIds.has(String(id));
  });
  return { status: payload?.status ?? null, message: payload?.message ?? null, requested_variant_ids: [...requestedIds], matched_variants: matched };
}

async function refreshLocalStockFromBilling(billingVariantIds) {
  const ids = [...new Set((billingVariantIds || []).map(value => String(value || '').trim()).filter(Boolean))];
  if (!ids.length) return { updatedVariants: 0, updatedProducts: 0 };
  const payload = await getProductVariants();
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

module.exports = { getProductVariants, getProducts, getVariants, getStocks, getProductDetails, productsFromResponse, variantsFromResponse, flatVariantsFromResponse, stocksFromResponse, productDetailsFromResponse, stockValue, assertBillingStock, refreshLocalStockFromBilling };
