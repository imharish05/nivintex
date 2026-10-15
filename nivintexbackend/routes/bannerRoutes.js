const express = require('express');
const router  = express.Router();
const {
  upload,
  getAllBanners,
  getBannerById,
  getBannersBySection,
  addBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

router.get('/',                 getAllBanners);
router.get('/section/:section', getBannersBySection);  // must be before /:id
router.get('/:id',              getBannerById);
router.post('/add',             upload.single('image'), addBanner);
router.put('/update/:id',       upload.single('image'), updateBanner);
router.delete('/:id',           deleteBanner);

module.exports = router;