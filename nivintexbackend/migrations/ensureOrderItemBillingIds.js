const OrderItem = require('../models/OrderItem');

module.exports = async function ensureOrderItemBillingIds() {
  const queryInterface = OrderItem.sequelize.getQueryInterface();
  const table = OrderItem.getTableName();
  const columns = await queryInterface.describeTable(table);

  for (const field of ['billing_product_id', 'billing_variant_id']) {
    if (columns[field]) continue;
    await queryInterface.addColumn(table, field, {
      type: OrderItem.rawAttributes[field].type,
      allowNull: true,
    });
  }
};
