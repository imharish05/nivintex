const Order     = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product   = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Cart      = require('../models/Cart');
const sequelize = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');
const { Op } = require('sequelize');

const {
    sendOrderStatusEmail,
    sendOrderConfirmationEmail
} = require('../services/emailService');


// ─────────────────────────────────────────
// 🛍 CREATE ORDER
// ─────────────────────────────────────────
const createOrder = async (req, res) => {
    try {
        const {
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            customer_phone2,
            billing_address,
            shipping_address,
            order_notes,
            subtotal,
            delivery_charge,
            tax,
            discount,
            total,
            coupon_code,
            payment_id,
            razorpay_order_id,
            razorpay_signature,
            payment_status,
            items = [],
            courier_id,
            courier_name,
            courier_rate,
            courier_estimated_delivery_days
        } = req.body;

        // Paid online orders must carry a valid Razorpay signature before stock is
        // decremented or an external shipment can be created.
        if (payment_status === 'paid') {
            if (!razorpay_order_id || !payment_id || !razorpay_signature || !process.env.RAZORPAY_SECRET) {
                return res.status(400).json({ success: false, message: 'Verified Razorpay payment details are required.' });
            }
            const expected = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
                .update(`${razorpay_order_id}|${payment_id}`).digest('hex');
            const actualBuffer = Buffer.from(String(razorpay_signature));
            const expectedBuffer = Buffer.from(expected);
            if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
                return res.status(400).json({ success: false, message: 'Razorpay payment verification failed.' });
            }
            const razorpayController = require('./razorpayController');
            // Verify using Razorpay's durable order record; process-memory state
            // is not reliable across backend restarts or multiple server workers.
            if (!await razorpayController.verifyRazorpayOrder(razorpay_order_id, total, courier_id)) {
                return res.status(400).json({ success: false, message: 'The Razorpay order amount or selected courier does not match this checkout.' });
            }
            const existingPaidOrder = await Order.findOne({ where: { razorpay_order_id } });
            if (existingPaidOrder) {
                return res.json({ success: true, orderId: existingPaidOrder.id, duplicate: true, billingSyncStatus: existingPaidOrder.billing_sync_status || 'not_configured' });
            }
        }

        if (!customer_name || !customer_email || items.length === 0) {
            require('fs').appendFileSync('error.log', new Date().toISOString() + ' Val Error: Missing required fields\n');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Repair cart references after a product was re-imported by resolving
        // its durable Billing IDs, then store canonical local IDs on the order.
        for (const item of items) {
            const submittedProductId = item.product_id || item.productId || item.id;
            const submittedVariantId = item.variantId || item.variant_id;
            const submittedBillingVariantId = item.billingVariantId || item.billing_variant_id;
            let product = null;
            let variant = null;

            if (submittedVariantId) {
                variant = /^\d+$/.test(String(submittedVariantId)) ? await ProductVariant.findByPk(submittedVariantId) : null;
                if (!variant) {
                    const billingVariantId = item.billingVariantId || item.billing_variant_id || submittedVariantId;
                    variant = await ProductVariant.findOne({ where: { billingVariantId: String(billingVariantId) } });
                }
                if (!variant) {
                    return res.status(400).json({ success: false, message: `The selected variant for ${item.name || 'this product'} is no longer available. Refresh your cart and try again.` });
                }
            } else if (submittedBillingVariantId) {
                variant = await ProductVariant.findOne({ where: { billingVariantId: String(submittedBillingVariantId) } });
                if (!variant) {
                    return res.status(400).json({ success: false, message: `The selected Billing variant for ${item.name || 'this product'} is no longer mapped in the store catalog. Refresh your cart and try again.` });
                }
            }
            if (submittedProductId && /^\d+$/.test(String(submittedProductId))) {
                product = await Product.findByPk(submittedProductId);
            }
            if (!product) {
                const billingProductId = item.billingProductId || item.billing_product_id
                    || submittedProductId;
                if (billingProductId) product = await Product.findOne({ where: { billingProductId: String(billingProductId) } });
            }
            if (!product && variant) product = await Product.findByPk(variant.productId);

            if (product && !variant && !submittedVariantId && (item.size || item.color || item.fabric)) {
                const variantWhere = { productId: product.id, billingVariantId: { [Op.ne]: null } };
                for (const field of ['size', 'color', 'fabric']) {
                    if (item[field]) variantWhere[field] = String(item[field]).trim();
                }
                const matches = await ProductVariant.findAll({ where: variantWhere, limit: 2 });
                if (matches.length === 1) variant = matches[0];
            }
            if (product && !variant && !submittedVariantId && !(item.size || item.color || item.fabric)) {
                const soleVariant = await ProductVariant.findOne({
                    where: { productId: product.id, billingVariantId: { [Op.ne]: null } },
                });
                const anotherVariant = soleVariant ? await ProductVariant.findOne({
                    where: { productId: product.id, billingVariantId: { [Op.ne]: null }, id: { [Op.ne]: soleVariant.id } },
                    attributes: ['id'],
                }) : null;
                if (soleVariant && !anotherVariant) variant = soleVariant;
            }

            if (!product) {
                const detail = `Product "${item.name || 'Unknown'}" (ID ${submittedProductId || 'missing'}) is no longer in the store catalog. Refresh your cart and try again.`;
                require('fs').appendFileSync('error.log', `${new Date().toISOString()} Val Error: ${detail}\n`);
                return res.status(400).json({ success: false, message: detail });
            }
            if (variant && Number(variant.productId) !== Number(product.id)) {
                return res.status(400).json({ success: false, message: `The selected variant for ${item.name || 'this product'} does not belong to the selected product. Refresh your cart and try again.` });
            }
            item.product_id = product.id;
            item.id = product.id;
            item.variantId = variant?.id || null;
            item.billingProductId = item.billingProductId || product.billingProductId || null;
            item.billingVariantId = item.billingVariantId || variant?.billingVariantId || null;
        }

        const billingItems = await Promise.all(items.map(async item => {
            const variant = item.variantId || item.variant_id
                ? await ProductVariant.findByPk(item.variantId || item.variant_id)
                : null;
            const product = await Product.findByPk(item.product_id || item.id);
            const billingVariantId = variant?.billingVariantId || item.billingVariantId || item.billing_variant_id || product?.billingVariantId || '';
            const gstLabel = String(product?.mrpGstType || '').toLowerCase();
            const gstPercent = gstLabel.includes('without') ? 0 : 5;
            return {
                product_variant_id: billingVariantId ? String(billingVariantId) : '',
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
                width: '',
                discount_amount: 0,
                gst_percent: gstPercent,
            };
        }));
        const gstRates = [...new Set(billingItems.map(item => Number(item.gst_percent)))];
        const hasMixedGst = gstRates.length > 1;
        const hasGst = billingItems.some(item => Number(item.gst_percent) > 0);
        const checkoutSubtotal = Number(subtotal) || 0;
        const checkoutDiscount = Number(discount) || 0;
        const checkoutTotal = Number(total) || 0;
        const checkoutTax = Number(tax) || 0;
        const billingPayload = {
            bill_number: '',
            franchise_location_id: '',
            price_type: 'MRP',
            payment_mode: 'Online',
            has_gst: hasGst ? 1 : 0,
            customer_id: '',
            customer_name: String(customer_name),
            customer_phone: String(customer_phone || ''),
            customer_email: String(customer_email || ''),
            billing_address: addressText(billing_address),
            shipping_address: addressText(shipping_address),
            source: 'Website',
            entry_mode: '',
            items: billingItems,
            bill_discount_amount: checkoutDiscount,
            paid_amount: payment_status === 'paid' ? checkoutTotal : 0,
            subtotal: checkoutSubtotal,
            gst_amount: checkoutTax,
            delivery_charge: Number(delivery_charge) || 0,
            total: checkoutTotal,
            balance: payment_status === 'paid' ? 0 : Math.max(0, checkoutTotal - (Number(req.body.paid_amount) || 0)),
            submission_action: 'complete',
        };

        // ── Validate item stock before creating the order ───────────────────
        const requestedStockByVariant = new Map();
        const requestedStockByProduct = new Map();
        for (const item of items) {
            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
            if (item.variantId) {
                const key = String(item.variantId);
                const requested = (requestedStockByVariant.get(key) || 0) + quantity;
                requestedStockByVariant.set(key, requested);
                const variant = await ProductVariant.findByPk(item.variantId);
                if (!variant) {
                    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Warn: Selected variant not found, falling back to main product.\n');
                    // Fallback to main product stock check
                    const product = await Product.findByPk(item.product_id || item.id);
                    const productKey = String(product?.id || item.product_id || item.id);
                    const requestedProduct = (requestedStockByProduct.get(productKey) || 0) + quantity;
                    requestedStockByProduct.set(productKey, requestedProduct);
                    if (product && product.stock < requestedProduct) {
                        return res.status(400).json({ success: false, message: `Only ${product.stock || 0} units available for ${item.name}.` });
                    }
                } else if (variant.stock < requested) {
                    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Val Error: Variant stock < quantity\n');
                    return res.status(400).json({
                        success:  false,
                        message:  `Only ${variant.stock || 0} unit${variant.stock === 1 ? '' : 's'} available for ${item.name || 'this product'}.`
                    });
                }
            } else {
                const product  = await Product.findByPk(item.product_id || item.id);
                if (!product) {
                    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Val Error: Selected product not found.\n');
                    return res.status(400).json({ success: false, message: 'Selected product not found.' });
                }
                const productKey = String(product.id);
                const requestedProduct = (requestedStockByProduct.get(productKey) || 0) + quantity;
                requestedStockByProduct.set(productKey, requestedProduct);
                if (product.stock < requestedProduct) {
                    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Val Error: Product stock < quantity. Stock: ' + product.stock + '\n');
                    return res.status(400).json({
                        success:  false,
                        message:  `Only ${product.stock || 0} unit${product.stock === 1 ? '' : 's'} available for ${item.name || 'this product'}.`
                    });
                }
            }
        }

        const transaction = await sequelize.transaction();
        try {
            const order = await Order.create({
                customer_id,
                customer_name,
                customer_email,
                customer_phone,
                customer_phone2,
                billing_address,
                shipping_address,
                order_notes,
                subtotal:        parseFloat(subtotal)        || 0,
                delivery_charge: parseFloat(delivery_charge) || 0,
                tax:             parseFloat(tax)             || 0,
                discount:        parseFloat(discount)        || 0,
                total:           parseFloat(total)           || 0,
                coupon_code,
                billing_bill_number: null,
                billing_stock_location_id: null,
                billing_price_type: billingPayload.price_type,
                billing_payment_mode: billingPayload.payment_mode,
                billing_has_gst: Boolean(billingPayload.has_gst),
                billing_gst_percent: hasMixedGst ? null : Number(billingItems[0]?.gst_percent ?? 0),
                billing_customer_id: null,
                billing_source: billingPayload.source,
                billing_entry_mode: null,
                billing_submission_action: billingPayload.submission_action,
                billing_paid_amount: billingPayload.paid_amount,
                billing_balance: billingPayload.balance,
                billing_payload: billingPayload,
                billing_sync_status: hasMixedGst ? 'needs_gst_review' : 'not_configured',
                billing_sync_error: hasMixedGst
                    ? 'This order contains products with different GST options; the Billing form supports one GST option per bill. Payload stored locally for review.'
                    : 'Billing create endpoint is not configured; payload stored locally for later sync.',
                billing_stock_sync_status: String(process.env.BILLING_API_TOKEN || '').trim() ? 'pending' : 'not_configured',
                shiprocket_requested_courier_id: courier_id ? String(courier_id) : null,
                shiprocket_requested_courier_name: courier_name || null,
                shiprocket_requested_rate: Number.isFinite(Number(courier_rate)) ? Number(courier_rate) : (Number(delivery_charge) || 0),
                shiprocket_estimated_delivery_days: courier_estimated_delivery_days ? String(courier_estimated_delivery_days) : null,
                shiprocket_booking_status: courier_id ? 'pending' : 'not_requested',
                payment_id,
                razorpay_order_id,
                razorpay_signature,
                payment_status: payment_status || 'paid',
                image:  items[0]?.image || items[0]?.img || null,
                status: 'confirmed'
            }, { transaction });

            await OrderItem.bulkCreate(
                items.map(item => ({
                    orderId:    order.id,
                    product_id: item.product_id || item.id,
                    variant_id: item.variantId || null,
                    name:       item.name,
                    price:      parseFloat(item.price)                  || 0,
                    quantity:   Math.max(1, parseInt(item.quantity, 10) || 1),
                    image:      item.image || item.img || null,
                    weight:     item.weight || null,
                    shipping_weight_kg: item.shippingWeightKg || null,
                    shipping_length_cm: item.shippingLengthCm || null,
                    shipping_width_cm: item.shippingWidthCm || null,
                    shipping_height_cm: item.shippingHeightCm || null,
                })),
                { transaction }
            );

            // ── Reduce stock ──────────────────────────────────────────────────
            const decrementedLocalVariants = new Set();
            for (const item of items) {
                const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
                let variantUpdated = false;
                if (item.variantId) {
                    if (decrementedLocalVariants.has(String(item.variantId))) continue;
                    decrementedLocalVariants.add(String(item.variantId));
                    const variant = await ProductVariant.findByPk(item.variantId);
                    if (variant) {
                        const newStock = Math.max(0, (variant.stock || 0) - (requestedStockByVariant.get(String(item.variantId)) || quantity));
                        await variant.update({ stock: newStock }, { transaction });
                        variantUpdated = true;
                    }
                }
                
                if (!variantUpdated) {
                    const product  = await Product.findByPk(item.product_id || item.id);
                    if (product) {
                        const key = String(product.id);
                        if (!decrementedLocalVariants.has(`product:${key}`)) {
                            decrementedLocalVariants.add(`product:${key}`);
                            const productQuantity = items.filter(candidate => !candidate.variantId && String(candidate.product_id || candidate.id) === key)
                                .reduce((sum, candidate) => sum + Math.max(1, parseInt(candidate.quantity, 10) || 1), 0);
                            const newStock = Math.max(0, (product.stock || 0) - productQuantity);
                            await product.update({ stock: newStock }, { transaction });
                        }
                    }
                }
            }

            await transaction.commit();

            // Billing owns inventory. Send its variant IDs only after the local order commits.
            const billingBase = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
            const billingToken = String(process.env.BILLING_API_TOKEN || '').trim();
            const billingHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };
            if (billingToken) billingHeaders.Authorization = `Bearer ${billingToken}`;
            const stockErrors = [];
            const orderStockItems = new Map();
            let billingStockSyncStatus = billingToken ? 'pending' : 'not_configured';
            let billingStockSyncedAt = null;
            for (const item of items) {
                const localVariantId = item.variantId || item.variant_id;
                const variant = localVariantId ? await ProductVariant.findByPk(localVariantId) : null;
                const billingVariantId = variant?.billingVariantId || item.billingVariantId || item.billing_variant_id;
                if (!billingVariantId) {
                    stockErrors.push(`No Billing variant ID is mapped for ${item.name || localVariantId || 'an order item'}.`);
                    continue;
                }
                const key = String(billingVariantId);
                const current = orderStockItems.get(key) || { billingVariantId, quantity: 0 };
                current.quantity += Math.max(1, parseInt(item.quantity, 10) || 1);
                orderStockItems.set(key, current);
            }
            for (const item of items) {
                if (item.variantId || item.variant_id) continue;
                const product = await Product.findByPk(item.product_id || item.id);
                const billingVariantId = item.billingVariantId || product?.billingVariantId;
                if (!billingVariantId) {
                    stockErrors.push(`No Billing variant ID is mapped for ${item.name || item.product_id || item.id || 'an order item'}.`);
                    continue;
                }
                const key = String(billingVariantId);
                const current = orderStockItems.get(key) || { billingVariantId, quantity: 0 };
                current.quantity += Math.max(1, parseInt(item.quantity, 10) || 1);
                orderStockItems.set(key, current);
            }
            if (!billingToken) {
                stockErrors.push('Billing stock update skipped: BILLING_API_TOKEN is not configured.');
                console.error('Billing stock decrement skipped: BILLING_API_TOKEN is not configured.');
            } else {
                for (const { billingVariantId, quantity } of orderStockItems.values()) {
                    try {
                        const response = await axios.post(`${billingBase}/stocks/decrement`, { product_variant_id: billingVariantId, quantity }, {
                            headers: billingHeaders,
                            timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000,
                            maxRedirects: 0,
                        });
                        const contentType = String(response.headers?.['content-type'] || '').toLowerCase();
                        if (response.status >= 300 && response.status < 400) {
                            throw new Error('Billing redirected the stock request to login. Check BILLING_API_TOKEN.');
                        }
                        if (!contentType.includes('application/json')) {
                            throw new Error('Billing stock endpoint returned a non-JSON response (likely a login page). Check BILLING_API_TOKEN and the API URL.');
                        }
                        if (response.status < 200 || response.status >= 300) {
                            throw new Error(`Billing stock endpoint returned HTTP ${response.status}.`);
                        }
                        if (response.data?.success === false || response.data?.status === false) {
                            throw new Error(response.data?.message || 'Billing rejected the stock decrement.');
                        }
                    } catch (stockError) {
                        const status = stockError.response?.status;
                        const message = status >= 300 && status < 400
                            ? 'Billing redirected the stock request to login. Check BILLING_API_TOKEN.'
                            : status === 401 || status === 403
                                ? 'Billing rejected BILLING_API_TOKEN or it lacks stock write access.'
                                : stockError.message || 'Unknown Billing API error.';
                        stockErrors.push(`Billing stock update failed for variant ${billingVariantId}${status ? ` (HTTP ${status})` : ''}: ${message}`);
                        console.error('Billing stock decrement failed:', { variantId: billingVariantId, status: status || null, message });
                    }
                }
            }

            if (billingToken) {
                billingStockSyncStatus = stockErrors.length ? 'failed' : 'synced';
                if (billingStockSyncStatus === 'synced') billingStockSyncedAt = new Date();
            } else {
                billingStockSyncStatus = 'not_configured';
            }
            try {
                await order.update({
                    billing_stock_sync_status: billingStockSyncStatus,
                    billing_stock_sync_error: stockErrors.length ? stockErrors.join('\n').slice(0, 60000) : null,
                    billing_stock_synced_at: billingStockSyncedAt,
                });
            } catch (stockStatusSaveError) {
                console.error('Could not persist Billing stock sync status:', stockStatusSaveError.message);
            }

            // ── Clear customer cart ───────────────────────────────────────────
            const shouldClearCart = req.body.clear_cart !== false; // Default to true if not provided
            try {
                if (customer_id && shouldClearCart) {
                    await Cart.destroy({ where: { customerId: customer_id } });
                    console.log(`🛒 Cart cleared for customer ${customer_id}`);
                }
            } catch (cartErr) {
                console.error('⚠️ Cart clear failed:', cartErr.message);
            }

            // ── Confirmation email ────────────────────────────────────────────
            try {
                await sendOrderConfirmationEmail({
                    email:           order.customer_email,
                    name:            order.customer_name,
                    paymentId:       order.payment_id || order.razorpay_order_id || '—',
                    orderId:         order.id,
                    items,
                    subtotal:        order.subtotal,
                    delivery_charge: order.delivery_charge,
                    tax:             order.tax,
                    discount:        order.discount,
                    total:           order.total,
                    coupon:          order.coupon_code || null,
                    billingAddress:  order.billing_address,
                    phone:           order.customer_phone,
                    phone2:          order.customer_phone2,
                });
            } catch (mailErr) {
                console.error('⚠️ Confirmation email failed (order still saved):', mailErr.message);
            }

            let shipment = null;
            let shipmentWarning = null;
            if (payment_status === 'paid' && courier_id) {
                try {
                    const shipmentOrder = await Order.findByPk(order.id, {
                        include: [{ model: OrderItem, as: 'OrderItems' }],
                    });
                    const shiprocket = require('../services/shiprocketService');
                    const address = parseJson(shipmentOrder.shipping_address) || parseJson(shipmentOrder.billing_address) || {};
                    const destination = String(address.zip || address.postcode || '').trim();
                    if (!/^\d{6}$/.test(destination)) throw new Error('Order needs a valid shipping PIN code before Shiprocket booking.');
                    const shipmentWeight = shipmentOrder.OrderItems.reduce((sum, item) => sum + Number(item.shipping_weight_kg || 0) * Math.max(1, Number(item.quantity) || 1), 0);
                    const available = await shiprocket.getAvailableCouriers({ deliveryPostcode: destination, weightKg: shipmentWeight });
                    const selectedCourier = available.couriers.find(candidate => candidate.courierId === Number(courier_id));
                    if (!selectedCourier) throw new Error('The selected Shiprocket courier is no longer available for this shipment.');
                    await order.update({
                        shiprocket_requested_courier_name: selectedCourier.courierName,
                        shiprocket_requested_rate: selectedCourier.rate,
                        shiprocket_estimated_delivery_days: selectedCourier.estimatedDeliveryDays || selectedCourier.etd || null,
                        shiprocket_booking_status: 'booking',
                    });
                    const booked = await shiprocket.bookShipment({ order: shipmentOrder, courierId: Number(courier_id) });
                    const courierName = booked.courierName || selectedCourier.courierName;
                    await shipmentOrder.update({
                        awb_code: booked.awbCode,
                        courier_name: courierName,
                        shiprocket_shipment_id: booked.shipmentId,
                        shiprocket_booking_error: null,
                        shiprocket_booking_status: 'booked',
                        shiprocket_requested_courier_name: selectedCourier.courierName,
                        shiprocket_requested_rate: selectedCourier.rate,
                        shiprocket_estimated_delivery_days: selectedCourier.estimatedDeliveryDays || selectedCourier.etd || null,
                        status: 'shipped',
                    });
                    shipment = { shipmentId: booked.shipmentId, awbCode: booked.awbCode, courierName };
                } catch (error) {
                    shipmentWarning = error.response?.data?.message || error.message || 'Shiprocket booking failed.';
                    await order.update({ shiprocket_booking_error: shipmentWarning, shiprocket_booking_status: 'failed' });
                    console.error('Post-payment Shiprocket booking failed:', error.response?.data || error.message);
                }
            }
            return res.json({ success: true, orderId: order.id, billingSyncStatus: order.billing_sync_status || 'not_configured', billingStockSyncStatus, ...(shipment ? { shipment } : {}), ...(shipmentWarning ? { shipmentWarning } : {}), ...(stockErrors.length ? { billingStockWarning: true, billingStockErrors: stockErrors } : {}) });

        } catch (txErr) {
            await transaction.rollback();
            require('fs').appendFileSync('error.log', new Date().toISOString() + ' TX Error: ' + txErr.message + '\n');
            console.error('⚠️ createOrder transaction failed:', txErr);
            return res.status(500).json({ success: false, message: 'Order creation failed', error: txErr.message });
        }
    } catch (err) {
        require('fs').appendFileSync('error.log', new Date().toISOString() + ' Top Error: ' + err.message + '\n');
        console.error('⚠️ createOrder error:', err);
        return res.status(500).json({ success: false, message: 'Order creation failed', error: err.message });
    }
};

