import React, { useEffect, useState } from 'react';
import { ShopProvider } from './context/ShopContext';
import { loadAllScripts } from './utils/loadScripts';

import Header from './components/Header';
import Hero from './components/Hero';
import InstagramSection from './components/InstagramSection';
import Footer from './components/Footer';
import CategorySection from './components/CategorySection';
import NewArrivals from './components/NewArrivals';
import BestSeller from './components/BestSeller';

import OrdersPage from './pages/Orders/OrdersPage';
import OrderDetailsPage from './pages/Orders/OrderDetailsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ShopGridPage from './pages/ShopGrid/ShopGridPage';
import ProductDetailsPage from './pages/ProductDetails/ProductDetailsPage';
import AboutPage from './pages/About/AboutPage';
import ContactPage from './pages/Contact/ContactPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import VerifyOTPPage from './pages/ForgotPassword/VerifyOTPPage';
import ResetPasswordPage from './pages/ForgotPassword/ResetPasswordPage';

import PrivacyPolicyPage from './pages/PrivacyPolicy/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfService/TermsOfServicePage';
import ShippingPolicyPage from './pages/ShippingPolicy/ShippingPolicyPage';
import RefundCancellationPolicyPage from './pages/RefundCancellationPolicy/RefundCancellationPolicyPage';
import ContactInformationPage from './pages/ContactInformation/ContactInformationPage';
import PaymentPolicyPage from './pages/PaymentPolicy/PaymentPolicyPage';

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
