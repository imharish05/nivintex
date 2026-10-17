require('dotenv').config();

const axios = require('axios');
const { billingApiBaseUrl } = require('../config/serviceUrls');

const baseUrl = billingApiBaseUrl();
const configuredTimeout = Number(process.env.BILLING_API_TIMEOUT_MS);
const timeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 10000;
const headers = { Accept: 'application/json' };

if (process.env.BILLING_API_TOKEN) {
  headers.Authorization = `Bearer ${process.env.BILLING_API_TOKEN}`;
}

axios.get(`${baseUrl}/category`, { headers, timeout })
  .then(({ status }) => {
    console.log(`Billing categories reachable (HTTP ${status}).`);
  })
  .catch((error) => {
    console.error(`Billing category request failed: ${error.code || error.message}`);
    process.exitCode = 1;
  });
