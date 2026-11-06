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
        && /Central Admin/.test(error.message),
    );
    assert.equal(calls, 2);
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

test('checkout accepts Billing stock_quantity only when variant and location match', async () => {
  const originalGet = axios.get;
  axios.get = async () => ({
    status: 200,
    data: {
      status: 200,
      product_varients: [{ id: 77, variants: [{ id: 101, total_stock: 9 }] }],
      stocks: [
        { product_variant_id: 101, franchise_location_id: 8, stock_quantity: 20 },
        { product_variant_id: 101, franchise_location_id: null, stock_quantity: 1 },
      ],
    },
  });
  try {
    const result = await assertBillingStock(
      [{ product_id: 77, product_variant_id: 101, quantity: 1 }],
      { locationId: null },
    );
    assert.equal(result.items[0].quantity_available, 1);
    await assert.rejects(
      assertBillingStock([{ product_id: 77, product_variant_id: 101, quantity: 2 }], { locationId: null }),
      error => error.status === 409 && /1 available, 2 requested/.test(error.message),
    );
  } finally {
    axios.get = originalGet;
  }
});

test('checkout reads exact location stock from Billing /stocks when catalog has only aggregate totals', async () => {
  const originalGet = axios.get;
  const requestedUrls = [];
  axios.get = async url => {
    requestedUrls.push(url);
    if (url.endsWith('/product_varients')) {
      return { status: 200, data: { status: 200, product_varients: [{ id: 77, variants: [{ id: 101, total_stock: 9 }] }] } };
    }
    assert.ok(url.endsWith('/stocks'));
    return { status: 200, data: { status: 200, stocks: [{ product_variant_id: 101, franchise_location_id: null, quantity: 3 }] } };
  };
  try {
    const result = await assertBillingStock([{ product_id: 77, product_variant_id: 101, quantity: 2 }]);
    assert.deepEqual(result.stockSourcesChecked, ['product_varients', 'stocks']);
    assert.equal(result.items[0].quantity_available, 3);
    assert.deepEqual(requestedUrls.map(url => url.split('/').pop()), ['product_varients', 'stocks']);
  } finally {
    axios.get = originalGet;
  }
});

test('checkout does not use a different location row or aggregate stock as Central Admin stock', async () => {
  const originalGet = axios.get;
  axios.get = async () => ({
    status: 200,
    data: {
      status: 200,
      product_varients: [{ id: 77, variants: [{ id: 101, total_stock: 9, in_stock: true }] }],
      stocks: [{ product_variant_id: 101, franchise_location_id: 8, quantity: 9 }],
    },
  });
  try {
    await assert.rejects(
      assertBillingStock([{ product_id: 77, product_variant_id: 101, quantity: 1 }], { locationId: null }),
      error => error.status === 503 && error.code === 'BILLING_LOCATION_STOCK_UNAVAILABLE',
    );
  } finally {
    axios.get = originalGet;
  }
});
