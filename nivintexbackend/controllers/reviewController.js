const { Op } = require('sequelize');
const Review = require('../models/Review');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

const ELIGIBLE_STATUS = 'Delivered';

// Helper: Find delivered item for customer + product
async function findDeliveredItem(customerId, productId) {
    try {
        // Check order items with status 'Delivered'
        const itemLevelMatch = await OrderItem.findOne({
            where: { 
                product_id: productId, 
                status: ELIGIBLE_STATUS 
            },
            include: [{
                model: Order,
                where: { customer_id: customerId },
                attributes: [],
                required: true,
            }],
        });
        
        if (itemLevelMatch) return itemLevelMatch;

        // Fallback: Check orders with status 'Delivered'
        const orderLevelMatch = await OrderItem.findOne({
            where: {
                product_id: productId,
                [Op.or]: [{ status: null }, { status: { [Op.is]: null } }],
            },
            include: [{
                model: Order,
                where: { customer_id: customerId, status: ELIGIBLE_STATUS },
                attributes: [],
                required: true,
            }],
        });
        
        return orderLevelMatch || null;
    } catch (error) {
        console.error('findDeliveredItem error:', error);
        return null;
    }
}

// GET /reviews?admin=1 - Get all reviews (admin) or approved only (public)
exports.getAllReviews = async (req, res) => {
    try {
        const isAdmin = req.query.admin === '1';
        const where = isAdmin ? {} : { status: 'Approved' };

        let reviews = await Review.findAll({
            where,
            include: [
                { 
                    model: Customer, 
                    attributes: ['id', 'name', 'email'],
                    required: false 
                },
                { 
                    model: Product, 
                    attributes: ['id', 'productName'],
                    required: false 
                }
            ],
            order: [['createdAt', 'DESC']],
        });

        // Format response
        const formattedReviews = reviews.map(review => ({
            id: review.id,
            customerId: review.customerId,
            productId: review.productId,
            rating: review.rating,
            feedback: review.feedback,
            comment: review.comment || review.feedback,
            name: review.name || (review.Customer ? review.Customer.name : null),
            email: review.email || (review.Customer ? review.Customer.email : null),
            status: review.status,
            verifiedPurchase: review.verifiedPurchase,
            createdAt: review.createdAt,
            Customer: review.Customer,
            Product: review.Product
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error('getAllReviews error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /reviews/product/:productId - Get approved reviews for a specific product
exports.getByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        let reviews = await Review.findAll({
            where: { 
                productId: productId,
                status: 'Approved' 
            },
            include: [
                { 
                    model: Customer, 
                    attributes: ['id', 'name', 'email'],
                    required: false 
                }
            ],
            order: [['createdAt', 'DESC']],
        });

        // Format response to match expected frontend structure
        const formattedReviews = reviews.map(review => ({
            id: review.id,
            customerId: review.customerId,
            productId: review.productId,
            rating: review.rating,
            feedback: review.feedback,
            comment: review.comment || review.feedback,
            name: review.name || (review.Customer ? review.Customer.name : null),
            email: review.email || (review.Customer ? review.Customer.email : null),
            status: review.status,
            verifiedPurchase: review.verifiedPurchase,
            createdAt: review.createdAt,
            Customer: review.Customer
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error('getByProduct error:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /reviews/can-review?customerId=X&productId=Y
exports.canReview = async (req, res) => {
    const { customerId, productId } = req.query;

    if (!customerId || !productId) {
        return res.status(400).json({ 
            canReview: false, 
            message: 'customerId and productId are required.' 
        });
    }

    try {
        const cId = Number(customerId);
        const pId = Number(productId);

        // Check if already reviewed
        const existing = await Review.findOne({ 
            where: { customerId: cId, productId: pId } 
        });
        
        if (existing) {
            return res.json({ 
                canReview: false, 
                message: 'You have already reviewed this product.' 
            });
        }

        // Check if product was delivered
        const deliveredItem = await findDeliveredItem(cId, pId);
        if (!deliveredItem) {
            return res.json({ 
                canReview: false, 
                message: 'You can review this product only after it has been delivered.' 
            });
        }

        return res.json({ canReview: true, message: '' });
    } catch (err) {
        console.error('canReview error:', err);
        res.status(500).json({ 
            canReview: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// POST /reviews - Add new review
exports.addReview = async (req, res) => {
    const { customerId, productId, rating, feedback, comment, name, email } = req.body;

    // Validation
    if (!customerId || !productId || !rating || !feedback) {
        return res.status(400).json({ 
            success: false, 
            message: 'customerId, productId, rating, and feedback are required.' 
        });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
            success: false, 
            message: 'Rating must be between 1 and 5.' 
        });
    }

    try {
        const cId = Number(customerId);
        const pId = Number(productId);

        // Check for duplicate review
        const existing = await Review.findOne({ 
            where: { customerId: cId, productId: pId } 
        });
        
        if (existing) {
            return res.status(409).json({ 
                success: false, 
                message: 'You have already submitted a review for this product.' 
            });
        }

        // Verify purchase (optional - can be disabled for testing)
        const deliveredItem = await findDeliveredItem(cId, pId);
        const verifiedPurchase = !!deliveredItem;

        // Create review
        const review = await Review.create({
            customerId: cId,
            productId: pId,
            rating: Number(rating),
            feedback: feedback.trim(),
            comment: (comment || feedback).trim(),
            name: name?.trim() || null,
            email: email?.trim() || null,
            status: 'Pending',
            verifiedPurchase: verifiedPurchase,
        });

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully. It will appear after approval.',
            data: review,
        });

    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ 
                success: false, 
                message: 'You have already submitted a review for this product.' 
            });
        }
        console.error('addReview error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// PUT /reviews/update/:id - Update review status
exports.updateReview = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status value.' 
            });
        }

        const review = await Review.findByPk(req.params.id);
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found.' 
            });
        }

        review.status = status;
        await review.save();

        res.json({ 
            success: true, 
            message: `Review ${status.toLowerCase()} successfully.`,
            data: review
        });
    } catch (err) {
        console.error('updateReview error:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// DELETE /reviews/:id - Delete review
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found.' 
            });
        }

        await review.destroy();
        
        res.json({ 
            success: true, 
            message: 'Review deleted successfully.' 
        });
    } catch (err) {
        console.error('deleteReview error:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
}; 