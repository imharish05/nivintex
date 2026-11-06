const axios = require('axios');
const orderFlowLog = require('../utils/orderFlowLogger');
const { shiprocketApiBaseUrl } = require('../config/serviceUrls');
let cachedToken = null;
let tokenExpiresAt = 0;
let authenticationBlocked = false;

// Internal parcel fallbacks used only in Shiprocket requests. These values are
// deliberately not written back to products or order items.
const DEFAULT_PACKAGE = Object.freeze({ weightKg: 0.5, lengthCm: 30, widthCm: 20, heightCm: 5 });

function getPackageMetrics(items = []) {
  const normalizedItems = items.map(item => {
    const rawWeight = item?.shipping_weight_kg ?? item?.shippingWeightKg ?? item?.weight;
    const rawLength = item?.shipping_length_cm ?? item?.shippingLengthCm ?? item?.length;
    const rawWidth = item?.shipping_width_cm ?? item?.shippingWidthCm ?? item?.width;
    const rawHeight = item?.shipping_height_cm ?? item?.shippingHeightCm ?? item?.height;
    const weightNum = Number(rawWeight);
    const lengthNum = Number(rawLength);
    const widthNum = Number(rawWidth);
    const heightNum = Number(rawHeight);
    return {
      quantity: Math.max(1, Number(item?.quantity || item?.qty) || 1),
      weightKg: Number.isFinite(weightNum) && weightNum > 0 ? weightNum : DEFAULT_PACKAGE.weightKg,
      lengthCm: Number.isFinite(lengthNum) && lengthNum > 0 ? lengthNum : DEFAULT_PACKAGE.lengthCm,
      widthCm: Number.isFinite(widthNum) && widthNum > 0 ? widthNum : DEFAULT_PACKAGE.widthCm,
      heightCm: Number.isFinite(heightNum) && heightNum > 0 ? heightNum : DEFAULT_PACKAGE.heightCm,
    };
  });

  return {
    totalWeight: normalizedItems.reduce((sum, item) => sum + item.weightKg * item.quantity, 0),
    length: normalizedItems.length ? Math.max(...normalizedItems.map(item => item.lengthCm)) : DEFAULT_PACKAGE.lengthCm,
    width: normalizedItems.length ? Math.max(...normalizedItems.map(item => item.widthCm)) : DEFAULT_PACKAGE.widthCm,
    height: normalizedItems.reduce((sum, item) => sum + item.heightCm * item.quantity, 0) || DEFAULT_PACKAGE.heightCm,
  };
}

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
  const url = `${shiprocketApiBaseUrl()}/auth/login`;
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

