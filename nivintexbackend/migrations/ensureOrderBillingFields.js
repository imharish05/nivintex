const Order = require('../models/Order');

module.exports = async function ensureOrderBillingFields() {
  const queryInterface = Order.sequelize.getQueryInterface();
  const table = Order.getTableName();
  const columns = await queryInterface.describeTable(table);

  for (const [attribute, definition] of Object.entries(Order.rawAttributes)) {
    if (!attribute.startsWith('billing_')) continue;
    const field = definition.field || attribute;
    if (columns[field]) continue;
    await queryInterface.addColumn(table, field, {
      type: definition.type,
      allowNull: definition.allowNull !== false,
      ...(definition.defaultValue !== undefined ? { defaultValue: definition.defaultValue } : {}),
    });
  }
};
