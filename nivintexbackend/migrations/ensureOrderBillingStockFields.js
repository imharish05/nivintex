const Order = require('../models/Order');

module.exports = async function ensureOrderBillingStockFields() {
  const queryInterface = Order.sequelize.getQueryInterface();
  const table = Order.getTableName();
  const columns = await queryInterface.describeTable(table);
  const fields = ['billing_stock_sync_status', 'billing_stock_sync_error', 'billing_stock_synced_at'];

  for (const field of fields) {
    const definition = Order.rawAttributes[field];
    if (columns[field]) continue;
    await queryInterface.addColumn(table, field, {
      type: definition.type,
      allowNull: definition.allowNull !== false,
      ...(definition.defaultValue !== undefined ? { defaultValue: definition.defaultValue } : {}),
    });
  }
};
