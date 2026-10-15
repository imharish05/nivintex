const Brand = require('../models/Brand');

// 1. Create Brand (Add)
exports.createBrand = async (req, res) => {
    try {
        const { brandName, status } = req.body;
        const logoPath = req.file ? req.file.path.replace(/\\/g, "/") : null;

        const newBrand = await Brand.create({
            brandName,
            logo: logoPath,
            status: status || 'Active'
        });

        res.status(201).json({ message: "Brand Added!", brand: newBrand });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Get All Brands (Admin-ku ellam theriya)
exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.findAll();
        res.status(200).json(brands);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Update Brand (Name, Logo, or Status)
exports.updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { brandName, status } = req.body;
        let updateData = { brandName, status };

        if (req.file) {
            updateData.logo = req.file.path.replace(/\\/g, "/");
        }

        await Brand.update(updateData, { where: { id } });
        res.status(200).json({ message: "Brand Updated Successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Delete Brand
exports.deleteBrand = async (req, res) => {
    try {
        await Brand.destroy({ where: { id: req.params.id } });
        res.status(200).json({ message: "Brand Deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};