const buildBillingPayload = async order => {
    const savedPayload = parseJson(order.billing_payload) || {};
    const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
    const fallbackItems = await Promise.all(orderItems.map(async item => {
        const [variant, product] = await Promise.all([
            item.variant_id ? ProductVariant.findByPk(item.variant_id) : null,
            item.product_id ? Product.findByPk(item.product_id) : null,
        ]);
        const gstLabel = String(product?.mrpGstType || '').toLowerCase();
        return {
            product_variant_id: variant?.billingVariantId || '',
            quantity: Math.max(1, Number(item.quantity) || 1),
            width: '',
            discount_amount: 0,
            gst_percent: gstLabel.includes('without') ? 0 : Number(order.billing_gst_percent ?? 5),
        };
    }));
    const allowedPriceTypes = ['MRP', 'Retail', 'Wholesale'];
    const savedPriceType = allowedPriceTypes.includes(savedPayload.price_type) ? savedPayload.price_type : null;
    const mergedItems = Array.isArray(savedPayload.items) && savedPayload.items.length
        ? savedPayload.items.map((item, index) => ({
            ...fallbackItems[index],
            ...item,
            product_variant_id: item.product_variant_id || fallbackItems[index]?.product_variant_id || '',
            quantity: item.quantity ?? fallbackItems[index]?.quantity ?? 1,
        }))
        : fallbackItems;

    return {
        ...savedPayload,
        bill_number: savedPayload.bill_number || '',
        franchise_location_id: '',
        price_type: savedPriceType || (allowedPriceTypes.includes(order.billing_price_type) ? order.billing_price_type : 'MRP'),
        payment_mode: savedPayload.payment_mode || order.billing_payment_mode || 'Online',
        has_gst: savedPayload.has_gst ?? (order.billing_has_gst ? 1 : 0),
        customer_name: savedPayload.customer_name || order.customer_name || '',
        customer_phone: savedPayload.customer_phone || order.customer_phone || '',
        customer_email: savedPayload.customer_email || order.customer_email || '',
        billing_address: savedPayload.billing_address || addressText(order.billing_address),
        shipping_address: savedPayload.shipping_address || addressText(order.shipping_address),
        items: mergedItems,
        bill_discount_amount: savedPayload.bill_discount_amount ?? (Number(order.discount) || 0),
        subtotal: savedPayload.subtotal ?? (Number(order.subtotal) || 0),
        gst_amount: savedPayload.gst_amount ?? (Number(order.tax) || 0),
        delivery_charge: savedPayload.delivery_charge ?? (Number(order.delivery_charge) || 0),
        paid_amount: savedPayload.paid_amount ?? (Number(order.billing_paid_amount ?? order.total) || 0),
        total: savedPayload.total ?? (Number(order.total) || 0),
        balance: savedPayload.balance ?? (Number(order.billing_balance) || 0),
        submission_action: 'complete',
    };
};

