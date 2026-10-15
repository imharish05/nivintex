const Order = require('../models/Order');

module.exports = async function ensureOrderShiprocketFields() {
  const queryInterface = Order.sequelize.getQueryInterface();
  const table = Order.getTableName();
  const columns = await queryInterface.describeTable(table);
  const fields = [
    'shiprocket_shipment_id',
    'shiprocket_booking_error',
    'shiprocket_requested_courier_id',
    'shiprocket_requested_courier_name',
    'shiprocket_requested_rate',
    'shiprocket_estimated_delivery_days',
    'shiprocket_booking_status',
  ];

  for (const field of fields) {
    const definition = Order.rawAttributes[field];
    if (columns[field]) continue;
    await queryInterface.addColumn(table, field, {
      type: definition.type,
      allowNull: definition.allowNull !== false,
    });
  }
};
