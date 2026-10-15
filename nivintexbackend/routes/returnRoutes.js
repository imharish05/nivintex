// routes/returnRoutes.js
const express = require('express');
const router  = express.Router();
const {
  requestReturn,
  approveReturn,
  rejectReturn,
  processRefund,
  getAllReturns,
  getCustomerReturns,
} = require('../controllers/returnController');

// Customer routes
router.post('/request',            requestReturn);       // Customer return request
router.get('/customer/:id',        getCustomerReturns);  

// Admin routes
router.get('/',                    getAllReturns);        // All returns
router.post('/:id/approve',        approveReturn);       // Approve return
router.post('/:id/reject',         rejectReturn);        // Reject return
router.post('/:id/refund',         processRefund);       // Razorpay refund

module.exports = router;