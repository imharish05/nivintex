'use strict';

const requiredUrl = key => {
  const value = String(process.env[key] || '').trim();
  if (!value) throw new Error(`${key} must be configured.`);
  return value.replace(/\/+$/, '');
};

const billingApiBaseUrl = () => requiredUrl('BILLING_API_BASE_URL');
const billingAssetBaseUrl = () => {
  const configured = String(process.env.BILLING_ASSET_BASE_URL || '').trim();
  return (configured || billingApiBaseUrl().replace(/\/api$/i, '')).replace(/\/+$/, '');
};

module.exports = {
  billingApiBaseUrl,
  billingAssetBaseUrl,
  shiprocketApiBaseUrl: () => requiredUrl('SHIPROCKET_API_BASE_URL'),
};
