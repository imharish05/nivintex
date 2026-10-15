const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const ProductVariant = require('../models/ProductVariant');

// GET all wishlist items for a customer
router.get('/:customerId', async (req, res) => {
    try {
        const items = await Wishlist.findAll({
            where: { customerId: req.params.customerId },
            order: [['createdAt', 'DESC']],
        });
        res.json(items);
    } catch (err) {
        console.error('Get wishlist error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ADD item to wishlist (skip if already exists)
router.post('/add', async (req, res) => {
    try {
        const { customerId, productId, variantId, color, size, fabric, name, img, price, weight, stock, rating, reviews } = req.body;

        if (!customerId || !productId || !name || price === undefined) {
            return res.status(400).json({ error: 'customerId, productId, name, price are required' });
        }

        const existing = await Wishlist.findOne({
            where: {
                customerId,
                productId,
                variantId: variantId || null,
            }
        });
        if (existing) {
            return res.status(200).json({ ...existing.toJSON(), alreadyExists: true });
        }

        const item = await Wishlist.create({
            customerId,
            productId,
            variantId: variantId || null,
            color: color || null,
            size: size || null,
            fabric: fabric || null,
            name,
            img: img || '',
            price,
            weight: weight || '',
            stock: stock !== undefined ? stock : true,
            rating: rating || 4.5,
            reviews: reviews || 0,
        });

        res.status(201).json(item);
    } catch (err) {
        console.error('Add wishlist error:', err);
        res.status(500).json({ error: err.message });
    }
});

// REMOVE a wishlist item by wishlist row id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Wishlist.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'Wishlist item not found' });
        res.json({ success: true, message: 'Item removed from wishlist' });
    } catch (err) {
        console.error('Remove wishlist error:', err);
        res.status(500).json({ error: err.message });
    }
});

// MOVE item from wishlist to cart
router.post('/move-to-cart/:id', async (req, res) => {
    try {
        const wishlistItem = await Wishlist.findByPk(req.params.id);
        if (!wishlistItem) return res.status(404).json({ error: 'Wishlist item not found' });
        const variant = wishlistItem.variantId ? await ProductVariant.findByPk(wishlistItem.variantId) : null;
        if (wishlistItem.variantId && !variant) return res.status(400).json({ error: 'Selected variant is no longer available.' });
        const selectedWeight = [wishlistItem.color, wishlistItem.size, wishlistItem.fabric].filter(Boolean).join(' - ') || wishlistItem.weight || null;

        // Add to cart (or increment if exists)
        const existing = await Cart.findOne({
            where: {
                customerId: wishlistItem.customerId,
                productId: wishlistItem.productId,
                variantId: wishlistItem.variantId || null,
            }
        });

        if (existing) {
            const stock = variant ? Number(variant.stock || 0) : Infinity;
            if (existing.quantity + 1 > stock) return res.status(400).json({ error: 'No additional stock is available for this variant.' });
            existing.quantity += 1;
            await existing.save();
        } else {
            if (variant && Number(variant.stock || 0) < 1) return res.status(400).json({ error: 'This variant is out of stock.' });
            await Cart.create({
                customerId: wishlistItem.customerId,
                productId:  wishlistItem.productId,
                variantId: wishlistItem.variantId || null,
                name:       wishlistItem.name,
                img:        wishlistItem.img,
                price:      wishlistItem.price,
                quantity:   1,
                weight:     selectedWeight,
                color:      wishlistItem.color || null,
                size:       wishlistItem.size || null,
                fabric:     wishlistItem.fabric || null,
            });
        }

        // Remove from wishlist
        await wishlistItem.destroy();

        res.json({ success: true, message: 'Moved to cart' });
    } catch (err) {
        console.error('Move to cart error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
