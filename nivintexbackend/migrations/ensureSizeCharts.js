const SizeChart = require('../models/SizeChart');
const ProductSizeChart = require('../models/ProductSizeChart');
const Category = require('../models/Category');

const standardColumns = [
  { key: 'bust', label: 'Bust' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'shoulder', label: 'Shoulder' },
];
const standardRows = [
  { size: 'XS', measurements: { bust: '32', waist: '28', hip: '36', shoulder: '13.5' } },
  { size: 'S', measurements: { bust: '34', waist: '30', hip: '38', shoulder: '14' } },
  { size: 'M', measurements: { bust: '36', waist: '32', hip: '40', shoulder: '14.5' } },
  { size: 'L', measurements: { bust: '38', waist: '34', hip: '42', shoulder: '15' } },
  { size: 'XL', measurements: { bust: '40', waist: '36', hip: '44', shoulder: '15.5' } },
  { size: 'XXL', measurements: { bust: '42', waist: '38', hip: '46', shoulder: '16' } },
  { size: 'XXXL', measurements: { bust: '44', waist: '40', hip: '48', shoulder: '16.5' } },
];

module.exports = async function ensureSizeCharts() {
  await SizeChart.sync();
  await ProductSizeChart.sync();
  const existingDefault = await SizeChart.findOne({ where: { isDefault: true } });
  if (!existingDefault) {
    await SizeChart.create({
      title: 'Default clothing size chart',
      unit: 'IN',
      isDefault: true,
      columns: standardColumns,
      rows: standardRows,
    });
  }

  // Give every existing category its own editable chart, without replacing
  // charts an admin has already created for specific categories.
  const categories = await Category.findAll();
  for (const category of categories) {
    if (!category.billingCategoryId) continue;
    const existingCategoryChart = await SizeChart.findOne({ where: { categoryBillingId: category.billingCategoryId } });
    if (existingCategoryChart) continue;
    await SizeChart.create({
      title: `${category.name} Size Chart`,
      categoryBillingId: category.billingCategoryId,
      unit: 'IN',
      isDefault: false,
      columns: standardColumns,
      rows: standardRows,
    });
  }
};
