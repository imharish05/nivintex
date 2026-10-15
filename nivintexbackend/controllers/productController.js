// controllers/productController.js
const Product      = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductVariant = require('../models/ProductVariant');
const Category     = require('../models/Category');
const SubCategory  = require('../models/SubCategory');
const Brand        = require('../models/Brand');
const OrderItem    = require('../models/OrderItem');
const fs           = require('fs');
const path         = require('path');
const { Op }      = require('sequelize');

// ── Shared helper: extract files from req.files array ────────────────────────
function extractFiles(req) {
    const files         = req.files || [];
    const mainImageFile = files.find(f => f.fieldname === 'image');
    const galleryFiles  = files.filter(f => f.fieldname === 'gallery');
    const barcodeImageFile = files.find(f => f.fieldname === 'barcode_image');
    return { mainImageFile, galleryFiles, barcodeImageFile };
}

// ── Shared include config ─────────────────────────────────────────────────────
const PRODUCT_INCLUDE = [
    { model: Category,        attributes: ['id', 'name', 'billingCategoryId'] },
    { model: SubCategory,     attributes: ['id', 'name', 'categoryId'] },
    { model: Brand,           attributes: ['id', 'brandName'] },
    { model: ProductImage,    as: 'Images',   attributes: ['id', 'url', 'sortOrder'], order: [['sortOrder', 'ASC']] },
    { model: ProductVariant,  as: 'Variants', order: [['id', 'ASC']] }
];

// ── Helper: normalise a file path for storage ─────────────────────────────────
const normPath = (p) => p.replace(/\\/g, '/');
const isLocalUpload = (value) => typeof value === 'string' && /^uploads\/prod-[^/\\]+$/i.test(value.replace(/\\/g, '/'));

async function resolveBillingCategoryId(categoryId) {
    if (categoryId === null || categoryId === undefined || categoryId === '') return null;
    const category = await Category.findOne({ where: { billingCategoryId: String(categoryId) } });
    return category ? category.id : null;
}

async function resolveSubCategoryId(subCategoryId, billingCategoryId) {
    if (subCategoryId === null || subCategoryId === undefined || subCategoryId === '') return null;
    const categoryId = await resolveBillingCategoryId(billingCategoryId);
    if (!categoryId) return null;
    const subcategory = await SubCategory.findOne({ where: { id: subCategoryId, categoryId } });
    return subcategory ? subcategory.id : null;
}

