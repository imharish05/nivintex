const express = require('express');
const { syncData, syncProducts } = require('../controllers/syncController');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
router.post('/billing', requireAdmin, syncData);
router.post('/billing/products', requireAdmin, syncProducts);

module.exports = router;
