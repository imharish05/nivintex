const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpay = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
    });
};

exports.createOrder = async (req, res) => {
    try {
        const razorpay = getRazorpay();
        const { amount, courierId } = req.body;
        const amountValue = Number(amount);
        const selectedCourierId = Number(courierId);
        if (!Number.isFinite(amountValue) || amountValue <= 0 || !Number.isInteger(selectedCourierId) || selectedCourierId <= 0) {
            return res.status(400).json({ success: false, message: 'A valid payment amount is required.' });
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: { courier_id: String(selectedCourierId) },
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY,
        });
    } catch (error) {
        console.error('Razorpay create order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyRazorpayOrder = async (razorpayOrderId, amount, courierId) => {
    const order = await getRazorpay().orders.fetch(String(razorpayOrderId));
    const courierMatches = !order.notes?.courier_id || String(order.notes.courier_id) === String(courierId);
    return Number(order.amount) === Math.round(Number(amount) * 100)
        && String(order.currency || '').toUpperCase() === 'INR'
        && courierMatches;
};

exports.verifyPayment = async (req, res) => {
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
