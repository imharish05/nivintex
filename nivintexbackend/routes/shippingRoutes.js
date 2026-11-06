const express = require('express');
const { Op } = require('sequelize');
const { getAvailableCouriers, getPackageMetrics } = require('../services/shiprocketService');
const { mapShiprocketStatus, shouldAdvanceStatus } = require('../services/shiprocketWebhookService');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const { sendOrderStatusEmail } = require('../services/emailService');
const orderFlowLog = require('../utils/orderFlowLogger');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/quote', async (req, res) => {
  const deliveryPostcode = String(req.query.pincode || '').trim();
  const requestedWeight = Number(req.query.weightKg);
  const requestedLength = Number(req.query.lengthCm);
  const requestedWidth = Number(req.query.widthCm);
  const requestedHeight = Number(req.query.heightCm);
  const requestedDeclaredValue = Number(req.query.declaredValue);
  const pickupLocation = String(process.env.SHIPROCKET_PICKUP_LOCATION || '').trim();
  if (!pickupLocation) return res.status(503).json({ success: false, message: 'Shiprocket pickup location name is not configured. Set SHIPROCKET_PICKUP_LOCATION to the exact pickup name registered in the Shiprocket account.' });
  if (!/^\d{6}$/.test(deliveryPostcode)) {
    return res.status(400).json({ success: false, message: 'Enter a valid 6-digit Indian PIN code.' });
  }
  if (req.query.weightKg !== undefined && (!Number.isFinite(requestedWeight) || requestedWeight <= 0)) {
    return res.status(400).json({ success: false, message: 'Shipment weight must be a positive number in kilograms.' });
  }
  for (const [key, value] of [['lengthCm', requestedLength], ['widthCm', requestedWidth], ['heightCm', requestedHeight]]) {
    if (req.query[key] !== undefined && (!Number.isFinite(value) || value <= 0)) {
      return res.status(400).json({ success: false, message: 'Parcel dimensions must be positive numbers in centimeters.' });
    }
  }
  if (req.query.declaredValue !== undefined && (!Number.isFinite(requestedDeclaredValue) || requestedDeclaredValue < 0)) {
    return res.status(400).json({ success: false, message: 'Declared shipment value must be a non-negative amount.' });
  }

  try {
    const quote = await getAvailableCouriers({
      deliveryPostcode,
      weightKg: requestedWeight,
      lengthCm: requestedLength,
      widthCm: requestedWidth,
      heightCm: requestedHeight,
      declaredValue: requestedDeclaredValue,
    });
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
      include: [{ model: OrderItem, as: 'OrderItems', attributes: ['shipping_weight_kg', 'shipping_length_cm', 'shipping_width_cm', 'shipping_height_cm', 'quantity'] }],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.awb_code) return res.status(409).json({ success: false, message: 'This order already has a shipment AWB.' });
    if (order.payment_status === 'paid' && order.billing_sync_status !== 'synced') return res.status(409).json({ success: false, message: 'Resolve the Billing invoice and stock sync before booking this shipment.' });
    const address = parseAddress(order.shipping_address) || parseAddress(order.billing_address) || {};
    const pincode = String(address.zip || address.postcode || '').trim();
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ success: false, message: 'Order must have a valid 6-digit shipping PIN code.' });
    const packageMetrics = getPackageMetrics(order.OrderItems);
    const result = await getAvailableCouriers({
      deliveryPostcode: pincode,
      weightKg: packageMetrics.totalWeight,
      lengthCm: packageMetrics.length,
      widthCm: packageMetrics.width,
      heightCm: packageMetrics.height,
      declaredValue: Math.max(0, (Number(order.total) || 0) - (Number(order.delivery_charge) || 0)),
    });
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
    if (order.payment_status !== 'paid') return res.status(400).json({ success: false, message: 'Only paid orders can be booked with Shiprocket.' });
    const packageMetrics = getPackageMetrics(order.OrderItems);
    const available = await getAvailableCouriers({
      deliveryPostcode: pincode,
      weightKg: packageMetrics.totalWeight,
      lengthCm: packageMetrics.length,
      widthCm: packageMetrics.width,
      heightCm: packageMetrics.height,
      declaredValue: Math.max(0, (Number(order.total) || 0) - (Number(order.delivery_charge) || 0)),
    });
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

// --- Shiprocket Webhooks ---
const handleWebhookVerification = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Shiprocket tracking webhook endpoint is active.',
    timestamp: new Date().toISOString(),
  });
};

