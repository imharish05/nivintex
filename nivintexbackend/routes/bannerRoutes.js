const express = require('express');
const router  = express.Router();
const {
  handleBannerUpload,
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
router.post('/add',             handleBannerUpload, addBanner);
router.put('/update/:id',       handleBannerUpload, updateBanner);
router.delete('/:id',           deleteBanner);

module.exports = router;
