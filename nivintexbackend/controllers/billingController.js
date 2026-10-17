const axios = require('axios');
const billingCatalog = require('../services/billingCatalogService');

const getBillingRequestOptions = () => {
  const configuredTimeout = Number(process.env.BILLING_API_TIMEOUT_MS);
  return {
    headers: {
      Accept: 'application/json',
      ...(process.env.BILLING_API_TOKEN
        ? { Authorization: `Bearer ${process.env.BILLING_API_TOKEN}` }
        : {}),
    },
    timeout: Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 30000,
  };
};

const logBillingFailure = (endpoint, error) => {
  const reason = error.code === 'ECONNABORTED'
    ? `request timed out after ${error.config?.timeout || 'unknown'} ms`
    : error.response?.status
      ? `HTTP ${error.response.status}`
      : error.code || error.message || 'upstream error';
  console.error(`Billing ${endpoint} proxy failed: ${reason}`);
};

exports.getCategories = async (_req, res) => {
  const baseUrl = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
  try {
    const response = await axios.get(`${baseUrl}/category`, getBillingRequestOptions());
    const data = response.data;
    const assetBase = (process.env.BILLING_ASSET_BASE_URL || baseUrl.replace(/\/api$/i, '')).replace(/\/+$/, '');
    if (Array.isArray(data?.category)) {
      data.category = data.category.map(cat => {
        if (cat.image && !/^https?:\/\//i.test(cat.image)) {
          return { ...cat, image: `${assetBase}/${String(cat.image).replace(/^\/+/, '')}` };
        }
        return cat;
      });
    }
    return res.status(response.status).json(data);
  } catch (error) {
    logBillingFailure('category', error);
    return res.status(502).json({
      success: false,
      message: error.code === 'ECONNABORTED'
        ? 'The billing system did not respond in time. Check its availability and BILLING_API_BASE_URL.'
        : 'Could not load categories from the billing system.',
    });
  }
};

exports.getSubcategories = async (_req, res) => {
  const baseUrl = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
  try {
    const response = await axios.get(`${baseUrl}/subcategory`, getBillingRequestOptions());
    return res.status(response.status).json(response.data);
  } catch (error) {
    logBillingFailure('subcategory', error);
    return res.status(502).json({
      success: false,
      message: error.code === 'ECONNABORTED'
        ? 'The billing system did not respond in time. Check its availability and BILLING_API_BASE_URL.'
        : 'Could not load subcategories from the billing system.',
    });
  }
};

exports.getProductVariants = async (_req, res) => {
  try {
    const data = await billingCatalog.getProductVariants();
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure('product_varients', error);
    return res.status(502).json({ success: false, message: error.response?.status
      ? `Could not load Billing product variants (HTTP ${error.response.status}).`
      : 'Could not reach Billing to load product variants.' });
  }
};

exports.getProducts = async (_req, res) => {
  try {
    const data = await billingCatalog.getProducts();
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure('products', error);
    return res.status(error.response?.status || 502).json({ success: false, message: error.response?.status
      ? `Could not load Billing products (HTTP ${error.response.status}).`
      : 'Could not reach Billing to load product prices.' });
  }
};

exports.getStocks = async (_req, res) => {
  try {
    const data = await billingCatalog.getStocks();
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  } catch (error) {
    logBillingFailure('stocks', error);
    return res.status(error.response?.status === 404 ? 404 : 502).json({
      success: false,
      message: error.response?.status === 404
        ? 'Billing does not expose a stock list endpoint for this account.'
        : 'Could not reach Billing to load stock quantities.',
    });
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
    return res.status(error.response?.status === 404 ? 404 : 502).json({ success: false, message: error.response?.status === 404
      ? 'This product is no longer available in Billing.'
      : 'Could not reach Billing to load this product.' });
  }
};
