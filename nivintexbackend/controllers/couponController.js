const Coupon = require('../models/Coupon');
const { Op } = require('sequelize');

// Create coupon
exports.createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update coupon (needed by admin UI)
exports.updateCoupon = async (req, res) => {
    try {
        await Coupon.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true, message: 'Coupon updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
            attributes: ['code', 'type', 'value', 'min_order', 'max_discount', 'expires_at', 'description']
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /coupons/apply — validates and returns discount (called on Apply button)
exports.applyCoupon = async (req, res) => {
    // Frontend sends: { code, subtotal }
    const { code, subtotal } = req.body;

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
            value: coupon.value
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