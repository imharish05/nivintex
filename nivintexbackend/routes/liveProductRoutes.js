const express = require('express');
const router  = express.Router();
const {
  uploadFields,
  getAllLiveProducts,
  getLiveProductById,
  addLiveProduct,
  updateLiveProduct,
  deleteLiveProduct,
} = require('../controllers/liveProductController');

// GET    /api/live-products            → all items (includes linkedProduct name)
// GET    /api/live-products/:id        → single item
// POST   /api/live-products/add        → create  (multipart: image + video + productId)
// PUT    /api/live-products/update/:id → update  (multipart: image + video + productId)
// DELETE /api/live-products/:id        → delete

router.get('/',            getAllLiveProducts);
router.get('/:id',         getLiveProductById);
router.post('/add',        uploadFields, addLiveProduct);
router.put('/update/:id',  uploadFields, updateLiveProduct);
router.delete('/:id',      deleteLiveProduct);

module.exports = router;