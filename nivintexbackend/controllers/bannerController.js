const Banner = require('../models/Banner');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Jimp } = require('jimp');
const { validateFields } = require('../utils/textValidation');

async function processAndCompressImage(filePath, section = 'hero') {
  if (!filePath) return null;
  const absolutePath = path.resolve(filePath);
  
  try {
    const ext = path.extname(absolutePath);
    const image = await Jimp.read(absolutePath);
    let targetPath = absolutePath;
    if (ext.toLowerCase() !== '.jpg' && ext.toLowerCase() !== '.jpeg') {
      targetPath = absolutePath.substring(0, absolutePath.lastIndexOf('.')) + '.jpg';
    }
    
    // Choose dimensions based on the target section
    let width = 1920;
    let height = 600;
    
    if (section === 'new_arrivals') {
      width = 600;
      height = 800; // 3:4 portrait
    } else if (section === 'best_sellers') {
      width = 600;
      height = 1100; // ~6:11 portrait
    }
    
    image.cover({ w: width, h: height });
    await image.write(targetPath, { quality: 80 });
      
    if (absolutePath !== targetPath && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    
    return path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
  } catch (err) {
    console.error('Error processing banner image with Jimp:', err.message);
    return filePath;
  }
}

// ── Multer Storage ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/banners';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExt  = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif'];
    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, WEBP, GIF images are allowed'));
    }
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

function handleBannerUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Banner image is too large. Maximum size is 15 MB.' });
    }
    return res.status(400).json({ error: err.message || 'Invalid banner upload.' });
  });
}

// ── GET all banners ─────────────────────────────────────────────
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(banners);
  } catch (err) {
    console.error('getAllBanners:', err);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
};

// ── GET single banner ───────────────────────────────────────────
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json(banner);
  } catch (err) {
    console.error('getBannerById:', err);
    res.status(500).json({ error: 'Failed to fetch banner' });
  }
};

// ── GET banners by section ──────────────────────────────────────
// Used by frontend: /api/banners/section/hero
//                   /api/banners/section/new_arrivals
//                   /api/banners/section/best_sellers
const getBannersBySection = async (req, res) => {
  try {
    const { section } = req.params;
    const allowed = ['hero', 'new_arrivals', 'best_sellers'];
    if (!allowed.includes(section)) {
      return res.status(400).json({
        error: 'Invalid section. Use hero, new_arrivals, or best_sellers.',
      });
    }
    const banners = await Banner.findAll({
      where: { section, status: 'Active' },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(banners);
  } catch (err) {
    console.error('getBannersBySection:', err);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
};

// ── POST add banner ─────────────────────────────────────────────
const addBanner = async (req, res) => {
  try {
    const { title, subtitle, content, link, sortOrder, status, section } = req.body;
    const targetSection = section || 'hero';
    const isRequired = ['new_arrivals', 'best_sellers'].includes(targetSection);

    // Validate character and word limits
    const validationError = validateFields([
      { value: title, fieldName: 'Title', required: isRequired, maxChars: 60, maxWords: 10 },
      { value: subtitle, fieldName: 'Subtitle', required: isRequired, maxChars: 80, maxWords: 15 },
      { value: content, fieldName: 'Content / Description', maxChars: 250, maxWords: 40 },
      { value: link, fieldName: 'Link/URL', required: isRequired, maxChars: 255 },
    ]);
    if (validationError) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ error: validationError });
    }

    // Enforce only one banner for new_arrivals and best_sellers
    if (['new_arrivals', 'best_sellers'].includes(targetSection)) {
      const existing = await Banner.findOne({ where: { section: targetSection } });
      if (existing) {
        if (req.file && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        const sectionLabel = targetSection === 'new_arrivals' ? 'New Arrivals' : 'Best Sellers';
        return res.status(400).json({
          error: `Only 1 banner is allowed for the ${sectionLabel} section. An active banner already exists. Please edit or delete the existing banner instead.`,
        });
      }
    }

    let image = req.file ? req.file.path.replace(/\\/g, '/') : null;

    if (image) {
      image = await processAndCompressImage(image, targetSection);
    }

    const banner = await Banner.create({
      title,
      subtitle:  subtitle  || null,
      content:   content   || null,
      link:      link      || null,
      sortOrder: sortOrder ? parseInt(sortOrder) : 1,
      status:    status    || 'Active',
      section:   targetSection,
      image,
    });

    res.status(201).json({ message: 'Banner added successfully', banner });
  } catch (err) {
    console.error('addBanner:', err);
    res.status(500).json({ error: 'Failed to add banner' });
  }
};

// ── PUT update banner ───────────────────────────────────────────
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    const { title, subtitle, content, link, sortOrder, status, section } = req.body;
    const targetSection = section || banner.section;
    const isRequired = ['new_arrivals', 'best_sellers'].includes(targetSection);

    // Validate character and word limits if fields are provided
    const validationError = validateFields([
      { value: title !== undefined ? title : banner.title, fieldName: 'Title', required: isRequired, maxChars: 60, maxWords: 10 },
      { value: subtitle !== undefined ? subtitle : banner.subtitle, fieldName: 'Subtitle', required: isRequired, maxChars: 80, maxWords: 15 },
      { value: content !== undefined ? content : banner.content, fieldName: 'Content / Description', maxChars: 250, maxWords: 40 },
      { value: link !== undefined ? link : banner.link, fieldName: 'Link/URL', required: isRequired, maxChars: 255 },
    ]);
    if (validationError) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ error: validationError });
    }

    // Enforce only one banner for new_arrivals and best_sellers
    if (['new_arrivals', 'best_sellers'].includes(targetSection)) {
      const existing = await Banner.findOne({
        where: {
          section: targetSection,
          id: { [Op.ne]: req.params.id },
        },
      });
      if (existing) {
        if (req.file && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        const sectionLabel = targetSection === 'new_arrivals' ? 'New Arrivals' : 'Best Sellers';
        return res.status(400).json({
          error: `Only 1 banner is allowed for the ${sectionLabel} section. Another banner already exists for this section.`,
        });
      }
    }

    if (req.file) {
      const previousImage = banner.image;
      let imagePath = req.file.path.replace(/\\/g, '/');
      const processedImage = await processAndCompressImage(imagePath, targetSection);
      banner.image = processedImage;
      if (previousImage && previousImage !== processedImage && fs.existsSync(previousImage)) {
        fs.unlinkSync(previousImage);
      }
    }

    banner.title     = title     || banner.title;
    banner.subtitle  = subtitle  !== undefined ? subtitle  : banner.subtitle;
    banner.content   = content   !== undefined ? content   : banner.content;
    banner.link      = link      !== undefined ? link      : banner.link;
    banner.sortOrder = sortOrder ? parseInt(sortOrder)     : banner.sortOrder;
    banner.status    = status    || banner.status;
    banner.section   = targetSection;

    await banner.save();
    res.json({ message: 'Banner updated successfully', banner });
  } catch (err) {
    console.error('updateBanner:', err);
    res.status(500).json({ error: 'Failed to update banner' });
  }
};

// ── DELETE banner ───────────────────────────────────────────────
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    if (banner.image) {
      try {
        if (fs.existsSync(banner.image)) {
          fs.unlinkSync(banner.image);
        }
      } catch (fileErr) {
        console.error('Error deleting banner file:', fileErr);
      }
    }

    await banner.destroy();
    res.json({ message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('deleteBanner:', err);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
};

module.exports = {
  upload,
  handleBannerUpload,
  getAllBanners,
  getBannerById,
  getBannersBySection,
  addBanner,
  updateBanner,
  deleteBanner,
};
