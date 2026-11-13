const Razorpay = require('razorpay');
const crypto = require('crypto');
const { assertBillingStock } = require('../services/billingCatalogService');
const orderFlowLog = require('../utils/orderFlowLogger');

const getRazorpay = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
    });
};

exports.createOrder = async (req, res) => {
    const flowId = `razorpay-create ${req.body?.billingPayload?.items?.map(item => item.product_variant_id).join(',') || `request-${Date.now()}`}`;
    orderFlowLog.attachOrderApiResponseLogger(req, res, flowId);
    try {
        const { amount, courierId, billingPayload, shippingAddress } = req.body;
        const amountValue = Number(amount);
        const isCustomDelivery = !courierId || courierId === 'custom' || courierId === 'custom_delivery' || courierId === 0 || courierId === '0';
        const selectedCourierId = isCustomDelivery ? 0 : Number(courierId);
        if (!Number.isFinite(amountValue) || amountValue <= 0 || (!isCustomDelivery && (!Number.isInteger(selectedCourierId) || selectedCourierId <= 0))) {
            return res.status(400).json({ success: false, message: 'A valid payment amount is required.' });
        }
        const shippingPincode = String(shippingAddress?.zip || shippingAddress?.postcode || shippingAddress?.pincode || '').trim();
        if (!/^[1-9]\d{5}$/.test(shippingPincode)) {
            return res.status(400).json({ success: false, code: 'INVALID_SHIPPING_PINCODE', message: 'Enter a valid 6-digit Indian shipping pincode.' });
        }

        const billingItems = billingPayload?.items;
        const billingAddress = req.body?.billingAddress;
        const customerName = String(billingPayload?.customer_name || '').trim();
        const customerPhone = String(billingPayload?.customer_phone || '').trim();
        const customerEmail = String(billingPayload?.customer_email || '').trim();
        const phoneDigits = customerPhone.replace(/\D/g, '');
        const billingAddressPhoneDigits = String(billingAddress?.phone || customerPhone || '').replace(/\D/g, '');
        const billingAddressComplete = Boolean(
            String(billingAddress?.name || billingAddress?.firstName || customerName || '').trim()
            && String(billingAddress?.address || '').trim()
            && String(billingAddress?.city || '').trim()
            && String(billingAddress?.state || '').trim()
            && /^\d{6}$/.test(String(billingAddress?.zip || billingAddress?.postcode || billingAddress?.pincode || '').trim())
            && String(billingAddress?.country || 'India').trim()
            && billingAddressPhoneDigits.length >= 7
            && billingAddressPhoneDigits.length <= 15
        );
        if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
            || phoneDigits.length < 7 || phoneDigits.length > 15
            || !billingAddressComplete
            || billingPayload?.source !== 'Website'
            || billingPayload?.entry_mode !== 'Manual'
            || (!['franchise', 'mrp'].includes(String(billingPayload?.price_type || '').toLowerCase()))
            || billingPayload?.payment_mode !== 'Online'
            || typeof billingPayload?.has_gst !== 'boolean'
            || (typeof billingPayload?.has_gst !== 'boolean')
            || !Number.isFinite(Number(billingPayload?.bill_discount_amount))
            || Number(billingPayload?.bill_discount_amount) < 0
            || billingItems.some(item => Number(item?.discount_amount ?? 0) !== 0)
            || !Number.isFinite(Number(billingPayload?.paid_amount))
            || Number(billingPayload?.paid_amount) <= 0
            || !Array.isArray(billingItems) || billingItems.length === 0) {
            return res.status(400).json({
                success: false,
                code: 'BILLING_DETAILS_INCOMPLETE',
                message: 'Select or complete a billing address and provide the required Billing customer, payment, and item details before starting payment.',
            });
        }
        for (const item of billingItems) {
            if (item?.product_id === undefined || item?.product_id === null || String(item.product_id).trim() === ''
                || item?.product_variant_id === undefined || item?.product_variant_id === null || String(item.product_variant_id).trim() === ''
                || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1
                || Number(item.discount_amount ?? 0) !== 0) {
                return res.status(400).json({
                    success: false,
                    code: 'BILLING_DETAILS_INCOMPLETE',
                    message: 'Every Billing item needs its product ID, variant ID, quantity, and valid discount before starting payment.',
                });
            }
        }

        let stockCheck;
        try {
            stockCheck = await assertBillingStock(billingItems, { locationId: billingPayload.franchise_location_id });
            orderFlowLog.logResponse(`${flowId} stock check`, 200, stockCheck);
        } catch (stockError) {
            const stockErrorCode = stockError.code || (stockError.status === 409 ? 'INSUFFICIENT_BILLING_STOCK'
                : stockError.billingHttpStatus === 429 || stockError.retryAfterMs != null ? 'BILLING_RATE_LIMITED'
                    : 'BILLING_STOCK_CHECK_FAILED');
            orderFlowLog.logResponse(`${flowId} stock check`, stockError.status || 503, {
                message: stockError.message,
                stockIssues: stockError.stockIssues || [],
                code: stockErrorCode,
            });
            const retryHeader = stockError.retryAfter;
            const parsedRetryHeader = retryHeader == null ? null : Number.isFinite(Number(retryHeader))
                ? Math.max(0, Number(retryHeader))
                : Number.isFinite(Date.parse(retryHeader)) ? Math.max(0, Math.ceil((Date.parse(retryHeader) - Date.now()) / 1000)) : null;
            const retryAfterSeconds = parsedRetryHeader ?? (stockError.retryAfterMs != null ? Math.ceil(stockError.retryAfterMs / 1000) : null);
            if (retryAfterSeconds) res.set('Retry-After', String(retryAfterSeconds));
            return res.status(stockError.status || 503).json({
                success: false,
                code: stockErrorCode,
                message: stockError.message,
                ...(stockError.stockIssues ? { stockIssues: stockError.stockIssues } : {}),
                ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
            });
        }

        // Only initialize/use Razorpay after the server has validated the complete
        // Billing draft and verified live stock for every variant.
        const razorpay = getRazorpay();

        const options = {
            amount: Math.round(amountValue * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: { courier_id: isCustomDelivery ? 'custom' : String(selectedCourierId) },
        };

        orderFlowLog.logRequest(`${flowId} Razorpay order`, 'POST', 'Razorpay SDK orders.create', options);
        const order = await razorpay.orders.create(options);
        orderFlowLog.logResponse(`${flowId} Razorpay order`, 200, {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            receipt: order.receipt,
            notes: order.notes,
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY,
            stockCheckedAt: stockCheck.checkedAt,
        });
    } catch (error) {
        orderFlowLog.logFailure(`${flowId} Razorpay order`, error);
        console.error('Razorpay create order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyRazorpayOrder = async (razorpayOrderId, amount, courierId) => {
    const order = await getRazorpay().orders.fetch(String(razorpayOrderId));
    const isCustom = !courierId || courierId === 'custom' || courierId === 'custom_delivery' || courierId === 0 || courierId === '0';
    const expectedCourier = isCustom ? 'custom' : String(courierId);
    const orderNoteCourier = order.notes?.courier_id ? String(order.notes.courier_id) : '';
    const courierMatches = !orderNoteCourier || orderNoteCourier === expectedCourier || (isCustom && (orderNoteCourier === 'custom' || orderNoteCourier === '0'));
    return Number(order.amount) === Math.round(Number(amount) * 100)
        && String(order.currency || '').toUpperCase() === 'INR'
        && courierMatches;
};

exports.verifyPayment = async (req, res) => {
    const flowId = `razorpay-verify ${req.body?.razorpay_order_id || `request-${Date.now()}`}`;
    orderFlowLog.attachOrderApiResponseLogger(req, res, flowId);
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body)
            .digest('hex');

        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
        const receivedBuffer = typeof razorpay_signature === 'string' ? Buffer.from(razorpay_signature, 'utf8') : null;
        const signaturesMatch = !!receivedBuffer
            && receivedBuffer.length === expectedBuffer.length
            && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
        if (signaturesMatch) {
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Razorpay verify error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
