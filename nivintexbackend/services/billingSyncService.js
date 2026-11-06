const axios = require('axios');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ProductImage = require('../models/ProductImage');
const Franchise = require('../models/Franchise');
const SubCategory = require('../models/SubCategory');
const { billingRequestManager } = require('./billingRequestManager');
const { billingApiBaseUrl, billingAssetBaseUrl } = require('../config/serviceUrls');

const timeout = Number(process.env.BILLING_API_TIMEOUT_MS) || 20000;
let activeSyncPromise = null;
let activeSyncMode = null;

function collection(payload, key) {
  const value = payload?.[key];
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (payload?.data?.[key] && typeof payload.data[key] === 'object') return [payload.data[key]];
  if (Array.isArray(payload?.data?.data?.[key])) return payload.data.data[key];
  if (payload?.data?.data?.[key] && typeof payload.data.data[key] === 'object') return [payload.data.data[key]];
  if (Array.isArray(payload?.result?.[key])) return payload.result[key];
  if (payload?.result?.[key] && typeof payload.result[key] === 'object') return [payload.result[key]];
  if (Array.isArray(payload?.data)) return payload.data;
  return Array.isArray(payload) ? payload : [];
}

function hasCollection(payload, key) {
  const values = [payload?.[key], payload?.data?.[key], payload?.data?.data?.[key], payload?.result?.[key]];
  return values.some(value => Array.isArray(value) || (value && typeof value === 'object'))
    || Array.isArray(payload?.data) || Array.isArray(payload);
}

function billingReferenceId(value) {
  return value && typeof value === 'object' ? (value.id ?? value.billing_id ?? null) : value;
}

