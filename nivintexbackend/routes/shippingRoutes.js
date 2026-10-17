const express = require('express');
const { getAvailableCouriers } = require('../services/shiprocketService');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/quote', async (req, res) => {
  const deliveryPostcode = String(req.query.pincode || '').trim();
  const requestedWeight = Number(req.query.weightKg);
  const pickupLocation = String(process.env.SHIPROCKET_PICKUP_LOCATION || '').trim();
  if (!pickupLocation) return res.status(503).json({ success: false, message: 'Shiprocket pickup location name is not configured. Set SHIPROCKET_PICKUP_LOCATION to the exact pickup name registered in the Shiprocket account.' });
  if (!/^\d{6}$/.test(deliveryPostcode)) {
    return res.status(400).json({ success: false, message: 'Enter a valid 6-digit Indian PIN code.' });
  }
  if (req.query.weightKg !== undefined && (!Number.isFinite(requestedWeight) || requestedWeight <= 0)) {
    return res.status(400).json({ success: false, message: 'Shipment weight must be a positive number in kilograms.' });
  }

  try {
    const quote = await getAvailableCouriers({ deliveryPostcode, weightKg: requestedWeight });
    return res.json({ success: true, ...quote });
  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamMessage = error.response?.data?.message;
    console.error('Shiprocket quote failed:', {
      stage: error.shiprocketStage || 'courier serviceability',
      status: upstreamStatus || error.status || 502,
      message: typeof upstreamMessage === 'string' ? upstreamMessage : error.message,
    });

    const message = error.shiprocketStage === 'API User authentication' && (upstreamStatus === 401 || upstreamStatus === 403)
      ? 'Shiprocket API login failed. Use the API User email and password from Settings > API > Configure, not the main login or pickup contact details.'
      : error.shiprocketStage === 'API User authentication' && (upstreamStatus === 400 || error.status === 429)
        ? 'Shiprocket has temporarily blocked this API User after repeated login failures. Login retries are paused; wait for Shiprocket to unblock it, verify the API User password, then restart the backend.'
      : (upstreamStatus === 401 || upstreamStatus === 403)
        ? `Shiprocket rejected the courier serviceability request (${upstreamStatus}). Check that the API User has courier/serviceability access enabled.`
      : error.status
        ? error.message
        : 'Unable to get a shipping quote from Shiprocket right now.';
    return res.status(error.status || 502).json({
      success: false,
      message,
    });
  }
});

router.put('/orders/:orderId/address', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.payment_status !== 'paid') return res.status(400).json({ success: false, message: 'Only paid orders can be prepared for shipment.' });
    if (order.awb_code) return res.status(409).json({ success: false, message: 'Shipping address cannot be changed after an AWB has been assigned.' });

    const address = req.body?.shippingAddress;
    if (!address || typeof address !== 'object' || Array.isArray(address)) {
      return res.status(400).json({ success: false, message: 'shippingAddress must be an object.' });
    }
    const normalized = {
      name: String(address.name || address.firstName || order.customer_name || '').trim(),
      address: String(address.address || address.address1 || '').trim(),
      address2: String(address.address2 || '').trim(),
      city: String(address.city || '').trim(),
      state: String(address.state || '').trim(),
      zip: String(address.zip || address.postcode || '').trim(),
      country: String(address.country || 'India').trim(),
      phone: String(address.phone || order.customer_phone || '').trim(),
    };
    if (!normalized.name || !normalized.address || !normalized.city || !normalized.state || !/^\d{6}$/.test(normalized.zip)) {
      return res.status(400).json({ success: false, message: 'Name, street address, city, state, and a valid 6-digit PIN code are required.' });
    }
    await order.update({
      shipping_address: JSON.stringify(normalized),
      shiprocket_booking_error: null,
      shiprocket_booking_status: 'pending',
    });
    return res.json({ success: true, message: 'Shipping address saved.', shippingAddress: normalized });
  } catch (error) {
    console.error('Save order shipping address failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not save the shipping address.' });
  }
});

