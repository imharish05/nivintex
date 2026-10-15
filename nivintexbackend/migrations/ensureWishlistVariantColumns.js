const Wishlist = require('../models/Wishlist');

module.exports = async function ensureWishlistVariantColumns() {
  const queryInterface = Wishlist.sequelize.getQueryInterface();
  const table = Wishlist.getTableName();
  const columns = await queryInterface.describeTable(table);
  for (const [attribute, definition] of Object.entries(Wishlist.rawAttributes)) {
    if (!['variantId', 'color', 'size', 'fabric'].includes(attribute)) continue;
    const field = definition.field || attribute;
    if (!columns[field]) await queryInterface.addColumn(table, field, {
      type: definition.type,
      allowNull: definition.allowNull !== false,
    });
  }
};

module.exports.ensureCartVariantColumn = async function ensureCartVariantColumn() {
  const Cart = require('../models/Cart');
  const queryInterface = Cart.sequelize.getQueryInterface();
  const table = Cart.getTableName();
  const columns = await queryInterface.describeTable(table);
  for (const attribute of ['variantId', 'color', 'size', 'fabric']) {
    const definition = Cart.rawAttributes[attribute];
    const field = definition.field || attribute;
    if (!columns[field]) await queryInterface.addColumn(table, field, {
      type: definition.type,
      allowNull: true,
    });
  }
};
