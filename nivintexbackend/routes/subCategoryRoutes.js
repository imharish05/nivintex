const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');
const multer = require('multer');
const billingCatalog = require('../services/billingCatalogService');

const mapSubcategory = (subcategory) => {
    const row = subcategory.toJSON();
    return {
        ...row,
        billingCategoryId: row.Category?.billingCategoryId || null,
    };
};

async function resolveLocalCategoryId(categoryId, categoryName) {
    let category = await Category.findOne({ where: { billingCategoryId: String(categoryId) } });
    if (!category && categoryName) {
        category = await Category.create({
            billingCategoryId: String(categoryId),
            name: categoryName,
            status: 'Active',
        });
    }
    return category?.id || null;
}

async function getBillingSubcategories() {
    const subcategoryPayload = await billingCatalog.getEndpoint('/subcategory');
    let categoryPayload = null;
    try { categoryPayload = await billingCatalog.getEndpoint('/category'); } catch { /* category names can be absent if that endpoint is unavailable */ }
    const rowsFor = (payload, key) => {
        const candidates = [payload?.[key], payload?.data?.[key], payload?.data?.data?.[key], payload?.data, payload?.result?.[key], payload];
        const value = candidates.find(item => Array.isArray(item)) || candidates.find(item => item && typeof item === 'object' && (item.id != null || item.category_id != null || item.subcategory_id != null));
        return Array.isArray(value) ? value : value ? [value] : [];
    };
    const categories = categoryPayload ? rowsFor(categoryPayload, 'category') : [];
    const categoriesById = new Map(categories.map(category => [String(category.id ?? category.category_id ?? category.categoryId), category]));
    return rowsFor(subcategoryPayload, 'subcategory').map(row => {
        const rawCategory = row.category_id ?? row.categoryId ?? row.cat_id ?? row.category ?? row.Category;
        const categoryId = typeof rawCategory === 'object' && rawCategory !== null
            ? (rawCategory.id ?? rawCategory.category_id ?? rawCategory.value)
            : rawCategory;
        const category = (categoryId !== undefined && categoryId !== null ? categoriesById.get(String(categoryId)) : null)
            || (typeof rawCategory === 'object' ? rawCategory : null)
            || (typeof rawCategory === 'string' ? categories.find(item => String(item.name || item.category_name || item.categoryName || '').trim().toLowerCase() === rawCategory.trim().toLowerCase()) : null);
        return {
        ...row,
        name: row.name || row.subcategory_name || row.sub_category_name,
        billingSubcategoryId: String(row.id),
        billing_subcategory_id: String(row.id),
        category_id: categoryId ?? null,
        categoryId: categoryId ?? null,
        category_name: row.category_name || row.categoryName || category?.name || category?.category_name || category?.categoryName || (typeof rawCategory === 'string' && Number.isNaN(Number(rawCategory)) ? rawCategory : ''),
        category: category || undefined,
        };
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/local', async (req, res) => {
    try {
        const data = await SubCategory.findAll({ include: Category, order: [['id', 'DESC']] });
        res.json(data.map(mapSubcategory));
    } catch (err) { 
        console.error("Fetch Error:", err);
        res.status(502).json({ error: 'Could not load subcategories from Billing API.' }); 
    }
});

router.get('/category/:categoryId', async (req, res) => {
    try {
        const category = await Category.findOne({ where: { billingCategoryId: String(req.params.categoryId) } });
        if (!category) return res.json([]);
        const data = await SubCategory.findAll({
            where: { categoryId: category.id, status: 'Active' },
            include: Category,
            order: [['name', 'ASC']],
        });
        res.json(data.map(mapSubcategory));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Billing catalog IDs are kept distinct from this store's local subcategory IDs.
router.get('/', async (_req, res) => {
    try { return res.json(await getBillingSubcategories()); }
    catch (err) { return res.status(502).json({ error: 'Could not load subcategories from Billing API.' }); }
});

router.get('/billing', async (_req, res) => {
    try { return res.json(await getBillingSubcategories()); }
    catch (err) { return res.status(502).json({ error: 'Could not load subcategories from Billing API.' }); }
});

// POST add
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, categoryId, categoryName, status } = req.body;
        const localCategoryId = await resolveLocalCategoryId(categoryId, categoryName);
        if (!localCategoryId) return res.status(400).json({ error: 'Choose a valid billing category.' });
        const image = req.file ? `uploads/${req.file.filename}` : null;
        const sub = await SubCategory.create({ name, categoryId: localCategoryId, image, status });
        const result = await SubCategory.findByPk(sub.id, { include: Category });
        res.status(201).json(mapSubcategory(result));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update
router.put('/update/:id', upload.single('image'), async (req, res) => {
    try {
        const sub = await SubCategory.findByPk(req.params.id);
        if (!sub) return res.status(404).json({ message: 'Not found' });
        const { name, categoryId, categoryName, status } = req.body;
        const localCategoryId = await resolveLocalCategoryId(categoryId, categoryName);
        if (!localCategoryId) return res.status(400).json({ error: 'Choose a valid billing category.' });
        const image = req.file ? `uploads/${req.file.filename}` : sub.image;
        await sub.update({ name, categoryId: localCategoryId, image, status });
        const result = await SubCategory.findByPk(sub.id, { include: Category });
        res.json(mapSubcategory(result));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        await SubCategory.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const data = await SubCategory.findByPk(req.params.id, { include: Category });
        if (!data) return res.status(404).json({ message: 'Subcategory not found.' });
        res.json(mapSubcategory(data));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
