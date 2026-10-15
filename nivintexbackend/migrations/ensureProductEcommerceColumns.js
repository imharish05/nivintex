const Product = require('../models/Product');

// The imported inventory database predates these ecommerce-only fields.
// Add only missing fields; never alter or drop existing inventory columns.
module.exports = async function ensureProductEcommerceColumns() {
    const queryInterface = Product.sequelize.getQueryInterface();
    const table = Product.getTableName();
    const columns = await queryInterface.describeTable(table);
    const fields = [
        'stock', 'shortDescription', 'isNewArrival', 'isBestSeller',
        'isBuyOneGetOne', 'brandId', 'colors', 'sizes', 'fabrics',
        'weights', 'volumes', 'nos', 'shippingWeightKg', 'shippingLengthCm',
        'shippingWidthCm', 'shippingHeightCm',
    ];

    for (const attribute of fields) {
        const definition = Product.rawAttributes[attribute];
        const columnName = definition.field || attribute;
        if (columns[columnName]) continue;
        await queryInterface.addColumn(table, columnName, {
            type: definition.type,
            allowNull: definition.allowNull !== false,
            ...(definition.defaultValue !== undefined ? { defaultValue: definition.defaultValue } : {}),
        });
        columns[columnName] = true;
    }
};
