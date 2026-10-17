'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { assertBillingStock } = require('../services/billingCatalogService');

test('checkout refuses aggregate total_stock because it cannot prove sellable stock at the invoice location', async () => {
  const originalGet = axios.get;
  let calls = 0;
  axios.get = async url => {
    calls += 1;
    assert.match(url, /\/product_varients$/);
    return {
      status: 200,
      data: {
        status: 200,
        product_varients: [{ id: 77, name: 'Catalog item', total_stock: 5, variants: [{ id: 101, total_stock: 5, in_stock: true }] }],
      },
    };
  };
  try {
    await assert.rejects(
      assertBillingStock([{ product_id: 77, product_variant_id: 101, quantity: 1 }]),
      error => error.status === 503 && error.code === 'BILLING_LOCATION_STOCK_UNAVAILABLE'
        && /aggregate product stock/.test(error.message),
    );
    assert.equal(calls, 1);
  } finally {
    axios.get = originalGet;
  }
});

test('checkout accepts only the exact Billing stock row for the selected location', async () => {
  const originalGet = axios.get;
  axios.get = async () => ({
    status: 200,
    data: {
      status: 200,
      product_varients: [{ id: 77, variants: [{ id: 101, total_stock: 9 }] }],
      stocks: [{ product_variant_id: 101, franchise_location_id: null, quantity: 2 }],
    },
  });
  try {
    const result = await assertBillingStock([{ product_id: 77, product_variant_id: 101, quantity: 2 }]);
    assert.equal(result.stockLocationId, null);
    assert.equal(result.items[0].quantity_available, 2);
    await assert.rejects(
      assertBillingStock([{ product_id: 77, product_variant_id: 101, quantity: 3 }]),
      error => error.status === 409 && /2 available, 3 requested/.test(error.message),
    );
  } finally {
    axios.get = originalGet;
  }
});
