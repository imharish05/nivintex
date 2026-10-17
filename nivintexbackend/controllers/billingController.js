const billingCatalog = require('../services/billingCatalogService');

const logBillingFailure = (endpoint, error) => {
  const reason = error.code === 'ECONNABORTED'
    ? `request timed out after ${error.config?.timeout || 'unknown'} ms`
    : error.response?.status
      ? `HTTP ${error.response.status}`
      : error.code || error.message || 'upstream error';
  console.error(`Billing ${endpoint} proxy failed: ${reason}`);
};

const upstreamStatus = error => Number(error.response?.status || error.status) || null;
const retryAfterSeconds = error => {
  if (error.retryAfterMs != null) return Math.ceil(error.retryAfterMs / 1000);
  const header = error.response?.headers?.['retry-after'];
  if (header == null) return null;
  const numeric = Number(header);
  if (Number.isFinite(numeric)) return Math.max(0, numeric);
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : null;
};

const sendReadError = (res, error, message) => {
  const status = upstreamStatus(error);
  const retry = retryAfterSeconds(error);
  if (retry) res.set('Retry-After', String(retry));
  return res.status(status === 404 ? 404 : status === 429 ? 503 : 502).json({
    success: false,
    code: status === 429 ? 'BILLING_RATE_LIMITED' : 'BILLING_READ_FAILED',
    message,
    ...(retry ? { retryAfterSeconds: retry } : {}),
  });
};

exports.getCategories = async (_req, res) => {
  try {
    const data = await billingCatalog.getEndpoint('/category');
    const baseUrl = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
    const assetBase = (process.env.BILLING_ASSET_BASE_URL || baseUrl.replace(/\/api$/i, '')).replace(/\/+$/, '');
    if (Array.isArray(data?.category)) {
      data.category = data.category.map(cat => {
        if (cat.image && !/^https?:\/\//i.test(cat.image)) {
          return { ...cat, image: `${assetBase}/${String(cat.image).replace(/^\/+/, '')}` };
        }
        return cat;
      });
    }
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure('category', error);
    return sendReadError(res, error, error.code === 'ECONNABORTED'
      ? 'The billing system did not respond in time. Try again shortly.'
      : 'Could not load categories from the billing system.');
  }
};

exports.getSubcategories = async (_req, res) => {
  try {
    return res.status(200).json(await billingCatalog.getEndpoint('/subcategory'));
  } catch (error) {
    logBillingFailure('subcategory', error);
    return sendReadError(res, error, error.code === 'ECONNABORTED'
      ? 'The billing system did not respond in time. Try again shortly.'
      : 'Could not load subcategories from the billing system.');
  }
};

exports.getProductVariants = async (_req, res) => {
  try {
    const data = await billingCatalog.getProductVariants();
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure('product_varients', error);
    return sendReadError(res, error, upstreamStatus(error)
      ? `Could not load Billing product variants (HTTP ${upstreamStatus(error)}).`
      : 'Could not reach Billing to load product variants.');
  }
};

exports.getProducts = async (_req, res) => {
  try {
    const data = await billingCatalog.getProducts();
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure('products', error);
    return sendReadError(res, error, upstreamStatus(error)
      ? `Could not load Billing products (HTTP ${upstreamStatus(error)}).`
      : 'Could not reach Billing to load product prices.');
  }
};

exports.getStocks = async (_req, res) => {
  try {
    const data = await billingCatalog.getStocks();
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure('stocks', error);
    return sendReadError(res, error, upstreamStatus(error) === 404
      ? 'Billing does not expose a stock list endpoint for this account.'
      : 'Could not reach Billing to load stock quantities.');
  }
};

exports.getProductDetails = async (req, res) => {
  const productId = String(req.params.id || '').trim();
  if (!/^\d+$/.test(productId)) return res.status(400).json({ success: false, message: 'A valid Billing product ID is required.' });
  try {
    const data = await billingCatalog.getProductDetails(productId);
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure(`product_details/${productId}`, error);
    return sendReadError(res, error, upstreamStatus(error) === 404
      ? 'This product is no longer available in Billing.'
      : 'Could not reach Billing to load this product.');
  }
};
