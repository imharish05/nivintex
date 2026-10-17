const axios = require('axios');
const orderFlowLog = require('../utils/orderFlowLogger');

const API_BASE = 'https://apiv2.shiprocket.in/v1/external';
let cachedToken = null;
let tokenExpiresAt = 0;
let authenticationBlocked = false;

function blockedAuthenticationError() {
  const error = new Error('Shiprocket API User is temporarily blocked after failed login attempts.');
  error.status = 429;
  error.shiprocketStage = 'API User authentication';
  return error;
}

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  if (authenticationBlocked) throw blockedAuthenticationError();

  const email = process.env.SHIPROCKET_API_EMAIL || process.env.Shiprocket_Mail;
  const password = process.env.SHIPROCKET_API_PASSWORD || process.env.shiproct_API_Key;
  if (!email || !password) {
    throw new Error('Shiprocket credentials are missing from the backend environment.');
  }

  if (password.split('.').length === 3) {
    cachedToken = password;
    tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return cachedToken;
  }

  let data;
  try {
    const url = `${API_BASE}/auth/login`;
    const requestBody = { email, password };
    orderFlowLog.logRequest('Shiprocket authentication', 'POST', url, requestBody);
    const response = await axios.post(url, requestBody, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    data = response.data;
    orderFlowLog.logResponse('Shiprocket authentication', response.status, data);
  } catch (error) {
    orderFlowLog.logFailure('Shiprocket authentication', error);
    error.shiprocketStage = 'API User authentication';
    const message = error.response?.data?.message;
    if (error.response?.status === 400 && typeof message === 'string' && /blocked.*too many failed login attempts/i.test(message)) {
      authenticationBlocked = true;
      throw blockedAuthenticationError();
    }
    throw error;
  }
  if (!data?.token) throw new Error('Shiprocket authentication did not return a token.');

  cachedToken = data.token;
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

async function getAvailableCouriers({ deliveryPostcode, weightKg = 0.5 }) {
  const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE || '641038';
  const requestedWeight = Number(weightKg);
  const configuredFallbackWeight = Number(process.env.SHIPROCKET_PACKAGE_WEIGHT_KG || 0.5);
  const configuredWeight = Number.isFinite(requestedWeight) && requestedWeight > 0
    ? requestedWeight
    : configuredFallbackWeight;
  const token = await getToken();
  const url = `${API_BASE}/courier/serviceability/`;
  const params = {
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPostcode,
    cod: 0,
    weight: configuredWeight,
  };
  orderFlowLog.logRequest('Shiprocket courier serviceability', 'GET', url, params);
  let response;
  try {
    response = await axios.get(url, {
      timeout: 15000,
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
  } catch (error) {
    orderFlowLog.logFailure('Shiprocket courier serviceability', error);
    throw error;
  }
  const { data } = response;
  orderFlowLog.logResponse('Shiprocket courier serviceability', response.status, {
    status: data?.status,
    message: data?.message,
    available_courier_companies: data?.data?.available_courier_companies,
  });

  const couriers = data?.data?.available_courier_companies || [];
  const availableCouriers = couriers
    .map(courier => {
      const rawRate = courier.rate ?? courier.freight_charge ?? courier.cost;
      return {
        courierName: courier.courier_name,
        courierId: Number(courier.courier_company_id),
        estimatedDeliveryDays: courier.estimated_delivery_days,
        rate: rawRate === undefined || rawRate === null || rawRate === '' ? NaN : Number(rawRate),
        rating: courier.rating ?? null,
        etd: courier.etd ?? null,
      };
    })
    .filter(courier => Number.isInteger(courier.courierId) && courier.courierId > 0 && Number.isFinite(courier.rate) && courier.rate >= 0)
    .sort((a, b) => a.rate - b.rate);

  if (!availableCouriers.length) {
    const error = new Error('Shiprocket has no serviceable courier for this PIN code.');
    error.status = 422;
    throw error;
  }

  return { couriers: availableCouriers, pickupPostcode, weightKg: configuredWeight };
}

async function bookShipment({ order, courierId }) {
  const token = await getToken();
  const shippingAddress = parseAddress(order.shipping_address) || parseAddress(order.billing_address) || {};
  const items = order.OrderItems || [];
  if (!items.length) throw new Error('This order has no items to ship.');
  const pincode = String(shippingAddress.zip || shippingAddress.postcode || '').trim();
  if (!/^\d{6}$/.test(pincode)) throw new Error('Order must have a valid 6-digit shipping PIN code.');
  const invalidPackageItem = items.find(item =>
    !(Number(item.shipping_weight_kg) > 0)
    || !(Number(item.shipping_length_cm) > 0)
    || !(Number(item.shipping_width_cm) > 0)
    || !(Number(item.shipping_height_cm) > 0)
  );
  if (invalidPackageItem) {
    throw new Error(`Packed weight and all three dimensions must be entered in admin for ${invalidPackageItem.name || 'every product'} before Shiprocket booking.`);
  }
  const totalWeight = items.reduce((sum, item) => sum + Number(item.shipping_weight_kg) * Math.max(1, Number(item.quantity) || 1), 0);
  // Shiprocket accepts one parcel. For multiple units, use admin dimensions as
  // the unit package and stack quantity on height; weight scales by quantity.
  const packageLength = Math.max(...items.map(item => Number(item.shipping_length_cm)));
  const packageWidth = Math.max(...items.map(item => Number(item.shipping_width_cm)));
  const packageHeight = items.reduce((sum, item) => sum + Number(item.shipping_height_cm) * Math.max(1, Number(item.quantity) || 1), 0);
  const pickupLocation = String(process.env.SHIPROCKET_PICKUP_LOCATION || '').trim();
  if (!pickupLocation) throw new Error('Set SHIPROCKET_PICKUP_LOCATION to the exact pickup name registered in the Shiprocket account.');
  const payload = {
    order_id: String(order.id),
    order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
    pickup_location: pickupLocation,
    channel_id: '',
    billing_customer_name: order.customer_name || shippingAddress.name || 'Customer',
    shipping_customer_name: order.customer_name || shippingAddress.name || 'Customer',
    billing_last_name: '',
    billing_address: shippingAddress.address || shippingAddress.address1 || 'Address not provided',
    billing_address_2: shippingAddress.address2 || '',
    billing_city: shippingAddress.city || '',
    billing_state: shippingAddress.state || '',
    billing_pincode: pincode,
    billing_country: shippingAddress.country || 'India',
    billing_email: order.customer_email || '',
    billing_phone: String(order.customer_phone || shippingAddress.phone || ''),
    shipping_address: shippingAddress.address || shippingAddress.address1 || 'Address not provided',
    shipping_address_2: shippingAddress.address2 || '',
    shipping_city: shippingAddress.city || '',
    shipping_state: shippingAddress.state || '',
    shipping_pincode: pincode,
    shipping_country: shippingAddress.country || 'India',
    shipping_email: order.customer_email || '',
    shipping_phone: String(order.customer_phone || shippingAddress.phone || ''),
    shipping_is_billing: true,
    order_items: items.map(item => ({ name: item.name || 'Item', sku: `ORDER-${order.id}-ITEM-${item.id}`, units: Math.max(1, Number(item.quantity) || 1), selling_price: Number(item.price) || 0 })),
    payment_method: order.payment_status === 'paid' ? 'Prepaid' : 'COD',
    sub_total: Number(order.total) || 0,
    length: packageLength, breadth: packageWidth, height: packageHeight, weight: totalWeight,
  };
  const createUrl = `${API_BASE}/orders/create/adhoc`;
  orderFlowLog.logRequest(`Shiprocket create shipment order-${order.id}`, 'POST', createUrl, payload);
  let createResponse;
  try {
    createResponse = await axios.post(createUrl, payload, {
      timeout: 20000,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    orderFlowLog.logFailure(`Shiprocket create shipment order-${order.id}`, error);
    throw error;
  }
  const created = createResponse.data;
  orderFlowLog.logResponse(`Shiprocket create shipment order-${order.id}`, createResponse.status, created);
  const shipmentId = created?.shipment_id;
  if (!shipmentId) throw new Error('Shiprocket did not return a shipment ID.');
  const awbUrl = `${API_BASE}/courier/assign/awb`;
  const awbPayload = {
    shipment_id: shipmentId,
    courier_id: courierId,
  };
  orderFlowLog.logRequest(`Shiprocket assign AWB order-${order.id}`, 'POST', awbUrl, awbPayload);
  let awbResponse;
  try {
    awbResponse = await axios.post(awbUrl, awbPayload, { timeout: 20000, headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    orderFlowLog.logFailure(`Shiprocket assign AWB order-${order.id}`, error);
    throw error;
  }
  const assigned = awbResponse.data;
  orderFlowLog.logResponse(`Shiprocket assign AWB order-${order.id}`, awbResponse.status, assigned);
  return { shipmentId, awbCode: assigned?.response?.data?.awb_code || assigned?.awb_code || null, courierName: assigned?.response?.data?.courier_name || assigned?.courier_name || null };
}

function parseAddress(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

module.exports = { getAvailableCouriers, bookShipment };