// ── Helper: delete a file from disk safely ────────────────────────────────────
const unlinkSafe = (filePath) => {
    if (!filePath) return;
    try {
        const abs = path.resolve(filePath);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (_) { /* ignore */ }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Create Product
// ─────────────────────────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
    try {
        const {
            productName, categoryId, subCategoryId, brandId,
            isNewArrival, isBestSeller, isBuyOneGetOne,
            shortDescription, longDescription,
            mrp, salesPrice, stock,
            product_code, hsn_code, barcode, status,
        } = req.body;

        const colors  = req.body.colors  ? JSON.parse(req.body.colors)  : null;
        const sizes   = req.body.sizes   ? JSON.parse(req.body.sizes)   : null;
        const fabrics = req.body.fabrics ? JSON.parse(req.body.fabrics) : null;
        const weights = req.body.weights ? JSON.parse(req.body.weights) : null;
        const volumes = req.body.volumes ? JSON.parse(req.body.volumes) : null;
        const nos     = req.body.nos     ? JSON.parse(req.body.nos)     : null;

        const { mainImageFile, galleryFiles, barcodeImageFile } = extractFiles(req);
        const imagePath = mainImageFile ? normPath(mainImageFile.path) : null;
        const barcodeImagePath = barcodeImageFile ? normPath(barcodeImageFile.path) : null;
        const localCategoryId = await resolveBillingCategoryId(categoryId);
        if (!localCategoryId) return res.status(400).json({ success: false, error: 'Choose a valid billing category.' });
        const localSubCategoryId = await resolveSubCategoryId(subCategoryId, categoryId);
        if (subCategoryId && !localSubCategoryId) return res.status(400).json({ success: false, error: 'Choose a subcategory under the selected category.' });

        const newProduct = await Product.create({
            productName,
            mrp:              parseFloat(mrp || 0),
            salesPrice:       parseFloat(salesPrice || 0),
            stock:            parseInt(stock || 0, 10),
            categoryId: localCategoryId,
            subCategoryId: localSubCategoryId,
            brandId:          brandId       || null,
            image:            imagePath,
            shortDescription: shortDescription || null,
            longDescription:  longDescription  || null,
            isNewArrival: isNewArrival === 'true' || isNewArrival === true,
            isBestSeller: isBestSeller === 'true' || isBestSeller === true,
            isBuyOneGetOne: isBuyOneGetOne === 'true' || isBuyOneGetOne === true,
            colors, sizes, fabrics, weights, volumes, nos,
            product_code:     product_code || null,
            hsn_code:         hsn_code || null,
            barcode:          barcode || null,
            barcode_image:    barcodeImagePath || null,
            status:           status || 'Active',
        });

        // Save gallery images
        if (galleryFiles.length > 0) {
            const imageRecords = galleryFiles.map((f, i) => ({
                productId: newProduct.id,
                url:       normPath(f.path),
                sortOrder: i,
            }));
            await ProductImage.bulkCreate(imageRecords);
        }

        // Save variants
        const variantsStr = req.body.variants;
        if (variantsStr) {
            try {
                const variantsArr = JSON.parse(variantsStr);
                const variantRecords = [];
                const files = req.files || [];
                
                for (let i = 0; i < variantsArr.length; i++) {
                    const v = variantsArr[i];
                    const vImageFiles = files.filter(f => f.fieldname === `variant_images_${i}`);
                    const imagesArr = vImageFiles.map(f => normPath(f.path));

                    variantRecords.push({
                        productId: newProduct.id,
                        size: v.size || null,
                        color: v.color || null,
                        mrp: parseFloat(v.mrp || 0),
                        salesPrice: parseFloat(v.salesPrice || 0),
                        stock: parseInt(v.stock || 0, 10),
                        image: imagesArr.length > 0 ? imagesArr[0] : null,
                        images: imagesArr,
                        sku: v.sku || null,
                        status: 'Active'
                    });
                }
                
                if (variantRecords.length > 0) {
                    await ProductVariant.bulkCreate(variantRecords);
                }
            } catch (err) {
                console.error("Error saving variants:", err);
            }
        }

        res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Update Product
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            productName, categoryId, subCategoryId, brandId,
            isNewArrival, isBestSeller, isBuyOneGetOne,
            shortDescription, longDescription,
            mrp, salesPrice, stock,
            product_code, hsn_code, barcode, status,
        } = req.body;

        const colors  = req.body.colors  ? JSON.parse(req.body.colors)  : null;
        const sizes   = req.body.sizes   ? JSON.parse(req.body.sizes)   : null;
        const fabrics = req.body.fabrics ? JSON.parse(req.body.fabrics) : null;
        const weights = req.body.weights ? JSON.parse(req.body.weights) : null;
        const volumes = req.body.volumes ? JSON.parse(req.body.volumes) : null;
        const nos     = req.body.nos     ? JSON.parse(req.body.nos)     : null;

        // IDs of existing gallery images the admin wants to KEEP (sent as JSON array)
        const keepImageIds = req.body.keepImageIds
            ? JSON.parse(req.body.keepImageIds)
            : null; // null means "don't touch gallery"

        const { mainImageFile, galleryFiles, barcodeImageFile } = extractFiles(req);

        const localCategoryId = await resolveBillingCategoryId(categoryId);
        if (!localCategoryId) return res.status(400).json({ success: false, error: 'Choose a valid billing category.' });
        const localSubCategoryId = await resolveSubCategoryId(subCategoryId, categoryId);
        if (subCategoryId && !localSubCategoryId) return res.status(400).json({ success: false, error: 'Choose a subcategory under the selected category.' });

        const updateData = {
            productName,
            mrp:              parseFloat(mrp || 0),
            salesPrice:       parseFloat(salesPrice || 0),
            stock:            parseInt(stock || 0, 10),
            categoryId: localCategoryId,
            subCategoryId: localSubCategoryId,
            brandId:          brandId          || null,
            shortDescription: shortDescription || null,
            longDescription:  longDescription  || null,
            isNewArrival: isNewArrival === 'true' || isNewArrival === true,
            isBestSeller: isBestSeller === 'true' || isBestSeller === true,
            isBuyOneGetOne: isBuyOneGetOne === 'true' || isBuyOneGetOne === true,
            colors, sizes, fabrics, weights, volumes, nos,
        };

        if (product_code !== undefined) updateData.product_code = product_code;
        if (hsn_code !== undefined) updateData.hsn_code = hsn_code;
        if (barcode !== undefined) updateData.barcode = barcode;
        if (status !== undefined) updateData.status = status;

        if (mainImageFile) {
            updateData.image = normPath(mainImageFile.path);
        }
        if (barcodeImageFile) {
            updateData.barcode_image = normPath(barcodeImageFile.path);
        }

        await Product.update(updateData, { where: { id } });

        // ── Gallery management ────────────────────────────────────────────────
        if (keepImageIds !== null) {
            // Delete gallery rows NOT in keepImageIds, and their files
            const toDelete = await ProductImage.findAll({
                where: { productId: id },
            });
            for (const img of toDelete) {
                if (!keepImageIds.includes(img.id)) {
                    unlinkSafe(img.url);
                    await img.destroy();
                }
            }
        }

        // Add new gallery uploads
        if (galleryFiles.length > 0) {
            const existing = await ProductImage.count({ where: { productId: id } });
            const imageRecords = galleryFiles.map((f, i) => ({
                productId: Number(id),
                url:       normPath(f.path),
                sortOrder: existing + i,
            }));
            await ProductImage.bulkCreate(imageRecords);
        }

        // Sync variants
        const variantsStr = req.body.variants;
        if (variantsStr) {
            try {
                const variantsArr = JSON.parse(variantsStr);
                const files = req.files || [];
                
                // Fetch existing variants
                const existingVariants = await ProductVariant.findAll({ where: { productId: id } });
                const existingMap = {};
                existingVariants.forEach(v => {
                    // Create a unique key per size-color
                    const key = `${v.size || ''}-${v.color || ''}`;
                    existingMap[key] = v;
                });
                
                const keepKeys = new Set();
                
                for (let i = 0; i < variantsArr.length; i++) {
                    const v = variantsArr[i];
                    const keepImagesStr = req.body[`keepVariantImages_${i}`];
                    let keepImages = [];
                    if (keepImagesStr) {
                        try { keepImages = JSON.parse(keepImagesStr); } catch(e) {}
                    }

                    const vImageFiles = files.filter(f => f.fieldname === `variant_images_${i}`);
                    const newImagesArr = vImageFiles.map(f => normPath(f.path));
                    console.log(`Variant ${i} - keepImages:`, keepImages, `newImages:`, newImagesArr);

                    const key = `${v.size || ''}-${v.color || ''}`;
                    keepKeys.add(key);
                    
                    const variantData = {
                        size: v.size || null,
                        color: v.color || null,
                        mrp: parseFloat(v.mrp || 0),
                        salesPrice: parseFloat(v.salesPrice || 0),
                        stock: parseInt(v.stock || 0, 10),
                        sku: v.sku || null,
                        status: 'Active'
                    };
                    
                    if (existingMap[key]) {
                        // Update
                        let existingImages = existingMap[key].images || [];
                        if (!Array.isArray(existingImages)) existingImages = [];
                        
                        // Delete removed images
                        for (const img of existingImages) {
                            if (!keepImages.includes(img)) {
                                unlinkSafe(img);
                            }
                        }
                        
                        const finalImages = [...keepImages, ...newImagesArr];
                        variantData.image = finalImages.length > 0 ? finalImages[0] : null;
                        variantData.images = finalImages;

                        await existingMap[key].update(variantData);
                    } else {
                        // Create
                        const finalImages = newImagesArr;
                        variantData.productId = id;
                        variantData.image = finalImages.length > 0 ? finalImages[0] : null;
                        variantData.images = finalImages;
                        await ProductVariant.create(variantData);
                    }
                }
                
                // Delete variants no longer in the matrix
                for (const key in existingMap) {
                    if (!keepKeys.has(key)) {
                        unlinkSafe(existingMap[key].image);
                        await existingMap[key].destroy();
                    }
                }
                
            } catch (err) {
                console.error("Error updating variants:", err);
            }
        }

        res.status(200).json({ success: true, message: 'Updated!' });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Update Product Variants Only
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProductVariantsOnly = async (req, res) => {
    try {
        const { id } = req.params;
        
        const colors  = req.body.colors  ? JSON.parse(req.body.colors)  : null;
        const sizes   = req.body.sizes   ? JSON.parse(req.body.sizes)   : null;
        const fabrics = req.body.fabrics ? JSON.parse(req.body.fabrics) : null;
        const weights = req.body.weights ? JSON.parse(req.body.weights) : null;
        const volumes = req.body.volumes ? JSON.parse(req.body.volumes) : null;
        const nos     = req.body.nos     ? JSON.parse(req.body.nos)     : null;

        await Product.update({
            colors, sizes, fabrics, weights, volumes, nos
        }, { where: { id } });

        const variantsStr = req.body.variants;
        if (variantsStr) {
            try {
                const variantsArr = JSON.parse(variantsStr);
                const files = req.files || [];
                
                const existingVariants = await ProductVariant.findAll({ where: { productId: id } });
                const existingMap = {};
                existingVariants.forEach(v => {
                    const key = `${v.size || ''}-${v.color || ''}`;
                    existingMap[key] = v;
                });
                
                const keepKeys = new Set();
                
                for (let i = 0; i < variantsArr.length; i++) {
                    const v = variantsArr[i];
                    const keepImagesStr = req.body[`keepVariantImages_${i}`];
                    let keepImages = [];
                    if (keepImagesStr) {
                        try { keepImages = JSON.parse(keepImagesStr); } catch(e) {}
                    }

                    const vImageFiles = files.filter(f => f.fieldname === `variant_images_${i}`);
                    const newImagesArr = vImageFiles.map(f => normPath(f.path));

                    const key = `${v.size || ''}-${v.color || ''}`;
                    keepKeys.add(key);
                    
                    const variantData = {
                        size: v.size || null,
                        color: v.color || null,
                        mrp: parseFloat(v.mrp || 0),
                        salesPrice: parseFloat(v.salesPrice || 0),
                        stock: parseInt(v.stock || 0, 10),
                        sku: v.sku || null,
                        status: 'Active'
                    };
                    
                    if (existingMap[key]) {
                        let existingImages = existingMap[key].images || [];
                        if (!Array.isArray(existingImages)) existingImages = [];
                        
                        for (const img of existingImages) {
                            if (!keepImages.includes(img)) unlinkSafe(img);
                        }
                        
                        const finalImages = [...keepImages, ...newImagesArr];
                        variantData.image = finalImages.length > 0 ? finalImages[0] : null;
                        variantData.images = finalImages;

                        await existingMap[key].update(variantData);
                    } else {
                        const finalImages = newImagesArr;
                        variantData.productId = id;
                        variantData.image = finalImages.length > 0 ? finalImages[0] : null;
                        variantData.images = finalImages;
                        await ProductVariant.create(variantData);
                    }
                }
                
                for (const key in existingMap) {
                    if (!keepKeys.has(key)) {
                        let existingImages = existingMap[key].images || [];
                        if (!Array.isArray(existingImages)) existingImages = [];
                        for (const img of existingImages) unlinkSafe(img);
                        await existingMap[key].destroy();
                    }
                }
                
            } catch (err) {
                console.error("Error updating variants:", err);
            }
        }

        res.status(200).json({ success: true, message: 'Variants updated!' });
    } catch (err) {
        console.error("Error updating product variants:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get All Products
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: PRODUCT_INCLUDE,
            order: [['id', 'DESC']],
        });
        const mappedProducts = products.map(p => ({
            id: p.id,
            category_id: p.categoryId,
            subcategory_id: p.subCategoryId,
            product_code: p.product_code,
            hsn_code: p.hsn_code,
            barcode: p.barcode,
            barcode_image: p.barcode_image,
            name: p.productName,
            description: p.shortDescription || p.longDescription,
            main_image: p.image,
            status: p.status,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
            ...p.toJSON(),
            franchise_price_final: p.franchise_price_final,
            billingSubcategoryId: p.billingSubcategoryId,
            billing_subcategory_id: p.billingSubcategoryId,
            billingCategoryId: p.Category?.billingCategoryId || null,
            billing_category_id: p.Category?.billingCategoryId || null,
            shipping_weight_kg: p.shippingWeightKg,
            shipping_length_cm: p.shippingLengthCm,
            shipping_width_cm: p.shippingWidthCm,
            shipping_height_cm: p.shippingHeightCm,
            shippingWeightKg: p.shippingWeightKg,
            shippingLengthCm: p.shippingLengthCm,
            shippingWidthCm: p.shippingWidthCm,
            shippingHeightCm: p.shippingHeightCm,
        }));
        res.status(200).json({ status: 200, products: mappedProducts });
    } catch (err) {
        res.status(500).json({ message: 'Error', error: err.message });
    }
};

// Search the product catalog in the database; the storefront does not filter
// an already-loaded product list for header search.
exports.searchProducts = async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();
        if (query.length < 2) return res.status(200).json({ products: [] });
        const term = `%${query}%`;

        // Also find any matching category or subcategory IDs
        const matchedCategories = await Category.findAll({ where: { name: { [Op.like]: term } }, attributes: ['id'] }).catch(() => []);
        const matchedSubCategories = await SubCategory.findAll({ where: { name: { [Op.like]: term } }, attributes: ['id'] }).catch(() => []);
        const catIds = (matchedCategories || []).map(c => c.id);
        const subCatIds = (matchedSubCategories || []).map(s => s.id);

        const orConditions = [
            { productName: { [Op.like]: term } },
            { product_code: { [Op.like]: term } },
            { barcode: { [Op.like]: term } },
            { hsn_code: { [Op.like]: term } },
            { shortDescription: { [Op.like]: term } },
            { longDescription: { [Op.like]: term } },
        ];

        if (catIds.length > 0) {
            orConditions.push({ categoryId: { [Op.in]: catIds } });
        }
        if (subCatIds.length > 0) {
            orConditions.push({ subCategoryId: { [Op.in]: subCatIds } });
        }

        const products = await Product.findAll({
            where: {
                [Op.or]: orConditions,
            },
            include: PRODUCT_INCLUDE,
            order: [['productName', 'ASC']],
            limit: 30,
        });
        return res.json({ products: products.map(product => product.toJSON()) });
    } catch (error) {
        console.error('Product search failed:', error);
        return res.status(500).json({ success: false, message: 'Could not search products.' });
    }
};

