const Stock = require('../models/Stock');
const Product = require('../models/Product');

// 1. Add Stock
exports.createStock = async (req, res) => {
  try {
    const { productId, productName, weight, stock, status } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({ error: 'Required fields missing: productId' });
    }

    // Check product exists
    const product = await Product.findByPk(Number(productId));
    if (!product) {
      return res.status(400).json({ error: `Product ID ${productId} does not exist` });
    }

    // Check if stock already exists for this product
    const existingStock = await Stock.findOne({ where: { productId: Number(productId) } });
    if (existingStock) {
      return res.status(400).json({ error: 'Stock already exists for this product' });
    }

    const newStock = await Stock.create({
      productName: productName || product.productName,
      weight: weight || 'Default',
      quantity: Number(stock) || 0,
      productId: Number(productId),
      status: status || (Number(stock) > 0 ? 'Active' : 'Inactive'),
    });

    res.status(201).json({ 
      message: 'Stock Added!', 
      data: {
        id: newStock.id,
        productId: newStock.productId,
        productName: newStock.productName,
        unit: newStock.weight,
        stock: newStock.quantity,
        status: newStock.status
      }
    });
  } catch (err) {
    console.error('createStock error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStock = async (req, res) => {
  try {
    const ProductVariant = require('../models/ProductVariant'); // require here to avoid circular dep issues if any, or just use it
    const variants = await ProductVariant.findAll({
      include: [{
         model: Product,
         attributes: ['id', 'categoryId', 'productName', 'shortDescription', 'longDescription', 'image', 'status', 'product_code', 'hsn_code', 'barcode', 'barcode_image', 'created_at', 'updated_at']
      }],
      order: [['id', 'DESC']]
    });

    const mapped = variants.map(v => {
      const p = v.Product;
      const productObj = p ? {
        id: p.id,
        category_id: p.categoryId,
        product_code: p.product_code,
        hsn_code: p.hsn_code,
        barcode: p.barcode,
        barcode_image: p.barcode_image,
        name: p.productName,
        description: p.shortDescription || p.longDescription,
        main_image: p.image,
        status: p.status,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
        ...p.toJSON()
      } : null;

      return {
        id: v.id,
        product_id: v.productId,
        variant_code: v.variant_code,
        size: v.size,
        color: v.color,
        sku: v.sku,
        wholesale_price: v.wholesale_price,
        wholesale_discount_type: v.wholesale_discount_type,
        wholesale_discount_value: v.wholesale_discount_value,
        wholesale_final_price: v.wholesale_final_price,
        retail_price: v.retail_price,
        retail_discount_type: v.retail_discount_type,
        retail_discount_value: v.retail_discount_value,
        retail_final_price: v.retail_final_price,
        franchise_price_final: v.franchise_price_final,
        mrp: v.mrp,
        selling_price: v.selling_price || v.salesPrice,
        status: v.status,
        created_at: v.createdAt,
        updated_at: v.updatedAt,
        quantity: v.stock || 0,
        product: productObj,
        ...v.toJSON()
      };
    });

    res.status(200).json({ status: 200, stocks: mapped });
  } catch (err) {
    console.error('getAllStock error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Stock by ID
exports.getStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const ProductVariant = require('../models/ProductVariant');
    
    const variant = await ProductVariant.findByPk(id, {
      include: [{
        model: Product,
        attributes: ['id', 'productName', 'mrp', 'salesPrice', 'image', 'stock']
      }]
    });

    if (!variant) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.status(200).json({
      id: variant.id,
      productId: variant.productId,
      productName: variant.Product?.productName,
      unit: variant.size ? [variant.size, variant.color, variant.fabric].filter(Boolean).join(' - ') : 'Default',
      stock: variant.stock,
      status: variant.status,
      Product: variant.Product
    });
  } catch (err) {
    console.error('getStockById error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 4. Update Stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, status } = req.body;
    
    const ProductVariant = require('../models/ProductVariant');
    const variant = await ProductVariant.findByPk(id, {
      include: [{ model: Product, attributes: ['id', 'productName', 'mrp', 'salesPrice', 'image'] }]
    });

    if (!variant) return res.status(404).json({ message: 'Variant stock not found' });

    if (stock !== undefined) variant.stock = Number(stock);
    if (status !== undefined) variant.status = status;
    if (stock !== undefined) variant.status = Number(stock) > 0 ? 'Active' : 'Inactive';

    await variant.save();

    return res.status(200).json({ 
      message: 'Stock Updated Successfully!',
      data: {
        id: variant.id,
        productId: variant.productId,
        productName: variant.Product?.productName,
        unit: variant.size ? [variant.size, variant.color, variant.fabric].filter(Boolean).join(' - ') : 'Default',
        stock: variant.stock,
        status: variant.status,
        Product: variant.Product
      }
    });

  } catch (err) {
    console.error('updateStock error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 5. Delete Stock
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't delete if it's a virtual stock
    if (id.toString().startsWith('product_')) {
      return res.status(400).json({ message: 'Cannot delete virtual stock. Create a stock record first.' });
    }
    
    const deleted = await Stock.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.status(200).json({ message: 'Stock Deleted!' });
  } catch (err) {
    console.error('deleteStock error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Decrement Billing stock for the ordered Billing variant. Expected body:
// { product_variant_id: "<billing variant id>", quantity: <positive integer> }.
exports.decrementBillingStock = async (req, res) => {
  try {
    const axios = require('axios');
    const variantId = req.body.product_variant_id ?? req.body.variant_id ?? req.body.id;
    const quantity = Number(req.body.quantity);
    if (variantId === undefined || variantId === null || String(variantId).trim() === '' || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'product_variant_id and a positive integer quantity are required.' });
    }
    const baseUrl = (process.env.BILLING_API_BASE_URL || 'https://billing.fashionaura26.com/api').replace(/\/+$/, '');
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (process.env.BILLING_API_TOKEN) headers.Authorization = `Bearer ${process.env.BILLING_API_TOKEN}`;
    const response = await axios.post(`${baseUrl}/stocks/decrement`, { product_variant_id: variantId, quantity }, {
      headers,
      timeout: Number(process.env.BILLING_API_TIMEOUT_MS) || 20000,
    });
    return res.status(200).json({ success: true, billing: response.data });
  } catch (error) {
    console.error('Billing stock decrement failed:', error.response?.status || error.code || error.message);
    return res.status(502).json({ success: false, message: 'Billing stock decrement failed.' });
  }
};
