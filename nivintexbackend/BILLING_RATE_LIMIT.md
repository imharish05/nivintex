# Billing request controls

All runtime Billing API requests from the backend use `services/billingRequestManager.js`. It applies an in-process concurrency queue, deduplicates identical in-flight GETs, logs a correlation ID and duration, and retries only idempotent GET requests after HTTP 429. POST requests such as `/billings` are queued but never retried automatically.

Checkout stock validation calls one fresh `GET /product_varients` and does not read the display cache. The invoice POST remains the authority for final inventory acceptance and Billing owns the decrement. A stale display snapshot cannot authorize payment.

Defaults are deliberately conservative concurrency and bounded queue settings, not claims about Billing's quota. No requests-per-second limit is configured because Billing's actual quota and scope have not been provided.

| Environment variable | Default | Purpose |
| --- | ---: | --- |
| `BILLING_API_MAX_CONCURRENT_REQUESTS` | `1` | Maximum simultaneous Billing requests per backend process |
| `BILLING_API_MAX_QUEUED_REQUESTS` | `40` | Maximum pending Billing requests before fast rejection |
| `BILLING_API_GET_RETRIES` | `1` | Additional attempts for safe GET requests only; set `0` to disable |
| `BILLING_API_MAX_RETRY_DELAY_MS` | `5000` | Longest wait that an automatic GET retry will perform |
| `BILLING_API_429_COOLDOWN_MS` | `1000` | Fallback cooldown when a 429 omits `Retry-After` |
| `BILLING_API_CATALOG_CACHE_TTL_MS` | `10000` | In-process display catalog snapshot lifetime; checkout bypasses it |
| `BILLING_API_CACHE_MAX_ENTRIES` | `100` | Maximum in-process cached display responses |

When Billing supplies `Retry-After`, the manager parses seconds or an HTTP date. It waits that duration before a retry and skips the retry if that duration exceeds the configured retry wait cap. The cooldown blocks fresh upstream work until its expiry. It does not repeat invoice POSTs.

The queue, in-flight map, cache, and cooldown are process-local. With multiple backend instances, each instance has its own limit. A shared limiter should only be added if deployment topology or Billing's documented quota requires it; Redis is not introduced here.

The billing host's actual rate-limit policy, response headers, and server-side logs are not available in this repository. Configure the concurrency, retry delay, and cooldown from Billing's documented limits when supplied. The exact original 429 cause (per-IP/per-account quota, WAF, or another consumer) cannot be proven from the website response alone.

For the separate 422 aggregate-versus-location stock mismatch, see `BILLING_422_ROOT_CAUSE.md`. `BILLING_STOCK_LOCATION_ID` may be set to an existing Billing franchise ID; leave it unset to target Central Admin (null).
