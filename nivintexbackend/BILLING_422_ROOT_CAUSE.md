# Billing stock and 422 investigation

## Earlier 422 cases

Paid orders 18 and 19 were submitted to Billing with variant `451` (`RDY-SALWAR-2026-10-027-L-STANDARD`) and quantity `1`. The catalog response showed aggregate `total_stock: 1`, but the older preflight did not read Billing `/stocks`. Billing's invoice handler checks the selected `franchise_location_id` and variant row inside its transaction, so aggregate catalog stock could not explain or guarantee invoice acceptance. Those already-paid orders must be checked against Billing before retrying; an ambiguous/paid invoice must never be posted again without reconciliation.

## Current live API evidence

Read-only GETs to the configured Billing API on 2026-10-21 returned:

- `/products`: `{ status, products, meta }`, paginated at 15 products per page, 104 products total.
- `/product_varients`: `{ status, product_varients }`, with 104 product records and nested variants. Catalog `total_stock` remains aggregate.
- `/product_details/2`: `{ status, product }`, with the individual product and nested variants.
- `/stocks`: `{ status, stocks }`, 451 rows shaped like `{ id, variant_code, display_name, size, color, barcode, product, quantity, in_stock }`. These rows omit `franchise_location_id`.

For Billing product `2` (`CRD-2026-07-002`), `/product_varients` and `/product_details/2` identify variants `4`, `5`, and `6`. `/stocks` reports quantities `2` for each matching variant code. For variant `1` (`CRD-2026-07-001-L-STANDARD`), the live stock row reported quantity `0` and `in_stock: false`, despite the catalog variant reporting aggregate `total_stock: 1`. That difference demonstrates why `/stocks` is the pre-payment source and catalog totals cannot authorize payment.

The current `/stocks` response is treated as the website's Central Admin view because it is the direct stock resource supplied for checkout and matches the null-location invoice configuration. If Billing changes that endpoint to return a different location or global total, Billing must expose a location-filtered response before the website can safely support another invoice location. Do not set `BILLING_STOCK_LOCATION_ID` to a franchise while using unscoped `/stocks` rows.

## Safeguards and order flow

- Before Razorpay order creation, Nivintex fetches fresh `/product_varients` and `/stocks`, matches the Billing variant ID and exact `variant_code`/SKU, and compares requested quantity with `/stocks[].quantity`. `in_stock: false` is zero. Missing stock or insufficient quantity stops payment before Razorpay starts.
- After payment, Nivintex verifies the Razorpay signature and order amount/currency, stores the paid order idempotently, then posts the invoice to `{BILLING_API_BASE_URL}/billings`. The request includes the configured location (null for Central Admin), customer fields, payment/source/price mode, amount, and each Billing variant ID and quantity.
- Billing owns invoice creation and its stock decrement in one transaction. Nivintex does not call `/stocks/decrement` after Billing accepts the invoice.
- The invoice response and request are stored on the local order. A successful invoice triggers local product/variant/stock refresh. Rejected and unknown invoice outcomes stay attached to the order for reconciliation; do not replay an ambiguous POST until Billing has been checked.

The field mapping and image synchronization are documented in [BILLING_INTEGRATION.md](./BILLING_INTEGRATION.md).
