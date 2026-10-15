const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Public routes
router.get('/can-review', reviewController.canReview);
router.get('/', reviewController.getAllReviews);
router.get('/product/:productId', reviewController.getByProduct);
router.post('/', reviewController.addReview);
router.post('/add', reviewController.addReview); // Alias for backward compatibility

// Admin routes
router.put('/update/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;