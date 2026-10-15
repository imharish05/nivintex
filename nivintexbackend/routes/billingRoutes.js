const express = require('express');
const { getCategories, getSubcategories } = require('../controllers/billingController');

const router = express.Router();

router.get('/category', getCategories);
router.get('/subcategory', getSubcategories);

module.exports = router;
