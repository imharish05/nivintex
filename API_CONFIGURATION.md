# API endpoint configuration

Configure API origins through environment variables; application source does not contain deployment-specific Billing, Shiprocket, or localhost API hosts.

## Backend

- `BILLING_API_BASE_URL` is required and includes the API prefix, for example `/api`.
- `BILLING_ASSET_BASE_URL` is optional. If omitted, it is derived from `BILLING_API_BASE_URL` by removing the trailing `/api`.
- `SHIPROCKET_API_BASE_URL` is required and includes `/v1/external`.

## Storefront and Admin builds

- `REACT_APP_API_URL` is the Nivintex backend API base URL.
- `REACT_APP_API_FROM_BILLING_URL` is the Billing API base used to resolve Billing hosted assets.

Create React App embeds these values when each app is built. Set them in the corresponding build environment and rebuild after changing them.

Razorpay's Node SDK manages its API host internally; the application logs the SDK operation name instead of embedding the provider URL. Razorpay Checkout.js and static CDN/font/social/map links are browser assets or user facing links, not backend API base URLs.