// Save only storefront-owned product fields; Billing remains the source of product data.
exports.updateBillingProductCustomization = async (req, res) => {
    try {
        const product = await Product.findOne({ where: { billingProductId: String(req.params.billingProductId) } });
        if (!product) return res.status(404).json({ success: false, message: 'Billing product not found. Refresh the product list and try again.' });

        const update = {};
        if (req.body.isNewArrival !== undefined) update.isNewArrival = req.body.isNewArrival === 'true' || req.body.isNewArrival === true;
        if (req.body.isBestSeller !== undefined) update.isBestSeller = req.body.isBestSeller === 'true' || req.body.isBestSeller === true;
        const shippingFields = [
            ['shippingWeightKg', 'shipping_weight_kg'],
            ['shippingLengthCm', 'shipping_length_cm'],
            ['shippingWidthCm', 'shipping_width_cm'],
            ['shippingHeightCm', 'shipping_height_cm'],
        ];
        const requiredShippingFields = new Set(shippingFields.map(([, field]) => field));
        for (const [attribute, field] of shippingFields) {
            const raw = req.body[field] ?? req.body[attribute];
            if (raw === undefined || raw === '') {
                if (requiredShippingFields.has(field)) {
                    return res.status(400).json({ success: false, message: `${field} is required for Shiprocket shipments.` });
                }
                continue;
            }
            const value = Number(raw);
            if (!Number.isFinite(value) || value <= 0) {
                return res.status(400).json({ success: false, message: `${field} must be a positive number or blank.` });
            }
            update[attribute] = value;
        }
        if (req.files?.some(file => file.fieldname === 'image')) {
            update.image = normPath(req.files.find(file => file.fieldname === 'image').path);
        } else if (req.body.removeImage === 'true') {
            update.image = null;
        }

        if (!Object.keys(update).length) return res.status(400).json({ success: false, message: 'Update shipping details, choose an image, or change a storefront flag.' });
        const previousImage = product.image;
        await product.update(update);
        if (update.image !== undefined && isLocalUpload(previousImage) && previousImage !== update.image) unlinkSafe(previousImage);
        return res.status(200).json({ success: true, product });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Variant metadata and stock are Billing-owned. Local variant image galleries are editable here.
exports.updateBillingVariantImage = async (req, res) => {
    try {
        const variant = await ProductVariant.findOne({ where: { billingVariantId: String(req.params.billingVariantId) } });
        if (!variant) return res.status(404).json({ success: false, message: 'Billing variant not found. Refresh the product list and try again.' });

        const files = (req.files || []).filter(item => item.fieldname === 'images' || item.fieldname === 'image');
        const hasKeepImages = req.body.keepImages !== undefined;
        let currentImages = Array.isArray(variant.images) ? variant.images : [];
        if (currentImages.length === 0 && variant.image) currentImages = [variant.image];

        let keepImages = [];
        if (req.body.removeImage === 'true') {
            keepImages = [];
        } else if (hasKeepImages) {
            try {
                const requestedImages = JSON.parse(req.body.keepImages);
                if (!Array.isArray(requestedImages)) throw new Error('Expected an image list.');
                // Only retain paths already associated with this variant.
                keepImages = requestedImages.filter(image => currentImages.includes(image));
            } catch (_) {
                return res.status(400).json({ success: false, message: 'Invalid keepImages value.' });
            }
        } else if (!files.length) {
            return res.status(400).json({ success: false, message: 'Choose images to upload or provide an image removal request.' });
        }

        const uploadedImages = files.map(file => normPath(file.path));
        const nextImages = [...new Set([...keepImages, ...uploadedImages])];
        const previousImages = [...new Set([...currentImages, variant.image].filter(Boolean))];
        await variant.update({ image: nextImages[0] || null, images: nextImages }, { hooks: false });
        previousImages
            .filter(image => isLocalUpload(image) && !nextImages.includes(image))
            .forEach(unlinkSafe);
        return res.status(200).json({ success: true, variant });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Get New Arrivals
// ─────────────────────────────────────────────────────────────────────────────
exports.getNewArrivals = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { isNewArrival: true },
            include: PRODUCT_INCLUDE,
            limit: 8,
            order: [['created_at', 'DESC']],
        });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Get Best Sellers
// ─────────────────────────────────────────────────────────────────────────────
exports.getBestSellers = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { isBestSeller: true },
            include: PRODUCT_INCLUDE,
            order: [['created_at', 'DESC']],
        });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Delete Product
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete gallery files from disk before removing DB rows
        const images = await ProductImage.findAll({ where: { productId: id } });
        images.forEach(img => unlinkSafe(img.url));

        const deleted = await Product.destroy({ where: { id } });
        if (deleted) {
            res.status(200).json({ success: true, message: 'Product deleted!' });
        } else {
            res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Get Product By ID
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: PRODUCT_INCLUDE,
        });
        if (product) {
            const mappedProduct = {
                id: product.id,
                category_id: product.categoryId,
                subcategory_id: product.subCategoryId,
                product_code: product.product_code,
                hsn_code: product.hsn_code,
                barcode: product.barcode,
                barcode_image: product.barcode_image,
                name: product.productName,
                description: product.shortDescription || product.longDescription,
                main_image: product.image,
                status: product.status,
                created_at: product.createdAt,
                updated_at: product.updatedAt,
                variants: product.Variants?.map(v => ({
                    id: v.id,
                    product_id: v.productId,
                    variant_code: v.variant_code,
                    size: v.size,
                    color: v.color,
                    sku: v.sku,
                    wholesale_price: v.wholesale_price,
                    wholesale_discount_type: v.wholesale_discount_type,
                    wholesale_discount_value: v.wholesale_discount_value,
                    wholesale_final_price: v.wholesale_final_price,
                    retail_price: v.retail_price,
                    retail_discount_type: v.retail_discount_type,
                    retail_discount_value: v.retail_discount_value,
                    retail_final_price: v.retail_final_price,
                    franchise_price_final: v.franchise_price_final,
                    mrp: v.mrp,
                    selling_price: v.franchise_price_final || v.selling_price || v.salesPrice,
                    status: v.status,
                    created_at: v.createdAt,
                    updated_at: v.updatedAt,
                    ...v.toJSON()
                })) || [],
                ...product.toJSON(),
                billingCategoryId: product.Category?.billingCategoryId || null,
                billing_category_id: product.Category?.billingCategoryId || null,
            };
            res.status(200).json({ status: 200, products: mappedProduct });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. Delete a single gallery image
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteGalleryImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const img = await ProductImage.findByPk(imageId);
        if (!img) return res.status(404).json({ success: false, message: 'Image not found' });
        unlinkSafe(img.url);
        await img.destroy();
        res.status(200).json({ success: true, message: 'Gallery image deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 10. Update Sale Status
exports.updateSaleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBuyOneGetOne } = req.body;

        const updateData = {};
        if (isBuyOneGetOne !== undefined) {
            updateData.isBuyOneGetOne = isBuyOneGetOne === 'true' || isBuyOneGetOne === true;
        }

        await Product.update(updateData, { where: { id } });
        res.status(200).json({ success: true, message: 'Sale status updated!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 11. Get All Product Variants
exports.getAllProductVariants = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: PRODUCT_INCLUDE,
            order: [['id', 'DESC']],
        });
        const mappedProducts = products.map(p => ({
            id: p.id,
            category_id: p.categoryId,
            product_code: p.product_code,
            hsn_code: p.hsn_code,
            barcode: p.barcode,
            barcode_image: p.barcode_image,
            name: p.productName,
            description: p.shortDescription || p.longDescription,
            main_image: p.image,
            status: p.status,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
            variants: p.Variants?.map(v => ({
                id: v.id,
                product_id: v.productId,
                variant_code: v.variant_code,
                size: v.size,
                color: v.color,
                sku: v.sku,
                wholesale_price: v.wholesale_price,
                wholesale_discount_type: v.wholesale_discount_type,
                wholesale_discount_value: v.wholesale_discount_value,
                wholesale_final_price: v.wholesale_final_price,
                retail_price: v.retail_price,
                retail_discount_type: v.retail_discount_type,
                retail_discount_value: v.retail_discount_value,
                retail_final_price: v.retail_final_price,
                
                franchise_price_final: v.franchise_price_final,
                mrp: v.mrp,
                selling_price: v.franchise_price_final || v.selling_price || v.salesPrice,
                status: v.status,
                created_at: v.createdAt,
                updated_at: v.updatedAt,
                ...v.toJSON()
            })) || [],
            ...p.toJSON()
        }));
        res.status(200).json({ status: 200, product_varients: mappedProducts });
    } catch (err) {
        res.status(500).json({ message: 'Error', error: err.message });
    }
};
