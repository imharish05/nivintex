const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// Admin routes
router.post('/admin/create', couponController.createCoupon);
router.get('/admin/all', couponController.getAllCoupons);
router.put('/admin/update/:id', couponController.updateCoupon);   // ← also needed by your admin UI
router.delete('/admin/delete/:id', couponController.deleteCoupon);

// Public routes (used by Checkout.jsx)
router.get('/available', couponController.getAvailableCoupons);   // ← was missing
router.post('/apply', couponController.applyCoupon);              // ← was missing

module.exports = router;