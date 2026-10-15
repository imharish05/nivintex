const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const multer = require('multer');
const path = require('path');

// Image upload setup
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/', categoryController.getAllCategories);
router.post('/add', upload.single('image'), categoryController.createCategory);
router.put('/update/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/delete/:id', categoryController.deleteCategory);

module.exports = router;