const getBillingPayload = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        const billingPayload = await buildBillingPayload(order);
        return res.json({ success: true, orderId: order.id, billingPayload, billingSyncStatus: order.billing_sync_status, billingSyncError: order.billing_sync_error || null });
    } catch (error) {
        console.error('Read order billing payload failed:', error.message);
        return res.status(500).json({ success: false, message: 'Could not load the order billing details.' });
    }
};

const updateBillingPayload = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        if (!req.body?.billingPayload || typeof req.body.billingPayload !== 'object' || Array.isArray(req.body.billingPayload)) {
            return res.status(400).json({ success: false, message: 'billingPayload must be an object.' });
        }

        const current = await buildBillingPayload(order);
        const submitted = req.body.billingPayload;
        const editableText = ['customer_name', 'customer_phone', 'customer_email', 'billing_address', 'shipping_address'];
        const next = { ...current };
        for (const key of editableText) {
            if (submitted[key] !== undefined) next[key] = String(submitted[key] || '').trim();
        }
        if (submitted.price_type !== undefined) {
            if (!['MRP', 'Retail', 'Wholesale'].includes(String(submitted.price_type))) return res.status(400).json({ success: false, message: 'Unsupported Billing price_type.' });
            next.price_type = String(submitted.price_type);
        }
        next.franchise_location_id = '';
        const submittedItems = (current.items || []).map(item => ({ ...item }));
        if (submitted.has_gst !== undefined) {
            next.has_gst = submitted.has_gst ? 1 : 0;
            next.items = submittedItems.map(item => ({ ...item, gst_percent: next.has_gst ? 5 : 0 }));
        } else {
            next.items = submittedItems;
        }

        // Preserve the captured purchase and verified payment amounts: editing
        // customer/Billing metadata must not rewrite a paid order or its items.
        next.bill_discount_amount = current.bill_discount_amount;
        next.paid_amount = Number(order.billing_paid_amount ?? order.total) || 0;
        next.subtotal = Number(order.subtotal) || 0;
        next.gst_amount = Number(order.tax) || 0;
        next.total = Number(order.total) || 0;
        next.balance = Number(order.billing_balance) || 0;
        next.submission_action = 'complete';
        const gstRates = [...new Set((next.items || []).map(item => Number(item.gst_percent)).filter(Number.isFinite))];
        const hasMixedGst = gstRates.length > 1;

        await order.update({
            billing_stock_location_id: null,
            billing_price_type: next.price_type || order.billing_price_type,
            billing_has_gst: Boolean(next.has_gst),
            billing_payload: next,
            billing_sync_status: hasMixedGst ? 'needs_gst_review' : 'not_configured',
            billing_sync_error: hasMixedGst
                ? 'This order contains products with different GST options; the Billing form supports one GST option per bill. Payload stored locally for review.'
                : 'Billing create/update endpoint is not configured; edited payload is stored locally.',
        });
        return res.json({ success: true, orderId: order.id, billingPayload: next, billingSyncStatus: order.billing_sync_status });
    } catch (error) {
        console.error('Update order billing payload failed:', error.message);
        return res.status(500).json({ success: false, message: 'Could not save the order billing details.' });
    }
};

