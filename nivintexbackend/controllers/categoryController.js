const Category = require('../models/Category');

// 1. Get All Categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            code_prefix: cat.code_prefix,
            image: cat.image,
            status: cat.status,
            created_at: cat.createdAt,
            updated_at: cat.updatedAt
        }));
        res.status(200).json({ status: 200, category: formattedCategories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Create Category (With Image)
exports.createCategory = async (req, res) => {
    try {
        const { name, code_prefix, status } = req.body;

        
        const image = req.file
            ? req.file.path.replace(/\\/g, '/')
            : null;

        const newCategory = await Category.create({ name, code_prefix, status: status || 'Active', image });
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Update Category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code_prefix, status } = req.body;
        let updateData = { name, code_prefix, status };

        if (req.file) {
            // Same normalization for update
            updateData.image = req.file.path.replace(/\\/g, '/');
        }

        await Category.update(updateData, { where: { id } });
        res.status(200).json({ message: "Category updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Delete Category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.destroy({ where: { id } });
        res.status(200).json({ message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};