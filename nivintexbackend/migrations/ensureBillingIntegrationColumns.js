const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Franchise = require('../models/Franchise');
const SubCategory = require('../models/SubCategory');

// Keep billing IDs separate from this store's primary keys.
module.exports = async function ensureBillingIntegrationColumns() {
    const models = [Category, SubCategory, Product, ProductVariant, Franchise];
    const integrationAttributes = new Set([
        'billingCategoryId', 'billingSubcategoryId', 'billingProductId', 'billingVariantId', 'billingFranchiseId', 'billingData', 'franchise_price_final', 'mrpGstType',
    ]);
    for (const model of models) {
        const queryInterface = model.sequelize.getQueryInterface();
        const table = model.getTableName();
        const columns = await queryInterface.describeTable(table);
        for (const [attribute, definition] of Object.entries(model.rawAttributes)) {
            if (!integrationAttributes.has(attribute)) continue;
            const field = definition.field || attribute;
            if (columns[field]) continue;
            await queryInterface.addColumn(table, field, {
                type: definition.type,
                allowNull: definition.allowNull !== false,
                ...(definition.defaultValue !== undefined ? { defaultValue: definition.defaultValue } : {}),
            });
            columns[field] = true;
        }
    }
};