async function getAvailableCouriers({ deliveryPostcode, weightKg = 0.5, lengthCm = DEFAULT_PACKAGE.lengthCm, widthCm = DEFAULT_PACKAGE.widthCm, heightCm = DEFAULT_PACKAGE.heightCm, declaredValue }) {
  const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE || '641038';
  const requestedWeight = Number(weightKg);
  const configuredFallbackWeight = Number(process.env.SHIPROCKET_PACKAGE_WEIGHT_KG || 0.5);
  const configuredWeight = Number.isFinite(requestedWeight) && requestedWeight > 0
    ? requestedWeight
    : configuredFallbackWeight;
  const packageLength = Number(lengthCm) > 0 ? Number(lengthCm) : DEFAULT_PACKAGE.lengthCm;
  const packageWidth = Number(widthCm) > 0 ? Number(widthCm) : DEFAULT_PACKAGE.widthCm;
  const packageHeight = Number(heightCm) > 0 ? Number(heightCm) : DEFAULT_PACKAGE.heightCm;
  const shipmentDeclaredValue = Number(declaredValue);
  const token = await getToken();
  const url = `${shiprocketApiBaseUrl()}/courier/serviceability/`;
  const params = {
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPostcode,
    cod: 0,
    weight: configuredWeight,
    length: packageLength,
    breadth: packageWidth,
    height: packageHeight,
    ...(Number.isFinite(shipmentDeclaredValue) && shipmentDeclaredValue > 0 ? { declared_value: shipmentDeclaredValue } : {}),
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
      // Shiprocket's panel can include a separate Smart Order fee in `rate`.
      // Customer shipping quotes should use the courier freight amount only.
      const freightCharge = courier.freight_charge === undefined || courier.freight_charge === null || courier.freight_charge === ''
        ? NaN
        : Number(courier.freight_charge);
      const rawRate = Number.isFinite(freightCharge) && freightCharge >= 0
        ? freightCharge
        : (courier.rate ?? courier.cost);
      return {
        courierName: courier.courier_name,
        courierId: Number(courier.courier_company_id),
        estimatedDeliveryDays: courier.estimated_delivery_days,
        rate: rawRate === undefined || rawRate === null || rawRate === '' ? NaN : Number(rawRate),
        freightCharge: Number.isFinite(freightCharge) ? freightCharge : null,
        otherCharges: Number.isFinite(Number(courier.other_charges)) ? Number(courier.other_charges) : null,
        coverageCharges: Number.isFinite(Number(courier.coverage_charges)) ? Number(courier.coverage_charges) : null,
        codCharges: Number.isFinite(Number(courier.cod_charges)) ? Number(courier.cod_charges) : null,
        rtoCharges: Number.isFinite(Number(courier.rto_charges)) ? Number(courier.rto_charges) : null,
        chargeWeight: Number.isFinite(Number(courier.charge_weight)) ? Number(courier.charge_weight) : null,
        isCustomRate: Number(courier.is_custom_rate) === 1,
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
  // Shiprocket accepts one parcel. Missing item measurements use private
  // fallback values for this request; existing measurements remain in force.
  const { totalWeight, length: packageLength, width: packageWidth, height: packageHeight } = getPackageMetrics(items);
  const pickupLocation = String(process.env.SHIPROCKET_PICKUP_LOCATION || '').trim();
  if (!pickupLocation) throw new Error('Set SHIPROCKET_PICKUP_LOCATION to the exact pickup name registered in the Shiprocket account.');
  const orderTotal = Math.max(0, Math.round((Number(order.total) || 0) * 100) / 100);
  const deliveryCharge = Math.max(0, Math.round((Number(order.delivery_charge) || 0) * 100) / 100);
  const totalDiscount = Math.max(0, Math.round((Number(order.discount) || 0) * 100) / 100);
  // Shiprocket calculates Total = sub_total + shipping_charges - total_discount.
  // In our store, customer paid: orderTotal = (product_subtotal + tax) + deliveryCharge - discount.
  // To ensure the prepaid amount in Shiprocket matches the exact customer total,
  // sub_total must include the product tax amount.
  const subTotal = Math.max(0, Math.round((orderTotal - deliveryCharge + totalDiscount) * 100) / 100);
  const shippingCharges = deliveryCharge;

  const baseItemTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * Math.max(1, Number(it.quantity) || 1), 0);
  const priceRatio = baseItemTotal > 0 ? (subTotal / baseItemTotal) : 1;
  let runningItemSum = 0;
  const payload = {
    order_id: `ORD-${order.id}`,
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
    order_items: items.map((item, idx) => {
      const rawWeight = item?.shipping_weight_kg ?? item?.shippingWeightKg ?? item?.weight;
      const weightNum = Number(rawWeight);
      const itemWeight = Number.isFinite(weightNum) && weightNum > 0 ? weightNum : DEFAULT_PACKAGE.weightKg;
      const units = Math.max(1, Number(item.quantity) || 1);
      let unitSellingPrice;
      if (idx === items.length - 1) {
        const remaining = Math.max(0, subTotal - runningItemSum);
        unitSellingPrice = Math.round((remaining / units) * 100) / 100;
      } else {
        unitSellingPrice = Math.round((Number(item.price) || 0) * priceRatio * 100) / 100;
        runningItemSum += unitSellingPrice * units;
      }
      return {
        name: item.name || 'Item',
        sku: `ORDER-${order.id}-ITEM-${item.id}`,
        units,
        selling_price: unitSellingPrice,
        weight: itemWeight,
      };
    }),
    payment_method: order.payment_status === 'paid' ? 'Prepaid' : 'COD',
    sub_total: subTotal,
    shipping_charges: shippingCharges,
    total_discount: totalDiscount,
    length: packageLength, breadth: packageWidth, height: packageHeight, weight: totalWeight,
  };
  const createUrl = `${shiprocketApiBaseUrl()}/orders/create/adhoc`;
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
  const awbUrl = `${shiprocketApiBaseUrl()}/courier/assign/awb`;
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

module.exports = { getAvailableCouriers, getPackageMetrics, bookShipment };
