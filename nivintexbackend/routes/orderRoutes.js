// routes/orderRoutes.js
const express = require('express');
const router  = express.Router();

const {
  createOrder,
  getBillingPayload,
  updateBillingPayload,
  retryBillingInvoice,
  getAllOrders,
  getCustomerOrders,
  updateOrderStatus,
  assignFranchise,
  updateFranchiseStatus
} = require('../controllers/orderController');
const requireAdmin = require('../middleware/requireAdmin');

router.post  ('/save',            createOrder);
router.get   ('/:id/billing-payload', requireAdmin, getBillingPayload);
router.put   ('/:id/billing-payload', requireAdmin, updateBillingPayload);
router.post  ('/:id/retry-billing', requireAdmin, retryBillingInvoice);
router.get   ('/all',             getAllOrders);
router.get   ('/customer/:id',    getCustomerOrders);
router.patch ('/:id/status',      updateOrderStatus);
router.put   ('/:id/assign-franchise', requireAdmin, assignFranchise);
router.put   ('/:id/franchise-status', updateFranchiseStatus);

module.exports = router;
