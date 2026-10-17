# Billing 422 investigation

## Evidence

- Local paid orders `18` and `19` both recorded Billing's HTTP 422 for `RDY-SALWAR-2026-10-027-L-STANDARD`.
- Both persisted invoice requests contained Billing variant ID `451`, quantity `1`. The supplied Billing catalog response identifies ID `451` as that exact SKU, so the local-to-Billing variant mapping is correct for these orders.
- The supplied `/product_varients` response reports product `106` with aggregate `total_stock: 4`; variant `451` has `total_stock: 1` and `in_stock: true`. It does not identify a stock location or a location-level quantity.
- Both saved Nivintex payloads omitted `franchise_location_id`; the stored order location was null.
- In the supplied Billing `BillingController::store` source, invoice creation checks `Stock` by both `franchise_location_id` and `product_variant_id`, locks that row, and rejects if the row is absent or its `quantity` is below the requested quantity. This occurs inside a database transaction before `Billing::create` and stock decrement.
- The supplied Billing variant search formatter is not a safe checkout source: for the central (null) location it can report `available_stock = 999999` when the central stock row is zero.

## Finding

The mismatch is aggregate catalog stock versus location-specific invoice stock. The catalog snapshot can show one unit somewhere in Billing while the invoice checks one exact stock row at the selected location. The present Nivintex request implicitly targets Central Admin (null location), and the supplied evidence does not show that Central Admin has a unit. The exact location containing the aggregate unit cannot be identified from the supplied API response. The failed requests therefore do not prove that the variant was sellable at the invoice location.

Billing's transaction source indicates these particular 422 requests fail before invoice creation or inventory decrement. The paid Nivintex orders still need reconciliation against Billing before an operator retries them.

## Nivintex safeguards applied

- Invoice payloads now preserve `franchise_location_id`; `BILLING_STOCK_LOCATION_ID` selects a configured franchise location. Leave it unset for Billing's Central Admin/null location. Set it only to an existing Billing franchise ID whose stock is intended for website fulfillment.
- Repeated lines with the same exact Billing variant ID are combined and invalid IDs or quantities are rejected.
- Checkout no longer treats `total_stock` or `in_stock` as proof of sellable stock. It requires an exact Billing stock row containing `product_variant_id`, `franchise_location_id`, and `quantity` matching the selected location. With the supplied `/product_varients` response, checkout stops before Razorpay payment because that response has only aggregate stock.
- The exact original location and invoice payload are reused when an invoice is retried; checkout and retry continue to require a stock check.

## Billing dependency to finish the flow

The supplied `/product_varients` response does not contain the per-location `Stock` rows needed to pass the same check as `store`. Billing must provide a documented read-only API response for the selected location that exposes the actual `Stock.quantity` for each `product_variant_id`, or update an existing documented endpoint to provide it. The website must use that response for pre-payment validation. Do not use the search formatter's `available_stock` for central checkout because the supplied controller can return its sentinel `999999` when central stock is empty.

Until Billing exposes this authoritative row through a documented route, Nivintex intentionally blocks payment when only aggregate stock is available. No invoice POST or live payment was used to test this fix.
