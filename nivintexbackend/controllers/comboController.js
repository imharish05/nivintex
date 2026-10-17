const RootCombo = require('../models/RootCombo');
const ChildCombo = require('../models/ChildCombo');
const ComboProduct = require('../models/ComboProduct');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateFields } = require('../utils/textValidation');

// ── Multer Storage Setup ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/combos';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'combo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to delete files
const deleteFile = (relativePath) => {
  if (!relativePath) return;
  const absPath = path.resolve(relativePath);
  if (fs.existsSync(absPath)) {
    try {
      fs.unlinkSync(absPath);
    } catch (err) {
      console.error('Failed to delete file:', relativePath, err);
    }
  }
};

// Helper to format image path
const formatPath = (file) => {
  if (!file) return null;
  return file.path.replace(/\\/g, '/');
};

// ── ROOT COMBO CONTROLLERS ───────────────────────────────────────

// GET all root combos
const getAllRootCombos = async (req, res) => {
  try {
    const roots = await RootCombo.findAll({
      include: [{
        model: ChildCombo,
        attributes: ['id']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Format to include count
    const formatted = roots.map(root => {
      const json = root.toJSON();
      json.childCombosCount = json.ChildCombos ? json.ChildCombos.length : 0;
      delete json.ChildCombos;
      return json;
    });

    res.json(formatted);
  } catch (err) {
    console.error('getAllRootCombos:', err);
    res.status(500).json({ error: 'Failed to fetch Root Combos' });
  }
};

// GET active root combos and their active children for storefront
const getStorefrontCombos = async (req, res) => {
  try {
    const roots = await RootCombo.findAll({
      where: { status: 'Active' },
      include: [{
        model: ChildCombo,
        where: { status: 'Active' },
        required: false, // Include roots even if they don't have children yet
        include: [{
          model: ComboProduct,
          include: [{
            model: Product,
            as: 'Product',
            include: [{ model: Brand, attributes: ['brandName'] }]
          }]
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(roots);
  } catch (err) {
    console.error('getStorefrontCombos:', err);
    res.status(500).json({ error: 'Failed to fetch storefront combos' });
  }
};

// POST add root combo
const addRootCombo = async (req, res) => {
  try {
    const { name, status } = req.body;
    const validationError = validateFields([
      { value: name, fieldName: 'Combo Name', required: true, maxChars: 60, maxWords: 8 },
    ]);
    if (validationError) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: validationError });
    }

    const imagePath = formatPath(req.file);

    const root = await RootCombo.create({
      name,
      status: status || 'Active',
      image: imagePath
    });

    res.status(201).json(root);
  } catch (err) {
    console.error('addRootCombo:', err);
    res.status(500).json({ error: 'Failed to add Root Combo' });
  }
};

// PUT update root combo
const updateRootCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const root = await RootCombo.findByPk(id);
    if (!root) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ error: 'Root Combo not found' });
    }

    if (name !== undefined) {
      const validationError = validateFields([
        { value: name, fieldName: 'Combo Name', required: true, maxChars: 60, maxWords: 8 },
      ]);
      if (validationError) {
        if (req.file) deleteFile(req.file.path);
        return res.status(400).json({ error: validationError });
      }
    }

    let imagePath = root.image;
    if (req.file) {
      // Delete old image
      deleteFile(root.image);
      imagePath = formatPath(req.file);
    }

    await root.update({
      name: name || root.name,
      status: status || root.status,
      image: imagePath
    });

    res.json(root);
  } catch (err) {
    console.error('updateRootCombo:', err);
    res.status(500).json({ error: 'Failed to update Root Combo' });
  }
};

// DELETE root combo
const deleteRootCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const root = await RootCombo.findByPk(id);
    if (!root) {
      return res.status(404).json({ error: 'Root Combo not found' });
    }

    // Delete its image file
    deleteFile(root.image);

    // Find and delete all child combos' image files
    const children = await ChildCombo.findAll({ where: { rootComboId: id } });
    children.forEach(child => {
      deleteFile(child.image);
    });

    // Delete root combo (cascades to ChildCombo and ComboProduct if configured)
    await root.destroy();

    res.json({ message: 'Root Combo deleted successfully' });
  } catch (err) {
    console.error('deleteRootCombo:', err);
    res.status(500).json({ error: 'Failed to delete Root Combo' });
  }
};

// ── CHILD COMBO CONTROLLERS ──────────────────────────────────────

