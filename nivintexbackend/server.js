require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// --- 1. MODELS IMPORT ---
const Category      = require('./models/Category');
const SubCategory   = require('./models/SubCategory');
const Brand         = require('./models/Brand');
const Product       = require('./models/Product');
const UserLogin     = require('./models/UserLogin');
const Customer      = require('./models/Customer');
const Cart          = require('./models/Cart');
const Wishlist      = require('./models/Wishlist');
const Order         = require('./models/Order');
const OrderItem     = require('./models/OrderItem');
const Return        = require('./models/Return');
const Banner        = require('./models/Banner');
const OfferBanner   = require('./models/Offerbanner');
const LiveProduct   = require('./models/LiveProduct');
const InstagramPost = require('./models/InstagramPost');
const PromoBar         = require('./models/PromoBar');
const ProductVariant   = require('./models/ProductVariant');
const RootCombo        = require('./models/RootCombo');
const ChildCombo       = require('./models/ChildCombo');
const ComboProduct     = require('./models/ComboProduct');
const SiteSettings     = require('./models/SiteSettings');
const ProductImage     = require('./models/ProductImage');

SubCategory.hasMany(Product, { foreignKey: 'subCategoryId', constraints: false });
Product.belongsTo(SubCategory, { foreignKey: 'subCategoryId', constraints: false });
SubCategory.belongsTo(Category, { foreignKey: 'categoryId', constraints: false });
Category.hasMany(SubCategory, { foreignKey: 'categoryId', constraints: false });

Brand.hasMany(Product, { foreignKey: 'brandId', constraints: false });
Product.belongsTo(Brand, { foreignKey: 'brandId', constraints: false });

Category.hasMany(Product,   { foreignKey: 'categoryId',  constraints: false });
Product.belongsTo(Category, { foreignKey: 'categoryId',  constraints: false });

Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'Variants', constraints: false });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', constraints: false });

Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'Images', constraints: false });
ProductImage.belongsTo(Product, { foreignKey: 'productId', constraints: false });

Order.hasMany(OrderItem,    { foreignKey: 'orderId', onDelete: 'CASCADE', constraints: false });
OrderItem.belongsTo(Order,  { foreignKey: 'orderId',  constraints: false });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'Product', constraints: false });
Product.hasMany(OrderItem,   { foreignKey: 'product_id', constraints: false });

Cart.belongsTo(Product, { foreignKey: 'productId', constraints: false });
Product.hasMany(Cart,   { foreignKey: 'productId', constraints: false });
Cart.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'Variant', constraints: false });
ProductVariant.hasMany(Cart, { foreignKey: 'variantId', constraints: false });

Order.hasMany(Return,   { foreignKey: 'order_id', constraints: false });
Return.belongsTo(Order, { foreignKey: 'order_id', constraints: false });

RootCombo.hasMany(ChildCombo,  { foreignKey: 'rootComboId', onDelete: 'CASCADE', constraints: false });
ChildCombo.belongsTo(RootCombo,{ foreignKey: 'rootComboId', constraints: false });

ChildCombo.hasMany(ComboProduct,  { foreignKey: 'comboId', onDelete: 'CASCADE', constraints: false });
ComboProduct.belongsTo(ChildCombo,{ foreignKey: 'comboId', constraints: false });

ComboProduct.belongsTo(Product, { foreignKey: 'productId', as: 'Product', constraints: false });
Product.hasMany(ComboProduct,   { foreignKey: 'productId', constraints: false });