const handleShiprocketWebhook = async (req, res) => {
  orderFlowLog.logRequest('Shiprocket webhook received', 'POST', req.originalUrl, req.body);

  try {
    // 1. Security token verification if configured
    const configuredSecret = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (configuredSecret) {
      const incomingSecret =
        req.headers['x-api-key'] ||
        req.headers['x-shiprocket-token'] ||
        req.headers['authorization'] ||
        req.query.token;

      if (!incomingSecret || incomingSecret !== configuredSecret) {
        orderFlowLog.logFailure('Shiprocket webhook authorization', new Error('Unauthorized webhook request: secret token mismatch.'));
        return res.status(401).json({
          success: false,
          message: 'Invalid or missing webhook security token.',
        });
      }
    }

    // 2. Extract payload (handle nested data object or flat payload)
    const payload = req.body?.data && typeof req.body.data === 'object' && !Array.isArray(req.body.data)
      ? req.body.data
      : req.body || {};

    const rawAwb = String(payload.awb || payload.awb_code || payload.awb_number || '').trim();
    const rawOrderId = String(payload.order_id || payload.channel_order_id || payload.orderId || '').trim();
    const rawShipmentId = String(payload.shipment_id || payload.shipmentId || '').trim();
    const rawStatusText = String(payload.current_status || payload.shipment_status || payload.status || '').trim();
    const rawStatusId = payload.current_status_id ?? payload.shipment_status_id ?? payload.status_id;
    const rawCourierName = String(payload.courier_name || payload.courier || '').trim();

    // 3. Handle initial ping/validation events from Shiprocket
    if (!rawAwb && !rawOrderId && !rawShipmentId) {
      orderFlowLog.logResponse('Shiprocket webhook test ping', 200, { received: true });
      return res.status(200).json({
        success: true,
        message: 'Shiprocket webhook test ping received successfully.',
      });
    }

    // 4. Locate order in database
    const cleanedOrderId = rawOrderId ? rawOrderId.replace(/^(NVN-|ORD-)+/i, '') : null;
    const whereConditions = [
      rawAwb ? { awb_code: rawAwb } : null,
      rawOrderId ? { id: rawOrderId } : null,
      cleanedOrderId && cleanedOrderId !== rawOrderId && /^\d+$/.test(cleanedOrderId) ? { id: Number(cleanedOrderId) } : null,
      rawShipmentId ? { shiprocket_shipment_id: rawShipmentId } : null,
    ].filter(Boolean);

    if (!whereConditions.length) {
      return res.status(200).json({ success: true, message: 'No identifiable order key found in payload.' });
    }

    const order = await Order.findOne({
      where: { [Op.or]: whereConditions },
      include: [{ model: OrderItem, as: 'OrderItems' }],
    });

    if (!order) {
      console.warn('⚠️ Shiprocket webhook: order not found for payload:', { rawAwb, rawOrderId, rawShipmentId });
      return res.status(200).json({
        success: true,
        message: 'Order not found in database. Notification recorded and skipped.',
      });
    }

    // 5. Map Shiprocket status to application Order status
    const targetStatus = mapShiprocketStatus(rawStatusId, rawStatusText);
    const currentStatus = order.status;

    const updateFields = {};
    if (rawAwb && !order.awb_code) updateFields.awb_code = rawAwb;
    if (rawCourierName && !order.courier_name) updateFields.courier_name = rawCourierName;
    if (rawShipmentId && !order.shiprocket_shipment_id) updateFields.shiprocket_shipment_id = rawShipmentId;

    if (targetStatus && shouldAdvanceStatus(currentStatus, targetStatus)) {
      updateFields.status = targetStatus;

      // If order was cancelled, restore product stock
      if (targetStatus === 'cancelled' && currentStatus !== 'cancelled') {
        const items = order.OrderItems || (await OrderItem.findAll({ where: { orderId: order.id } }));
        for (const item of items) {
          if (item.product_id) {
            const product = await Product.findByPk(item.product_id);
            if (product) {
              await product.update({ stock: (product.stock || 0) + (item.quantity || 1) });
            }
          }
        }
      }
    }

    if (Object.keys(updateFields).length > 0) {
      await order.update(updateFields);

      if (updateFields.status) {
        try {
          await sendOrderStatusEmail(order, updateFields.status);
        } catch (mailErr) {
          console.error(`⚠️ Shiprocket webhook email notice failed for Order #${order.id} (${updateFields.status}):`, mailErr.message);
        }
      }
    }

    orderFlowLog.logResponse('Shiprocket webhook handled', 200, {
      orderId: order.id,
      previousStatus: currentStatus,
      newStatus: updateFields.status || currentStatus,
      updatedFields: Object.keys(updateFields),
    });

    return res.status(200).json({
      success: true,
      message: 'Shiprocket tracking webhook processed successfully.',
      orderId: order.id,
      status: updateFields.status || currentStatus,
    });
  } catch (error) {
    orderFlowLog.logFailure('Shiprocket webhook error', error);
    console.error('Shiprocket webhook processing failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal error processing Shiprocket webhook.',
    });
  }
};

router.get('/webhook', handleWebhookVerification);
router.post('/webhook', handleShiprocketWebhook);
router.get('/shiprocket-webhook', handleWebhookVerification);
router.post('/shiprocket-webhook', handleShiprocketWebhook);

function parseAddress(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

module.exports = router;