// GET children by root combo id
const getChildrenByRoot = async (req, res) => {
  try {
    const { rootComboId } = req.params;
    const children = await ChildCombo.findAll({
      where: { rootComboId },
      include: [{
        model: ComboProduct,
        include: [{
          model: Product,
          as: 'Product',
          include: [{ model: Brand, attributes: ['brandName'] }]
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(children);
  } catch (err) {
    console.error('getChildrenByRoot:', err);
    res.status(500).json({ error: 'Failed to fetch Child Combos' });
  }
};

// POST add child combo
const addChildCombo = async (req, res) => {
  try {
    const {
      rootComboId,
      name,
      type,
      status,
      shortDescription,
      fullDescription,
      originalPrice,
      comboPrice,
      products // JSON string representing array of product objects or product IDs
    } = req.body;

    if (!rootComboId || !name || !originalPrice || !comboPrice) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const validationError = validateFields([
      { value: name, fieldName: 'Combo Pack Name', required: true, maxChars: 80, maxWords: 12 },
      { value: shortDescription, fieldName: 'Short Description', maxChars: 160, maxWords: 30 },
      { value: fullDescription, fieldName: 'Detailed Description', maxChars: 1000, maxWords: 160 },
    ]);
    if (validationError) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: validationError });
    }

    const imagePath = formatPath(req.file);

    const child = await ChildCombo.create({
      rootComboId: Number(rootComboId),
      name,
      type: type || 'Fixed',
      status: status || 'Active',
      shortDescription,
      fullDescription,
      originalPrice: Number(originalPrice),
      comboPrice: Number(comboPrice),
      image: imagePath
    });

    // Associate products if provided
    if (products) {
      let productList = [];
      try {
        productList = typeof products === 'string' ? JSON.parse(products) : products;
      } catch (e) {
        console.error('Failed to parse products input:', e);
      }

      if (Array.isArray(productList)) {
        const records = productList.map(item => {
          // Supports both `{ productId, quantity }` and plain product ID values
          const productId = typeof item === 'object' ? item.productId : item;
          const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
          return {
            comboId: child.id,
            productId: Number(productId),
            quantity: Number(quantity)
          };
        });

        if (records.length > 0) {
          await ComboProduct.bulkCreate(records);
        }
      }
    }

    // Return the child combo with associated products loaded
    const childWithProducts = await ChildCombo.findByPk(child.id, {
      include: [{
        model: ComboProduct,
        include: [{ model: Product, as: 'Product' }]
      }]
    });

    res.status(201).json(childWithProducts);
  } catch (err) {
    console.error('addChildCombo:', err);
    res.status(500).json({ error: 'Failed to add Child Combo' });
  }
};

// PUT update child combo
const updateChildCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      status,
      shortDescription,
      fullDescription,
      originalPrice,
      comboPrice,
      products
    } = req.body;

    const child = await ChildCombo.findByPk(id);
    if (!child) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ error: 'Child Combo not found' });
    }

    const validationError = validateFields([
      { value: name !== undefined ? name : child.name, fieldName: 'Combo Pack Name', required: true, maxChars: 80, maxWords: 12 },
      { value: shortDescription !== undefined ? shortDescription : child.shortDescription, fieldName: 'Short Description', maxChars: 160, maxWords: 30 },
      { value: fullDescription !== undefined ? fullDescription : child.fullDescription, fieldName: 'Detailed Description', maxChars: 1000, maxWords: 160 },
    ]);
    if (validationError) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ error: validationError });
    }

    let imagePath = child.image;
    if (req.file) {
      deleteFile(child.image);
      imagePath = formatPath(req.file);
    }

    await child.update({
      name: name || child.name,
      type: type || child.type,
      status: status || child.status,
      shortDescription: shortDescription !== undefined ? shortDescription : child.shortDescription,
      fullDescription: fullDescription !== undefined ? fullDescription : child.fullDescription,
      originalPrice: originalPrice !== undefined ? Number(originalPrice) : child.originalPrice,
      comboPrice: comboPrice !== undefined ? Number(comboPrice) : child.comboPrice,
      image: imagePath
    });

    // Update product associations if provided
    if (products !== undefined) {
      // Clear old associations
      await ComboProduct.destroy({ where: { comboId: id } });

      let productList = [];
      try {
        productList = typeof products === 'string' ? JSON.parse(products) : products;
      } catch (e) {
        console.error('Failed to parse products input:', e);
      }

      if (Array.isArray(productList)) {
        const records = productList.map(item => {
          const productId = typeof item === 'object' ? item.productId : item;
          const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
          return {
            comboId: child.id,
            productId: Number(productId),
            quantity: Number(quantity)
          };
        });

        if (records.length > 0) {
          await ComboProduct.bulkCreate(records);
        }
      }
    }

    const updatedChild = await ChildCombo.findByPk(id, {
      include: [{
        model: ComboProduct,
        include: [{ model: Product, as: 'Product' }]
      }]
    });

    res.json(updatedChild);
  } catch (err) {
    console.error('updateChildCombo:', err);
    res.status(500).json({ error: 'Failed to update Child Combo' });
  }
};

// DELETE child combo
const deleteChildCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const child = await ChildCombo.findByPk(id);
    if (!child) {
      return res.status(404).json({ error: 'Child Combo not found' });
    }

    // Delete its image file
    deleteFile(child.image);

    // Delete combo (cascade deletes ComboProduct records)
    await child.destroy();

    res.json({ message: 'Child Combo deleted successfully' });
  } catch (err) {
    console.error('deleteChildCombo:', err);
    res.status(500).json({ error: 'Failed to delete Child Combo' });
  }
};

module.exports = {
  upload,
  getAllRootCombos,
  getStorefrontCombos,
  addRootCombo,
  updateRootCombo,
  deleteRootCombo,
  getChildrenByRoot,
  addChildCombo,
  updateChildCombo,
  deleteChildCombo
};