function parseJson(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch (_) { return null; }
}

function addressText(value) {
    const parsed = parseJson(value);
    if (!parsed || typeof parsed !== 'object') return String(value || '');
    return [
        parsed.address || parsed.address1,
        parsed.address2,
        parsed.city,
        parsed.state,
        parsed.zip || parsed.postcode,
        parsed.country,
    ].filter(Boolean).join(', ');
}


// ─────────────────────────────────────────
// 📦 GET ALL ORDERS
// ─────────────────────────────────────────
const getAllOrders = async (req, res) => {
    try {
        const whereClause = {};
        if (req.query.franchise_id) {
            whereClause.franchise_id = req.query.franchise_id;
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [{
                model: OrderItem,
                as:    'OrderItems',
                include: [{
                    model:      Product,
                    as:         'Product',
                    attributes: ['id', 'productName', 'image'],
                }],
            }],
            order: [['createdAt', 'DESC']]
        });
        return res.json({ success: true, orders });
    } catch (err) {
        console.error('getAllOrders error:', err);
        return res.status(500).json({ success: false });
    }
};


// ─────────────────────────────────────────
// 👤 CUSTOMER ORDERS
// ─────────────────────────────────────────
const getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { customer_id: req.params.id },
            include: [{
                model: OrderItem,
                as:    'OrderItems',
                include: [{
                    model:      Product,
                    as:         'Product',
                    attributes: ['id', 'productName', 'image'],
                }],
            }],
            order: [['createdAt', 'DESC']]
        });
        return res.json({ success: true, orders });
    } catch (err) {
        console.error('getCustomerOrders error:', err);
        return res.status(500).json({ success: false });
    }
};


