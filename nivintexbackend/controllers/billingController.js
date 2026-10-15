const axios = require('axios');

exports.getCategories = async (_req, res) => {
  const baseUrl = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
  const headers = { Accept: 'application/json' };

  if (process.env.BILLING_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.BILLING_API_TOKEN}`;
  }

  try {
    const response = await axios.get(`${baseUrl}/category`, {
      headers,
      timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000,
    });
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
    console.error('Billing category proxy failed:', error.response?.status || error.code || 'upstream error');
    return res.status(502).json({
      success: false,
      message: 'Could not load categories from the billing system.',
    });
  }
};

exports.getSubcategories = async (_req, res) => {
  const baseUrl = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
  const headers = { Accept: 'application/json' };
  if (process.env.BILLING_API_TOKEN) headers.Authorization = `Bearer ${process.env.BILLING_API_TOKEN}`;
  try {
    const response = await axios.get(`${baseUrl}/subcategory`, { headers, timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000 });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Billing subcategory proxy failed:', error.response?.status || error.code || 'upstream error');
    return res.status(502).json({ success: false, message: 'Could not load subcategories from the billing system.' });
  }
};