// --- 3. ROUTES IMPORT ---
const adminRoutes         = require('./routes/adminRoutes');
const categoryRoutes      = require('./routes/categoryRoutes');
const productRoutes       = require('./routes/productRoutes');
const brandRoutes         = require('./routes/brandRoutes');
const stockRoutes         = require('./routes/stockRoutes');
const customerRoutes      = require('./routes/customerRoutes');
const reviewRoutes        = require('./routes/reviewRoutes');
const dashboardRoutes     = require('./routes/dashboardRoutes');
const subCategoryRoutes   = require('./routes/subCategoryRoutes');
const userLoginRoutes     = require('./routes/userloginRoutes');
const cartRoutes          = require('./routes/cartRoutes');
const wishlistRoutes      = require('./routes/wishlistRoutes');
const couponRoutes        = require('./routes/couponRoutes');
const razorpayRoutes      = require('./routes/razorpayRoutes');
const orderRoutes         = require('./routes/orderRoutes');
const returnRoutes        = require('./routes/returnRoutes');
const contactroutes       = require('./routes/contactRoutes');
const bannerRoutes        = require('./routes/bannerRoutes');
const offerBannerRoutes   = require('./routes/offerbannerRoutes');
const liveProductRoutes   = require('./routes/liveProductRoutes');
const instagramPostRoutes = require('./routes/instagrampostRoutes');
const promoBarRoutes      = require('./routes/promoBarRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const variantRoutes       = require('./routes/variantRoutes');
const comboRoutes         = require('./routes/comboRoutes');
const siteSettingsRoutes  = require('./routes/siteSettingsRoutes');
const productDetailsRoutes = require('./routes/productDetailsRoutes');
const productVariantsRoutes = require('./routes/productVariantsRoutes');
const franchiseRoutes       = require('./routes/franchiseRoutes');
const shippingRoutes        = require('./routes/shippingRoutes');
const syncRoutes            = require('./routes/syncRoutes');
const billingRoutes         = require('./routes/billingRoutes');
const productSpecificationRoutes = require('./routes/productSpecificationRoutes');
const sizeChartRoutes = require('./routes/sizeChartRoutes');

const app = express();

// --- 4. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static('uploads'));

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// --- 5. ROUTES SETUP ---
app.use('/api/user',             userLoginRoutes);
app.use('/api/auth',             adminRoutes);
app.use('/api/category',       categoryRoutes);
app.use('/api/products',         productRoutes);
app.use('/api/product-specifications', productSpecificationRoutes);
app.use('/api/size-charts', sizeChartRoutes);
app.use('/api/product_details',  productDetailsRoutes);
app.use('/api/product_varients', productVariantsRoutes);
app.use('/api/brands',           brandRoutes);
app.use('/api/stocks',           stockRoutes);
app.use('/api/customers',        customerRoutes);
app.use('/api/reviews',          reviewRoutes);
app.use('/api/dashboard',        dashboardRoutes);
app.use('/api/subcategories',    subCategoryRoutes);
app.use('/api/cart',             cartRoutes);
app.use('/api/wishlist',         wishlistRoutes);
app.use('/api/coupons',          couponRoutes);
app.use('/api/razorpay',         razorpayRoutes);
app.use('/api/orders',           orderRoutes);
app.use('/api/returns',          returnRoutes);
app.use('/api/contact',          contactroutes);
app.use('/api/banners',          bannerRoutes);
app.use('/api/offer-banners',    offerBannerRoutes);
app.use('/api/live-products',    liveProductRoutes);
app.use('/api/instagram-posts',  instagramPostRoutes);
app.use('/api/promo-bar',        promoBarRoutes);
app.use('/api/password-reset',   passwordResetRoutes);
app.use('/api/variants',         variantRoutes);
app.use('/api/combos',           comboRoutes);
app.use('/api/site-settings',    siteSettingsRoutes);
app.use('/api/franchises',       franchiseRoutes);
app.use('/api/shipping',         shippingRoutes);
app.use('/api/sync',             syncRoutes);
app.use('/api/billing',          billingRoutes);

// --- 6. SYNC & LISTEN ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  let startupStep = 'database authentication';
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected!');
    startupStep = 'database model sync';
    await sequelize.sync({ force: false }); // Only create missing tables, don't alter existing ones
    startupStep = 'product specifications table migration';
    await require('./migrations/ensureProductSpecificationsTable')();
    startupStep = 'size charts migration';
    await require('./migrations/ensureSizeCharts')();
    startupStep = 'subcategory image column migration';
    await require('./migrations/ensureSubCategoryImageColumn')();
    startupStep = 'product ecommerce column migration';
    await require('./migrations/ensureProductEcommerceColumns')();
    startupStep = 'billing integration column migration';
    await require('./migrations/ensureBillingIntegrationColumns')();
    startupStep = 'cart shipping details migration';
    await require('./migrations/ensureCartShippingColumns')();
    startupStep = 'order item shipping details migration';
    await require('./migrations/ensureOrderItemShippingColumns')();
    startupStep = 'order billing fields migration';
    await require('./migrations/ensureOrderBillingFields')();
    startupStep = 'order Shiprocket fields migration';
    await require('./migrations/ensureOrderShiprocketFields')();
    startupStep = 'order Billing stock sync fields migration';
    await require('./migrations/ensureOrderBillingStockFields')();
    startupStep = 'wishlist variant migration';
    const ensureWishlistVariantColumns = require('./migrations/ensureWishlistVariantColumns');
    await ensureWishlistVariantColumns();
    await ensureWishlistVariantColumns.ensureCartVariantColumn();
    console.log('✅ MySQL Connected & Database Synced');

    startupStep = 'HTTP server startup';
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error(`❌ Startup failed during ${startupStep}:`, err);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
};

startServer();
