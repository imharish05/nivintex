const SubCategory = require('../models/SubCategory');

// The subcategory create/update endpoints accept an image upload, but the
// imported inventory schema predates that column. Add it only when missing so
// the uploaded image path is actually persisted instead of being silently
// dropped by Sequelize.
module.exports = async function ensureSubCategoryImageColumn() {
    const queryInterface = SubCategory.sequelize.getQueryInterface();
    const table = SubCategory.getTableName();
    const columns = await queryInterface.describeTable(table);

    if (!columns.image) {
        await queryInterface.addColumn(table, 'image', {
            type: SubCategory.rawAttributes.image.type,
            allowNull: true,
        });
    }
};
