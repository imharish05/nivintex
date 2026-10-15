const ProductSpecification = require('../models/ProductSpecification');

module.exports = async function ensureProductSpecificationsTable() {
  await ProductSpecification.sync();
};
