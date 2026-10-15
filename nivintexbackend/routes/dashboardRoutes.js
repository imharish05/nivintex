// routes/dashboardRoutes.js
const express = require('express');
const router  = express.Router();
const { getDashboardStats, getStockAlerts } = require('../controllers/dashboardController');

router.get('/stats',         getDashboardStats);
router.get('/stock-alerts',  getStockAlerts);   // ← NEW: product-level low/out-of-stock

module.exports = router;