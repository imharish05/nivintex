const OfferBanner = require('../models/Offerbanner');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateFields } = require('../utils/textValidation');

const nullIfEmpty = (val) => (val === '' || val === undefined || val === 'undefined' ? null : val);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/offer-banners';
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
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error(`Only image files are allowed. Got: ${file.mimetype}`));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// GET all
const getAllOfferBanners = async (req, res) => {
  try {
    const offers = await OfferBanner.findAll({ order: [['createdAt', 'DESC']] });
    res.json(offers);
  } catch (err) {
    console.error('getAllOfferBanners:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET single
const getOfferBannerById = async (req, res) => {
  try {
    const offer = await OfferBanner.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer banner not found' });
    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST add
const addOfferBanner = async (req, res) => {
  try {
    const { title, subtitle, offerLabel, btnText, btnLink, status } = req.body;

    const validationError = validateFields([
      { value: title, fieldName: 'Title', required: true, maxChars: 60, maxWords: 10 },
      { value: subtitle, fieldName: 'Subtitle', required: true, maxChars: 80, maxWords: 15 },
      { value: offerLabel, fieldName: 'Offer Label', required: true, maxChars: 40, maxWords: 6 },
      { value: btnText, fieldName: 'Button Text', required: true, maxChars: 25, maxWords: 4 },
      { value: btnLink, fieldName: 'Button Link', required: true, maxChars: 255 },
    ]);
    if (validationError) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ error: validationError });
    }

    const image = req.file ? req.file.path.replace(/\\/g, '/') : null;

    const offer = await OfferBanner.create({
      title,
      subtitle:   nullIfEmpty(subtitle),
      offerLabel: nullIfEmpty(offerLabel),
      btnText:    nullIfEmpty(btnText) || 'Shop now',
      btnLink:    nullIfEmpty(btnLink),
      status:     nullIfEmpty(status) || 'Active',
      image,
    });

    res.status(201).json({ message: 'Offer banner added successfully', offer });
  } catch (err) {
    console.error('❌ addOfferBanner ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT update
const updateOfferBanner = async (req, res) => {
  try {
    const offer = await OfferBanner.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer banner not found' });

    const { title, subtitle, offerLabel, btnText, btnLink, status } = req.body;

    const validationError = validateFields([
      { value: title !== undefined ? title : offer.title, fieldName: 'Title', required: true, maxChars: 60, maxWords: 10 },
      { value: subtitle !== undefined ? subtitle : offer.subtitle, fieldName: 'Subtitle', required: true, maxChars: 80, maxWords: 15 },
      { value: offerLabel !== undefined ? offerLabel : offer.offerLabel, fieldName: 'Offer Label', required: true, maxChars: 40, maxWords: 6 },
      { value: btnText !== undefined ? btnText : offer.btnText, fieldName: 'Button Text', required: true, maxChars: 25, maxWords: 4 },
      { value: btnLink !== undefined ? btnLink : offer.btnLink, fieldName: 'Button Link', required: true, maxChars: 255 },
    ]);
    if (validationError) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ error: validationError });
    }

    if (req.file) {
      if (offer.image && fs.existsSync(offer.image)) fs.unlinkSync(offer.image);
      offer.image = req.file.path.replace(/\\/g, '/');
    }

    if (title      !== undefined) offer.title      = title;
    if (subtitle   !== undefined) offer.subtitle   = nullIfEmpty(subtitle);
    if (offerLabel !== undefined) offer.offerLabel = nullIfEmpty(offerLabel);
    if (btnText    !== undefined) offer.btnText    = nullIfEmpty(btnText);
    if (btnLink    !== undefined) offer.btnLink    = nullIfEmpty(btnLink);
    if (status     !== undefined) offer.status     = status;

    await offer.save();
    res.json({ message: 'Offer banner updated successfully', offer });
  } catch (err) {
    console.error('❌ updateOfferBanner ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE
const deleteOfferBanner = async (req, res) => {
  try {
    const offer = await OfferBanner.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer banner not found' });

    if (offer.image && fs.existsSync(offer.image)) fs.unlinkSync(offer.image);

    await offer.destroy();
    res.json({ message: 'Offer banner deleted successfully' });
  } catch (err) {
    console.error('❌ deleteOfferBanner ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  upload,
  getAllOfferBanners,
  getOfferBannerById,
  addOfferBanner,
  updateOfferBanner,
  deleteOfferBanner,
};