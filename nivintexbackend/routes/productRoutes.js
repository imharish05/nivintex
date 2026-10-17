// routes/productRoutes.js
const express           = require('express');
const router            = express.Router();
const productController = require('../controllers/productController');
const multer            = require('multer');
const path              = require('path');
const requireAdmin      = require('../middleware/requireAdmin');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        const prefix = file.fieldname === 'gallery' ? 'gal-' : 'prod-';
        cb(null, prefix + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: {
        fieldSize: 50 * 1024 * 1024,
        fileSize:  10 * 1024 * 1024,
        fields:    100,
        files:     100,          // main + gallery + variant images
    },
});

const handleUpload = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log('MulterError field:', err.field, '| message:', err.message);
            return res.status(400).json({ error: err.message });
        } else if (err) {
            console.log('UploadError:', err.message);
            return res.status(500).json({ error: err.message });
        }
        next();
    });
};

router.get('/',                          productController.getAllProducts);
router.get('/search',                    productController.searchProducts);
router.get('/slug/:slug',                productController.getProductBySlug);
router.put('/billing/:billingProductId/customization', requireAdmin, handleUpload, productController.updateBillingProductCustomization);
router.put('/billing-variants/:billingVariantId/image', requireAdmin, handleUpload, productController.updateBillingVariantImage);
router.post('/add',                      handleUpload, productController.createProduct);
router.put('/update/:id',                handleUpload, productController.updateProduct);
router.put('/update-variants/:id',       handleUpload, productController.updateProductVariantsOnly);
router.put('/update-sale-status/:id',    productController.updateSaleStatus);
router.delete('/:id',                    productController.deleteProduct);
router.delete('/gallery/:imageId',       productController.deleteGalleryImage);
router.get('/new-arrivals',              productController.getNewArrivals);
router.get('/best-sellers',              productController.getBestSellers);
router.get('/:id',                       productController.getProductById);

module.exports = router;
