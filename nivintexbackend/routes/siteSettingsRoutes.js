// routes/siteSettingsRoutes.js
"use strict";

const express = require("express");
const router  = express.Router();
const {
  getAll,
  getPublic,
  update,
  bulkUpdate,
} = require("../controllers/siteSettingsController");

// ── PUBLIC (frontend reads this) ────────────────────────────────────────────
router.get("/public", getPublic);   // GET /api/site-settings/public

// ── ADMIN ───────────────────────────────────────────────────────────────────
router.get("/",          getAll);        // GET  /api/site-settings
router.put("/",          bulkUpdate);    // PUT  /api/site-settings   (bulk)
router.put("/:key",      update);        // PUT  /api/site-settings/:key

module.exports = router;
