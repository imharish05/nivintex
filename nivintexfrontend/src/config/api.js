const trimBase = value => String(value || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = trimBase(process.env.REACT_APP_API_URL);
export const BILLING_API_BASE_URL = trimBase(process.env.REACT_APP_API_FROM_BILLING_URL);
export const BILLING_ASSET_BASE_URL = BILLING_API_BASE_URL.replace(/\/api$/i, '');
