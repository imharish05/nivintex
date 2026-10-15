const Cart = require('../models/Cart');

module.exports = async function ensureCartShippingColumns() {
    const queryInterface = Cart.sequelize.getQueryInterface();
    const table = Cart.getTableName();
    const columns = await queryInterface.describeTable(table);
    const fields = ['shipping_weight_kg', 'shipping_length_cm', 'shipping_width_cm', 'shipping_height_cm'];

    for (const field of fields) {
        const definition = Cart.rawAttributes[field];
        if (columns[field]) continue;
        await queryInterface.addColumn(table, field, {
            type: definition.type,
            allowNull: definition.allowNull !== false,
        });
    }
};
