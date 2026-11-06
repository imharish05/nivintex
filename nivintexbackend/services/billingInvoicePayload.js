'use strict';

function normalizeStockLocationId(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error('BILLING_STOCK_LOCATION_ID must be blank for Central Admin or a valid positive Billing franchise ID.');
    error.status = 503;
    error.code = 'BILLING_STOCK_LOCATION_CONFIG_INVALID';
    throw error;
  }
  return id;
}

function configuredStockLocationId() {
  const value = String(process.env.BILLING_STOCK_LOCATION_ID ?? '').trim();
  return normalizeStockLocationId(value); // Billing's Central Admin location is represented by NULL.
}

function makeBillingCreatePayload(snapshot) {
  const combinedItems = new Map();
  let itemDiscountTotal = 0;
  for (const item of Array.isArray(snapshot.items) ? snapshot.items : []) {
    const rawId = item?.product_variant_id;
    const variantId = Number(rawId);
    if (rawId === undefined || rawId === null || String(rawId).trim() === '' || !Number.isSafeInteger(variantId) || variantId < 1) {
      throw new Error('A purchased item has no valid Billing product variant ID. Map every order variant to Billing before invoice creation.');
    }
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Billing quantity is invalid for product variant ${variantId}.`);
    }
    const discount = Number(item.discount_amount ?? 0);
    if (!Number.isFinite(discount) || discount < 0) {
      throw new Error(`Billing discount is invalid for product variant ${variantId}.`);
    }
    itemDiscountTotal += discount;
    const rawGstPercent = Number(item.gst_percent ?? (snapshot.has_gst === false ? 0 : 5));
    if (!Number.isFinite(rawGstPercent) || ![0, 5].includes(rawGstPercent)) {
      throw new Error(`Billing GST rate is invalid for product variant ${variantId}.`);
    }
    const current = combinedItems.get(variantId) || {
      product_variant_id: variantId,
      quantity: 0,
      discount_amount: 0,
      gst_percent: rawGstPercent,
      includeGstPercent: item.gst_percent !== undefined && item.gst_percent !== null,
    };
    if (current.gst_percent !== rawGstPercent) {
      throw new Error(`Conflicting GST settings were submitted for product variant ${variantId}.`);
    }
    current.includeGstPercent = current.includeGstPercent || (item.gst_percent !== undefined && item.gst_percent !== null);
    current.quantity += quantity;
    current.discount_amount += discount;
    combinedItems.set(variantId, current);
  }
  const combined = [...combinedItems.values()];
  const hasGst = combined.some(item => item.gst_percent > 0);
  const items = combined.map(({ includeGstPercent, ...item }) => {
    item.discount_amount = 0;
    if (!includeGstPercent) delete item.gst_percent;
    return item;
  });
  if (!items.length) throw new Error('Billing invoice needs at least one purchased variant.');

  const rawLocationId = snapshot.franchise_location_id;
  const locationId = rawLocationId === undefined || rawLocationId === ''
    ? configuredStockLocationId() : normalizeStockLocationId(rawLocationId);
  const snapshotBillDiscount = Number(snapshot.bill_discount_amount) || 0;
  if (!Number.isFinite(snapshotBillDiscount) || snapshotBillDiscount < 0) {
    throw new Error('Billing bill-level discount is invalid.');
  }

  return {
    franchise_location_id: locationId === null ? null : Number(locationId),
    customer_name: String(snapshot.customer_name || ''),
    customer_phone: String(snapshot.customer_phone || ''),
    customer_email: String(snapshot.customer_email || ''),
    source: 'Website',
    entry_mode: 'Manual',
    price_type: 'Franchise',
    payment_mode: 'Online',
    has_gst: hasGst,
    billing_address: String(snapshot.billing_address || ''),
    shipping_address: String(snapshot.shipping_address || ''),
    bill_discount_amount: Number((snapshotBillDiscount + itemDiscountTotal).toFixed(2)),
    paid_amount: Number(snapshot.paid_amount) || 0,
    items,
  };
}

module.exports = { makeBillingCreatePayload, configuredStockLocationId, normalizeStockLocationId };
