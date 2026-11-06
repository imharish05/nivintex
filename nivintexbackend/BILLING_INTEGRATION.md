# Billing API integration

The admin panel's **Sync billing data now** action calls `POST /api/sync/billing` on the ecommerce backend and requires its admin JWT. Billing API credentials stay in `nivintexbackend/.env`; the browser never receives `BILLING_API_TOKEN`.

The live Billing API was read on 2026-10-21. `BILLING_API_BASE_URL` must be `https://nivintex.saitechnosolutions.co.in/api` for the current test account. The sync uses the following endpoints:

| Billing endpoint | Live response shape | Purpose |
| --- | --- | --- |
| `GET /products` | `{ status, products, meta }`; 15 products per page, 104 total, 7 pages | Base product names, codes, descriptions, category/subcategory, prices, and paging. The sync fetches all pages; Billing image fields are ignored. |
| `GET /product_varients` | `{ status, product_varients }`; 104 product records, each with nested `variants` | Billing product/variant IDs, SKUs, codes, size/color, and prices. Billing image fields are ignored by the storefront sync. `total_stock` is aggregate, not a location stock quantity. |
| `GET /product_details/:id` | `{ status, product }` | Per-product detail enrichment, including nested variants. A full admin sync reads each product sequentially and merges it by Billing product ID. Billing image fields are ignored. |
| `GET /stocks` | `{ status, stocks }`; live rows shaped like `{ id, variant_code, display_name, size, color, barcode, product, quantity, in_stock }` | Current website/Central Admin stock view. The row `id` maps to the Billing variant ID after the SKU/code is checked against `/product_varients`. This response does not contain a location ID; it must remain the stock view for the same Central Admin/null location used by invoice creation. |

Full sync fetches product pages, product variants and stock rows, then fetches product details one at a time with `BILLING_API_PRODUCT_DETAILS_DELAY_MS` (default 250 ms) between detail requests. A post-invoice catalog refresh skips per-product details and refreshes products, variants, and stock only. All requests go through the shared Billing request manager; only GETs can be retried after a 429.

## Field mapping into Nivintex

| Billing source field | Nivintex database field | Notes |
| --- | --- | --- |
| `products[].id`, `product_varients[].id`, `product_details.product.id` | `Product.billing_product_id` | Stable external key; matched across all three responses. Local `Product.id` remains independent. |
| `name`, `product_code`, `hsn_code`, `barcode`, `description`, `status` | `Product.name`, `product_code`, `hsn_code`, `barcode`, `shortDescription`, `longDescription`, `status` | Description populates both descriptions until Billing exposes separate short/long fields. |
| `category.id`, `subcategory.id` | `Product.billingCategoryId` via Category; `Product.billing_subcategory_id`; local category/subcategory foreign keys | Billing IDs are resolved to local IDs; external IDs are retained separately. |
| `prices.franchise` or `franchise_price_final` | `Product.franchise_price_final`, `Product.retail_price_final` (`salesPrice`) | Current storefront selling price. Variant franchise price overrides the product price. |
| `prices.mrp`; if zero/missing, `prices.retail` | `Product.mrp_price` | The API reports MRP as zero on several products; retail is used as the display compare price fallback. |
| Admin GST checkbox | `Product.mrp_gst_type` | Storefront-owned value, default `With GST`. Checked products add 5% GST to the listed storefront price. Unchecked products use `Without GST`; Billing catalog refresh preserves this setting. |
| Admin product image upload | `Product.main_image` | Only Admin-uploaded `uploads/prod-*` paths are retained. Billing `main_image` and other image fields are ignored. If no Admin upload exists, the storefront shows the Fashion Aura logo. |
| Admin gallery image upload | `ProductImages.url`, `sortOrder` | Only Admin-uploaded `uploads/gal-*` paths are retained. Billing gallery fields are ignored. |
| `variants[].id` | `ProductVariant.billing_variant_id` | Stable external variant key, matched to product by nested parent relationship. |
| `variant_code`, `sku`, `size`, `color`, `fabric`, `weight`, `volume`, `nos`, `variant_name`, `barcode`, `hsn_code`, `width` | `ProductVariant.variant_code`, `sku`, attributes, `billing_data` | `billing_data` retains additional Billing-only variant metadata. |
| Variant `prices.mrp`, `prices.retail`, `prices.wholesale`, `prices.franchise` and direct price fields | `ProductVariant.mrp`, retail/wholesale fields, `franchise_price_final`, `salesPrice` | Variant price values override product prices when supplied. |
| Admin variant image upload | `ProductVariant.image`, `ProductVariant.images` | Only Admin-uploaded `uploads/prod-*` paths are retained. Billing variant image fields are ignored; absent an Admin image, the product/Admin gallery or Fashion Aura logo is shown. |
| `/stocks[].variant_code` (or `sku`), `quantity`, `in_stock` | `ProductVariant.stock`; `Product.stock` (sum of its variants) | Live `/stocks` rows do not include `franchise_location_id`. Sync matches by exact variant code/SKU; preflight may also use the row ID only after validating its code against the catalog. `in_stock: false` becomes zero. Aggregate `total_stock` is only a local display fallback if no `/stocks` row exists, never for pre-payment validation or post-invoice refresh. |