function idOf(value) {
  return value === null || value === undefined || value === '' ? null : String(value);
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function variantStatus(value) {
  return ['inactive', 'disabled', '0', 'false', 'no'].includes(String(value ?? 'Active').trim().toLowerCase())
    ? 'Inactive'
    : 'Active';
}

function localUploadPath(value) {
  return typeof value === 'string' && /^uploads\/(?:prod|gal)-[^/\\]+$/i.test(value.replace(/\\/g, '/'))
    ? value.replace(/\\/g, '/')
    : null;
}

function imageUrl(value) {
  if (!value) return null;
  if (typeof value === 'object') value = value.url || value.image_url || value.image || value.path || value.src;
  if (!value || typeof value !== 'string') return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${billingAssetBaseUrl()}/${String(value).replace(/^\/+/, '')}`;
}

function detailProduct(payload) {
  const candidates = [payload?.product_details, payload?.product, payload?.products,
    payload?.data?.product_details, payload?.data?.product, payload?.data?.products,
    payload?.data?.data, payload?.data, payload];
  for (const candidate of candidates) {
    const product = Array.isArray(candidate) ? candidate[0] : candidate;
    if (product && typeof product === 'object' && (product.id != null || product.product_id != null)) return product;
  }
  return null;
}

function apiClient() {
  const baseURL = billingApiBaseUrl();
  const headers = { Accept: 'application/json' };
  if (process.env.BILLING_API_TOKEN) headers.Authorization = `Bearer ${process.env.BILLING_API_TOKEN}`;
  return axios.create({ baseURL, timeout, headers, maxContentLength: 20 * 1024 * 1024 });
}

async function fetchPayloads(productsOnly = false) {
  const client = apiClient();
  const requestGet = (path, params = {}, { fresh = false } = {}) => billingRequestManager.request({
    method: 'GET',
    key: `GET:${client.defaults.baseURL}${path}${Object.keys(params).length ? `?${Object.keys(params).sort().map(key => `${key}=${String(params[key])}`).join('&')}` : ''}`,
    bypassCache: fresh,
    label: path,
    execute: () => client.get(path, Object.keys(params).length ? { params } : undefined),
  });
  const allPaths = {
    categories: '/category',
    subcategories: '/subcategory',
    products: '/products',
    productVariants: '/product_varients',
    stocks: '/stocks',
    franchises: '/franchises',
  };
  const paths = productsOnly
    ? { categories: allPaths.categories, subcategories: allPaths.subcategories, products: allPaths.products, productVariants: allPaths.productVariants, stocks: allPaths.stocks }
    : allPaths;
  const fetchAllProductPages = async () => {
    // A product refresh must read Billing directly. Cached GET data can bring
    // deleted products back into the local catalog during reconciliation.
    const firstResponse = await requestGet(allPaths.products, {}, { fresh: true });
    const firstPayload = firstResponse.data;
    const lastPage = Math.max(1, Number(firstPayload?.meta?.last_page ?? firstPayload?.data?.meta?.last_page ?? 1) || 1);
    if (lastPage <= 1) return firstPayload;
    const pages = [];
    for (let page = 2; page <= lastPage; page += 1) {
      const response = await requestGet(allPaths.products, { page }, { fresh: true });
      pages.push(response.data);
    }
    const firstProducts = collection(firstPayload, 'products');
    const allProducts = [...firstProducts, ...pages.flatMap(payload => collection(payload, 'products'))];
    return { ...firstPayload, products: allProducts, meta: { ...firstPayload.meta, total_pages_fetched: lastPage } };
  };

  const entries = [];
  for (const [name, path] of Object.entries(paths)) {
    try {
      const response = name === 'products'
        ? { data: await fetchAllProductPages() }
        : await requestGet(path);
      if (response.data?.status && Number(response.data.status) >= 400) {
        throw Object.assign(new Error(`Billing API ${path} returned status ${response.data.status}`), { response: { status: Number(response.data.status), data: response.data } });
      }
      entries.push([name, response.data]);
    } catch (error) {
      // Stock is useful when exposed, but the billing account may not publish
      // the GET route. Product/variant endpoints remain the source for prices;
      // use their quantity/stock values if present and surface this as a warning.
      if (name === 'stocks' && error.response?.status === 404) {
        entries.push([name, { __unavailable: true, __warning: 'Billing GET /stocks returned 404; stock quantities were read from product/variant responses where available.' }]);
        continue;
      }
      throw new Error(`Billing sync failed at ${path} (HTTP ${error.response?.status || 'network error'}). ${error.response?.data?.message || error.message || 'Check API access and response format.'}`);
    }
  }
  const payloads = Object.fromEntries(entries);
  if (!productsOnly) {
    const productRows = new Map();
    for (const product of [...collection(payloads.products, 'products'), ...collection(payloads.productVariants, 'product_varients')]) {
      const id = idOf(product.id ?? product.product_id);
      if (id) productRows.set(id, product);
    }
    const detailsById = {};
    const delayMs = Math.max(0, Number(process.env.BILLING_API_PRODUCT_DETAILS_DELAY_MS) || 250);
    let index = 0;
    for (const id of productRows.keys()) {
      if (index > 0 && delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
      const response = await requestGet(`/product_details/${encodeURIComponent(id)}`);
      if (response.data?.status && Number(response.data.status) >= 400) {
        throw new Error(`Billing API /product_details/${id} returned status ${response.data.status}.`);
      }
      const product = detailProduct(response.data);
      if (!product) throw new Error(`Billing API /product_details/${id} returned no product record.`);
      detailsById[idOf(product.id ?? product.product_id) || id] = product;
      index += 1;
    }
    payloads.productDetails = detailsById;
  }
  return payloads;
}

function buildProducts(payloads) {
  const baseProducts = collection(payloads.products, 'products');
  const detailedProducts = collection(payloads.productVariants, 'product_varients');
  const byId = new Map();
  const individualDetails = Object.values(payloads.productDetails || {});
  for (const product of [...baseProducts, ...detailedProducts, ...individualDetails]) {
    const key = idOf(product.id);
    if (!key) continue;
    byId.set(key, { ...(byId.get(key) || {}), ...product });
  }

  const flatVariants = [];
  const variantsByProduct = new Map();
  for (const variant of flatVariants) {
    const productId = idOf(variant.product_id ?? variant.productId);
    if (!productId) continue;
    if (!variantsByProduct.has(productId)) variantsByProduct.set(productId, []);
    variantsByProduct.get(productId).push(variant);
  }

  const stockByVariant = new Map();
  const stockByVariantCode = new Map();
  for (const stock of collection(payloads.stocks, 'stocks')) {
    // The live /stocks contract exposes `id` as the Billing variant ID, but
    // don't rely on that undocumented equivalence. Match by its stable SKU/code
    // below unless the response explicitly names a variant ID.
    const variantId = idOf(stock.product_variant_id ?? stock.product_varient_id ?? stock.variant_id ?? stock.productVariantId);
    const markedOutOfStock = stock.in_stock === false || stock.in_stock === 0
      || ['false', '0', 'no', 'out of stock'].includes(String(stock.in_stock ?? '').trim().toLowerCase());
    const stockQuantity = markedOutOfStock
      ? 0
      : numberOrNull(stock.available_stock ?? stock.available_quantity ?? stock.available_qty ?? stock.quantity_available
        ?? stock.qty_available ?? stock.current_stock ?? stock.stock_qty ?? stock.quantity ?? stock.stock ?? stock.total_stock);
    if (variantId && stockQuantity !== null) stockByVariant.set(variantId, stockQuantity);
    const code = String(stock.variant_code || stock.sku || '').trim().toLowerCase();
    if (code && stockQuantity !== null) stockByVariantCode.set(code, stockQuantity);
  }

  return [...byId.entries()].map(([id, product]) => {
    const nested = Array.isArray(product.variants) ? product.variants : [];
    const flat = variantsByProduct.get(id) || [];
    const merged = new Map();
    for (const variant of [...flat, ...nested]) {
      const key = idOf(variant.id) || String(variant.variant_code || variant.sku || `${variant.size || ''}-${variant.color || ''}`);
      merged.set(key, { ...(merged.get(key) || {}), ...variant });
    }
    const variants = [...merged.values()].map(variant => {
      const variantId = idOf(variant.id);
      const variantCode = String(variant.variant_code || variant.sku || '').trim().toLowerCase();
      const stock = stockByVariantCode.has(variantCode)
        ? stockByVariantCode.get(variantCode)
        : variantId && stockByVariant.has(variantId)
          ? stockByVariant.get(variantId)
          : numberOrNull(variant.available_stock ?? variant.available_quantity ?? variant.available_qty ?? variant.quantity_available
            ?? variant.qty_available ?? variant.current_stock ?? variant.stock_qty ?? variant.quantity ?? variant.stock ?? variant.total_stock);
      return { ...variant, _availableQuantity: Math.max(0, Math.floor(stock ?? 0)) };
    });
    return { ...product, id, variants };
  });
}

async function syncAll(productsOnly = false) {
  const requestedMode = Boolean(productsOnly);
  if (activeSyncPromise) {
    // Identical refresh requests can share the same sync. A full sync waits for
    // a product-only sync (or vice versa) so they never write concurrently.
    if (activeSyncMode === requestedMode) return activeSyncPromise;
    try {
      await activeSyncPromise;
    } catch (_) {
      // A failed earlier sync should not prevent the queued mode from trying.
    }
    return syncAll(requestedMode);
  }

  activeSyncMode = requestedMode;
  activeSyncPromise = (async () => {
   let syncStep = 'fetching Billing API data';
   try {
    const payloads = await fetchPayloads(productsOnly);
    const categories = collection(payloads.categories, 'category');
    const subcategories = collection(payloads.subcategories, 'subcategory');
    const products = buildProducts(payloads);
    if (!hasCollection(payloads.products, 'products') || !hasCollection(payloads.productVariants, 'product_varients')) {
      throw new Error('Billing sync did not receive valid product and product variant collections; local catalog was left unchanged.');
    }
    const franchises = productsOnly ? [] : collection(payloads.franchises, 'franchises');
    const categorySnapshotAvailable = hasCollection(payloads.categories, 'category');
    const subcategorySnapshotAvailable = hasCollection(payloads.subcategories, 'subcategory');
    const result = { categories: 0, categoriesDeactivated: 0, subcategories: 0, subcategoriesDeactivated: 0, products: 0, variants: 0, productsDeactivated: 0, variantsDeactivated: 0, franchises: 0 };
    const stockWarning = payloads.stocks?.__warning;
    if (stockWarning) result.warnings = [stockWarning];

    await sequelize.transaction(async transaction => {
      const categoryMap = new Map();
      const seenBillingCategoryIds = new Set();
      for (const source of categories) {
        const billingId = idOf(source.id ?? source.category_id ?? source.categoryId);
        const name = source.name || source.category_name || source.categoryName;
        if (!billingId || !name) continue;
        let target = await Category.findOne({ where: { billingCategoryId: billingId }, transaction });
        // Reuse a pre-existing local category with the same unique Billing code
        // prefix, then attach the Billing ID instead of inserting a duplicate.
        if (!target && source.code_prefix) {
          target = await Category.findOne({ where: { code_prefix: source.code_prefix }, transaction });
        }
        const values = {
          name,
          code_prefix: source.code_prefix || null,
          image: imageUrl(source.image),
          status: variantStatus(source.status ?? source.is_active ?? source.isActive ?? source.active),
          billingCategoryId: billingId,
        };
        syncStep = `saving category ${billingId}`;
        if (target) await target.update(values, { transaction });
        else target = await Category.create(values, { transaction });
        categoryMap.set(billingId, target.id);
        seenBillingCategoryIds.add(billingId);
        result.categories += 1;
      }

      if (categorySnapshotAvailable) {
        const localCategories = await Category.findAll({
          where: { billingCategoryId: { [Op.ne]: null } },
          attributes: ['id', 'billingCategoryId', 'status'],
          transaction,
        });
        const removedCategoryIds = localCategories
          .filter(category => !seenBillingCategoryIds.has(idOf(category.billingCategoryId)) && category.status !== 'Inactive')
          .map(category => category.id);
        if (removedCategoryIds.length) {
          const [deactivated] = await Category.update({ status: 'Inactive' }, {
            where: { id: { [Op.in]: removedCategoryIds } }, transaction,
          });
          result.categoriesDeactivated = deactivated;
        }
      }

      const subcategoryMap = new Map();
      const billingSubcategoryIds = new Set();
      const billingCategoryIdsByLocalId = new Map([...categoryMap.entries()].map(([billingId, localId]) => [localId, billingId]));
      for (const source of subcategories) {
        const billingId = idOf(source.id ?? source.subcategory_id ?? source.subcategoryId);
        const name = source.name || source.subcategory_name || source.sub_category_name || source.subcategoryName;
        if (!billingId || !name) continue;
        const rawCategoryId = billingReferenceId(source.category_id ?? source.categoryId ?? source.cat_id ?? source.category);
        const rawCategoryName = source.category_name ?? source.categoryName ?? source.category?.name ?? source.Category?.name;
        const matchedCategory = categories.find(category => String(category.name || category.category_name || category.categoryName || '').trim().toLowerCase() === String(rawCategoryName || '').trim().toLowerCase());
        const billingCategoryId = idOf(rawCategoryId) || idOf(matchedCategory?.id ?? matchedCategory?.category_id ?? matchedCategory?.categoryId);
        const categoryId = billingCategoryId ? categoryMap.get(billingCategoryId) : null;
        if (!categoryId) continue;
        let target = await SubCategory.findOne({ where: { billingSubcategoryId: billingId }, transaction });
        if (!target) target = await SubCategory.findOne({ where: { categoryId, name }, transaction });
        const values = { name, categoryId, status: variantStatus(source.status ?? source.is_active ?? source.isActive ?? source.active), billingSubcategoryId: billingId };
        if (target) await target.update(values, { transaction });
        else target = await SubCategory.create(values, { transaction });
        subcategoryMap.set(billingId, target.id);
        billingSubcategoryIds.add(billingId);
        result.subcategories += 1;
      }

      if (categorySnapshotAvailable && subcategorySnapshotAvailable) {
        const localSubcategories = await SubCategory.findAll({
          where: { billingSubcategoryId: { [Op.ne]: null } },
          attributes: ['id', 'billingSubcategoryId', 'status'],
          transaction,
        });
        const removedSubcategoryIds = localSubcategories
          .filter(subcategory => !billingSubcategoryIds.has(idOf(subcategory.billingSubcategoryId)) && subcategory.status !== 'Inactive')
          .map(subcategory => subcategory.id);
        if (removedSubcategoryIds.length) {
          const [deactivated] = await SubCategory.update({ status: 'Inactive' }, {
            where: { id: { [Op.in]: removedSubcategoryIds } }, transaction,
          });
          result.subcategoriesDeactivated = deactivated;
        }
      }

      for (const source of products) {
        const billingId = idOf(source.id);
        const productCode = source.product_code || source.productCode || null;
        if (!billingId || !source.name) continue;
        let target = await Product.findOne({ where: { billingProductId: billingId }, transaction });
        // Adopt the imported ecommerce row when it predates billing_product_id.
        // product_code is unique in the existing products table.
        if (!target && productCode) {
          target = await Product.findOne({ where: { product_code: productCode }, transaction });
        }
        if (!target && source.barcode) {
          target = await Product.findOne({ where: { barcode: source.barcode }, transaction });
        }
        const billingCategoryId = idOf(billingReferenceId(source.category_id ?? source.categoryId ?? source.category));
        const variants = source.variants || [];
        const salePrice = numberOrNull(source.franchise_price_final ?? source.prices?.franchise);
        const retailPrice = numberOrNull(source.retail_price ?? source.prices?.retail);
        const listedMrp = numberOrNull(source.mrp ?? source.prices?.mrp);
        // Billing owns catalog data, not storefront photography. Product images
        // remain sourced from Admin uploads; keep only our local upload paths.
        const productMainImage = localUploadPath(target?.image);
        const productValues = {
          billingProductId: billingId,
          categoryId: billingCategoryId
            ? (categoryMap.get(billingCategoryId) || (categorySnapshotAvailable ? null : target?.categoryId || null))
            : null,
          // Billing subcategory IDs belong to another database. Keep them in a
          // separate column and retain only a valid local subcategory FK here.
          billingSubcategoryId: idOf(billingReferenceId(source.subcategory_id ?? source.subcategoryId ?? source.subcategory)),
          subCategoryId: subcategoryMap.get(idOf(billingReferenceId(source.subcategory_id ?? source.subcategoryId ?? source.subcategory)))
            || (!subcategorySnapshotAvailable && target?.subCategoryId && billingCategoryIdsByLocalId.get(target.categoryId) === billingCategoryId ? target.subCategoryId : null),
          productName: source.name,
          product_code: productCode,
          hsn_code: source.hsn_code || null,
          barcode: source.barcode || null,
          barcode_image: imageUrl(source.barcode_image),
          mrp: listedMrp > 0 ? listedMrp : retailPrice ?? salePrice ?? 0,
          salesPrice: salePrice ?? 0,
          franchise_price_final: salePrice,
          // GST inclusion is a storefront/Admin setting. Billing catalog refreshes
          // must not reset the value selected in Admin.
          mrpGstType: target?.mrpGstType || 'With GST',
          image: productMainImage,
          shortDescription: source.description || target?.shortDescription || null,
          longDescription: source.description || target?.longDescription || null,
          status: source.status || 'Active',
          stock: variants.reduce((sum, variant) => sum + variant._availableQuantity, 0),
        };
        syncStep = `saving product ${billingId}`;
        if (target) await target.update(productValues, { transaction });
        else target = await Product.create(productValues, { transaction });
        result.products += 1;

        const existingImages = await ProductImage.findAll({ where: { productId: target.id }, transaction });
        const nonAdminImages = existingImages.filter(image => !localUploadPath(image.url));
        if (nonAdminImages.length) {
          await ProductImage.destroy({
            where: { id: { [Op.in]: nonAdminImages.map(image => image.id) } },
            transaction,
          });
        }

        for (const sourceVariant of variants) {
          const variantBillingId = idOf(sourceVariant.id);
          if (!variantBillingId) continue;
          let variant = await ProductVariant.findOne({ where: { billingVariantId: variantBillingId }, transaction });
          // Existing local variant rows may have been imported before the Billing ID column was added.
          if (!variant && sourceVariant.variant_code) {
            variant = await ProductVariant.findOne({
              where: { productId: target.id, variant_code: sourceVariant.variant_code },
              transaction,
            });
          }
          const retainedVariantImages = (Array.isArray(variant?.images) ? variant.images : (variant?.image ? [variant.image] : []))
            .map(localUploadPath)
            .filter(Boolean);
          const variantImages = [...new Set(retainedVariantImages)];
          const variantValues = {
            billingVariantId: variantBillingId,
            billingData: {
              variant_name: sourceVariant.variant_name || null,
              width: sourceVariant.width || null,
              hsn_code: sourceVariant.hsn_code || null,
              barcode: sourceVariant.barcode || null,
              barcode_image: sourceVariant.barcode_image || null,
            },
            productId: target.id,
            variant_code: sourceVariant.variant_code || null,
            sku: sourceVariant.sku || null,
            color: sourceVariant.color || null,
            size: sourceVariant.size || null,
            fabric: sourceVariant.fabric || null,
            weight: sourceVariant.weight || null,
            volume: sourceVariant.volume || null,
            nos: sourceVariant.nos || null,
            mrp: numberOrNull(sourceVariant.mrp ?? sourceVariant.prices?.mrp) ?? listedMrp ?? retailPrice ?? salePrice ?? 0,
            salesPrice: numberOrNull(sourceVariant.franchise_price_final ?? sourceVariant.prices?.franchise) ?? salePrice ?? 0,
            franchise_price_final: numberOrNull(sourceVariant.franchise_price_final ?? sourceVariant.prices?.franchise) ?? salePrice,
            stock: sourceVariant._availableQuantity,
            image: variantImages[0] || null,
            images: variantImages,
            wholesale_price: numberOrNull(sourceVariant.wholesale_price ?? sourceVariant.prices?.wholesale),
            wholesale_discount_type: sourceVariant.wholesale_discount_type || null,
            wholesale_discount_value: numberOrNull(sourceVariant.wholesale_discount_value),
            wholesale_final_price: numberOrNull(sourceVariant.wholesale_final_price),
            retail_price: numberOrNull(sourceVariant.retail_price ?? sourceVariant.prices?.retail),
            retail_discount_type: sourceVariant.retail_discount_type || null,
            retail_discount_value: numberOrNull(sourceVariant.retail_discount_value),
            retail_final_price: numberOrNull(sourceVariant.retail_final_price),
            selling_price: numberOrNull(sourceVariant.selling_price),
            status: variantStatus(sourceVariant.status),
          };
          syncStep = `saving variant ${variantBillingId} for product ${billingId}`;
          if (variant) await variant.update(variantValues, { transaction, hooks: false });
          else variant = await ProductVariant.create(variantValues, { transaction, hooks: false });
          result.variants += 1;
        }
      }

      // Billing is authoritative for imported catalog presence. Keep local rows
      // and uploaded photos for Admin, but hide products/variants removed there.
      const billingProductIds = new Set(products.map(product => idOf(product.id)).filter(Boolean));
      const localProducts = await Product.findAll({
        where: { billingProductId: { [Op.ne]: null } },
        attributes: ['id', 'billingProductId'],
        transaction,
      });
      const removedProducts = localProducts.filter(product => !billingProductIds.has(idOf(product.billingProductId)));
      const removedProductIds = removedProducts.map(product => product.id);
      if (removedProductIds.length) {
        const [deactivated] = await Product.update({
          status: 'Inactive', stock: 0, isNewArrival: false, isBestSeller: false, isBuyOneGetOne: false,
        }, { where: { id: { [Op.in]: removedProductIds } }, transaction });
        result.productsDeactivated = deactivated;
      }

      const billingVariantIds = new Set(products.flatMap(product => product.variants || [])
        .map(variant => idOf(variant.id)).filter(Boolean));
      const localVariants = await ProductVariant.findAll({
        where: { billingVariantId: { [Op.ne]: null } },
        attributes: ['id', 'billingVariantId'],
        transaction,
      });
      const removedVariantIds = localVariants.filter(variant => !billingVariantIds.has(idOf(variant.billingVariantId)))
        .map(variant => variant.id);
      if (removedVariantIds.length) {
        const [deactivated] = await ProductVariant.update({ status: 'Inactive', stock: 0 }, {
          where: { id: { [Op.in]: removedVariantIds } }, transaction, hooks: false, individualHooks: false,
        });
        result.variantsDeactivated = deactivated;
      }

      for (const source of franchises) {
        const billingId = idOf(source.id);
        if (!billingId || !source.name) continue;
        let target = await Franchise.findOne({ where: { billingFranchiseId: billingId }, transaction });
        const values = {
          billingFranchiseId: billingId,
          name: source.name,
          owner_name: source.owner_name || null,
          email: source.email || null,
          phone: source.phone || null,
          gst: source.gst || null,
          address: source.address || null,
          state_id: source.state_id || null,
          city_id: source.city_id || null,
          pincode_id: source.pincode_id || null,
          pincode: source.pincode || null,
          area_name: source.area_name || null,
          status: source.status || 'Active',
        };
        syncStep = `saving franchise ${billingId}`;
        if (target) await target.update(values, { transaction });
        else target = await Franchise.create(values, { transaction });
        result.franchises += 1;
      }
    });

    return { success: true, message: 'Billing data synced successfully.', counts: result };
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const validationDetails = (error.errors || [])
        .map(item => `${item.path || 'field'}: ${item.message}`)
        .join('; ');
      error.message = `Validation failed while ${syncStep}${validationDetails ? ` (${validationDetails})` : ''}.`;
      error.status = 422;
    }
    const upstream = error.response?.status;
    if (upstream) {
      const apiPath = error.config?.url || 'billing API';
      throw new Error(`Billing sync failed at ${apiPath} (HTTP ${upstream}). Check API access and response format.`);
    }
    throw error;
   } finally {
    activeSyncPromise = null;
    activeSyncMode = null;
   }
  })();
  return activeSyncPromise;
}

module.exports = { syncAll };
