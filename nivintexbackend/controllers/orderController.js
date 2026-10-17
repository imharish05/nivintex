const Order     = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product   = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Cart      = require('../models/Cart');
const sequelize = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');
const { Op } = require('sequelize');
const billingCatalog = require('../services/billingCatalogService');
const billingSyncService = require('../services/billingSyncService');
const orderFlowLog = require('../utils/orderFlowLogger');

// A successful Billing invoice is the inventory source of truth. Refresh the
// complete local Billing product catalog immediately so product prices and
// variant stock shown by the storefront match the post-invoice state.
async function syncCatalogAfterBillingInvoice(billingVariantIds) {
    const ids = [...new Set((billingVariantIds || []).map(value => String(value || '').trim()).filter(Boolean))];
    const result = await billingSyncService.syncAll(true);
    const refreshedVariants = await ProductVariant.findAll({
        where: { billingVariantId: { [Op.in]: ids } },
        attributes: ['billingVariantId'],
    });
    const refreshedIds = new Set(refreshedVariants.map(variant => String(variant.billingVariantId)));
    const missingIds = ids.filter(id => !refreshedIds.has(id));
    if (missingIds.length) {
        throw new Error(`Billing catalog refreshed, but local variants were not found for Billing IDs: ${missingIds.join(', ')}.`);
    }
    return { ...result, refreshedVariants: refreshedIds.size };
}

const {
    sendOrderStatusEmail,
    sendOrderConfirmationEmail
} = require('../services/emailService');


