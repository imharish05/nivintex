import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ShopProvider } from './context/ShopContext';
import { loadAllScripts } from './utils/loadScripts';

import Header from './components/Header';
import Hero from './components/Hero';
import InstagramSection from './components/InstagramSection';
import Footer from './components/Footer';
import CategorySection from './components/CategorySection';
import NewArrivals from './components/NewArrivals';
import BestSeller from './components/BestSeller';

const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const ShopGridPage = lazy(() => import('./pages/ShopGrid/ShopGridPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetails/ProductDetailsPage'));
const AboutPage = lazy(() => import('./pages/About/AboutPage'));
const ContactPage = lazy(() => import('./pages/Contact/ContactPage'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage'));
const VerifyOTPPage = lazy(() => import('./pages/ForgotPassword/VerifyOTPPage'));
const ResetPasswordPage = lazy(() => import('./pages/ForgotPassword/ResetPasswordPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfService/TermsOfServicePage'));
const ShippingPolicyPage = lazy(() => import('./pages/ShippingPolicy/ShippingPolicyPage'));
const RefundCancellationPolicyPage = lazy(() => import('./pages/RefundCancellationPolicy/RefundCancellationPolicyPage'));
const ContactInformationPage = lazy(() => import('./pages/ContactInformation/ContactInformationPage'));
const PaymentPolicyPage = lazy(() => import('./pages/PaymentPolicy/PaymentPolicyPage'));

import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import OfferBanner from './components/OfferBanner';
import WhatsAppFloat from './components/WhatsAppFloat';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopOnNavigation from './components/ScrollToTopOnNavigation';

import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

function HomePage({ onOpenCart, onOpenWishlist }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    loadAllScripts();
  }, []);

  return (
    <>
      <div className="mouse-cursor cursor-outer"></div>
      <div className="mouse-cursor cursor-inner"></div>
   
      <Header onOpenCart={onOpenCart} onOpenWishlist={onOpenWishlist} />
      <Hero />
      <CategorySection />
      <InstagramSection />
      <NewArrivals />
      <BestSeller />
    
      <OfferBanner/>
      <Footer />
    </>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);

  const openCart     = () => { setCartOpen(true);  setWishOpen(false); };
  const openWishlist = () => { setWishOpen(true);  setCartOpen(false); };
  const closeCart    = () => {
    setCartOpen(false);
    if (location.pathname === '/cart') {
      navigate('/home');
    }
  };
  const closeWish    = () => {
    setWishOpen(false);
    if (location.pathname === '/wishlist') {
      navigate('/home');
    }
  };

  useEffect(() => {
    if (location.pathname === '/cart') {
      setCartOpen(true);
      setWishOpen(false);
    } else if (location.pathname === '/wishlist') {
      setWishOpen(true);
      setCartOpen(false);
    } else {
      setCartOpen(false);
      setWishOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleOpenCart = () => openCart();
    const handleOpenWish = () => openWishlist();
    window.addEventListener('openCartDrawer', handleOpenCart);
    window.addEventListener('openWishlistDrawer', handleOpenWish);
    return () => {
      window.removeEventListener('openCartDrawer', handleOpenCart);
      window.removeEventListener('openWishlistDrawer', handleOpenWish);
    };
  }, []);

  const NotFoundPage = () => (
    <>
      <Header onOpenCart={openCart} onOpenWishlist={openWishlist} />
      <main style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center', background: '#F4F0E8' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C9933A', marginBottom: 8 }}>404</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 42px)', color: '#0f5447', margin: '0 0 12px' }}>Page Not Found</h1>
        <p style={{ color: '#6B6B8A', fontSize: 14, maxWidth: 420, marginBottom: 24 }}>
          The page you are looking for does not exist or may have moved.
        </p>
        <a href="/shop" onClick={e => { e.preventDefault(); window.location.assign('/shop'); }} style={{ padding: '12px 28px', background: '#0f5447', color: '#fff', textDecoration: 'none', borderRadius: 6, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
          Browse Collection
        </a>
      </main>
      <Footer />
    </>
  );

  const withHeader = (PageComponent, extraProps = {}) => (
    <>
      <Header onOpenCart={openCart} onOpenWishlist={openWishlist} />
      <PageComponent {...extraProps} />
    </>
  );

  return (
    <ShopProvider>
      <ScrollToTopOnNavigation />
      <Suspense fallback={<div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: '#0f5447' }}>Loading page…</div>}>
      <Routes>
        <Route path="/" element={<HomePage onOpenCart={openCart} onOpenWishlist={openWishlist} />} />
        <Route path="/home" element={<HomePage onOpenCart={openCart} onOpenWishlist={openWishlist} />} />
        <Route path="/shop" element={withHeader(ShopGridPage)} />
        <Route path="/sale" element={withHeader(ShopGridPage, { saleOnly: true })} />
        <Route path="/product-details" element={withHeader(ProductDetailsPage)} />
        <Route path="/product/:slug" element={withHeader(ProductDetailsPage)} />
        <Route path="/about" element={withHeader(AboutPage)} />
        <Route path="/contact" element={withHeader(ContactPage)} />
        <Route path="/checkout" element={withHeader(CheckoutPage)} />
        <Route path="/login" element={withHeader(LoginPage)} />
        <Route path="/register" element={withHeader(RegisterPage)} />
        <Route path="/cart" element={<HomePage onOpenCart={openCart} onOpenWishlist={openWishlist} />} />
        <Route path="/wishlist" element={<HomePage onOpenCart={openCart} onOpenWishlist={openWishlist} />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forgot-password" element={withHeader(ForgotPasswordPage)} />
        <Route path="/verify-otp" element={withHeader(VerifyOTPPage)} />
        <Route path="/reset-password" element={withHeader(ResetPasswordPage)} />
        <Route path="/privacy-policy" element={withHeader(PrivacyPolicyPage)} />
        <Route path="/terms-of-service" element={withHeader(TermsOfServicePage)} />
        <Route path="/shipping-policy" element={withHeader(ShippingPolicyPage)} />
        <Route path="/payment-policy" element={withHeader(PaymentPolicyPage)} />
        <Route path="/refund-cancellation" element={withHeader(RefundCancellationPolicyPage)} />
        <Route path="/contact-information" element={withHeader(ContactInformationPage)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      <CartDrawer open={cartOpen} onClose={closeCart} />
      <WishlistDrawer open={wishOpen} onClose={closeWish} onOpenCart={openCart} />
      <ScrollToTop />
      <WhatsAppFloat />
    </ShopProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
