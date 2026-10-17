// controllers/promoBarController.js
"use strict";

const PromoBar = require("../models/PromoBar");
const { validateFields } = require("../utils/textValidation");

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/promo-bar/active
 * Returns all active promo bars ordered by sortOrder ASC.
 * Frontend always calls this; gracefully returns [] if none exist.
 */
const getActive = async (req, res) => {
  try {
    const bars = await PromoBar.findAll({
      where:      { isActive: true },
      order:      [["sortOrder", "ASC"], ["createdAt", "DESC"]],
      attributes: ["id", "message", "code", "codeLabel", "bgGradient", "textColor", "linkUrl"],
    });
    return res.json(bars);
  } catch (err) {
    console.error("[PromoBar] getActive:", err);
    return res.status(500).json({ error: "Failed to fetch promo bar" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/promo-bar
 * List all promo bars (active and inactive).
 */
const getAll = async (req, res) => {
  try {
    const bars = await PromoBar.findAll({
      order: [["sortOrder", "ASC"], ["createdAt", "DESC"]],
    });
    return res.json(bars);
  } catch (err) {
    console.error("[PromoBar] getAll:", err);
    return res.status(500).json({ error: "Failed to fetch promo bars" });
  }
};

/**
 * POST /api/promo-bar
 * Create a new promo bar.
 *
 * Body (JSON):
 *   message    {string}  required
 *   code       {string}  optional
 *   codeLabel  {string}  optional  default "USE CODE:"
 *   bgGradient {string}  optional
 *   textColor  {string}  optional
 *   linkUrl    {string}  optional
 *   isActive   {boolean} optional  default true
 *   sortOrder  {number}  optional  default 0
 */
const create = async (req, res) => {
  const {
    message, code, codeLabel,
    bgGradient, textColor, linkUrl,
    isActive, sortOrder,
  } = req.body;

  const validationError = validateFields([
    { value: message, fieldName: 'Promo Message', required: true, maxChars: 120, maxWords: 20 },
    { value: codeLabel, fieldName: 'Code Label', maxChars: 30, maxWords: 4 },
    { value: code, fieldName: 'Promo Code', maxChars: 30, maxWords: 3 },
    { value: linkUrl, fieldName: 'Link URL', maxChars: 255 },
  ]);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const bar = await PromoBar.create({
      message:    String(message).trim(),
      code:       code       ? String(code).trim()       : null,
      codeLabel:  codeLabel  ? String(codeLabel).trim()  : "USE CODE:",
      bgGradient: bgGradient ? String(bgGradient).trim() : undefined,
      textColor:  textColor  ? String(textColor).trim()  : undefined,
      linkUrl:    linkUrl    ? String(linkUrl).trim()    : null,
      isActive:   isActive   !== undefined ? Boolean(isActive)       : true,
      sortOrder:  sortOrder  !== undefined ? parseInt(sortOrder, 10) : 0,
    });
    return res.status(201).json(bar);
  } catch (err) {
    console.error("[PromoBar] create:", err);
    return res.status(500).json({ error: "Failed to create promo bar" });
  }
};

/**
 * PUT /api/promo-bar/:id
 * Update an existing promo bar (partial updates supported).
 */
const update = async (req, res) => {
  try {
    const bar = await PromoBar.findByPk(req.params.id);
    if (!bar) return res.status(404).json({ error: "Promo bar not found" });

    const {
      message, code, codeLabel,
      bgGradient, textColor, linkUrl,
      isActive, sortOrder,
    } = req.body;

    const validationError = validateFields([
      { value: message !== undefined ? message : bar.message, fieldName: 'Promo Message', required: true, maxChars: 120, maxWords: 20 },
      { value: codeLabel !== undefined ? codeLabel : bar.codeLabel, fieldName: 'Code Label', maxChars: 30, maxWords: 4 },
      { value: code !== undefined ? code : bar.code, fieldName: 'Promo Code', maxChars: 30, maxWords: 3 },
      { value: linkUrl !== undefined ? linkUrl : bar.linkUrl, fieldName: 'Link URL', maxChars: 255 },
    ]);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await bar.update({
      ...(message    !== undefined && { message:    String(message).trim() }),
      ...(code       !== undefined && { code:       code ? String(code).trim() : null }),
      ...(codeLabel  !== undefined && { codeLabel:  String(codeLabel).trim() }),
      ...(bgGradient !== undefined && { bgGradient: String(bgGradient).trim() }),
      ...(textColor  !== undefined && { textColor:  String(textColor).trim() }),
      ...(linkUrl    !== undefined && { linkUrl:    linkUrl ? String(linkUrl).trim() : null }),
      ...(isActive   !== undefined && { isActive:   Boolean(isActive) }),
      ...(sortOrder  !== undefined && { sortOrder:  parseInt(sortOrder, 10) }),
    });

    return res.json(bar);
  } catch (err) {
    console.error("[PromoBar] update:", err);
    return res.status(500).json({ error: "Failed to update promo bar" });
  }
};

/**
 * PATCH /api/promo-bar/:id/toggle
 * Flip isActive without touching anything else.
 */
const toggle = async (req, res) => {
  try {
    const bar = await PromoBar.findByPk(req.params.id);
    if (!bar) return res.status(404).json({ error: "Promo bar not found" });

    await bar.update({ isActive: !bar.isActive });
    return res.json({ id: bar.id, isActive: bar.isActive });
  } catch (err) {
    console.error("[PromoBar] toggle:", err);
    return res.status(500).json({ error: "Failed to toggle promo bar" });
  }
};

/**
 * DELETE /api/promo-bar/:id
 * Permanently remove a promo bar.
 */
const remove = async (req, res) => {
  try {
    const bar = await PromoBar.findByPk(req.params.id);
    if (!bar) return res.status(404).json({ error: "Promo bar not found" });

    await bar.destroy();
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("[PromoBar] remove:", err);
    return res.status(500).json({ error: "Failed to delete promo bar" });
  }
};

module.exports = { getActive, getAll, create, update, toggle, remove };