// ─────────────────────────────────────────
// 🛍 CREATE ORDER
// ─────────────────────────────────────────
const createOrder = async (req, res) => {
    const flowId = `order-create ${req.body?.razorpay_order_id || req.body?.payment_id || `request-${Date.now()}`}`;
    orderFlowLog.attachOrderApiResponseLogger(req, res, flowId);
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
                return res.json({ success: true, orderId: existingPaidOrder.id, duplicate: true, billingSyncStatus: existingPaidOrder.billing_sync_status || 'not_configured', billingSyncError: existingPaidOrder.billing_sync_error || null });
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
            const submittedBillingProductId = item.billingProductId || item.billing_product_id;
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
                if (!variant && !submittedBillingVariantId) {
                    return res.status(400).json({ success: false, message: `The selected variant for ${item.name || 'this product'} is no longer available. Refresh your cart and try again.` });
                }
            } else if (submittedBillingVariantId) {
                variant = await ProductVariant.findOne({ where: { billingVariantId: String(submittedBillingVariantId) } });
            }
            if (submittedBillingProductId) {
                product = await Product.findOne({ where: { billingProductId: String(submittedBillingProductId) } });
            }
            if (!product && submittedProductId && /^\d+$/.test(String(submittedProductId))) {
                product = await Product.findByPk(submittedProductId);
            }
            if (!product) {
                const billingProductId = submittedBillingProductId || submittedProductId;
                if (billingProductId) product = await Product.findOne({ where: { billingProductId: String(billingProductId) } });
            }
            if (!product && variant) product = await Product.findByPk(variant.productId);

            if (product && !variant && !submittedVariantId && !submittedBillingVariantId && (item.size || item.color || item.fabric)) {
                const variantWhere = { productId: product.id, billingVariantId: { [Op.ne]: null } };
                for (const field of ['size', 'color', 'fabric']) {
                    if (item[field]) variantWhere[field] = String(item[field]).trim();
                }
                const matches = await ProductVariant.findAll({ where: variantWhere, limit: 2 });
                if (matches.length === 1) variant = matches[0];
            }
            if (product && !variant && !submittedVariantId && !submittedBillingVariantId && !(item.size || item.color || item.fabric)) {
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
                // Payment is already captured at this point. If checkout gave us
                // durable Billing IDs, preserve the paid line item even when a
                // local catalog row has not been imported yet.
                if (payment_status !== 'paid' || !submittedBillingProductId || !submittedBillingVariantId) {
                    return res.status(400).json({ success: false, message: detail });
                }
            }
            if (product && variant && Number(variant.productId) !== Number(product.id)) {
                return res.status(400).json({ success: false, message: `The selected variant for ${item.name || 'this product'} does not belong to the selected product. Refresh your cart and try again.` });
            }
            if (variant && submittedBillingVariantId && variant.billingVariantId
                && String(variant.billingVariantId) !== String(submittedBillingVariantId)) {
                return res.status(400).json({ success: false, message: `The selected variant for ${item.name || 'this product'} no longer matches the Billing catalog. Refresh your cart and try again.` });
            }
            item.product_id = product?.id || null;
            item.id = product?.id || null;
            item.variantId = variant?.id || null;
            item.billingProductId = item.billingProductId || item.billing_product_id || product?.billingProductId || null;
            item.billingVariantId = item.billingVariantId || variant?.billingVariantId || null;
        }

        const billingItems = await Promise.all(items.map(async item => {
            const variant = item.variantId || item.variant_id
                ? await ProductVariant.findByPk(item.variantId || item.variant_id)
                : null;
            const product = await Product.findByPk(item.product_id || item.id);
            const billingVariantId = variant?.billingVariantId || item.billingVariantId || item.billing_variant_id || '';
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
        const hasGst = false;
        const checkoutSubtotal = Number(subtotal) || 0;
        const checkoutDiscount = Number(discount) || 0;
        const checkoutTotal = Number(total) || 0;
        const checkoutTax = Number(tax) || 0;
        const billingPayload = {
            bill_number: '',
            franchise_location_id: '',
            price_type: 'MRP',
            payment_mode: 'Online',
            has_gst: false,
            customer_id: '',
            customer_name: String(customer_name),
            customer_phone: String(customer_phone || ''),
            customer_email: String(customer_email || ''),
            billing_address: addressText(billing_address),
            shipping_address: addressText(shipping_address),
            source: 'Website',
            entry_mode: 'Manual',
            items: billingItems,
            bill_discount_amount: checkoutDiscount,
            // Billing receives the product amount only; keep delivery locally
            // for order/admin records until its inclusion in Billing is confirmed.
            paid_amount: payment_status === 'paid' ? checkoutSubtotal : 0,
            subtotal: checkoutSubtotal,
            gst_amount: checkoutTax,
            delivery_charge: Number(delivery_charge) || 0,
            total: checkoutSubtotal,
            balance: payment_status === 'paid' ? 0 : Math.max(0, checkoutSubtotal - (Number(req.body.paid_amount) || 0)),
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
                    if (item.billingVariantId || item.billing_variant_id) continue;
                    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Warn: Selected variant not found, falling back to main product.\n');
                    // Fallback to main product stock check
                    const product = await Product.findByPk(item.product_id || item.id);
                    const productKey = String(product?.id || item.product_id || item.id);
                    const requestedProduct = (requestedStockByProduct.get(productKey) || 0) + quantity;
                    requestedStockByProduct.set(productKey, requestedProduct);
                    if (product && product.stock < requestedProduct) {
                        return res.status(400).json({ success: false, message: `Only ${product.stock || 0} units available for ${item.name}.` });
                    }
                } else if (!variant.billingVariantId && variant.stock < requested) {
                    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Val Error: Variant stock < quantity\n');
                    return res.status(400).json({
                        success:  false,
                        message:  `Only ${variant.stock || 0} unit${variant.stock === 1 ? '' : 's'} available for ${item.name || 'this product'}.`
                    });
                }
            } else if (item.billingVariantId || item.billing_variant_id) {
                // Billing remains the source of truth for externally mapped variants.
                continue;
            } else {
                const product  = await Product.findByPk(item.product_id || item.id);
                if (!product) {
                    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Val Error: Selected product not found.\n');
                    return res.status(400).json({ success: false, message: 'Selected product not found.' });
                }
                const productKey = String(product.id);
                if (item.billingVariantId || item.billing_variant_id) continue;
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
                billing_sync_status: payment_status === 'paid' ? 'pending' : 'not_applicable',
                billing_sync_error: null,
                billing_stock_sync_status: payment_status === 'paid' ? 'pending' : 'not_applicable',
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
                status: 'pending'
            }, { transaction });

            await OrderItem.bulkCreate(
                items.map(item => ({
                    orderId:    order.id,
                    product_id: item.product_id || item.id,
                    variant_id: item.variantId || null,
                    billing_product_id: item.billingProductId || item.billing_product_id || null,
                    billing_variant_id: item.billingVariantId || item.billing_variant_id || null,
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
                        if (!variant.billingVariantId) {
                            const newStock = Math.max(0, (variant.stock || 0) - (requestedStockByVariant.get(String(item.variantId)) || quantity));
                            await variant.update({ stock: newStock }, { transaction });
                        }
                        variantUpdated = true;
                    }
                }
                
                if (!variantUpdated) {
                    if (item.billingVariantId || item.billing_variant_id) continue;
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

            // Billing creates the invoice and decrements its own stock atomically.
            // Never call /stocks/decrement here as that would subtract inventory twice.
            let billingSyncStatus = payment_status === 'paid' ? 'failed' : 'not_applicable';
            let billingSyncError = null;
            let billingStockSyncStatus = payment_status === 'paid' ? 'pending' : 'not_applicable';
            let billingRequestPayload = null;
            let billingResponse = null;
            if (payment_status === 'paid') {
                try {
                    billingRequestPayload = makeBillingCreatePayload(billingPayload);
                    await order.update({
                        billing_sync_status: 'pending',
                        billing_request_payload: billingRequestPayload,
                        billing_sync_error: null,
                    });
                    const billingBase = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
                    const billingUrl = `${billingBase}/billings`;
                    orderFlowLog.logRequest(`${flowId} Billing invoice`, 'POST', billingUrl, billingRequestPayload);
                    const response = await axios.post(billingUrl, billingRequestPayload, {
                        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                        timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000,
                        maxRedirects: 0,
                    });
                    billingResponse = response.data;
                    orderFlowLog.logResponse(`${flowId} Billing invoice`, response.status, response.data);
                    if (response.data?.success === false || response.data?.status === false || Number(response.data?.status) >= 400) {
                        const rejection = new Error(response.data?.message || 'Billing rejected the invoice request.');
                        rejection.billingRejected = true;
                        throw rejection;
                    }
                    billingSyncStatus = 'synced';
                    billingStockSyncStatus = 'synced';
                    let localStockSyncError = null;
                    try {
                        const requestedBillingIds = [...new Set(billingRequestPayload.items.map(item => String(item.product_variant_id)))];
                        const localSync = await syncCatalogAfterBillingInvoice(requestedBillingIds);
                        if (localSync.refreshedVariants < requestedBillingIds.length) {
                            billingStockSyncStatus = 'refresh_failed';
                            localStockSyncError = `Billing created the invoice, but only ${localSync.refreshedVariants} of ${requestedBillingIds.length} local variant records were verified after catalog refresh.`;
                        }
                    } catch (stockRefreshError) {
                        billingStockSyncStatus = 'refresh_failed';
                        localStockSyncError = `Billing created the invoice, but the local stock cache could not be refreshed: ${stockRefreshError.message}`;
                    }
                    await order.update({
                        billing_sync_status: billingSyncStatus,
                        billing_sync_error: null,
                        billing_response: billingResponse,
                        billing_stock_sync_status: billingStockSyncStatus,
                        billing_stock_sync_error: localStockSyncError,
                        billing_stock_synced_at: billingStockSyncStatus === 'synced' ? new Date() : null,
                    });
                } catch (billingError) {
                    if (billingError.response) orderFlowLog.logFailure(`${flowId} Billing invoice`, billingError);
                    else if (billingResponse !== null) orderFlowLog.logResponse(`${flowId} Billing invoice`, 'REJECTED', billingResponse);
                    else orderFlowLog.logFailure(`${flowId} Billing invoice`, billingError);
                    billingResponse = billingError.response?.data ?? billingResponse ?? null;
                    billingSyncError = billingError.response?.status
                        ? `Billing invoice request returned HTTP ${billingError.response.status}: ${billingError.response.data?.message || billingError.message}${Number(billingError.response.status) >= 500 ? ' Check Billing before retrying because invoice creation may have completed.' : ''}`
                        : billingError.billingRejected
                            ? billingError.message
                        : billingResponse !== null && !billingError.request
                            ? `Billing returned a response, but the website could not confirm it was saved locally: ${billingError.message}`
                        : billingError.request
                            ? `Billing invoice request outcome is unknown (${billingError.code || 'network error'}). Check Billing before retrying to avoid creating a duplicate invoice.`
                            : billingError.message || 'Could not prepare Billing invoice request.';
                    if (Number(billingError.response?.status) === 422
                        && /insufficient stock/i.test(String(billingError.response?.data?.message || billingError.message || ''))
                        && billingRequestPayload?.items?.length) {
                        try {
                            await billingCatalog.assertBillingStock(billingRequestPayload.items);
                            billingSyncError += ' Immediate Billing GET recheck still reported enough stock; Billing /billings and its GET stock snapshot disagree, or the invoice checks a different stock location.';
                        } catch (stockCheckError) {
                            if (Array.isArray(stockCheckError.stockIssues) && stockCheckError.stockIssues.length) {
                                const latest = stockCheckError.stockIssues
                                    .map(issue => `${issue.label}: ${issue.available} available, ${issue.requested} requested`)
                                    .join('; ');
                                billingSyncError += ` Immediate Billing GET recheck: ${latest}.`;
                            } else {
                                billingSyncError += ` Immediate Billing GET recheck could not confirm current stock: ${stockCheckError.message}`;
                            }
                        }
                    }
                    const uncertainBillingOutcome = (billingError.request && !billingError.response)
                        || (billingResponse !== null && !billingError.response)
                        || Number(billingError.response?.status) >= 500;
                    billingSyncStatus = billingError.billingRejected || (billingError.response && Number(billingError.response.status) < 500)
                        ? 'failed'
                        : uncertainBillingOutcome ? 'unknown' : 'failed';
                    billingStockSyncStatus = billingSyncStatus;
                    let stockRefreshError = billingSyncError;
                    if (billingError.response && Number(billingError.response.status) >= 400 && Number(billingError.response.status) < 500 && billingRequestPayload?.items?.length) {
                        try {
                            const ids = [...new Set(billingRequestPayload.items.map(item => String(item.product_variant_id)))];
                            await syncCatalogAfterBillingInvoice(ids);
                            billingStockSyncStatus = 'synced';
                            stockRefreshError = `${billingSyncError} Billing rejected the invoice, so stock was not decremented; the local catalog was refreshed from Billing.`;
                        } catch (refreshError) {
                            billingStockSyncStatus = 'refresh_failed';
                            stockRefreshError = `${billingSyncError} Local catalog refresh after rejection failed: ${refreshError.message}`;
                        }
                    }
                    try {
                        await order.update({
                            billing_sync_status: billingSyncStatus,
                            billing_sync_error: billingSyncError,
                            billing_response: billingResponse,
                            billing_request_payload: billingRequestPayload,
                            billing_stock_sync_status: billingStockSyncStatus,
                            billing_stock_sync_error: stockRefreshError,
                            billing_stock_synced_at: billingStockSyncStatus === 'synced' ? new Date() : null,
                        });
                    } catch (saveError) {
                        console.error('Could not persist Billing invoice failure:', saveError.message);
                    }
                    console.error('Billing invoice creation failed:', billingSyncError);
                }
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
            if (payment_status === 'paid' && courier_id && billingSyncStatus !== 'synced') {
                shipmentWarning = 'Shipment booking is paused until Billing confirms the invoice and stock decrement.';
            } else if (payment_status === 'paid' && courier_id) {
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
                        status: 'pending',
                    });
                    shipment = { shipmentId: booked.shipmentId, awbCode: booked.awbCode, courierName };
                } catch (error) {
                    shipmentWarning = error.response?.data?.message || error.message || 'Shiprocket booking failed.';
                    await order.update({ shiprocket_booking_error: shipmentWarning, shiprocket_booking_status: 'failed' });
                    console.error('Post-payment Shiprocket booking failed:', error.response?.data || error.message);
                }
            }
            return res.json({ success: true, orderId: order.id, billingSyncStatus, billingSyncError, billingStockSyncStatus, ...(shipment ? { shipment } : {}), ...(shipmentWarning ? { shipmentWarning } : {}) });

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
        total: savedPayload.total ?? (Number(order.subtotal) || 0),
        balance: savedPayload.balance ?? (Number(order.billing_balance) || 0),
        submission_action: 'complete',
    };
};

