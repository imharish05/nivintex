const express = require('express');
const { getCategories, getSubcategories, getProducts, getProductVariants, getProductDetails, getStocks } = require('../controllers/billingController');

const router = express.Router();

router.get('/category', getCategories);
router.get('/subcategory', getSubcategories);
router.get('/products', getProducts);
router.get('/product-varients', getProductVariants);
router.get('/product-details/:id', getProductDetails);
router.get('/stocks', getStocks);

module.exports = router;