// ─────────────────────────────────────────
// 🔄 UPDATE STATUS
// ─────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const normalizedStatus = req.body.status.toLowerCase();

        // Restore stock on cancellation
        if (normalizedStatus === 'cancelled' && order.status !== 'cancelled') {
            const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
            for (const item of orderItems) {
                const product = await Product.findByPk(item.product_id);
                if (product) {
                    await product.update({ stock: (product.stock || 0) + (item.quantity || 1) });
                }
            }
        }

        await order.update({ status: normalizedStatus });

        try {
            await sendOrderStatusEmail(order, normalizedStatus);
        } catch (mailErr) {
            console.error('⚠️ Status email failed:', mailErr.message);
        }

        return res.json({ success: true });

    } catch (err) {
        console.error('updateOrderStatus error:', err);
        return res.status(500).json({ success: false });
    }
};


// ─────────────────────────────────────────
// 🏢 ASSIGN FRANCHISE
// ─────────────────────────────────────────
const assignFranchise = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const allowedStatuses = ['pending', 'processing', 'confirmed', 'assigned'];
        if (!allowedStatuses.includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Cannot assign franchise at this stage' });
        }

        const { franchise_id, franchise_name } = req.body;
        if (order.franchise_id && order.franchise_id !== franchise_id && order.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Cannot change franchise after the order is accepted.' });
        }
        if (franchise_id === undefined) return res.status(400).json({ success: false, message: 'franchise_id is required; use null to unassign.' });
        if (franchise_id !== null) {
            const Franchise = require('../models/Franchise');
            const franchise = await Franchise.findByPk(franchise_id);
            if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found.' });
        }
        await order.update({ 
            franchise_id, 
            franchise_name: franchise_id === null ? null : (franchise_name || null),
            status: franchise_id === null ? (order.status === 'assigned' ? 'confirmed' : order.status) : 'assigned'
        });

        return res.json({ success: true, order });
    } catch (err) {
        console.error('assignFranchise error:', err);
        return res.status(500).json({ success: false });
    }
};

// ─────────────────────────────────────────
// 🚚 UPDATE STATUS BY FRANCHISE
// ─────────────────────────────────────────
const updateFranchiseStatus = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Validate flow: Assigned -> Accepted -> Packed -> Out For Delivery -> Delivered
        const newStatus = req.body.status.toLowerCase();
        const flow = {
            'assigned': ['accepted'],
            'accepted': ['packed'],
            'packed': ['out_for_delivery'],
            'out_for_delivery': ['delivered']
        };

        if (order.status !== 'assigned' && !flow[order.status]) {
             return res.status(400).json({ success: false, message: 'Invalid current status for franchise update' });
        }

        if (flow[order.status] && !flow[order.status].includes(newStatus)) {
             return res.status(400).json({ success: false, message: `Cannot change status from ${order.status} to ${newStatus}` });
        }

        await order.update({ status: newStatus });
        return res.json({ success: true, order });
    } catch (err) {
        console.error('updateFranchiseStatus error:', err);
        return res.status(500).json({ success: false });
    }
};

// ─────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────
module.exports = {
    createOrder,
    getBillingPayload,
    updateBillingPayload,
    getAllOrders,
    getCustomerOrders,
    updateOrderStatus,
    assignFranchise,
    updateFranchiseStatus
};
