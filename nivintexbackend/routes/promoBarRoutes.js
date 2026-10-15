// routes/promoBarRoutes.js
"use strict";

const express = require("express");
const router  = express.Router();

const {
  getActive,
  getAll,
  create,
  update,
  toggle,
  remove,
} = require("../controllers/promoBarController");

// ── Swap this out for your real admin-auth middleware ──────────────────────
// e.g.  const adminAuth = require("../middleware/adminAuth");
const adminAuth = (req, res, next) => {
  // TODO: verify JWT / check req.user.role === "admin"
  next();
};

// ── PUBLIC ─────────────────────────────────────────────────────────────────
router.get("/active", getActive);

// ── ADMIN CRUD ─────────────────────────────────────────────────────────────
router.get(    "/",           adminAuth, getAll);
router.post(   "/",           adminAuth, create);
router.put(    "/:id",        adminAuth, update);
router.patch(  "/:id/toggle", adminAuth, toggle);
router.delete( "/:id",        adminAuth, remove);

module.exports = router;