router.get('/orders/:orderId/couriers', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{ model: OrderItem, as: 'OrderItems', attributes: ['shipping_weight_kg', 'quantity'] }],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.awb_code) return res.status(409).json({ success: false, message: 'This order already has a shipment AWB.' });
    if (order.payment_status === 'paid' && order.billing_sync_status !== 'synced') return res.status(409).json({ success: false, message: 'Resolve the Billing invoice and stock sync before booking this shipment.' });
    const address = parseAddress(order.shipping_address) || parseAddress(order.billing_address) || {};
    const pincode = String(address.zip || address.postcode || '').trim();
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ success: false, message: 'Order must have a valid 6-digit shipping PIN code.' });
    const missingPackage = order.OrderItems.find(item => !(Number(item.shipping_weight_kg) > 0));
    if (missingPackage) return res.status(400).json({ success: false, message: 'Packed weight must be entered in admin for every product before courier lookup.' });
    const weightKg = order.OrderItems.reduce((sum, item) => sum + Number(item.shipping_weight_kg) * Math.max(1, Number(item.quantity) || 1), 0);
    const result = await getAvailableCouriers({ deliveryPostcode: pincode, weightKg });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Order courier lookup failed:', error.response?.data || error.message);
    return res.status(error.status || 502).json({ success: false, message: error.message || 'Unable to load available couriers.' });
  }
});

router.post('/orders/:orderId/book', requireAdmin, async (req, res) => {
  const courierId = Number(req.body?.courierId);
  if (!Number.isInteger(courierId) || courierId <= 0) return res.status(400).json({ success: false, message: 'Choose a valid courier.' });
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{ model: OrderItem, as: 'OrderItems', attributes: ['id', 'name', 'price', 'quantity', 'shipping_weight_kg', 'shipping_length_cm', 'shipping_width_cm', 'shipping_height_cm'] }],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.awb_code) return res.status(409).json({ success: false, message: 'This order already has a shipment AWB.' });
    if (order.billing_sync_status !== 'synced') return res.status(409).json({ success: false, message: 'Resolve the Billing invoice and stock sync before booking this shipment.' });
    const address = parseAddress(order.shipping_address) || parseAddress(order.billing_address) || {};
    const pincode = String(address.zip || address.postcode || '').trim();
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ success: false, message: 'Order must have a valid 6-digit shipping PIN code.' });
    const missingPackage = order.OrderItems.find(item => !(Number(item.shipping_weight_kg) > 0) || !(Number(item.shipping_length_cm) > 0) || !(Number(item.shipping_width_cm) > 0) || !(Number(item.shipping_height_cm) > 0));
    if (missingPackage) return res.status(400).json({ success: false, message: 'Packed weight and all three dimensions must be entered in admin for every product before Shiprocket booking.' });
    if (order.payment_status !== 'paid') return res.status(400).json({ success: false, message: 'Only paid orders can be booked with Shiprocket.' });
    const totalWeight = order.OrderItems.reduce((sum, item) => sum + Number(item.shipping_weight_kg) * Math.max(1, Number(item.quantity) || 1), 0);
    const available = await getAvailableCouriers({ deliveryPostcode: pincode, weightKg: totalWeight });
    const courier = available.couriers.find(item => item.courierId === courierId);
    if (!courier) return res.status(400).json({ success: false, message: 'That courier is no longer available for this order.' });
    const { bookShipment } = require('../services/shiprocketService');
    const { sendOrderStatusEmail } = require('../services/emailService');
    const booked = await bookShipment({ order, courierId });
    await order.update({
      awb_code: booked.awbCode,
      courier_name: booked.courierName || courier.courierName,
      shiprocket_shipment_id: booked.shipmentId,
      shiprocket_booking_error: null,
      status: 'shipped',
    });
    try {
      await sendOrderStatusEmail(order, 'shipped');
    } catch (mailErr) {
      console.error('⚠️ Shiprocket shipment email failed:', mailErr.message);
    }
    return res.json({ success: true, shipmentId: booked.shipmentId, awbCode: booked.awbCode, courierName: booked.courierName || courier.courierName });
  } catch (error) {
    console.error('Shiprocket shipment booking failed:', error.response?.data || error.message);
    return res.status(error.status || 502).json({ success: false, message: error.response?.data?.message || error.message || 'Unable to book shipment.' });
  }
});

function parseAddress(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

module.exports = router;
