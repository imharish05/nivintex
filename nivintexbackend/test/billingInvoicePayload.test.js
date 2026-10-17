'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeBillingCreatePayload } = require('../services/billingInvoicePayload');

test('invoice payload preserves the Billing location and combines duplicate exact variant IDs', () => {
  const payload = makeBillingCreatePayload({
    franchise_location_id: null,
    customer_name: 'Sample buyer',
    customer_phone: '9876543210',
    customer_email: 'buyer@example.test',
    paid_amount: 1720,
    bill_discount_amount: 0,
    items: [
      { product_variant_id: '451', quantity: 1, discount_amount: 0 },
      { product_variant_id: 451, quantity: 2, discount_amount: 0 },
    ],
  });
  assert.equal(payload.franchise_location_id, null);
  assert.deepEqual(payload.items, [{ product_variant_id: 451, quantity: 3, discount_amount: 0 }]);
  assert.equal(payload.price_type, 'MRP');
});

test('invoice payload rejects local IDs that are not valid Billing variant IDs and bad quantities', () => {
  assert.throws(() => makeBillingCreatePayload({ items: [{ product_variant_id: 'local-12', quantity: 1 }] }), /valid Billing product variant ID/);
  assert.throws(() => makeBillingCreatePayload({ items: [{ product_variant_id: 451, quantity: 0 }] }), /quantity is invalid/);
});
