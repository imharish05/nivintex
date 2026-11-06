const { State } = require('country-state-city');
const sequelize = require('../config/db');
const DeliveryZone = require('../models/DeliveryZone');

const DEFAULT_TN_BASE_PRICE = 80.00;
const DEFAULT_OTHER_BASE_PRICE = 120.00;
const DEFAULT_PER_KG_PRICE = 35.00;
const DEFAULT_BASE_WEIGHT_KG = 1.00;

module.exports = async function ensureDeliveryZonesTable() {
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM delivery_zones LIKE 'state_name'").catch(() => [[]]);
    if (!cols || cols.length === 0) {
      console.log('[DeliveryZone] Migrating old delivery_zones table to new schema...');
      await sequelize.query('DROP TABLE IF EXISTS delivery_zones');
    }
  } catch (_) {}

  await DeliveryZone.sync();

  const indianStates = State.getStatesOfCountry('IN') || [];
  if (!indianStates.length) return;

  const count = await DeliveryZone.count();
  if (count === 0) {
    console.log('[DeliveryZone] Seeding initial delivery zones for all Indian states...');
    const records = indianStates.map(st => {
      const isTN = st.name.trim().toLowerCase() === 'tamil nadu';
      return {
        state_name: st.name.trim(),
        base_price: isTN ? DEFAULT_TN_BASE_PRICE : DEFAULT_OTHER_BASE_PRICE,
        per_kg_price: DEFAULT_PER_KG_PRICE,
        base_weight_kg: DEFAULT_BASE_WEIGHT_KG,
        is_active: true,
      };
    });

    await DeliveryZone.bulkCreate(records);
    console.log(`[DeliveryZone] Successfully seeded ${records.length} delivery zones.`);
  } else {
    for (const st of indianStates) {
      const exists = await DeliveryZone.findOne({ where: { state_name: st.name.trim() } });
      if (!exists) {
        const isTN = st.name.trim().toLowerCase() === 'tamil nadu';
        await DeliveryZone.create({
          state_name: st.name.trim(),
          base_price: isTN ? DEFAULT_TN_BASE_PRICE : DEFAULT_OTHER_BASE_PRICE,
          per_kg_price: DEFAULT_PER_KG_PRICE,
          base_weight_kg: DEFAULT_BASE_WEIGHT_KG,
          is_active: true,
        });
      }
    }
  }
};
