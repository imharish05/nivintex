const OrderItem = require('../models/OrderItem');

module.exports = async function ensureOrderItemShippingColumns() {
    const queryInterface = OrderItem.sequelize.getQueryInterface();
    const table = OrderItem.getTableName();
    const columns = await queryInterface.describeTable(table);
    const fields = ['shipping_weight_kg', 'shipping_length_cm', 'shipping_width_cm', 'shipping_height_cm'];

    for (const field of fields) {
        const definition = OrderItem.rawAttributes[field];
        if (columns[field]) continue;
        await queryInterface.addColumn(table, field, {
            type: definition.type,
            allowNull: definition.allowNull !== false,
        });
    }
};
