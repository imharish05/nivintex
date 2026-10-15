# Billing API integration

The admin panel's **Sync billing data now** action calls `POST /api/sync/billing` on the ecommerce backend. It requires the existing admin JWT in an `Authorization: Bearer …` header. In `nivintexadmin/.env`, `REACT_APP_API_URL` must point to the ecommerce backend and include `/api`; the current setting is present and has that shape.

The backend pulls these GET endpoints from the billing API:

- `/category`
- `/subcategory`
- `/products`
- `/product_varients`
- `/varients`
- `/stocks`
- `/franchises`

The external billing API base is configured separately in `nivintexbackend/.env` with `BILLING_API_BASE_URL`; it defaults to the host in the supplied workbook. Billing stock writes require `BILLING_API_TOKEN` with a valid bearer token and stock write permission, even though read endpoints may be public. When this token is unset, the order flow skips the stock request and marks the order `not_configured`. `BILLING_API_TIMEOUT_MS` and `BILLING_ASSET_BASE_URL` are optional. Never put billing credentials in the React app.

## Field mapping

- Categories: billing ID, name, code prefix, image, status.
- Subcategories: `/subcategory` is read directly through the ecommerce backend; billing IDs are kept separately from local subcategory IDs and linked to the matching local category when synced.
- Products: billing ID, category, subcategory, product code, HSN, barcode, name, description, image, status, and `franchise_price_final`. That final franchise amount is used as the website/admin selling price; variants can still use their own final price.
- Variants: billing ID, variant code, SKU, size/color/fabric/weight/volume/nos, retail and wholesale price fields, MRP, status, image.
- Stock: the billing `/stocks` quantity is matched by variant ID and copied to the ecommerce variant. Ecommerce stock is integer-based, so fractional billing quantities are rounded down to avoid overselling. After an order commits, the backend posts `{ "product_variant_id": "<billing variant id>", "quantity": <integer> }` to `/stocks/decrement`. The route accepts POST, but writes require a valid `BILLING_API_TOKEN` with stock write access. If that token is absent, the ecommerce backend skips the remote request and records `not_configured` on the order; if Billing rejects it, the order records `failed` and the response message. Admin order details show that status and error. Set the token in the backend environment and restart the backend; never put billing credentials in the React app.
- Shipping: paid orders retain the customer-selected Shiprocket courier ID/name, quoted rate, estimated delivery, shipping amount charged, booking status, actual booked courier, shipment ID, and AWB on the order. Admin order details show these fields. Historical orders created before these fields were added cannot recover a courier name or quote that was never stored.
- Franchises: billing ID, business/contact details, address, location fields, and status.

Billing IDs are stored in separate nullable columns and are not used as ecommerce primary keys. Repeated syncs update the matching billing record; records missing from a later billing response are left untouched. Billing image paths are converted to absolute URLs on the billing host.

The shared GET responses do not provide per-line GST rate or unit-of-measure fields; those require additional API fields if the billing system must be used for invoice/tax calculations. The Billing create-invoice endpoint and request contract have not been supplied/configured, so paid orders are retained locally with invoice sync pending. Confirm the stock request fields with the Billing API implementation if it expects different names.