function makeBillingCreatePayload(snapshot) {
    const items = (Array.isArray(snapshot.items) ? snapshot.items : []).map(item => {
        const variantId = item.product_variant_id;
        if (variantId === undefined || variantId === null || String(variantId).trim() === '') {
            throw new Error('A purchased item has no Billing variant ID. Map every order variant to Billing before invoice creation.');
        }
        const value = String(variantId).trim();
        return {
            product_variant_id: /^\d+$/.test(value) ? Number(value) : value,
            quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
            discount_amount: Number(item.discount_amount) || 0,
        };
    });
    if (!items.length) throw new Error('Billing invoice needs at least one purchased variant.');

    return {
        customer_name: String(snapshot.customer_name || ''),
        customer_phone: String(snapshot.customer_phone || ''),
        customer_email: String(snapshot.customer_email || ''),
        source: 'Website',
        entry_mode: 'Manual',
        price_type: 'MRP',
        payment_mode: 'Online',
        has_gst: false,
        bill_discount_amount: Number(snapshot.bill_discount_amount) || 0,
        paid_amount: Number(snapshot.paid_amount) || 0,
        items,
    };
}

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
        next.total = Number(order.subtotal) || 0;
        next.balance = Number(order.billing_balance) || 0;
        next.submission_action = 'complete';
        await order.update({
            billing_stock_location_id: null,
            billing_price_type: next.price_type || order.billing_price_type,
            billing_has_gst: Boolean(next.has_gst),
            billing_payload: next,
        });
        return res.json({ success: true, orderId: order.id, billingPayload: next, billingSyncStatus: order.billing_sync_status });
    } catch (error) {
        console.error('Update order billing payload failed:', error.message);
        return res.status(500).json({ success: false, message: 'Could not save the order billing details.' });
    }
};

