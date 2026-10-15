const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'brand-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/', brandController.getAllBrands);
router.post('/add', upload.single('logo'), brandController.createBrand);
router.put('/update/:id', upload.single('logo'), brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

module.exports = router;