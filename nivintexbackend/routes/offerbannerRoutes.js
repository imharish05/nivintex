// routes/offerbannerRoutes.js
const express = require('express');
const router  = express.Router();
const {
  upload,
  getAllOfferBanners,
  getOfferBannerById,
  addOfferBanner,
  updateOfferBanner,
  deleteOfferBanner,
} = require('../controllers/offerbannerController');

// Multer wrapper — turns Multer errors into clean 400 responses
const multerMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

router.get('/',              getAllOfferBanners);
router.get('/:id',           getOfferBannerById);
router.post('/add',          multerMiddleware, addOfferBanner);
router.put('/update/:id',    multerMiddleware, updateOfferBanner);
router.delete('/:id',        deleteOfferBanner);

module.exports = router;