const express = require('express');
const { Op } = require('sequelize');
const { State } = require('country-state-city');
const DeliveryZone = require('../models/DeliveryZone');

const router = express.Router();

const DEFAULT_TN_BASE_PRICE = 80.00;
const DEFAULT_OTHER_BASE_PRICE = 120.00;
const DEFAULT_PER_KG_PRICE = 35.00;
const DEFAULT_BASE_WEIGHT_KG = 1.00;

// GET /api/delivery-zones - List all delivery zones
router.get('/', async (req, res) => {
  try {
    const zones = await DeliveryZone.findAll({
      order: [
        // Tamil Nadu first, then alphabetical
        sequelizeOrderExpression(),
      ],
    });
    return res.json({ success: true, data: zones });
  } catch (error) {
    console.error('[DeliveryZone] Error fetching zones:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch delivery zones.' });
  }
});

function sequelizeOrderExpression() {
  const sequelize = require('../config/db');
  return [
    sequelize.literal("CASE WHEN LOWER(state_name) = 'tamil nadu' THEN 0 ELSE 1 END"),
    'ASC',
  ];
}

// GET /api/delivery-zones/calculate - Calculate shipping for a given state & weight
router.get('/calculate', async (req, res) => {
  try {
    const stateName = String(req.query.state || '').trim();
    const weightKg = Math.max(0.01, parseFloat(req.query.weightKg) || 0.5);

    if (!stateName) {
      return res.status(400).json({ success: false, message: 'State name is required.' });
    }

    let zone = await DeliveryZone.findOne({
      where: {
        state_name: { [Op.like]: stateName },
        is_active: true,
      },
    });

    // Fallback if not found or inactive
    const isTN = stateName.toLowerCase() === 'tamil nadu';
    const basePrice = zone ? parseFloat(zone.base_price) : (isTN ? DEFAULT_TN_BASE_PRICE : DEFAULT_OTHER_BASE_PRICE);
    const perKgPrice = zone ? parseFloat(zone.per_kg_price) : DEFAULT_PER_KG_PRICE;
    const baseWeightKg = zone ? parseFloat(zone.base_weight_kg) : DEFAULT_BASE_WEIGHT_KG;

    let additionalWeightKg = 0;
    let additionalCharge = 0;

    if (weightKg > baseWeightKg) {
      additionalWeightKg = Math.ceil(weightKg - baseWeightKg);
      additionalCharge = Math.round(additionalWeightKg * perKgPrice * 100) / 100;
    }

    const totalDeliveryCharge = Math.round((basePrice + additionalCharge) * 100) / 100;

    return res.json({
      success: true,
      state: stateName,
      weightKg,
      baseWeightKg,
      basePrice,
      perKgPrice,
      additionalWeightKg,
      additionalCharge,
      totalDeliveryCharge,
    });
  } catch (error) {
    console.error('[DeliveryZone] Calculate error:', error);
    return res.status(500).json({ success: false, message: 'Calculation failed.' });
  }
});

// GET /api/delivery-zones/:id
router.get('/:id', async (req, res) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
    return res.json({ success: true, data: zone });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/delivery-zones - Create new delivery zone
router.post('/', async (req, res) => {
  try {
    const { state_name, base_price, per_kg_price, base_weight_kg, is_active } = req.body;
    if (!state_name || !String(state_name).trim()) {
      return res.status(400).json({ success: false, message: 'State name is required.' });
    }

    const trimmedState = String(state_name).trim();
    const existing = await DeliveryZone.findOne({ where: { state_name: trimmedState } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Delivery zone for "${trimmedState}" already exists.` });
    }

    const created = await DeliveryZone.create({
      state_name: trimmedState,
      base_price: parseFloat(base_price) || 120.00,
      per_kg_price: parseFloat(per_kg_price) || 35.00,
      base_weight_kg: parseFloat(base_weight_kg) || 1.00,
      is_active: is_active !== false,
    });

    return res.status(201).json({ success: true, message: 'Delivery zone created.', data: created });
  } catch (error) {
    console.error('[DeliveryZone] Create error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/delivery-zones/:id - Update zone
router.put('/:id', async (req, res) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found.' });

    const { state_name, base_price, per_kg_price, base_weight_kg, is_active } = req.body;
    if (state_name !== undefined) zone.state_name = String(state_name).trim();
    if (base_price !== undefined) zone.base_price = parseFloat(base_price);
    if (per_kg_price !== undefined) zone.per_kg_price = parseFloat(per_kg_price);
    if (base_weight_kg !== undefined) zone.base_weight_kg = parseFloat(base_weight_kg);
    if (is_active !== undefined) zone.is_active = Boolean(is_active);

    await zone.save();
    return res.json({ success: true, message: 'Delivery zone updated.', data: zone });
  } catch (error) {
    console.error('[DeliveryZone] Update error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/delivery-zones/:id - Delete zone
router.delete('/:id', async (req, res) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found.' });

    await zone.destroy();
    return res.json({ success: true, message: 'Delivery zone deleted.' });
  } catch (error) {
    console.error('[DeliveryZone] Delete error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/delivery-zones/seed - Reset / re-seed all 36 Indian states
router.post('/seed', async (req, res) => {
  try {
    const indianStates = State.getStatesOfCountry('IN') || [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const st of indianStates) {
      const name = st.name.trim();
      const isTN = name.toLowerCase() === 'tamil nadu';
      const targetBasePrice = isTN ? DEFAULT_TN_BASE_PRICE : DEFAULT_OTHER_BASE_PRICE;

      const existing = await DeliveryZone.findOne({ where: { state_name: name } });
      if (existing) {
        existing.base_price = targetBasePrice;
        existing.per_kg_price = DEFAULT_PER_KG_PRICE;
        existing.base_weight_kg = DEFAULT_BASE_WEIGHT_KG;
        existing.is_active = true;
        await existing.save();
        updatedCount += 1;
      } else {
        await DeliveryZone.create({
          state_name: name,
          base_price: targetBasePrice,
          per_kg_price: DEFAULT_PER_KG_PRICE,
          base_weight_kg: DEFAULT_BASE_WEIGHT_KG,
          is_active: true,
        });
        createdCount += 1;
      }
    }

    return res.json({
      success: true,
      message: `Seeded ${createdCount} new zones and refreshed ${updatedCount} zones (Tamil Nadu: ₹80, Others: ₹120, +₹35/kg).`,
    });
  } catch (error) {
    console.error('[DeliveryZone] Seed error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
