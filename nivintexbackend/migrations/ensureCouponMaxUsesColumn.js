const Coupon = require('../models/Coupon');

module.exports = async function ensureCouponMaxUsesColumn() {
  const queryInterface = Coupon.sequelize.getQueryInterface();
  const table = Coupon.getTableName();
  const columns = await queryInterface.describeTable(table);

  if (!columns.max_uses_per_user) {
    await queryInterface.addColumn(table, 'max_uses_per_user', {
      type: Coupon.rawAttributes.max_uses_per_user.type,
      allowNull: true,
      defaultValue: null,
    });
  }
};
