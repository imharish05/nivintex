const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const billingCatalog = require('../services/billingCatalogService');

const getAvailableStock = async ({ productId, variantId }) => {
    if (variantId) {
        const variant = await ProductVariant.findByPk(variantId);
        if (!variant || Number(variant.productId) !== Number(productId)) {
            const notFound = new Error('Selected product variant not found');
            notFound.status = 404;
            throw notFound;
        }
        if (variant.billingVariantId) {
            const product = await Product.findByPk(productId);
            if (!product?.billingProductId) throw new Error('This Billing variant is not linked to a Billing product.');
            try {
                // Match checkout's source of truth: current Billing /product_varients.
                const response = await billingCatalog.getProductVariants();
                const remoteVariant = billingCatalog.variantsFromResponse(response).find(item => String(item.id) === String(variant.billingVariantId));
                if (!remoteVariant) {
                    const unavailable = new Error('This variant is no longer listed by Billing. Refresh the product page.');
                    unavailable.status = 409;
                    throw unavailable;
                }
                const remoteProduct = billingCatalog.productsFromResponse(response).find(candidate =>
                    (candidate?.variants || candidate?.product_variants || candidate?.product_varients || [])
                        .some(item => String(item.id) === String(variant.billingVariantId)));
                if (remoteProduct?.id != null && String(remoteProduct.id) !== String(product.billingProductId)) {
                    const mismatch = new Error('This variant does not belong to the selected Billing product. Refresh the product page.');
                    mismatch.status = 409;
                    throw mismatch;
                }
                const stock = billingCatalog.stockValue(remoteVariant);
                if (stock === null) throw new Error('Billing did not return a usable stock quantity.');
                return stock;
            } catch (error) {
                if (error.status) throw error;
                const unavailable = new Error('Could not verify current Billing stock. Please try again.');
                unavailable.status = 503;
                throw unavailable;
            }
        }
        return Number(variant.stock || 0);
    }
    const product = await Product.findByPk(productId);
    if (!product) {
        throw new Error('Product not found');
    }
    return Number(product.stock || 0);
};

// ── CLEAR entire cart (MUST be before /:id) ───────────────────────────────────
router.delete('/clear/:customerId', async (req, res) => {
    try {
        await Cart.destroy({ where: { customerId: req.params.customerId } });
        res.json({ success: true, message: 'Cart cleared' });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ── GET all cart items for a customer ─────────────────────────────────────────
router.get('/customer/:customerId', async (req, res) => {
    try {
        const items = await Cart.findAll({
            where: { customerId: req.params.customerId },
            include: [
                {
                    model: Product,
                    attributes: ['id', 'billingProductId', 'productName', 'franchise_price_final', 'salesPrice', 'isBuyOneGetOne'],
                },
                { model: ProductVariant, as: 'Variant', attributes: ['id', 'billingVariantId', 'franchise_price_final'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(items);
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ── ADD item to cart ──────────────────────────────────────────────────────────
router.post('/add', async (req, res) => {
    try {
        const {
            customerId,
            productId,
            variantId,
            color,
            size,
            fabric,
            name,
            img,
            price,
            quantity,
            weight,
            shippingWeightKg,
            shippingLengthCm,
            shippingWidthCm,
            shippingHeightCm,
            isBuyOneGetOne,
        } = req.body;

        if (!customerId || !productId || !name || price === undefined) {
            return res.status(400).json({ error: 'customerId, productId, name, price are required' });
        }

        const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
        const stock = await getAvailableStock({ productId, variantId });
        const product = await Product.findByPk(productId);
        const variant = variantId ? await ProductVariant.findByPk(variantId) : null;
        const finalPrice = Number(variant?.franchise_price_final ?? product?.franchise_price_final);
        if (!product || !Number.isFinite(finalPrice) || finalPrice < 0) {
            return res.status(400).json({ error: 'The final franchise price is unavailable for this product.' });
        }

        if (stock <= 0) {
            return res.status(400).json({ error: 'This item is out of stock.' });
        }

        const existing = await Cart.findOne({
            where: {
                customerId,
                productId,
                variantId: variantId || null,
            }
        });

        if (existing) {
            const desiredQuantity = existing.quantity + qtyToAdd;
            if (desiredQuantity > stock) {
                return res.status(400).json({ error: `Only ${stock} item${stock === 1 ? '' : 's'} available in stock.` });
            }
            existing.quantity = desiredQuantity;
            existing.color = color || existing.color;
            existing.size = size || existing.size;
            existing.fabric = fabric || existing.fabric;
            existing.price = finalPrice;
            existing.isBuyOneGetOne = isBuyOneGetOne === 'true' || isBuyOneGetOne === true;
            existing.shipping_weight_kg = shippingWeightKg ?? existing.shipping_weight_kg;
            existing.shipping_length_cm = shippingLengthCm ?? existing.shipping_length_cm;
            existing.shipping_width_cm = shippingWidthCm ?? existing.shipping_width_cm;
            existing.shipping_height_cm = shippingHeightCm ?? existing.shipping_height_cm;
            await existing.save();
            return res.json(existing);
        }

        if (qtyToAdd > stock) {
            return res.status(400).json({ error: `Only ${stock} item${stock === 1 ? '' : 's'} available in stock.` });
        }

        const item = await Cart.create({
            customerId,
            productId,
            variantId: variantId || null,
            color: color || null,
            size: size || null,
            fabric: fabric || null,
            name,
            img:         img         || '',
            price: finalPrice,
            quantity:    qtyToAdd,
            weight:      weight      || null,
            shipping_weight_kg: shippingWeightKg || null,
            shipping_length_cm: shippingLengthCm || null,
            shipping_width_cm: shippingWidthCm || null,
            shipping_height_cm: shippingHeightCm || null,
            isBuyOneGetOne: isBuyOneGetOne === 'true' || isBuyOneGetOne === true,
        });

        res.status(201).json(item);
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ── UPDATE quantity ───────────────────────────────────────────────────────────
router.put('/update/:id', async (req, res) => {
    try {
        const item = await Cart.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Cart item not found' });

        const desiredQuantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
        const stock = await getAvailableStock({ productId: item.productId, variantId: item.variantId });

        if (stock <= 0) {
            return res.status(400).json({ error: 'This item is out of stock.' });
        }

        if (desiredQuantity > stock) {
            return res.status(400).json({ error: `Only ${stock} item${stock === 1 ? '' : 's'} available in stock.` });
        }

        item.quantity = desiredQuantity;
        await item.save();
        res.json(item);
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ── REMOVE single item (MUST be last) ────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Cart.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'Cart item not found' });
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (err) {
        console.error('Remove cart error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
