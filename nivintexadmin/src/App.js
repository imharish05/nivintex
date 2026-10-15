import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import Dashboard from './components/Dashboard/Dashboard';
import Categories from './components/Categories/Categories';
import SubCategories from './components/SubCategories/SubCategories';
import Brands from './components/Brands/Brands';
import Products from './components/Products/Products';
import VariantsPage from './components/Variants/VariantsPage';
import Stock from './components/Stock/Stock';
import Customers from './components/Customers/Customers';
import Reviews from './components/Reviews/Reviews';
import Coupons from './components/Coupons/AddCoupon';
import Orders from './components/orders/orders';
import AdminContactManager from './components/Admincontactmanager';
import Banners from './components/Banners/Banners';
import OfferBanners from './components/OfferBanners/OfferBanners';
import Combos from './components/Combos/Combos';
import Toast from './components/Toast/Toast';
import './styles/global.css';
import Swal from 'sweetalert2';
import LiveProducts from './components/LiveProducts/LiveProducts';
import InstagramPostsAdmin from './components/Instagrampostsadmin/Instagrampostsadmin'; 
import PromoBar from './components/Promobar/Promobar'; 
import SaleManager from './components/SaleManager/SaleManager'; 
import FranchiseLogin from './components/Franchise/FranchiseLogin';
import FranchiseDashboard from './components/Franchise/FranchiseDashboard';
const PAGE_CONFIG = {
  dashboard:          { title: 'Dashboard' },
  combos:             { title: 'Combos Management' },
  categories:         { title: 'Categories' },
  subcategories:      { title: 'Sub-Categories' },
  brands:             { title: 'Brands' },
  products:           { title: 'Products' },
  variants:           { title: 'Product Variants' },
  stock:              { title: 'Stock Management' },
  customers:          { title: 'Customers' },
  reviews:            { title: 'Reviews' },
  coupons:            { title: 'Coupon Management' },
  orders:             { title: 'All Orders' },
  orders_new:         { title: 'New Orders' },
  orders_confirmed:   { title: 'Confirmed Orders' },
  orders_shipped:     { title: 'Shipped Orders' },
  orders_delivery:    { title: 'Out for Delivery' },
  orders_delivered:   { title: 'Delivered Orders' },
  orders_cancelled:   { title: 'Cancelled Orders' },
  contacts:           { title: 'Contact Requests' },
  banners:            { title: 'Banners' },
  'offer-banners':    { title: 'Offer Banners' },
  'live-products':    { title: 'What More Live' },
  'instagram-posts':  { title: 'Instagram Posts' }, // ← NEW
  'sale-manager':     { title: 'Sales Management' },
  'promo-bar':        { title: 'Promo Bar' },
};

function AdminLayoutWrapper({ handleLogout, showToast, toast }) {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'dashboard';
  const cfg = PAGE_CONFIG[currentPath] || PAGE_CONFIG.dashboard;

  return (
    <div className="layout">
      <Sidebar activePage={currentPath} onLogout={handleLogout} />
      <main className="main">
        <Topbar title={cfg.title} />
        <div className="content">
          <Routes>
            <Route path="/dashboard"          element={<Dashboard     showToast={showToast} />} />
            <Route path="/combos"             element={<Combos        showToast={showToast} />} />
            <Route path="/categories"         element={<Categories    showToast={showToast} />} />
            <Route path="/subcategories"     element={<SubCategories showToast={showToast} />} />


            <Route path="/products"           element={<Products      showToast={showToast} />} />
            <Route path="/variants"           element={<VariantsPage  showToast={showToast} />} />
            <Route path="/stock"              element={<Stock         showToast={showToast} />} />
            <Route path="/customers"          element={<Customers     showToast={showToast} />} />
            <Route path="/reviews"            element={<Reviews       showToast={showToast} />} />
            <Route path="/coupons"            element={<Coupons       showToast={showToast} />} />
            <Route path="/banners"            element={<Banners       showToast={showToast} />} />
            <Route path="/offer-banners"      element={<OfferBanners  showToast={showToast} />} />
            <Route path="/live-products"      element={<LiveProducts  showToast={showToast} />} />
            <Route path="/instagram-posts"    element={<InstagramPostsAdmin showToast={showToast} />} /> {/* ← NEW */}
            <Route path="/sale-manager"       element={<SaleManager   showToast={showToast} />} />

            <Route path="/orders"             element={<Orders showToast={showToast} status={null} />} />
            <Route path="/orders_new"         element={<Orders showToast={showToast} status="processing" />} />
            <Route path="/orders_confirmed"   element={<Orders showToast={showToast} status="confirmed" />} />
            <Route path="/orders_shipped"     element={<Orders showToast={showToast} status="shipped" />} />
            <Route path="/orders_delivery"    element={<Orders showToast={showToast} status="out_for_delivery" />} />
            <Route path="/orders_delivered"   element={<Orders showToast={showToast} status="delivered" />} />
            <Route path="/orders_cancelled"   element={<Orders showToast={showToast} status="cancelled" />} />

            <Route path="/contacts"           element={<AdminContactManager showToast={showToast} />} />
            <Route path="/promo-bar" element={<PromoBar showToast={showToast} />} />

            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </main>

      <Toast show={toast.show} title={toast.title} msg={toast.msg} />
    </div>
  );
}

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [toast, setToast] = useState({ show: false, title: '', msg: '' });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.exp || payload.exp * 1000 <= Date.now()) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        } else {
          setIsAdminLoggedIn(true);
          const timer = window.setTimeout(() => window.dispatchEvent(new Event('admin-auth-expired')), Math.max(0, payload.exp * 1000 - Date.now()));
          setIsCheckingAuth(false);
          return () => window.clearTimeout(timer);
        }
      } catch (_) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    const expireAdminSession = () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsAdminLoggedIn(false);
    };
    window.addEventListener('admin-auth-expired', expireAdminSession);
    return () => window.removeEventListener('admin-auth-expired', expireAdminSession);
  }, []);

  if (isCheckingAuth) return null;

  const showToast = (title, msg = '') => {
    setToast({ show: true, title, msg });
    setTimeout(() => setToast({ show: false, title: '', msg: '' }), 2800);
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: "Are you sure you want to exit?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f5447',
      cancelButtonColor: '#ff4444',
      confirmButtonText: 'Yes, Logout!',
      background: '#131f33',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setIsAdminLoggedIn(false);
      }
    });
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAdminLoggedIn
            ? <Login onLoginSuccess={() => setIsAdminLoggedIn(true)} />
            : <Navigate to="/dashboard" />}
        />
        <Route
          path="/franchise/login"
          element={<FranchiseLogin onLoginSuccess={() => {}} />}
        />
        <Route
          path="/franchise/dashboard"
          element={
            localStorage.getItem('franchiseToken')
              ? <div className="layout"><main className="main" style={{ marginLeft: 0, width: '100%' }}><FranchiseDashboard showToast={showToast} /></main><Toast show={toast.show} title={toast.title} msg={toast.msg} /></div>
              : <Navigate to="/franchise/login" />
          }
        />
        <Route
          path="/*"
          element={isAdminLoggedIn
            ? <AdminLayoutWrapper handleLogout={handleLogout} showToast={showToast} toast={toast} />
            : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}
