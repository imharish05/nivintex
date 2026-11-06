// controllers/siteSettingsController.js
"use strict";

const SiteSettings = require("../models/SiteSettings");

// Default settings seeded if table is empty
const DEFAULTS = [
  { key: "headerBgColor",   value: "#165b4d", label: "Header Background Color", type: "color" },
  { key: "headerTextColor", value: "#ffffff", label: "Header Text Color",        type: "color" },
  { key: "headerAccentColor", value: "#19604e", label: "Header Accent Color",    type: "color" },
  { key: "headerNavHoverColor", value: "#A2C579", label: "Header Nav Hover Color", type: "color" },
  { key: "shipping_method", value: "custom", label: "Shipping Delivery Method", type: "text" },
];

// Seed defaults if any setting does not exist yet
const seedDefaults = async () => {
  for (const def of DEFAULTS) {
    const existing = await SiteSettings.findOne({ where: { key: def.key } });
    if (!existing) {
      await SiteSettings.create(def);
    }
  }
};

// GET /api/site-settings  — returns all settings as { key: value } map
exports.getAll = async (req, res) => {
  try {
    await seedDefaults();
    const rows = await SiteSettings.findAll({ order: [["id", "ASC"]] });
    // Return full rows for admin panel
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/site-settings/public — returns { key: value } map for frontend
exports.getPublic = async (req, res) => {
  try {
    await seedDefaults();
    const rows = await SiteSettings.findAll();
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/site-settings/:key — update a single setting
exports.update = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    let row = await SiteSettings.findOne({ where: { key } });
    if (!row) {
      row = await SiteSettings.create({ key, value, label: key, type: "text" });
    } else {
      await row.update({ value });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/site-settings — bulk update multiple settings at once
// Body: { headerBgColor: "#abc", headerTextColor: "#fff", ... }
exports.bulkUpdate = async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      const row = await SiteSettings.findOne({ where: { key } });
      if (row) {
        await row.update({ value });
      } else {
        await SiteSettings.create({ key, value, label: key, type: "text" });
      }
    }
    // Return fresh map
    const rows = await SiteSettings.findAll();
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });
    res.json({ success: true, settings: map });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
