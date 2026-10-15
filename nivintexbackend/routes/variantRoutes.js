// routes/variantRoutes.js
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const ctrl       = require('../controllers/variantController');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, 'var-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const handleUpload = (req, res, next) =>
  upload.any()(req, res, (err) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
    if (err) return res.status(500).json({ error: err.message });
    next();
  });

// Routes scoped under /api/variants
router.get('/product/:productId',           ctrl.getVariantsByProduct);   // GET all variants for a product
router.post('/product/:productId/add',      handleUpload, ctrl.addVariant);       // POST add one variant
router.post('/product/:productId/bulk',     handleUpload, ctrl.bulkSetVariants);  // POST replace all variants
router.get('/:id',                          ctrl.getVariantById);         // GET single variant
router.put('/update/:id',                   handleUpload, ctrl.updateVariant);    // PUT update variant
router.delete('/:id',                       ctrl.deleteVariant);          // DELETE variant

module.exports = router;