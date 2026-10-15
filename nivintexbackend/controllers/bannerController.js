const Banner = require('../models/Banner');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

async function processAndCompressImage(filePath, section = 'hero') {
  if (!filePath) return null;
  const absolutePath = path.resolve(filePath);
  
  try {
    const image = await Jimp.read(absolutePath);
    const ext = path.extname(absolutePath);
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
    
    await image
      .cover(width, height)
      .quality(80)
      .writeAsync(targetPath);
      
    if (absolutePath !== targetPath && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    
    return path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
  } catch (err) {
    console.error('Error processing banner image with Jimp:', err);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

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
    let image = req.file ? req.file.path.replace(/\\/g, '/') : null;

    if (image) {
      image = await processAndCompressImage(image, section);
    }

    const banner = await Banner.create({
      title,
      subtitle:  subtitle  || null,
      content:   content   || null,
      link:      link      || null,
      sortOrder: sortOrder ? parseInt(sortOrder) : 1,
      status:    status    || 'Active',
      section:   section   || 'hero',
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

    if (req.file) {
      if (banner.image && fs.existsSync(banner.image)) fs.unlinkSync(banner.image);
      let imagePath = req.file.path.replace(/\\/g, '/');
      banner.image = await processAndCompressImage(imagePath, section || banner.section);
    }

    banner.title     = title     || banner.title;
    banner.subtitle  = subtitle  !== undefined ? subtitle  : banner.subtitle;
    banner.content   = content   !== undefined ? content   : banner.content;
    banner.link      = link      !== undefined ? link      : banner.link;
    banner.sortOrder = sortOrder ? parseInt(sortOrder)     : banner.sortOrder;
    banner.status    = status    || banner.status;
    banner.section   = section   || banner.section;

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
  getAllBanners,
  getBannerById,
  getBannersBySection,
  addBanner,
  updateBanner,
  deleteBanner,
};