Missing Billing products/variants are deactivated locally rather than deleted, preserving order references and locally uploaded photos. A failed GET or invalid required catalog collection aborts the transaction so the existing DB catalog is not partially replaced.

## Checkout and invoice flow

1. Before creating a Razorpay order, the backend reads `/product_varients` and `/stocks` fresh, matches each cart item's Billing variant ID and SKU/code, combines duplicate variant quantities, and verifies requested quantity against `/stocks[].quantity`. If a stock row says `in_stock: false`, available quantity is zero. Missing variant rows or insufficient quantity stop checkout before Razorpay is created.
2. For the current website flow, `/stocks` is treated as Central Admin stock because its live response has no location column. `BILLING_STOCK_LOCATION_ID` should remain blank so invoice creation uses `franchise_location_id: null`. Do not use an unscoped `/stocks` response with a non-null franchise location. For franchise fulfillment, Billing must expose location-filtered stock rows and the same location must be sent in the invoice.
3. After successful payment, Nivintex verifies the Razorpay signature and order amount/currency, saves the local paid order, then posts `POST /billings` using the backend Billing base URL and optional bearer token.
4. The invoice payload includes `franchise_location_id`, customer name/phone/email, billing and shipping addresses, `source: "Website"`, `entry_mode: "Manual"`, `price_type: "Franchise"`, `payment_mode: "Online"`, `has_gst: true`, `bill_discount_amount`, `paid_amount`, and `items`. Each item contains `product_variant_id`, `quantity`, and `discount_amount`. Billing creates the invoice and decrements its own inventory atomically. Nivintex does not separately post `/stocks/decrement`, which would subtract the stock twice.
5. Successful invoice response data is stored on the order and invoice sync becomes `synced`; Nivintex refreshes the local stock cache from fresh `/product_varients` and `/stocks` responses, using exact SKU/code matches. If fresh location stock cannot be verified, the invoice remains accepted but the local stock refresh is marked failed for follow-up. An explicit rejection is recorded as failed. A timeout or server error is treated as an unknown outcome and must be reconciled with Billing before retrying, to avoid duplicate invoices.

`BILLING_API_TOKEN` is sent as `Authorization: Bearer ...` on reads and invoice creation when configured. Never put it in `nivintexfrontend/.env` or `nivintexadmin/.env`.

## Live sample: Billing product 2

`GET /product_varients` and `GET /product_details/2` both identify Billing product `2`, `CRD-2026-07-002`, “HANDBLOCK CO ORDS”. It has Billing variants `4`, `5`, and `6` (L, M, XL). `GET /stocks` returns those variant codes and quantity `2` each; the product-level aggregate is `total_stock: 6`. The local DB stores product ID `2` only in `billing_product_id`; its local primary key may be different. The variant IDs are stored the same way in `billing_variant_id`.
