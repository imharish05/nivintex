const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { Op } = require('sequelize');

function parseAndValidateExpiry(rawExpiry) {
    if (rawExpiry === undefined || rawExpiry === null || String(rawExpiry).trim() === '') {
        return { value: null, error: null };
    }
    const trimmed = String(rawExpiry).trim();
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
        ? new Date(`${trimmed}T23:59:59.999`)
        : new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return { value: null, error: 'Invalid expiry date.' };
    }
    if (parsed <= new Date()) {
        return { value: null, error: 'Expiry date cannot be in the past.' };
    }
    return { value: parsed, error: null };
}

// Create coupon
exports.createCoupon = async (req, res) => {
    try {
        const { value: parsedExpiry, error: expiryError } = parseAndValidateExpiry(req.body.expires_at);
        if (expiryError) {
            return res.status(400).json({ success: false, message: expiryError });
        }
        const payload = {
            ...req.body,
            code: String(req.body.code || '').trim().toUpperCase(),
            expires_at: parsedExpiry,
        };
        const coupon = await Coupon.create(payload);
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update coupon (needed by admin UI)
exports.updateCoupon = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (Object.prototype.hasOwnProperty.call(req.body, 'expires_at')) {
            const { value: parsedExpiry, error: expiryError } = parseAndValidateExpiry(req.body.expires_at);
            if (expiryError) {
                return res.status(400).json({ success: false, message: expiryError });
            }
            payload.expires_at = parsedExpiry;
        }
        if (payload.code !== undefined) {
            payload.code = String(payload.code).trim().toUpperCase();
        }
        await Coupon.update(payload, { where: { id: req.params.id } });
        res.json({ success: true, message: 'Coupon updated' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get all coupons (Admin)
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll();
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /coupons/available — returns active, non-expired coupons for modal display
exports.getAvailableCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({
            where: {
                is_active: true,
                [Op.or]: [
                    { expires_at: { [Op.gt]: new Date() } },
                    { expires_at: null }
                ]
            },
            attributes: ['code', 'type', 'value', 'min_order', 'max_discount', 'max_uses_per_user', 'expires_at', 'description']
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /coupons/apply — validates and returns discount (called on Apply button)
exports.applyCoupon = async (req, res) => {
    // Frontend sends: { code, subtotal }
    const { code, subtotal, customer_email, customer_phone, customer_id } = req.body;

    try {
        const coupon = await Coupon.findOne({
            where: {
                code: code.trim().toUpperCase(),
                is_active: true,
                [Op.or]: [
                    { expires_at: { [Op.gt]: new Date() } },
                    { expires_at: null }
                ]
            }
        });

        if (!coupon) {
            return res.json({ success: false, message: 'Invalid or expired coupon code.' });
        }

        if (parseFloat(subtotal) < parseFloat(coupon.min_order)) {
            return res.json({
                success: false,
                message: `Minimum order of ₹${coupon.min_order} required for this coupon.`
            });
        }


        // Check per-person usage limit
        if (coupon.max_uses_per_user && Number(coupon.max_uses_per_user) > 0) {
            const userConditions = [];
            if (customer_id) userConditions.push({ customer_id });
            if (customer_email && customer_email.trim()) userConditions.push({ customer_email: customer_email.trim() });
            if (customer_phone && customer_phone.trim()) userConditions.push({ customer_phone: customer_phone.trim() });

            if (userConditions.length === 0) {
                return res.json({
                    success: false,
                    message: 'Enter your email or phone number to use this coupon.'
                });
            }

            const usedCount = await Order.count({
                where: {
                    coupon_code: coupon.code,
                    status: { [Op.ne]: 'cancelled' },
                    [Op.or]: userConditions
                }
            });

            if (usedCount >= Number(coupon.max_uses_per_user)) {
                return res.json({
                    success: false,
                    message: `You have reached the maximum usage limit (${coupon.max_uses_per_user} time${Number(coupon.max_uses_per_user) > 1 ? 's' : ''}) for this coupon.`
                });
            }
        }
        // Calculate discount
        let discount = 0;
        let label = '';

        if (coupon.type === 'percent') {
            discount = parseFloat(subtotal) * (parseFloat(coupon.value) / 100);
            if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
                discount = parseFloat(coupon.max_discount);
            }
            label = `${coupon.value}% off${coupon.max_discount ? ` (max ₹${coupon.max_discount})` : ''}`;
        } else {
            discount = parseFloat(coupon.value);
            label = `₹${coupon.value} off`;
        }

        // Response shape matches what Checkout.jsx expects
        res.json({
            success: true,
            discount: parseFloat(discount.toFixed(2)),
            code: coupon.code,
            label,
            type: coupon.type,
            value: coupon.value,
            max_discount: coupon.max_discount == null ? null : Number(coupon.max_discount),
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete coupon
exports.deleteCoupon = async (req, res) => {
    try {
        await Coupon.destroy({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