const retryBillingInvoice = async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.payment_status !== 'paid') return res.status(400).json({ success: false, message: 'Only paid orders can be invoiced.' });
    if (order.billing_sync_status === 'synced') return res.status(409).json({ success: false, message: 'Billing already confirmed this invoice.' });
    if (!/HTTP 422: Insufficient stock/i.test(String(order.billing_sync_error || ''))) {
        return res.status(409).json({ success: false, message: 'Automatic retry is allowed only when Billing explicitly rejected the previous request for insufficient stock. Check Billing first if the previous outcome was unknown.' });
    }

    let billingRequestPayload;
    let billingResponse = null;
    try {
        const savedRequest = parseJson(order.billing_request_payload);
        if (!savedRequest) throw new Error('The original Billing request was not saved.');
        billingRequestPayload = makeBillingCreatePayload(savedRequest);
        const stockCheck = await billingCatalog.assertBillingStock(billingRequestPayload.items);
        await order.update({ billing_sync_status: 'pending', billing_sync_error: null });
        const billingBase = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
        const billingUrl = `${billingBase}/billings`;
        orderFlowLog.logRequest(`order-${order.id} Billing invoice retry`, 'POST', billingUrl, billingRequestPayload);
        const response = await axios.post(billingUrl, billingRequestPayload, {
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000,
            maxRedirects: 0,
        });
        billingResponse = response.data;
        orderFlowLog.logResponse(`order-${order.id} Billing invoice retry`, response.status, response.data);
        if (response.data?.success === false || response.data?.status === false || Number(response.data?.status) >= 400) {
            const rejection = new Error(response.data?.message || 'Billing rejected the invoice request.');
            rejection.billingRejected = true;
            throw rejection;
        }

        let stockSyncStatus = 'synced';
        let stockSyncError = null;
        try {
            const ids = [...new Set(billingRequestPayload.items.map(item => String(item.product_variant_id)))];
            const refreshed = await syncCatalogAfterBillingInvoice(ids);
            if (refreshed.refreshedVariants < ids.length) {
                stockSyncStatus = 'refresh_failed';
                stockSyncError = `Invoice created; only ${refreshed.refreshedVariants} of ${ids.length} local variant records were verified after catalog refresh.`;
            }
        } catch (error) {
            stockSyncStatus = 'refresh_failed';
            stockSyncError = `Invoice created, but local stock cache refresh failed: ${error.message}`;
        }
        await order.update({
            billing_sync_status: 'synced',
            billing_sync_error: null,
            billing_request_payload: billingRequestPayload,
            billing_response: response.data,
            billing_stock_sync_status: stockSyncStatus,
            billing_stock_sync_error: stockSyncError,
            billing_stock_synced_at: stockSyncStatus === 'synced' ? new Date() : null,
        });
        return res.json({ success: true, orderId: order.id, billingSyncStatus: 'synced', billingStockSyncStatus: stockSyncStatus, stockCheckedAt: stockCheck.checkedAt });
    } catch (error) {
        if (error.response) orderFlowLog.logFailure(`order-${order.id} Billing invoice retry`, error);
        else if (billingResponse !== null) orderFlowLog.logResponse(`order-${order.id} Billing invoice retry`, 'REJECTED', billingResponse);
        else orderFlowLog.logFailure(`order-${order.id} Billing invoice retry`, error);
        const message = error.response?.status
            ? `Billing invoice request returned HTTP ${error.response.status}: ${error.response.data?.message || error.message}`
            : error.message || 'Could not retry the Billing invoice.';
        const status = error.response?.status && Number(error.response.status) >= 500 ? 'unknown' : 'failed';
        let stockSyncStatus = status;
        let stockSyncError = message;
        if (error.response && Number(error.response.status) >= 400 && Number(error.response.status) < 500 && billingRequestPayload?.items?.length) {
            try {
                const ids = [...new Set(billingRequestPayload.items.map(item => String(item.product_variant_id)))];
                await syncCatalogAfterBillingInvoice(ids);
                stockSyncStatus = 'synced';
                stockSyncError = `${message} Billing rejected the invoice, so stock was not decremented; the local catalog was refreshed from Billing.`;
            } catch (refreshError) {
                stockSyncStatus = 'refresh_failed';
                stockSyncError = `${message} Local catalog refresh after rejection failed: ${refreshError.message}`;
            }
        }
        await order.update({
            billing_sync_status: status,
            billing_sync_error: message,
            ...(billingRequestPayload ? { billing_request_payload: billingRequestPayload } : {}),
            ...(error.response?.data ? { billing_response: error.response.data } : {}),
            billing_stock_sync_status: stockSyncStatus,
            billing_stock_sync_error: stockSyncError,
            billing_stock_synced_at: stockSyncStatus === 'synced' ? new Date() : null,
        });
        return res.status(error.status || error.response?.status || 502).json({ success: false, message, stockIssues: error.stockIssues || [] });
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
        whereClause.status = { [Op.ne]: 'cancelled' };
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
// ─────────────────────────────────────────
// 🔄 UPDATE STATUS
// ─────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'OrderItems' }]
        });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const normalizedStatus = req.body.status.toLowerCase();

        const allowedStatuses = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ success: false, message: 'Status must be pending, confirmed, shipped, out_for_delivery, or delivered.' });
        }

        // Restore stock on cancellation
        if (normalizedStatus === 'cancelled' && order.status !== 'cancelled') {
            const orderItems = order.OrderItems || await OrderItem.findAll({ where: { orderId: order.id } });
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
            status: order.status
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
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'OrderItems' }]
        });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Franchise updates follow the storefront's supported order statuses.
        const newStatus = String(req.body.status || '').toLowerCase();
        const currentStatus = ({ assigned: 'pending', accepted: 'confirmed', packed: 'shipped' })[String(order.status || '').toLowerCase()] || String(order.status || '').toLowerCase();
        const flow = {
            'pending': ['confirmed'],
            'confirmed': ['shipped'],
            'shipped': ['out_for_delivery'],
            'out_for_delivery': ['delivered']
        };

        if (!flow[currentStatus]) {
             return res.status(400).json({ success: false, message: 'Invalid current status for franchise update' });
        }

        if (!flow[currentStatus].includes(newStatus)) {
             return res.status(400).json({ success: false, message: `Cannot change status from ${currentStatus} to ${newStatus}` });
        }

        await order.update({ status: newStatus });

        try {
            await sendOrderStatusEmail(order, newStatus);
        } catch (mailErr) {
            console.error('⚠️ Franchise status change email failed:', mailErr.message);
        }

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
    retryBillingInvoice,
    getAllOrders,
    getCustomerOrders,
    updateOrderStatus,
    assignFranchise,
    updateFranchiseStatus
};
