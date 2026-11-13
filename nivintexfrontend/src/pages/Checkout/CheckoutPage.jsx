import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import Footer from '../../components/Footer';
import defaultLogo from '../../assets/img/logo2.png';
import { useShop, calculateCartTotals } from '../../context/ShopContext';
import { productApi, razorpayApi, couponApi } from '../../utils/api';
import CourierSelectModal from '../../components/CourierSelectModal';
import { API_BASE_URL } from '../../config/api';
import {
  sanitizeIndianPhone,
  validateEmail,
  validateIndianPhone,
  validateName,
  validatePincode,
  validatePassword,
} from '../../utils/formValidation';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// Change these paths to match your policy pages
const POLICY_LINKS = {
  terms: '/terms-of-service',
  shipping: '/shipping-policy',
  returns: '/refund-cancellation',
};

const ORDER_SAVE_URL = `${API_BASE_URL}/orders/save`;
const SHIPPING_QUOTE_URL = `${API_BASE_URL}/shipping/quote`;

const BRAND       = '#0f5447';
const ACCENT      = '#126354';
const GREEN       = '#A2C579';
const ACCENT_SOFT = 'rgba(162,197,121,0.10)';
const ACCENT_GLOW = 'rgba(162,197,121,0.25)';

const F = {
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};


const inputStyle = {
  width: '100%', padding: '11px 14px',
  border: '1px solid #EAE4D6', borderRadius: '0px',
  fontSize: '13px', outline: 'none', marginBottom: '16px',
  background: '#EAF0E2', fontFamily: F.sub,
  color: '#111111', transition: 'border-color 0.25s, box-shadow 0.25s',
  boxSizing: 'border-box', fontWeight: 500, letterSpacing: '0.3px',
};
const onFocus = e => { e.target.style.borderColor = '#C9933A'; e.target.style.boxShadow = `0 0 0 3px rgba(201,147,58,0.08)`; };
const onBlur  = e => { e.target.style.borderColor = '#EAE4D6'; e.target.style.boxShadow = 'none'; };

const Field = ({ label, optional, error, ...props }) => (
  <>
    <label className="ck-label" style={error ? { color: '#c0392b' } : {}}>
      {label}
      {optional && <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: '#8FA88A' }}> (optional)</span>}
    </label>
    <input
      style={{ ...inputStyle, ...(error ? { borderColor: '#e74c3c', background: '#fff8f7', boxShadow: '0 0 0 3px rgba(231,76,60,0.10)' } : {}) }}
      onFocus={onFocus} onBlur={onBlur} {...props}
    />
    {error && <span className="ck-error-msg">{error}</span>}
  </>
);

const StateAutocompleteField = ({ label, value, onChange, error, optional, placeholder = 'Select or type state' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = (value || '').trim().toLowerCase();
  const filtered = query
    ? INDIAN_STATES.filter(s => s.toLowerCase().includes(query)).sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(query);
        const bStarts = b.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
    : INDIAN_STATES;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  const handleSelect = (stateName) => {
    onChange(stateName);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filtered.length > 0) {
        e.preventDefault();
        const pickIndex = highlightedIndex >= 0 ? highlightedIndex : 0;
        handleSelect(filtered[pickIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items && items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', marginBottom: error ? '4px' : '16px', position: 'relative' }}>
      <label className="ck-label" style={error ? { color: '#c0392b' } : {}}>
        {label}
        {optional && <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: '#8FA88A' }}> (optional)</span>}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            ...inputStyle,
            paddingRight: '36px',
            marginBottom: 0,
            ...(error ? { borderColor: '#e74c3c', background: '#fff8f7', boxShadow: '0 0 0 3px rgba(231,76,60,0.10)' } : {})
          }}
          onFocus={e => {
            onFocus(e);
            setIsOpen(true);
          }}
          onBlur={e => {
            onBlur(e);
            const trimmed = (value || '').trim().toLowerCase();
            if (trimmed) {
              const match = INDIAN_STATES.find(s => s.toLowerCase() === trimmed);
              if (match && value !== match) {
                onChange(match);
              }
            }
          }}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <div
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: '#8FA88A',
            fontSize: 12,
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <i className="fa-solid fa-chevron-down" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </div>
      </div>

      {error && <span className="ck-error-msg" style={{ display: 'block', marginTop: 4 }}>{error}</span>}

      {isOpen && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#ffffff',
            border: '1px solid #C9933A',
            borderTop: 'none',
            maxHeight: '220px',
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          }}
        >
          {filtered.length === 0 ? (
            <li style={{ padding: '10px 14px', fontSize: 12, color: '#888', fontStyle: 'italic', fontFamily: F.sub }}>
              No matching Indian state found
            </li>
          ) : (
            filtered.map((stateName, idx) => {
              const isSelected = value && value.trim().toLowerCase() === stateName.toLowerCase();
              const isHighlighted = idx === highlightedIndex;
              return (
                <li
                  key={stateName}
                  onMouseDown={() => handleSelect(stateName)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    padding: '9px 14px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: F.sub,
                    color: isSelected ? '#fff' : '#1A1A1A',
                    background: isSelected ? BRAND : (isHighlighted ? '#F0F5ED' : '#fff'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f2f2f2'
                  }}
                >
                  <span>{stateName}</span>
                  {isSelected && <i className="fa-solid fa-check" style={{ fontSize: 10, color: '#fff' }} />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

const SelectField = ({ label, value, onChange, options }) => (
  <>
    <label className="ck-label">{label}</label>
    <select style={{ ...inputStyle, appearance: 'none' }} value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </>
);

const countries = [
  { value: 'IN', label: 'India' }, { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' }, { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
];

const loadRazorpayScript = () =>
  new Promise(resolve => {
    if (document.getElementById('razorpay-sdk')) return resolve(true);
    const s = document.createElement('script');
    s.id = 'razorpay-sdk';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const PaymentProcessingOverlay = () => (
  <div className="ck-payment-overlay">
    <div className="ck-payment-overlay-inner">
      <div className="ck-spinner-wrap">
        <div className="ck-spinner-ring" />
        <div className="ck-spinner" />
        <div className="ck-spinner-icon">
          <i className="fa-solid fa-check" style={{ color: GREEN, fontSize: 22 }} />
        </div>
      </div>
      <div className="ck-overlay-title">Payment Successful</div>
      <div className="ck-overlay-sub">Confirming your order…</div>
      <div className="ck-overlay-dots">
        <div className="ck-overlay-dot" />
        <div className="ck-overlay-dot" />
        <div className="ck-overlay-dot" />
      </div>
    </div>
  </div>
);

const normalizeAddressForCompare = (addr) => ({
  firstName: String(addr?.firstName || addr?.name || '').trim().toLowerCase(),
  phone: sanitizeIndianPhone(addr?.phone || ''),
  address: String(addr?.address || '').trim().toLowerCase(),
  address2: String(addr?.address2 || '').trim().toLowerCase(),
  city: String(addr?.city || '').trim().toLowerCase(),
  state: String(addr?.state || '').trim().toLowerCase(),
  zip: String(addr?.zip || '').trim(),
  country: String(addr?.country || 'India').trim().toLowerCase(),
});

const isSameAddress = (a, b) => {
  if (!a || !b) return false;
  const na = normalizeAddressForCompare(a);
  const nb = normalizeAddressForCompare(b);
  return Object.keys(na).every(k => na[k] === nb[k]);
};

const validateAddressFields = (addr, { requireEmail = false } = {}) => {
  const errs = {};
  const nameErr = validateName(addr?.firstName || addr?.name, 'Full name');
  if (nameErr) errs.firstName = nameErr;
  if (requireEmail) {
    const emailErr = validateEmail(addr?.email);
    if (emailErr) errs.email = emailErr;
  }
  const phoneErr = validateIndianPhone(addr?.phone);
  if (phoneErr) errs.phone = phoneErr;
  if (!addr?.address?.trim()) errs.address = 'Street address is required';
  if (!addr?.city?.trim()) errs.city = 'City is required';
  if (!addr?.state?.trim()) errs.state = 'State is required';
  else if (!INDIAN_STATES.some(s => s.toLowerCase() === addr.state.trim().toLowerCase())) {
    errs.state = 'Please select a valid state from the list';
  }
  const zipErr = validatePincode(addr?.zip);
  if (zipErr) errs.zip = zipErr;
  return errs;
};

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [confirmed, setConfirmed]     = useState(false);
  const [billingSyncStatus, setBillingSyncStatus] = useState('');
  const [billingSyncError, setBillingSyncError] = useState('');
  const [shipmentWarning, setShipmentWarning] = useState('');
  const [billingSame, setBillingSame] = useState(true);
  const [form, setForm]               = useState({
    firstName: '', email: '', phone: '', address: '', address2: '', city: '', state: '', zip: '', country: 'India', addressType: 'Home'
  });
  const [billing, setBilling]         = useState({
    firstName: '', phone: '', address: '', address2: '', city: '', state: '', zip: '', country: 'India', addressType: 'Home',
  });
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingForm, setBillingForm] = useState({
    firstName: '', phone: '', address: '', address2: '', city: '', state: '', zip: '', country: 'India', addressType: 'Home',
  });
  const [billingFormErrors, setBillingFormErrors] = useState({});
  const [billingEditIndex, setBillingEditIndex] = useState(null);
  const [formErrors, setFormErrors]   = useState({});
  const [placing, setPlacing]         = useState(false);
  const [placeError, setPlaceError]   = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingOrderConfirmation, setPendingOrderConfirmation] = useState(null);
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingQuoteError, setShippingQuoteError] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('custom');
  const [customDeliveryRate, setCustomDeliveryRate] = useState(null);
  const [customDeliveryLoading, setCustomDeliveryLoading] = useState(false);
  const [customDeliveryError, setCustomDeliveryError] = useState('');

  const [buyNowItem, setBuyNowItem] = useState(null);

  useEffect(() => {
    try {
      const bn = sessionStorage.getItem('buyNowItem');
      if (bn) setBuyNowItem(JSON.parse(bn));
    } catch (_) {}
  }, []);

  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [createAccount, setCreateAccount] = useState(false);
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddressesLoaded, setIsAddressesLoaded] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [editIndex, setEditIndex] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const errorBannerRef = useRef(null);
  const { cartItems = [], user, setCartItems, fetchOrders, getCartTotals, login, register } = useShop();

  useEffect(() => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    couponApi.getAvailable()
      .then(data => setAvailableCoupons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const getStorageKey = (u) => `ck_saved_addrs_${u?.email || 'guest'}`;
  const loadedKeyRef = useRef(getStorageKey(user));

  useEffect(() => {
    if (!isAddressesLoaded) return;
    const key = getStorageKey(user);
    if (loadedKeyRef.current !== key) return;
    localStorage.setItem(key, JSON.stringify(savedAddresses));
  }, [savedAddresses, user, isAddressesLoaded]);

  useEffect(() => {
    const key = getStorageKey(user);
    loadedKeyRef.current = key;
    try {
      const stored = localStorage.getItem(key);
      const parsed = stored ? JSON.parse(stored) : [];

      if (user && parsed.length === 0) {
        setSavedAddresses([]);
        setForm({
          firstName: user.name || user.username || '',
          phone: sanitizeIndianPhone(user.phone || ''),
          email: user.email || '',
          address: '',
          address2: '',
          city: '',
          state: '',
          zip: '',
          country: 'India',
          addressType: 'Home'
        });
        setBilling({
          firstName: user.name || user.username || '',
          phone: sanitizeIndianPhone(user.phone || ''),
          address: '',
          address2: '',
          city: '',
          state: '',
          zip: '',
          country: 'India',
        });
        setShowAddressForm(true);
      } else {
        setSavedAddresses(parsed);
        if (parsed.length > 0) {
          const initialAddr = { ...parsed[0], phone: sanitizeIndianPhone(parsed[0].phone || '') };
          setForm(initialAddr);
          setBilling(initialAddr);
          setShowAddressForm(false);
        } else {
          setShowAddressForm(true);
        }
      }
      setSelectedAddressIndex(0);
    } catch {
      setSavedAddresses([]);
    } finally {
      setIsAddressesLoaded(true);
    }
  }, [user]);

  const sourceItems = buyNowItem ? [buyNowItem] : cartItems;
  const shipmentWeightKg = sourceItems.reduce((sum, item) => {
    const weight = Number(item.shippingWeightKg || item.shipping_weight_kg || 0);
    const quantity = Math.max(1, Number(item.qty || item.quantity || 1));
    return sum + (Number.isFinite(weight) && weight > 0 ? weight * quantity : 0);
  }, 0);
  const orderItems = sourceItems.map(item => ({
    id:        item.id,
    productId: item.productId || item.product_id || item.id,
    name:      item.name  || 'Product',
    img:       item.image || '',
    price:     parseFloat(item.price || 0),
    qty:       parseInt(item.qty || 1, 10),
    variant:   item.subtitle || '',
    variantId: item.variantId || null,
    billingVariantId: item.billingVariantId || null,
    billingProductId: item.billingProductId || null,
    size: item.size || '',
    color: item.color || '',
    fabric: item.fabric || '',
    shippingWeightKg: item.shippingWeightKg || null,
    shippingLengthCm: item.shippingLengthCm || null,
    shippingWidthCm: item.shippingWidthCm || null,
    shippingHeightCm: item.shippingHeightCm || null,
    isBuyOneGetOne: !!item.isBuyOneGetOne,
    mrpGstType: item.mrpGstType || item.mrp_gst_type || 'With GST',
  }));

  const selectedBillingAddress = billingSame || !user ? form : billing;
  const billingAddressReady = Boolean(
    (billingSame || !user || savedAddresses.some(addr => isSameAddress(billing, addr)) || Boolean(billing?.address && billing?.zip))
    && Object.keys(validateAddressFields(selectedBillingAddress, { requireEmail: false })).length === 0
    && selectedBillingAddress?.country?.trim()
  );

  const { subtotal, savings } = buyNowItem ? calculateCartTotals([buyNowItem]) : getCartTotals();
  const isCustomDelivery  = shippingMethod === 'custom';
  const customDeliveryCharge = customDeliveryRate ? Number(customDeliveryRate.totalDeliveryCharge) : 0;

  const quoteIsCurrent    = isCustomDelivery
    ? Boolean(customDeliveryRate && form.state && customDeliveryRate.state?.toLowerCase() === form.state.trim().toLowerCase())
    : Boolean(shippingQuote?.pincode && String(shippingQuote.pincode).trim() === String(form.zip || '').trim());

  const selectedCourier  = isCustomDelivery
    ? (customDeliveryRate ? {
        courierId: 'custom',
        courierName: `Custom Delivery (${customDeliveryRate.state})`,
        rate: customDeliveryCharge,
        estimatedDeliveryDays: '3-5 Business Days',
      } : null)
    : (quoteIsCurrent ? shippingQuote?.couriers?.find(courier => String(courier.courierId) === String(selectedCourierId)) : null);

  const shipping          = isCustomDelivery ? customDeliveryCharge : (selectedCourier ? Number(selectedCourier.rate) : 0);
  // Product prices are GST-inclusive. Show the GST component without adding it
  // again to the amount the customer pays.
  const tax               = orderItems.reduce((sum, item) => {
    if (String(item.mrpGstType).toLowerCase() === 'without gst') return sum;
    const paidQuantity = item.isBuyOneGetOne ? Math.ceil(item.qty / 2) : item.qty;
    return sum + (item.price * paidQuantity * 5 / 105);
  }, 0);
  const couponDiscount        = appliedCoupon ? Math.min(subtotal, Number(appliedCoupon.discount) || 0) : 0;
  const flooredSubtotal       = Math.floor(Math.max(0, subtotal));
  const flooredTax            = Math.floor(Math.max(0, tax));
  const hasGstItems           = orderItems.some(item => String(item.mrpGstType).toLowerCase() !== 'without gst');
  const flooredSavings        = Math.floor(Math.max(0, savings));
  const flooredCouponDiscount = Math.floor(Math.max(0, couponDiscount));
  const flooredShipping       = Math.floor(Math.max(0, shipping));
  const flooredTotal          = Math.floor(Math.max(0, flooredSubtotal - flooredCouponDiscount) + flooredShipping);

  const formattedSubtotal       = flooredSubtotal.toLocaleString('en-IN');
  const formattedSavings        = flooredSavings.toLocaleString('en-IN');
  const formattedCouponDiscount = flooredCouponDiscount.toLocaleString('en-IN');
  const formattedShipping       = flooredShipping.toLocaleString('en-IN');
  const formattedTotal          = flooredTotal.toLocaleString('en-IN');
  const payDisabled = placing || orderItems.length === 0 || !quoteIsCurrent || !selectedCourier || !billingAddressReady || !policyAccepted;

  const handleApplyCoupon = async (overrideCode) => {
    const codeToUse = (overrideCode !== undefined ? overrideCode : couponInput).trim().toUpperCase();
    if (!codeToUse) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponApplying(true);
    setCouponError('');
    try {
      const res = await couponApi.apply({
        code: codeToUse,
        subtotal,
        customer_email: form.email || user?.email || '',
        customer_phone: form.phone || user?.phone || '',
        customer_id: user?.id || null,
      });
      if (!res?.success) {
        setAppliedCoupon(null);
        setCouponError(res?.message || 'Could not apply this coupon.');
        return;
      }
      setAppliedCoupon({
        code: res.code || codeToUse,
        discount: Number(res.discount) || 0,
        label: res.label || '',
      });
      setCouponInput(res.code || codeToUse);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Could not validate coupon.');
    } finally {
      setCouponApplying(false);
    }
  };

  useEffect(() => {
    if (appliedCoupon && subtotal <= 0) {
      setAppliedCoupon(null);
    }
  }, [appliedCoupon, subtotal]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ── Sync Shipping Method from Site Settings ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/site-settings/public`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data && data.shipping_method) {
          setShippingMethod(data.shipping_method);
        }
      })
      .catch(err => {
        console.error('Failed to load shipping settings:', err);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Restore form data saved before login redirect ──────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem('checkoutForm');
    if (saved) {
      try {
        const savedForm = JSON.parse(saved);
        setForm(f => ({ ...f, ...savedForm }));
        sessionStorage.removeItem('checkoutForm');
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (user?.email && !form.email)
      setForm(f => ({ ...f, email: user.email, firstName: f.firstName || user.name || '' }));
  }, [user]);
  useEffect(() => { loadRazorpayScript(); }, []);

  useEffect(() => {
    if (shippingMethod !== 'custom') {
      setCustomDeliveryRate(null);
      setCustomDeliveryError('');
      return undefined;
    }

    const stateToUse = (form.state || '').trim();
    const matchedState = INDIAN_STATES.find(s => s.toLowerCase() === stateToUse.toLowerCase());
    if (!stateToUse || !matchedState) {
      setCustomDeliveryRate(null);
      setCustomDeliveryError('');
      return undefined;
    }

    let cancelled = false;
    setCustomDeliveryLoading(true);
    setCustomDeliveryError('');

    const weight = Math.max(0.5, Number(shipmentWeightKg) || 0.5);
    const url = `${API_BASE_URL}/delivery-zones/calculate?state=${encodeURIComponent(matchedState)}&weightKg=${weight}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          const rateData = (data && data.success) ? (data.data || data) : null;
          if (rateData && Number.isFinite(Number(rateData.totalDeliveryCharge))) {
            setCustomDeliveryRate(rateData);
            setCustomDeliveryError('');
          } else {
            setCustomDeliveryRate(null);
            setCustomDeliveryError(data?.message || 'Delivery not available for selected state.');
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          setCustomDeliveryRate(null);
          setCustomDeliveryError(err.message || 'Could not calculate delivery rate.');
        }
      })
      .finally(() => {
        if (!cancelled) setCustomDeliveryLoading(false);
      });

    return () => { cancelled = true; };
  }, [shippingMethod, form.state, shipmentWeightKg]);

  useEffect(() => {
    if (shippingMethod !== 'shiprocket') {
      setShippingQuote(null);
      setSelectedCourierId('');
      setShippingQuoteError('');
      return undefined;
    }
    const pincode = form.zip.trim();
    if (validatePincode(pincode)) {
      setShippingQuote(null);
      setSelectedCourierId('');
      setShippingQuoteError('');
      return undefined;
    }

    let cancelled = false;
    setShippingQuote(null);
    setSelectedCourierId('');
    setShippingQuoteError('');
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ pincode });
        if (shipmentWeightKg > 0) params.set('weightKg', String(shipmentWeightKg));
        const response = await fetch(`${SHIPPING_QUOTE_URL}?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not calculate shipping.');
        if (!cancelled) {
          setShippingQuote({ ...data, pincode });
          if (data.couriers && data.couriers.length > 0) {
            const cheapest = [...data.couriers].sort((a, b) => Number(a.rate) - Number(b.rate))[0];
            setSelectedCourierId(prev => {
              const stillValid = data.couriers.some(c => String(c.courierId) === String(prev));
              return stillValid ? prev : String(cheapest.courierId);
            });
          }
        }
      } catch (error) {
        if (!cancelled) setShippingQuoteError(error.message || 'Could not calculate shipping.');
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [shippingMethod, form.zip, shipmentWeightKg]);

  
  const handleInlineLogin = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(loginEmail);
    if (emailErr) {
      setLoginError(emailErr);
      return;
    }
    const pwErr = validatePassword(loginPassword);
    if (pwErr) {
      setLoginError(pwErr);
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      setShowInlineLogin(false);
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const validate = (checkBilling = true) => {
    const errs = validateAddressFields(form, { requireEmail: true });
    if (checkBilling && !billingAddressReady) {
      errs.billingAddress = 'Select a complete billing address or choose “Billing same as shipping”.';
    }
    return errs;
  };

  const handlePlaceOrder = async () => {
    if (!policyAccepted) {
      setPlaceError('Please read and accept the policies before paying.');
      return;
    }
    if (showBillingForm) {
      setPlaceError('Please save or cancel the billing address form before paying.');
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      setPlaceError(errs.billingAddress || 'Please fill in all required fields.');
      const hasShippingErr = Object.keys(errs).some(key => key !== 'billingAddress');
      if (hasShippingErr && !showAddressForm) setShowAddressForm(true);
      else if (errs.billingAddress && !billingSame && !showBillingForm) {
        setBillingForm({
          firstName: billing?.firstName || form.firstName || '',
          phone: sanitizeIndianPhone(billing?.phone || form.phone || ''),
          address: billing?.address || '',
          address2: billing?.address2 || '',
          city: billing?.city || '',
          state: billing?.state || '',
          zip: billing?.zip || '',
          country: billing?.country || 'India',
          addressType: billing?.addressType || 'Home',
        });
        setBillingEditIndex(null);
        setShowBillingForm(true);
      }
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    setFormErrors({});
    setPlaceError('');

    if (isCustomDelivery) {
      if (!quoteIsCurrent || !customDeliveryRate) {
        setPlaceError(customDeliveryError || 'Please select a valid delivery state to calculate shipping charges.');
        return;
      }
    } else {
      if (!quoteIsCurrent || !selectedCourier) {
        setPlaceError(shippingQuoteError || 'Choose a Shiprocket courier before continuing.');
        return;
      }
    }

    // ── Login check after form validation ──────────────────────────────
    if (!user) {
      setToastMessage("Please log in or register to proceed with your payment.");
      setTimeout(() => setToastMessage(''), 5000);
      return;
    }

    setPlacing(true);
    let checkoutItems = orderItems;
    try {
      const catalog = await productApi.getAll();
      const products = Array.isArray(catalog) ? catalog : [];
      checkoutItems = orderItems.map(item => {
        const product = products.find(candidate => String(candidate.id) === String(item.productId))
          || products.find(candidate => String(candidate.billingProductId || candidate.billing_product_id || '') === String(item.billingProductId || item.productId));
        if (!product) return { ...item, checkoutInvalid: true };
        const variants = product.Variants || [];
        const variant = item.variantId || item.billingVariantId
          ? variants.find(candidate => String(candidate.id) === String(item.variantId)
            || String(candidate.billingVariantId || candidate.billing_variant_id || '') === String(item.billingVariantId || item.variantId))
          : (item.size || item.color || item.fabric)
            ? variants.find(candidate => (!item.size || String(candidate.size || '') === String(item.size))
              && (!item.color || String(candidate.color || '') === String(item.color))
              && (!item.fabric || String(candidate.fabric || '') === String(item.fabric)))
            : variants.length === 1 ? variants[0] : null;
        if (item.variantId && !variant && !item.billingVariantId) return { ...item, checkoutInvalid: true };
        if (variants.length > 1 && !variant && !item.billingVariantId) return { ...item, checkoutInvalid: true };
        return {
          ...item,
          productId: product.id,
          billingProductId: product.billingProductId || product.billing_product_id || item.billingProductId || null,
          variantId: variant?.id || null,
          billingVariantId: variant?.billingVariantId || variant?.billing_variant_id || item.billingVariantId || null,
        };
      });
      const staleItem = checkoutItems.find(item => item.checkoutInvalid);
      if (staleItem) {
        setPlaceError(`${staleItem.name || 'An item'} or its selected variant is no longer available in the store catalog. Remove it from your cart and add the current product again. You have not been charged.`);
        setPlacing(false);
        setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        return;
      }

      for (const item of checkoutItems) {
        if (!item.billingProductId || !item.billingVariantId) {
          throw new Error(`${item.name || 'An item'} is missing its Billing product or variant mapping. Refresh the product and cart before payment.`);
        }
        if (!Number.isInteger(Number(item.qty)) || Number(item.qty) < 1) {
          throw new Error(`${item.name || 'An item'} has an invalid quantity. Update the cart before payment.`);
        }
      }
    } catch (error) {
      setPlaceError(error.message?.includes('Billing product or variant mapping') || error.message?.includes('invalid quantity')
        ? error.message
        : `Could not prepare the required Billing details before payment: ${error.message || 'validation failed'}. Please try again.`);
      setPlacing(false);
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setPlaceError('Failed to load Razorpay. Check your internet connection and try again.');
      setPlacing(false);
      return;
    }

    try {
      const billingPayload = {
        customer_name: form.firstName.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim(),
        source: 'Website',
        entry_mode: 'Manual',
        price_type: 'Franchise',
        payment_mode: 'Online',
        has_gst: false,
        bill_discount_amount: flooredCouponDiscount,
        paid_amount: Math.max(0, flooredSubtotal - flooredCouponDiscount),
        items: checkoutItems.map(item => ({
          product_id: item.billingProductId,
          product_variant_id: item.billingVariantId,
          quantity: Number(item.qty),
          discount_amount: 0,
        })),
      };
      const createdPayment = await razorpayApi.createOrder({
        amount: flooredTotal,
        courierId: isCustomDelivery ? 'custom' : selectedCourier.courierId,
        billingAddress: {
          name: String(selectedBillingAddress?.firstName || selectedBillingAddress?.name || form.firstName || '').trim(),
          phone: String(selectedBillingAddress?.phone || form.phone || '').trim(),
          address: String(selectedBillingAddress?.address || form.address || '').trim(),
          address2: String(selectedBillingAddress.address2 || '').trim(),
          city: String(selectedBillingAddress?.city || form.city || '').trim(),
          state: String(selectedBillingAddress?.state || form.state || '').trim(),
          zip: String(selectedBillingAddress?.zip || form.zip || '').trim(),
          country: String(selectedBillingAddress?.country || form.country || 'India').trim(),
        },
        shippingAddress: {
          zip: String(form.zip || '').trim(),
        },
        billingPayload,
      });
      if (!createdPayment?.success || !createdPayment.orderId || !createdPayment.key) {
        throw new Error(createdPayment?.message || 'Could not start secure payment.');
      }

      const rzpOptions = {
        key: createdPayment.key,
        amount: createdPayment.amount,
        order_id: createdPayment.orderId,
        currency: 'INR',
        name: 'Fashion Aura',
        description: 'Order Payment',
        prefill: { name: form.firstName, email: form.email, contact: form.phone },
        theme: { color: BRAND },
        modal: {
          ondismiss: () => {
            setPlacing(false); setPaymentProcessing(false);
            setPlaceError('Payment was cancelled. Please try again.');
            setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          },
        },
        handler: async (paymentResponse) => {
          setPaymentProcessing(true);
          await handlePaymentSuccess(paymentResponse, checkoutItems);
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', (response) => {
        setPlacing(false); setPaymentProcessing(false);
        setPlaceError(`Payment failed: ${response.error?.description || 'Unknown error'}. Please try again.`);
        setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      });
      rzp.open();
    } catch (err) {
      setPlaceError(err.message || 'Something went wrong. Please try again.');
      setPlacing(false); setPaymentProcessing(false);
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  };

  const handlePaymentSuccess = async (paymentResponse, checkoutItems = orderItems) => {
    try {
      // The checkout form is the delivery address. `billingSame` only controls
      // which address is copied into the invoice's billing address.
      const shippingAddr = {
        name: form.firstName, address: form.address, address2: form.address2,
        city: form.city, state: form.state, zip: form.zip, country: form.country, phone: form.phone,
      };
      const billingAddr = billingSame ? shippingAddr : {
        name: billing.firstName || form.firstName, address: billing.address || '',
        address2: billing.address2 || '', city: billing.city || '', state: billing.state || '',
        zip: billing.zip || '', country: billing.country || 'India', phone: billing.phone || form.phone,
      };

      // ── Save order to local backend ────────────────────────────────────
      const paidOrderPayload = {
            customer_id: user?.id || null,
            clear_cart: !buyNowItem,
            customer_name: form.firstName,
            customer_email: form.email,
            customer_phone: form.phone,
            billing_address: JSON.stringify(billingAddr),
            shipping_address: JSON.stringify(shippingAddr),
            subtotal: flooredSubtotal,
            delivery_charge: flooredShipping,
            tax: flooredTax,
            discount: Math.floor(Math.max(0, flooredSavings + flooredCouponDiscount)),
            billing_discount_amount: flooredCouponDiscount,
            coupon_code: appliedCoupon?.code || null,
            total: flooredTotal,
            payment_status: 'paid',
            payment_id: paymentResponse.razorpay_payment_id,
            razorpay_order_id: paymentResponse.razorpay_order_id || '',
            razorpay_signature: paymentResponse.razorpay_signature || '',
            courier_id: isCustomDelivery ? 'custom' : (selectedCourier?.courierId || selectedCourierId),
            courier_name: isCustomDelivery ? `Custom Delivery (${customDeliveryRate?.state || form.state})` : (selectedCourier?.courierName || ''),
            courier_rate: flooredShipping,
            courier_estimated_delivery_days: isCustomDelivery ? '3-5 Business Days' : (selectedCourier?.estimatedDeliveryDays || selectedCourier?.etd || ''),
            items: checkoutItems.map(i => ({
              product_id: i.productId, billingProductId: i.billingProductId, variantId: i.variantId, billingVariantId: i.billingVariantId, size: i.size, color: i.color, fabric: i.fabric, name: i.variant ? `${i.name} (${i.variant})` : i.name,
              weight: i.variant || null,
              image: i.img || null, price: parseFloat(i.price.toFixed(2)), quantity: i.qty,
              shippingWeightKg: i.shippingWeightKg,
              shippingLengthCm: i.shippingLengthCm,
              shippingWidthCm: i.shippingWidthCm,
              shippingHeightCm: i.shippingHeightCm,
            })),
      };
      let saveRes;
      let saveData;
      let saveFailure;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          saveRes = await fetch(ORDER_SAVE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paidOrderPayload),
          });
          saveData = await saveRes.json().catch(() => ({}));
          if (saveRes.ok && saveData.success) break;
          saveFailure = new Error(saveData.message || saveData.error || `The server could not save this order (HTTP ${saveRes.status}).`);
          if (saveRes.status < 500 || attempt === 2) throw saveFailure;
        } catch (error) {
          saveFailure = error;
          const isNetworkFailure = !saveRes && (error instanceof TypeError || !error.status);
          const retryableServerFailure = Boolean(saveRes && saveRes.status >= 500);
          if (attempt === 2 || (!isNetworkFailure && !retryableServerFailure)) throw error;
        }
        await new Promise(resolve => window.setTimeout(resolve, 500 * (attempt + 1)));
        saveRes = null;
      }
      if (!saveRes?.ok || !saveData?.success) throw saveFailure || new Error('The server could not save this order.');
      setBillingSyncStatus(saveData.billingSyncStatus || '');
      setBillingSyncError(saveData.billingSyncError || '');
      setShipmentWarning(saveData.shipmentWarning || '');
      console.log('[Order saved]', saveData);

      // Clear cart or buyNowItem
      if (buyNowItem) {
        sessionStorage.removeItem('buyNowItem');
      } else {
        if (user?.id) {
          try { await fetch(`${API_BASE_URL}/cart/clear/${user.id}`, { method: 'DELETE' }); } catch (_) {}
        }
        if (setCartItems) setCartItems([]);
        localStorage.removeItem('nv_guest_cart');
      }
      if (fetchOrders) fetchOrders();

      setPaymentProcessing(false);
      setPlacing(false);
      setPendingOrderConfirmation(null);
      setConfirmed(true);
    } catch (err) {
      setPaymentProcessing(false); setPlacing(false);
      setPendingOrderConfirmation({ paymentResponse, checkoutItems });
      setPlaceError(
        `Payment received but order could not be confirmed: ${err.message || 'order save failed'}. Contact support with payment ID: ${paymentResponse.razorpay_payment_id}`
      );
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  };

  if (!user) return null;

  return (
    <>
      {toastMessage && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#fff', borderLeft: '4px solid #e74c3c', padding: '16px 24px', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 12, width: '90%', maxWidth: 450 }}>
          <i className="fa-solid fa-circle-xmark" style={{ color: '#e74c3c', fontSize: 18 }}></i>
          <p style={{ margin: 0, fontSize: 13, color: '#1A1A1A', lineHeight: 1.4, fontWeight: 500 }}>{toastMessage}</p>
        </div>
      )}
      <style>{`
        .ck-root {
          font-family: ${F.sub};
          background: #EAF0E2;
          min-height: 100vh;
        }

        /* ── Cards ── */
        .ck-card {
          background: #fff;
          border-radius: 10px;
          padding: 40px;
          border: 1px solid #EAE4D6;
          box-shadow: 0 2px 12px rgba(31,92,68,0.06);
        }
        .ck-card-heading {
          font-family: ${F.main};
          font-size: 20px; font-weight: 300;
          color: ${BRAND}; margin-bottom: 28px;
          letter-spacing: 6px; text-transform: uppercase;
        }

        /* ── Summary ── */
        .ck-summary {
          background: #fff;
          border-radius: 10px;
          padding: 32px;
          border: 1px solid #EAE4D6;
          box-shadow: 0 2px 12px rgba(31,92,68,0.06);
          position: sticky; top: 100px;
        }
        .ck-summary-heading {
          font-family: ${F.main};
          font-size: 16px; font-weight: 300;
          color: ${BRAND}; margin-bottom: 22px;
          padding-bottom: 14px; border-bottom: 1px solid #EAE4D6;
          letter-spacing: 5px; text-transform: uppercase;
        }
        .ck-summary-row {
          display: flex; justify-content: space-between;
          margin-bottom: 10px;
          font-family: ${F.sub}; font-size: 12px;
          line-height: 1.35;
          font-weight: 300; letter-spacing: 0.5px;
        }
        .ck-summary-total     { font-family: ${F.main}; font-size: 13px; font-weight: 400; color: ${BRAND}; letter-spacing: 3px; text-transform: uppercase; }
        .ck-summary-total-val { font-family: ${F.main}; font-size: 15px; font-weight: 400; color: #C9933A; letter-spacing: 1px; }

        /* ── GST tag + row ── */
        /* ── Policy acceptance ── */
        .ck-policy-wrap { margin-top: 22px; display: flex; flex-direction: column; gap: 10px; }
        .ck-policy-notice {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 12px 14px;
          background: #FFF8E8;
          border: 1px solid #F0DDB0;
          border-left: 3px solid #C9933A;
          border-radius: 8px;
        }
        .ck-policy-notice > i { color: #C9933A; font-size: 15px; margin-top: 2px; flex-shrink: 0; }
        .ck-policy-notice strong {
          display: block;
          font-family: ${F.main}; font-size: 11px; font-weight: 700;
          letter-spacing: 1.4px; text-transform: uppercase; color: #8A5A00;
          margin-bottom: 3px;
        }
        .ck-policy-notice span {
          display: block;
          font-family: ${F.sub}; font-size: 12px; line-height: 1.5; color: #6B5320;
        }
        .ck-policy-check {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 14px;
          background: #fff;
          border: 1px solid #D8E5D3;
          border-radius: 8px;
          cursor: pointer; user-select: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .ck-policy-check:hover { border-color: #C9933A; }
        .ck-policy-check.checked { border-color: ${BRAND}; background: rgba(162,197,121,0.12); }
        .ck-policy-check input {
          position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;
        }
        .ck-policy-box {
          width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1.5px solid #B9CDB1; border-radius: 5px; background: #fff;
          color: transparent; font-size: 11px;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .ck-policy-check.checked .ck-policy-box { background: ${BRAND}; border-color: ${BRAND}; color: #fff; }
        .ck-policy-check input:focus-visible + .ck-policy-box { outline: 2px solid #C9933A; outline-offset: 2px; }
        .ck-policy-text {
          font-family: ${F.sub}; font-size: 12.5px; line-height: 1.55; color: #3A4A42;
        }
        .ck-policy-text a {
          color: ${BRAND}; font-weight: 600;
          text-decoration: underline; text-underline-offset: 2px;
        }
        .ck-policy-text a:hover { color: ${BRAND}; }

        /* ── Coupon (Modern Luxury Voucher Styling) ── */
        .ck-coupon {
          margin: 16px 0 22px;
          padding: 18px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s ease;
        }
        .ck-coupon-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          font-family: ${F.main};
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #1F2937;
        }
        .ck-coupon-head i {
          font-size: 13px;
          color: ${BRAND};
        }

        .ck-coupon-input-group {
          display: flex;
          align-items: center;
          height: 44px;
          background: #FAF9F6;
          border: 1.5px solid #E5E7EB;
          border-radius: 8px;
          padding: 3px;
          transition: all 0.2s ease;
        }
        .ck-coupon-input-group:focus-within {
          border-color: ${BRAND};
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(15, 84, 71, 0.10);
        }
        .ck-coupon-input-group.has-error {
          border-color: #EF4444;
          background: #FEF2F2;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.10);
        }
        .ck-coupon-input-icon {
          font-size: 13px;
          color: #9CA3AF;
          margin-left: 10px;
          flex-shrink: 0;
        }
        .ck-coupon-input-group input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          padding: 0 10px;
          font-family: ${F.main};
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${BRAND};
        }
        .ck-coupon-input-group input::placeholder {
          font-weight: 400;
          letter-spacing: 0.3px;
          text-transform: none;
          color: #9CA3AF;
        }
        .ck-coupon-input-group button {
          height: 36px;
          border: none;
          cursor: pointer;
          padding: 0 20px;
          background: ${BRAND};
          color: #FFFFFF;
          border-radius: 6px;
          font-family: ${F.main};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ck-coupon-input-group button:not(:disabled):hover {
          background: #145041;
          box-shadow: 0 2px 8px rgba(15, 84, 71, 0.25);
        }
        .ck-coupon-input-group button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .ck-coupon-error {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 10px 0 0;
          padding: 8px 12px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 6px;
          font-family: ${F.sub};
          font-size: 12px;
          color: #B91C1C;
        }

        .ck-coupon-list {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px dashed #E5E7EB;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ck-coupon-list-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: ${F.main};
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6B7280;
        }
        .ck-coupon-list-title i {
          font-size: 11px;
          color: ${BRAND};
        }

        .ck-coupon-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          background: #FAF9F6;
          border: 1px solid #E5E7EB;
          border-left: 3.5px solid ${BRAND};
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .ck-coupon-card:hover {
          background: #F4F8F4;
          border-color: ${BRAND};
          border-left-color: ${BRAND};
          box-shadow: 0 3px 12px rgba(15, 84, 71, 0.08);
          transform: translateY(-1px);
        }
        .ck-coupon-card-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .ck-coupon-card-code {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          background: #FFFFFF;
          border: 1px dashed rgba(15, 84, 71, 0.45);
          border-radius: 6px;
          font-family: ${F.main};
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.4px;
          color: ${BRAND};
          text-transform: uppercase;
        }
        .ck-coupon-card-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ck-coupon-card-info strong {
          font-family: ${F.sub};
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
        }
        .ck-coupon-card-info span {
          font-family: ${F.sub};
          font-size: 11px;
          color: #6B7280;
          line-height: 1.2;
        }
        .ck-coupon-card-apply {
          flex-shrink: 0;
          background: #FFFFFF;
          border: 1.5px solid ${BRAND};
          border-radius: 6px;
          padding: 6px 14px;
          font-family: ${F.main};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${BRAND};
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ck-coupon-card-apply:hover:not(:disabled) {
          background: ${BRAND};
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(15, 84, 71, 0.2);
        }
        .ck-coupon-card-apply:focus-visible {
          outline: 2px solid ${BRAND};
          outline-offset: 2px;
        }
        .ck-coupon-card-apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 420px) {
          .ck-coupon-card {
            padding: 10px 12px;
            gap: 10px;
          }
          .ck-coupon-card-code {
            font-size: 11px;
            padding: 5px 8px;
            letter-spacing: 1px;
          }
          .ck-coupon-card-apply {
            padding: 5px 10px;
            font-size: 10px;
          }
        }

        .ck-coupon-applied {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #F0FDF4;
          border: 1.5px solid #86EFAC;
          border-radius: 10px;
        }
        .ck-coupon-applied-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: ${BRAND};
          color: #FFFFFF;
          font-size: 13px;
        }
        .ck-coupon-applied-meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ck-coupon-applied-meta strong {
          font-family: ${F.main};
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.4px;
          color: ${BRAND};
        }
        .ck-coupon-applied-meta span {
          font-family: ${F.sub};
          font-size: 12px;
          font-weight: 500;
          color: #15803D;
        }
        .ck-coupon-remove {
          flex-shrink: 0;
          background: transparent;
          border: 1px solid #FECACA;
          border-radius: 6px;
          padding: 5px 12px;
          font-family: ${F.main};
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #DC2626;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ck-coupon-remove:hover {
          background: #FEF2F2;
          border-color: #DC2626;
        }

        .ck-subtotal-row {
          align-items: center;
          margin-bottom: 14px;
        }
        .ck-subtotal-label {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          min-width: 0;
          white-space: nowrap;
        }
        .ck-subtotal-title {
          font-family: ${F.sub};
          font-size: 14px;
          font-weight: 400;
          color: #4A4A5E;
          letter-spacing: 0.4px;
        }
        .ck-gst-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: ${F.sub};
          font-size: 11.5px;
          font-weight: 500;
          color: #6B9A45;
          letter-spacing: 0.4px;
          line-height: 1.2;
          white-space: nowrap;
        }
        .ck-gst-note i {
          font-size: 9px;
          color: ${GREEN};
        }
        @media (max-width: 400px) {
          .ck-subtotal-label { gap: 6px; }
          .ck-subtotal-title { font-size: 13px; }
          .ck-gst-note { font-size: 10.5px; }
        }
        .ck-subtotal-value {
          font-family: ${F.main};
          font-size: 17px;
          font-weight: 500;
          color: ${BRAND};
          letter-spacing: 0.8px;
          line-height: 1.2;
        }

        /* ── Courier Summary Widget ── */
        .ck-courier-box {
          margin-top: 14px;
          margin-bottom: 8px;
        }
        .ck-courier-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .ck-courier-section-label {
          font-family: ${F.main};
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #8FA88A;
          font-weight: 600;
        }
        .ck-courier-active-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          background: #FAFDF9;
          border: 1px solid #D8E5D3;
          border-radius: 8px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ck-courier-active-card:hover {
          border-color: #C9933A;
          box-shadow: 0 2px 8px rgba(15, 84, 71, 0.06);
        }
        .ck-courier-active-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .ck-courier-active-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #EAF0E2;
          color: ${BRAND};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .ck-courier-active-meta {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ck-courier-active-name {
          font-size: 13px;
          font-weight: 600;
          color: ${BRAND};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
        .ck-courier-active-eta {
          font-size: 11px;
          color: #6B6B8A;
          display: flex;
          align-items: center;
          line-height: 1.2;
        }
        .ck-courier-change-btn {
          background: #fff;
          border: 1px solid #D8E5D3;
          color: ${BRAND};
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          font-family: ${F.main};
          letter-spacing: 0.5px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .ck-courier-change-btn:hover {
          background: ${BRAND};
          color: #fff;
          border-color: ${BRAND};
        }
        .ck-courier-choose-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #FAFDF9;
          border: 1.5px dashed ${BRAND};
          border-radius: 8px;
          color: ${BRAND};
          font-size: 11px;
          font-weight: 600;
          font-family: ${F.main};
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ck-courier-choose-btn:hover {
          background: #EAF0E2;
          border-style: solid;
        }
        .ck-courier-options-badge {
          background: ${BRAND};
          color: #fff;
          padding: 2px 7px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }

        /* ── Labels & errors ── */
        .ck-label {
          font-family: ${F.main};
          font-size: 9px; letter-spacing: 2.5px;
          text-transform: uppercase; color: ${BRAND};
          font-weight: 600; display: block; margin-bottom: 6px;
        }
        .ck-card input::placeholder {
          color: #7C8B82;
          font-weight: 400;
          opacity: 1;
        }
        .ck-error-msg {
          font-family: ${F.sub};
          font-size: 11px; color: #c0392b;
          margin-top: -10px; margin-bottom: 10px;
          display: flex; align-items: center; gap: 4px;
          font-weight: 300;
        }
        .ck-error-msg::before {
          content: '!'; display: inline-flex; align-items: center; justify-content: center;
          width: 14px; height: 14px; background: #c0392b; color: #fff;
          border-radius: 50%; font-size: 9px; font-weight: 700; flex-shrink: 0;
        }
        .ck-error-banner {
          background: #fdf3f2; border: 1px solid #f5c6c2; border-left: 3px solid #e74c3c;
          border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;
          font-family: ${F.sub}; font-size: 12px; color: #922b21;
          line-height: 1.7; font-weight: 300; letter-spacing: 0.3px;
        }
        .ck-error-banner strong {
          font-family: ${F.main}; display: block;
          font-weight: 400; margin-bottom: 4px;
          letter-spacing: 1.5px; text-transform: uppercase; font-size: 10px;
        }

        /* ── Checkbox ── */
        .ck-checkbox-row {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
          background: #EAF0E2; border: 1px solid #EAE4D6;
          margin: 24px 0; cursor: pointer;
          transition: border-color 0.25s; user-select: none;
        }
        .ck-checkbox-row:hover { border-color: #C9933A; }
        .ck-checkbox-row.checked { border-color: #C9933A; background: rgba(201,147,58,0.05); }
        .ck-checkbox-box {
          width: 18px; height: 18px;
          border: 1px solid #C8D8C0; background: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.25s;
        }
        .ck-checkbox-box.checked { background: ${BRAND}; border-color: ${BRAND}; }
        .ck-checkbox-label {
          font-family: ${F.main}; font-size: 11px; font-weight: 400;
          color: ${BRAND}; letter-spacing: 1.5px; text-transform: uppercase;
        }
        .ck-checkbox-sublabel {
          font-family: ${F.sub}; font-size: 11px; color: #8FA88A;
          font-weight: 200; margin-top: 2px; letter-spacing: 0.3px;
        }

        /* ── Billing section ── */
        .ck-billing-section {
          border-top: 1px solid #EAE4D6; padding-top: 24px; margin-top: 8px;
          animation: fadeSlide 0.3s ease;
        }
        .ck-billing-title {
          font-family: ${F.main};
          font-size: 13px; font-weight: 400; color: ${BRAND};
          margin-bottom: 20px; letter-spacing: 4px; text-transform: uppercase;
          display: flex; align-items: center; gap: 10px;
        }
        .ck-billing-title::before {
          content: ''; display: inline-block;
          width: 2px; height: 14px; background: #C9933A;
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Button ── */
        .ck-btn-primary {
          background: ${BRAND}; color: #fff; border: none;
          padding: 13px 28px; border-radius: 8px; width: 100%;
          font-family: ${F.main}; font-size: 11px; font-weight: 300;
          letter-spacing: 3px; text-transform: uppercase; cursor: pointer;
          position: relative; overflow: hidden; transition: box-shadow 0.3s;
          margin-top: 8px;
        }
        .ck-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .ck-btn-primary::before {
          content: ''; position: absolute; inset: 0;
          background: #C9933A; transform: translateX(-100%); transition: transform 0.35s ease;
        }
        .ck-btn-primary:not(:disabled):hover::before { transform: translateX(0); }
        .ck-btn-primary:not(:disabled):hover { box-shadow: 0 6px 18px rgba(201,147,58,0.3); }
        .ck-btn-primary span { position: relative; }

        /* ── Product thumb ── */
        .ck-product-thumb {
          width: 64px; height: 64px;
          object-fit: cover; object-position: top;
          border: 1px solid #EAE4D6; background: #EAF0E2;
          display: block; flex-shrink: 0;
        }
        .ck-product-thumb-fallback {
          width: 64px; height: 64px;
          background: #EAF0E2; border: 1px solid #EAE4D6;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0;
        }
        .ck-item-name {
          font-family: ${F.main}; font-size: 12px; font-weight: 400;
          color: ${BRAND}; letter-spacing: 1.5px; text-transform: uppercase;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;
        }
        .ck-item-variant {
          font-family: ${F.sub}; font-size: 11px; color: #000000;
          font-weight: 500; margin: 3px 0 0; letter-spacing: 0.3px;
        }
        .ck-item-price {
          font-family: ${F.main}; font-size: 13px; font-weight: 400;
          color: ${BRAND}; letter-spacing: 1px;
        }

        /* ── User badge ── */
        .ck-user-badge {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          background: rgba(201,147,58,0.06); border: 1px solid #EAE4D6;
          margin-bottom: 24px;
        }
        .ck-user-name {
          font-family: ${F.main}; font-size: 11px; font-weight: 400;
          color: ${BRAND}; letter-spacing: 1.5px; text-transform: uppercase; margin: 0;
        }
        .ck-user-email {
          font-family: ${F.sub}; font-size: 11px; color: #8FA88A; font-weight: 200; margin: 0;
        }

        /* ── Empty cart ── */
        .ck-empty-cart {
          text-align: center; padding: 40px 20px;
          border: 1px dashed #EAE4D6;
        }

        /* ── Secure badge ── */
        .ck-secure-badge {
          margin-top: 24px; padding: 14px 16px;
          background: #EAF0E2; border: 1px solid #EAE4D6;
          display: flex; gap: 14px; align-items: center;
        }
        .ck-secure-title {
          font-family: ${F.main}; font-size: 11px; font-weight: 400;
          color: ${BRAND}; letter-spacing: 1.5px; text-transform: uppercase; margin: 0;
        }
        .ck-secure-sub {
          font-family: ${F.sub}; font-size: 11px; color: #8FA88A; font-weight: 200; margin: 0;
        }

        /* ── Success ── */
        .ck-success-icon {
          width: 90px; height: 90px;
          background: rgba(162,197,121,0.12); border: 1px solid #EAE4D6;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
        }
        .ck-success-title {
          font-family: ${F.main}; font-size: 26px; font-weight: 300;
          color: ${BRAND}; margin-bottom: 12px;
          letter-spacing: 6px; text-transform: uppercase;
        }
        .ck-success-sub {
          font-family: ${F.sub}; font-size: 13px; font-weight: 200;
          color: #6B6B8A; margin-bottom: 8px; letter-spacing: 0.5px;
        }

        /* ── Payment overlay ── */
        @keyframes ck-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes ck-pulse-ring {
          0%  {transform:scale(0.85);opacity:0.6}
          50% {transform:scale(1.1);opacity:0.2}
          100%{transform:scale(0.85);opacity:0.6}
        }
        @keyframes ck-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes ck-slide-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        .ck-payment-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(244,240,232,0.96); backdrop-filter: blur(6px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: ck-fade-in 0.25s ease;
        }
        .ck-payment-overlay-inner {
          display: flex; flex-direction: column; align-items: center; gap: 20px;
          animation: ck-slide-up 0.35s ease 0.1s both;
        }
        .ck-spinner-wrap { position: relative; width: 72px; height: 72px; }
        .ck-spinner-ring {
          position: absolute; inset: 0; border-radius: 50%;
          background: linear-gradient(135deg,${GREEN},${BRAND});
          opacity: 0.15; animation: ck-pulse-ring 1.6s ease-in-out infinite;
        }
        .ck-spinner {
          position: absolute; inset: 6px; border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: ${BRAND}; border-right-color: ${GREEN};
          animation: ck-spin 0.75s linear infinite;
        }
        .ck-spinner-icon {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        }
        .ck-overlay-title {
          font-family: ${F.main}; font-size: 18px; font-weight: 300;
          color: ${BRAND}; letter-spacing: 4px; text-transform: uppercase;
        }
        .ck-overlay-sub {
          font-family: ${F.sub}; font-size: 11px; font-weight: 200;
          letter-spacing: 2px; text-transform: uppercase; color: #C9933A; margin-top: -10px;
        }
        .ck-overlay-dots { display: flex; gap: 6px; margin-top: 4px; }
        .ck-overlay-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #C9933A; opacity: 0.3;
          animation: ck-pulse-ring 1.2s ease-in-out infinite;
        }
        .ck-overlay-dot:nth-child(2){animation-delay:0.2s}
        .ck-overlay-dot:nth-child(3){animation-delay:0.4s}

        @media(max-width:768px){
          .ck-card { padding: 20px 16px; } .ck-section { padding: 28px 0 64px !important; }
          .ck-card-heading { font-size: 16px; letter-spacing: 2.5px; margin-bottom: 16px; }
          .ck-summary { position: static; margin-top: 24px; padding: 20px 16px; }
          .ck-root input, .ck-root select { font-size: 16px !important; }
        }
        @media(max-width:480px){
          .ck-card { padding: 16px 12px; }
          .ck-card-heading { font-size: 14px; letter-spacing: 1.5px; margin-bottom: 14px; }
          .ck-summary { padding: 16px 12px; }
          .ck-btn-primary { font-size: 10px; letter-spacing: 2px; padding: 12px 18px; min-height: 44px; } .ck-courier-active-card { flex-wrap: wrap; }
        }
      `}</style>

      <div className="ck-root">
        {paymentProcessing && <PaymentProcessingOverlay />}

        <CourierSelectModal
          isOpen={isCourierModalOpen}
          onClose={() => setIsCourierModalOpen(false)}
          couriers={shippingQuote?.couriers || []}
          selectedCourierId={selectedCourierId}
          onSelect={(courierId) => setSelectedCourierId(courierId)}
          pincode={form.zip}
          city={form.city}
        />

        <section className="section-padding fix ck-section">
          <div className="container">

            {/* ── Order Confirmed ── */}
            {confirmed ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="ck-success-icon">
                  <i className="fa-solid fa-check" style={{ color: GREEN, fontSize: 40 }} />
                </div>
                <h2 className="ck-success-title">Order Confirmed</h2>
                <p className="ck-success-sub">
                  Thank you for your purchase. A confirmation has been sent to{' '}
                  <strong style={{ color: '#C9933A', fontWeight: 400 }}>{form.email || 'your email'}</strong>.
                </p>
                {shipmentWarning && (
                  <p role="status" style={{ maxWidth: 560, margin: '16px auto 0', color: '#8a5a00', fontSize: 14 }}>
                    Your payment and order were confirmed, but Shiprocket could not book the shipment yet: {shipmentWarning} Please contact support to arrange dispatch.
                  </p>
                )}
                {billingSyncStatus && billingSyncStatus !== 'synced' && billingSyncStatus !== 'not_applicable' && (
                  <p role="status" style={{ maxWidth: 560, margin: '16px auto 0', color: '#8a5a00', fontSize: 14 }}>
                    Your payment and order are saved. Billing invoice status: {billingSyncStatus.replace(/_/g, ' ')}.{billingSyncError ? ` ${billingSyncError}` : ''}
                  </p>
                )}
                <button onClick={() => navigate('/home')} className="ck-btn-primary"
                  style={{ display: 'inline-block', padding: '13px 40px', width: 'auto', marginTop: 24 }}>
                  <span>Continue Shopping</span>
                </button>
              </div>

            ) : (
              <>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontFamily: F.main, fontSize: 28, fontWeight: 400, color: BRAND, marginBottom: 16 }}>Secure Checkout</h2>
                  
                  {!user && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#6B6B8A', fontFamily: F.main }}>
                        Returning customer? <span onClick={() => setShowInlineLogin(!showInlineLogin)} style={{ color: BRAND, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Click here to login</span>
                      </p>
                      {showInlineLogin && (
                        <div style={{ marginTop: 16, padding: '24px', border: '1px solid #EAE4D6', background: '#FDFDFD', borderRadius: 8 }}>
                          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6B6B8A', fontFamily: F.sub }}>If you have shopped with us before, please enter your login details below.</p>
                          <form onSubmit={handleInlineLogin} noValidate>
                            <div className="row g-4" style={{ marginBottom: 24 }}>
                              <div className="col-md-6">
                                <label style={{ display: 'block', fontSize: 10, color: '#8FA88A', fontFamily: F.main, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>EMAIL ADDRESS</label>
                                <input type="email" placeholder="your@email.com" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }} required 
                                  style={{ width: '100%', padding: '14px 16px', border: '1px solid #EAE4D6', borderRadius: 8, fontSize: 14, fontFamily: F.sub, outline: 'none', color: '#1A1A1A', background: '#fff' }} />
                              </div>
                              <div className="col-md-6">
                                <label style={{ display: 'block', fontSize: 10, color: '#8FA88A', fontFamily: F.main, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>PASSWORD</label>
                                <div style={{ position: 'relative' }}>
                                  <input type={showLoginPassword ? 'text' : 'password'} placeholder="Your password" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }} required 
                                    style={{ width: '100%', padding: '14px 44px 14px 16px', border: '1px solid #EAE4D6', borderRadius: 8, fontSize: 14, fontFamily: F.sub, outline: 'none', color: '#1A1A1A', background: '#fff' }} />
                                  <button
                                    type="button"
                                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowLoginPassword(prev => !prev)}
                                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: 8, cursor: 'pointer', color: '#8FA88A', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <i className={`fa-solid ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            {loginError && <p style={{ margin: '0 0 16px', color: '#e74c3c', fontSize: 12, fontFamily: F.sub }}>{loginError}</p>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <button type="submit" disabled={isLoggingIn} style={{ padding: '12px 32px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: F.main, fontSize: 13, fontWeight: 600 }}>
                                {isLoggingIn ? 'Logging in...' : 'Login'}
                              </button>
                              <a href="#forgot-password" style={{ color: BRAND, fontSize: 13, fontFamily: F.sub, textDecoration: 'underline' }}>Forgot password?</a>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="row g-3 g-lg-5">
                <div className="col-lg-7">
                  <div className="ck-card">
                    {!(user && showAddressForm) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                        <h4 className="ck-card-heading" style={{ margin: 0, flex: '1 1 180px' }}>Shipping & Billing Address</h4>
                        {user && !showAddressForm && (
                          <button type="button" onClick={() => {
                            setForm({ firstName: '', email: '', phone: '', address: '', address2: '', city: '', state: '', zip: '', country: 'India', addressType: 'Home' });
                            setEditIndex(null);
                            setShowBillingForm(false);
                            setBillingFormErrors({});
                            setShowAddressForm(true);
                          }} 
                            style={{ color: BRAND, border: `1px solid ${BRAND}`, background: 'transparent', padding: '8px 14px', minHeight: 38, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            + Add New
                          </button>
                        )}
                      </div>
                    )}

                    {placeError && (
                      <div className="ck-error-banner" ref={errorBannerRef}>
                        <strong>Could not proceed</strong>
                        {placeError}
                        {pendingOrderConfirmation && (
                          <button
                            type="button"
                            onClick={() => {
                              const pending = pendingOrderConfirmation;
                              setPendingOrderConfirmation(null);
                              setPaymentProcessing(true);
                              handlePaymentSuccess(pending.paymentResponse, pending.checkoutItems);
                            }}
                            style={{ display: 'block', marginTop: 10, padding: '9px 14px', border: 0, borderRadius: 6, background: '#075c4b', color: '#fff', cursor: 'pointer' }}
                          >
                            Retry order confirmation
                          </button>
                        )}
                      </div>
                    )}

                    {user && !showAddressForm ? (
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <p style={{ fontSize: 11, color: '#8FA88A', fontWeight: 600, letterSpacing: 1 }}>SHIPPING ADDRESS</p>
                        </div>
                        {savedAddresses.map((addr, idx) => {
                          const isSelected = idx === selectedAddressIndex;
                          return (
                            <div key={idx} 
                              onClick={() => {
                                setForm({
                                  ...addr,
                                  phone: sanitizeIndianPhone(addr.phone || ''),
                                  email: addr.email || user?.email || '',
                                  firstName: addr.firstName && addr.firstName !== 'User' ? addr.firstName : (user?.name || user?.username || '')
                                });
                                setSelectedAddressIndex(idx);
                              }}
                              style={{ border: isSelected ? `1px solid ${BRAND}` : '1px solid #EAE4D6', borderRadius: 8, padding: 16, background: isSelected ? ACCENT_SOFT : '#fff', position: 'relative', marginBottom: 12, cursor: 'pointer' }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '8px 12px',
                                marginBottom: 12,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '1 1 180px', minWidth: 0 }}>
                                  <input type="radio" checked={isSelected} readOnly style={{ accentColor: BRAND, width: 16, height: 16, flexShrink: 0 }} />
                                  <span style={{ fontWeight: 600, color: '#1A1A1A', fontSize: 14 }}>{(addr.firstName && addr.firstName !== 'User') ? addr.firstName : (user?.name || user?.username || 'User')}</span>
                                  <span style={{ background: '#EAE4D6', color: '#6B6B8A', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>{addr.addressType || 'HOME'}</span>
                                  {idx === 0 && <span style={{ background: '#FFF3CD', color: '#856404', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: 0.5, whiteSpace: 'nowrap', flexShrink: 0 }}>★ Default</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setForm({ ...addr, phone: sanitizeIndianPhone(addr.phone || '') });
                                      setEditIndex(idx);
                                      setShowBillingForm(false);
                                      setBillingFormErrors({});
                                      setShowAddressForm(true);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: BRAND, cursor: 'pointer', fontSize: 13, padding: '6px 4px', minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <i className="fa-regular fa-pen-to-square"></i> Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSavedAddresses(prev => {
                                        const newAddrs = prev.filter((_, i) => i !== idx);
                                        if (selectedAddressIndex === idx) setSelectedAddressIndex(0);
                                        else if (selectedAddressIndex > idx) setSelectedAddressIndex(selectedAddressIndex - 1);
                                        return newAddrs;
                                      });
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 13, padding: '6px 4px', minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <i className="fa-regular fa-trash-can"></i> Delete
                                  </button>
                                </div>
                              </div>
                              
                              <div style={{ paddingLeft: 28, fontSize: 13, color: '#6B6B8A', lineHeight: 1.6 }}>
                                <p style={{ margin: 0 }}>{addr.address} {addr.address2}</p>
                                <p style={{ margin: 0 }}>{addr.city}, {addr.state} - {addr.zip}</p>
                                <p style={{ margin: 0 }}>{addr.country}</p>
                                <p style={{ margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: 8, color: BRAND }}>
                                  <i className="fa-solid fa-phone" style={{ fontSize: 11 }} /> {addr.phone}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                          <div onClick={() => {
                            const nextSame = !billingSame;
                            setBillingSame(nextSame);
                            if (nextSame) {
                              setShowBillingForm(false);
                              setBillingFormErrors({});
                            } else if ((!billing?.address || !billing?.zip) && savedAddresses.length > 0) {
                              const fallback = savedAddresses[selectedAddressIndex] || savedAddresses[0];
                              setBilling({ ...fallback, phone: sanitizeIndianPhone(fallback.phone || '') });
                            }
                            setPlaceError('');
                          }} style={{ background: '#F9F9FB', border: '1px solid #EAE4D6', padding: '8px 16px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={billingSame} readOnly style={{ accentColor: BRAND, width: 14, height: 14 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>Billing same as shipping</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 11, color: '#8FA88A', fontWeight: 600, letterSpacing: 1, margin: 0 }}>BILLING ADDRESS</p>
                          {!billingSame && !showBillingForm && (
                            <button
                              type="button"
                              onClick={() => {
                                setBillingForm({
                                  firstName: '',
                                  phone: '',
                                  address: '',
                                  address2: '',
                                  city: '',
                                  state: '',
                                  zip: '',
                                  country: 'India',
                                  addressType: 'Work',
                                });
                                setBillingEditIndex(null);
                                setBillingFormErrors({});
                                setPlaceError('');
                                setShowBillingForm(true);
                              }}
                              style={{ color: BRAND, border: `1px solid ${BRAND}`, background: 'transparent', padding: '6px 12px', minHeight: 34, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                            >
                              + Add New
                            </button>
                          )}
                        </div>

                        {billingSame ? (
                          <div style={{ background: '#F9F9FB', border: '1px dashed #EAE4D6', borderRadius: 8, padding: 16, textAlign: 'center', color: '#8FA88A', fontSize: 13, fontStyle: 'italic' }}>
                            ✓ Same as shipping address
                          </div>
                        ) : showBillingForm ? (
                          <div style={{ border: '1px solid #EAE4D6', borderRadius: 8, padding: 16, background: '#FCFCF9' }}>
                            <h5 style={{ fontWeight: 800, color: '#1A1A1A', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className={`fa-solid ${billingEditIndex !== null ? 'fa-pen-to-square' : 'fa-plus'}`} style={{ color: BRAND }}></i>
                              {billingEditIndex !== null ? 'Edit Billing Address' : 'New Billing Address'}
                            </h5>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                              {['Home', 'Work', 'Other'].map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setBillingForm(f => ({ ...f, addressType: type }))}
                                  style={{
                                    flex: 1, padding: '10px 0', border: '1px solid #EAE4D6', borderRadius: 8,
                                    background: billingForm.addressType === type ? BRAND : '#F9F9FB',
                                    color: billingForm.addressType === type ? '#fff' : '#6B6B8A',
                                    fontFamily: F.main, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                  }}
                                >
                                  <i className={`fa-solid ${type === 'Home' ? 'fa-house' : type === 'Work' ? 'fa-building' : 'fa-location-dot'}`}
                                    style={{ fontSize: 12, color: billingForm.addressType === type ? '#fff' : BRAND }}></i>
                                  {type}
                                </button>
                              ))}
                            </div>

                            <div className="row g-3" style={{ marginBottom: 16 }}>
                              <div className="col-md-6">
                                <Field
                                  label="FULL NAME *"
                                  placeholder="Enter billing full name"
                                  value={billingForm.firstName}
                                  error={billingFormErrors.firstName}
                                  onChange={e => { setBillingForm(f => ({ ...f, firstName: e.target.value })); setBillingFormErrors(p => ({ ...p, firstName: '' })); }}
                                />
                              </div>
                              <div className="col-md-6">
                                <Field
                                  label="MOBILE NUMBER *"
                                  type="tel"
                                  inputMode="numeric"
                                  maxLength={10}
                                  placeholder="10-digit mobile"
                                  value={billingForm.phone}
                                  error={billingFormErrors.phone}
                                  onChange={e => { setBillingForm(f => ({ ...f, phone: sanitizeIndianPhone(e.target.value) })); setBillingFormErrors(p => ({ ...p, phone: '' })); }}
                                />
                              </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                              <Field
                                label="STREET / HOUSE NO. *"
                                placeholder="House / flat no., road name"
                                value={billingForm.address}
                                error={billingFormErrors.address}
                                onChange={e => { setBillingForm(f => ({ ...f, address: e.target.value })); setBillingFormErrors(p => ({ ...p, address: '' })); }}
                              />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                              <Field
                                label="APARTMENT / LANDMARK (OPTIONAL)"
                                placeholder="Building name, floor, landmark"
                                value={billingForm.address2}
                                onChange={e => setBillingForm(f => ({ ...f, address2: e.target.value }))}
                              />
                            </div>

                            <div className="row g-3" style={{ marginBottom: 16 }}>
                              <div className="col-md-6">
                                <Field
                                  label="CITY *"
                                  placeholder="City"
                                  value={billingForm.city}
                                  error={billingFormErrors.city}
                                  onChange={e => { setBillingForm(f => ({ ...f, city: e.target.value })); setBillingFormErrors(p => ({ ...p, city: '' })); }}
                                />
                              </div>
                              <div className="col-md-6">
                                <StateAutocompleteField
                                  label="STATE *"
                                  value={billingForm.state}
                                  error={billingFormErrors.state}
                                  placeholder="Select or type state"
                                  onChange={val => {
                                    setBillingForm(f => ({ ...f, state: val }));
                                    setBillingFormErrors(p => ({ ...p, state: '' }));
                                  }}
                                />
                              </div>
                            </div>

                            <div className="row g-3" style={{ marginBottom: 16 }}>
                              <div className="col-md-6">
                                <Field
                                  label="PINCODE *"
                                  inputMode="numeric"
                                  maxLength={6}
                                  placeholder="6-digit pincode"
                                  value={billingForm.zip}
                                  error={billingFormErrors.zip}
                                  onChange={e => { setBillingForm(f => ({ ...f, zip: e.target.value.replace(/\D/g, '').slice(0, 6) })); setBillingFormErrors(p => ({ ...p, zip: '' })); }}
                                />
                              </div>
                              <div className="col-md-6">
                                <Field label="COUNTRY" placeholder="India" value={billingForm.country} readOnly />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const errs = validateAddressFields(billingForm, { requireEmail: false });
                                  if (Object.keys(errs).length) {
                                    setBillingFormErrors(errs);
                                    return;
                                  }
                                  const cleaned = {
                                    ...billingForm,
                                    firstName: billingForm.firstName.trim(),
                                    phone: sanitizeIndianPhone(billingForm.phone),
                                    address: billingForm.address.trim(),
                                    address2: (billingForm.address2 || '').trim(),
                                    city: billingForm.city.trim(),
                                    state: billingForm.state.trim(),
                                    zip: billingForm.zip.trim(),
                                    country: billingForm.country || 'India',
                                    addressType: billingForm.addressType || 'Home',
                                  };
                                  if (billingEditIndex === null) {
                                    setSavedAddresses(prev => [...prev, cleaned]);
                                  } else if (typeof billingEditIndex === 'number' && billingEditIndex !== selectedAddressIndex) {
                                    setSavedAddresses(prev => {
                                      const updated = [...prev];
                                      updated[billingEditIndex] = { ...prev[billingEditIndex], ...cleaned };
                                      return updated;
                                    });
                                  }
                                  setBilling(cleaned);
                                  setBillingEditIndex(null);
                                  setBillingFormErrors({});
                                  setShowBillingForm(false);
                                  setPlaceError('');
                                }}
                                style={{ background: BRAND, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                              >
                                Save Billing Address
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBillingEditIndex(null);
                                  setBillingFormErrors({});
                                  setShowBillingForm(false);
                                }}
                                style={{ background: '#F9F9FB', color: '#1A1A1A', border: '1px solid #EAE4D6', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {(() => {
                              const openBillingEdit = (addr, editIdx) => {
                                setBillingForm({
                                  firstName: (addr?.firstName && addr.firstName !== 'User') ? addr.firstName : (user?.name || user?.username || ''),
                                  phone: sanitizeIndianPhone(addr?.phone || ''),
                                  address: addr?.address || '',
                                  address2: addr?.address2 || '',
                                  city: addr?.city || '',
                                  state: addr?.state || '',
                                  zip: addr?.zip || '',
                                  country: addr?.country || 'India',
                                  addressType: addr?.addressType || 'Home',
                                });
                                setBillingEditIndex(editIdx);
                                setBillingFormErrors({});
                                setPlaceError('');
                                setShowBillingForm(true);
                              };
                              const hasCustomBilling = Boolean(billing?.address && billing?.zip) && !savedAddresses.some(addr => isSameAddress(billing, addr));
                              const renderBillingCard = (addr, { key, isSelected, editIdx, isCustom = false, onSelect }) => (
                                <div
                                  key={key}
                                  onClick={onSelect}
                                  style={{ border: isSelected ? `1px solid ${BRAND}` : '1px solid #EAE4D6', borderRadius: 8, padding: 16, background: isSelected ? ACCENT_SOFT : '#fff', position: 'relative', marginBottom: 12, cursor: 'pointer' }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '1 1 180px', minWidth: 0 }}>
                                      <input type="radio" checked={isSelected} readOnly style={{ accentColor: BRAND, width: 16, height: 16, flexShrink: 0 }} />
                                      <span style={{ fontWeight: 600, color: '#1A1A1A', fontSize: 15 }}>{(addr.firstName && addr.firstName !== 'User') ? addr.firstName : (user?.name || user?.username || 'User')}</span>
                                      <span style={{ background: '#EAE4D6', color: '#6B6B8A', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>{addr.addressType || 'HOME'}</span>
                                      {isCustom && (
                                        <span style={{ background: '#E6F4EE', color: BRAND, fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>Billing</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openBillingEdit(addr, editIdx);
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: BRAND, cursor: 'pointer', fontSize: 13, padding: '6px 4px', minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                                    >
                                      <i className="fa-regular fa-pen-to-square"></i> Edit
                                    </button>
                                  </div>

                                  <div style={{ paddingLeft: 28, fontSize: 13, color: '#6B6B8A', lineHeight: 1.6 }}>
                                    <p style={{ margin: 0 }}>{addr.address} {addr.address2}</p>
                                    <p style={{ margin: 0 }}>{addr.city}, {addr.state} - {addr.zip}</p>
                                    <p style={{ margin: 0 }}>{addr.country}</p>
                                    <p style={{ margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: 8, color: BRAND }}>
                                      <i className="fa-solid fa-phone" style={{ fontSize: 11 }} /> {addr.phone}
                                    </p>
                                  </div>
                                </div>
                              );

                              return (
                                <>
                                  {hasCustomBilling && renderBillingCard(billing, {
                                    key: 'billing-custom',
                                    isSelected: true,
                                    editIdx: 'custom',
                                    isCustom: true,
                                    onSelect: () => setPlaceError(''),
                                  })}
                                  {savedAddresses.map((addr, idx) => renderBillingCard(addr, {
                                    key: `billing-${idx}`,
                                    isSelected: !hasCustomBilling && isSameAddress(billing, addr),
                                    editIdx: idx,
                                    onSelect: () => {
                                      setBilling({ ...addr, phone: sanitizeIndianPhone(addr.phone || '') });
                                      setPlaceError('');
                                    },
                                  }))}
                                </>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        {user && showAddressForm && (
                          <h5 style={{ fontWeight: 800, color: '#1A1A1A', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fa-solid fa-plus" style={{ color: '#002C93' }}></i> New Address
                          </h5>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 24, marginTop: (user && showAddressForm) ? 0 : 16 }}>
                          {['Home', 'Work', 'Other'].map(type => (
                            <button
                              key={type} type="button"
                              onClick={() => setForm(f => ({ ...f, addressType: type }))}
                              style={{
                                flex: 1, padding: '10px 0', border: '1px solid #EAE4D6', borderRadius: 8,
                                background: form.addressType === type ? BRAND : '#F9F9FB',
                                color: form.addressType === type ? '#fff' : '#6B6B8A',
                                fontFamily: F.main, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                              }}>
                              <i className={`fa-solid ${type === 'Home' ? 'fa-house' : type === 'Work' ? 'fa-building' : 'fa-location-dot'}`} 
                                 style={{ fontSize: 12, color: form.addressType === type ? '#fff' : BRAND }}></i>
                              {type}
                            </button>
                          ))}
                        </div>

                        <div className="row g-3" style={{ marginBottom: 16 }}>
                      <div className="col-md-6">
                        <Field label="FULL NAME *" placeholder="Enter your full name"
                          value={form.firstName} error={formErrors.firstName}
                          onChange={e => { setForm({ ...form, firstName: e.target.value }); setFormErrors(p => ({ ...p, firstName: '' })); }} />
                      </div>
                      <div className="col-md-6">
                        <Field label="MOBILE NUMBER *" type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile"
                          value={form.phone} error={formErrors.phone}
                          onChange={e => { setForm({ ...form, phone: sanitizeIndianPhone(e.target.value) }); setFormErrors(p => ({ ...p, phone: '' })); }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Field label="EMAIL ADDRESS *" type="email" placeholder="your@email.com"
                        value={form.email} error={formErrors.email}
                        onChange={e => { setForm({ ...form, email: e.target.value }); setFormErrors(p => ({ ...p, email: '' })); }} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Field label="STREET / HOUSE NO. *" placeholder="House / flat no., road name"
                        value={form.address} error={formErrors.address}
                        onChange={e => { setForm({ ...form, address: e.target.value }); setFormErrors(p => ({ ...p, address: '' })); }} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Field label="APARTMENT / LANDMARK (OPTIONAL)" placeholder="Building name, floor, landmark"
                        value={form.address2}
                        onChange={e => setForm({ ...form, address2: e.target.value })} />
                    </div>

                    <div className="row g-3" style={{ marginBottom: 16 }}>
                      <div className="col-md-6">
                        <Field label="CITY *" placeholder="City"
                          value={form.city} error={formErrors.city}
                          onChange={e => { setForm({ ...form, city: e.target.value }); setFormErrors(p => ({ ...p, city: '' })); }} />
                      </div>
                      <div className="col-md-6">
                        <StateAutocompleteField
                          label="STATE *"
                          value={form.state}
                          error={formErrors.state}
                          placeholder="Select or type state"
                          onChange={val => {
                            setForm(f => ({ ...f, state: val }));
                            setFormErrors(p => ({ ...p, state: '' }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="row g-3" style={{ marginBottom: 16 }}>
                      <div className="col-md-6">
                        <Field label="PINCODE *" inputMode="numeric" maxLength={6} placeholder="6-digit pincode"
                          value={form.zip} error={formErrors.zip}
                          onChange={e => { setForm({ ...form, zip: e.target.value.replace(/\D/g, '').slice(0, 6) }); setFormErrors(p => ({ ...p, zip: '' })); }} />
                      </div>
                      <div className="col-md-6">
                        <Field label="COUNTRY" placeholder="India"
                          value={form.country} readOnly />
                      </div>
                    </div>

                    {user && showAddressForm && (
                      <>
                        <div style={{ marginTop: 16, marginBottom: 24 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#6B6B8A' }}>
                            <input type="checkbox" style={{ accentColor: BRAND, width: 14, height: 14 }} />
                            Set as my default address
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => {
                            const errs = validate(false);
                            if (Object.keys(errs).length) { setFormErrors(errs); return; }
                            const cleaned = {
                              ...form,
                              firstName: form.firstName.trim(),
                              email: form.email.trim(),
                              phone: sanitizeIndianPhone(form.phone),
                              zip: form.zip.trim(),
                            };
                            setForm(cleaned);
                            if (!billing?.address) {
                              setBilling(cleaned);
                            }
                            setSavedAddresses(prev => {
                              if (editIndex !== null) {
                                const updated = [...prev];
                                updated[editIndex] = cleaned;
                                setSelectedAddressIndex(editIndex);
                                setEditIndex(null);
                                return updated;
                              } else {
                                const updated = [...prev, cleaned];
                                setSelectedAddressIndex(updated.length - 1);
                                return updated;
                              }
                            });
                            setShowAddressForm(false);
                          }} style={{ background: BRAND, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            Save Address
                          </button>
                          <button type="button" onClick={() => {
                            if (savedAddresses.length > 0) {
                              setForm(savedAddresses[selectedAddressIndex] || savedAddresses[0]);
                            }
                            setShowAddressForm(false);
                          }} style={{ background: '#F9F9FB', color: '#1A1A1A', border: '1px solid #EAE4D6', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                      </>
                    )}

                    {/* Billing address section removed as per request */}

                    {!user && (
                      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed #EAE4D6' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontFamily: F.main, color: BRAND, fontWeight: 600, marginBottom: 16 }}>
                          <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} style={{ accentColor: BRAND, width: 16, height: 16 }} />
                          Create an account?
                        </label>
                        {!createAccount && (
                          <div style={{ background: '#F4F9F9', border: '1px solid #E1EEEE', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 16, lineHeight: 1 }}>💡</span>
                            <p style={{ margin: 0, fontSize: 12, color: '#4A5568', lineHeight: 1.5, fontFamily: F.sub }}>
                              <strong style={{ color: BRAND }}>Note:</strong> Log in or check <strong style={{ color: BRAND }}>"Create an account?"</strong> above to track your order history and receive delivery updates!
                            </p>
                          </div>
                        )}
                        {createAccount && (
                          <div style={{ marginTop: 16 }}>
                            <label className="ck-label" style={{ fontSize: 10, color: '#8FA88A', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>PASSWORD (MIN. 6 CHARACTERS)</label>
                            <div style={{ position: 'relative' }}>
                              <input type={showRegisterPassword ? 'text' : 'password'} placeholder="Create a password" value={registerPassword} 
                                onChange={e => { setRegisterPassword(e.target.value); setFormErrors(p => ({ ...p, registerPassword: '' })); }} 
                                style={{ width: '100%', padding: '14px 44px 14px 16px', border: formErrors.registerPassword ? '1px solid #e74c3c' : '1px solid #EAE4D6', borderRadius: 8, fontSize: 14, fontFamily: F.sub, outline: 'none', marginBottom: 0, color: '#1A1A1A', background: '#fff' }} />
                              <button
                                type="button"
                                aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowRegisterPassword(prev => !prev)}
                                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: 8, cursor: 'pointer', color: '#8FA88A', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <i className={`fa-solid ${showRegisterPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                              </button>
                            </div>
                            {formErrors.registerPassword && (
                              <p style={{ margin: '4px 0 0', color: '#e74c3c', fontSize: 11, fontFamily: F.sub }}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i> {formErrors.registerPassword}
                              </p>
                            )}
                            <p style={{ fontSize: 12, color: '#6B6B8A', fontFamily: F.sub, margin: '8px 0 16px', lineHeight: 1.5 }}>
                              Your account will be created with the email address above. You'll be logged in automatically after checkout.
                            </p>
                            <button type="button" 
                              onClick={async () => {
                                const errs = validate(false);
                                const pwErr = validatePassword(registerPassword, { minLength: 6 });
                                if (pwErr) {
                                  errs.registerPassword = pwErr;
                                }
                                if (Object.keys(errs).length) { 
                                  setFormErrors(errs); 
                                  if (!errs.registerPassword) {
                                    setPlaceError('Please fill all required shipping fields before registering.'); 
                                    setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); 
                                  }
                                  return; 
                                }
                                setPlacing(true);
                                try {
                                  await register({
                                    username: form.firstName.trim(),
                                    email: form.email.trim(),
                                    phone: sanitizeIndianPhone(form.phone),
                                    password: registerPassword,
                                  });
                                  setPlaceError('');
                                } catch(err) {
                                  if (err.message?.toLowerCase().includes('already') || err.message?.toLowerCase().includes('exist')) {
                                    setToastMessage('This email is already registered. Please log in using the link above.');
                                    setTimeout(() => setToastMessage(''), 5000);
                                  } else {
                                    setPlaceError('Registration failed: ' + (err.message || 'Unknown error'));
                                  }
                                }
                                setPlacing(false);
                              }}
                              style={{ width: '100%', padding: '14px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontFamily: F.main, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                              Confirm & Register
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT: Order Summary ── */}
                <div className="col-lg-5">
                  <div className="ck-summary">
                    <h5 className="ck-summary-heading">Order Summary</h5>

                    {orderItems.length === 0 ? (
                      <div className="ck-empty-cart">
                        <p style={{ fontSize: 32, marginBottom: 8 }}>🛒</p>
                        <p style={{ fontFamily: F.sub, color: '#8FA88A', fontSize: 12, fontWeight: 200 }}>Your cart is empty.</p>
                      </div>
                    ) : (
                      <>
                        {orderItems.map((item, i) => (
                          <div key={item.id || i} className="d-flex gap-3 align-items-center"
                            style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #EAE4D6' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              {item.img
                                ? <img src={item.img} alt={item.name} className="ck-product-thumb"
                                    onError={e => { e.target.src = defaultLogo; e.target.style.objectFit = 'contain'; e.target.style.background = '#126354'; e.target.style.padding = '4px'; }} />
                                : null}
                              <div className="ck-product-thumb-fallback" style={{ display: item.img ? 'none' : 'flex', background: '#126354' }}><img src={defaultLogo} alt='Default Logo' style={{ width: '80%', height: 'auto', objectFit: 'contain' }} /></div>
                              <span style={{
                                position: 'absolute', top: -8, right: -8,
                                background: BRAND, color: '#fff',
                                width: 18, height: 18, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontFamily: F.main, fontSize: 10, fontWeight: 400,
                              }}>{item.qty}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="ck-item-name">{item.name}</p>
                              {item.variant && <p className="ck-item-variant">{item.variant}</p>}
                              {item.isBuyOneGetOne && (
                                <span style={{
                                  display: 'inline-block',
                                  background: '#FEE2E2', color: '#DC2626',
                                  fontSize: '8px', fontWeight: 600,
                                  padding: '1px 5px', borderRadius: '3px',
                                  fontFamily: F.main, letterSpacing: '0.5px',
                                  textTransform: 'uppercase',
                                  marginTop: '4px'
                                }}>
                                  Buy 1 Get 1 Free
                                </span>
                              )}
                            </div>
                            <span className="ck-item-price">
                              {item.isBuyOneGetOne ? (
                                <>
                                  <span style={{ color: '#aaa', textDecoration: 'line-through', fontSize: '11px', marginRight: '6px' }}>
                                    ₹{Math.floor(item.price * item.qty).toLocaleString('en-IN')}
                                  </span>
                                  ₹{Math.floor(item.price * Math.ceil(item.qty / 2)).toLocaleString('en-IN')}
                                </>
                              ) : `₹${Math.floor(item.price * item.qty).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                        ))}

                        <div className="ck-coupon">
                          <div className="ck-coupon-head">
                            <i className="fa-solid fa-ticket" aria-hidden="true" />
                            <span>Have a coupon code?</span>
                          </div>

                          {appliedCoupon ? (
                            <div className="ck-coupon-applied">
                              <span className="ck-coupon-applied-icon"><i className="fa-solid fa-check" aria-hidden="true" /></span>
                              <div className="ck-coupon-applied-meta">
                                <strong>{appliedCoupon.code}</strong>
                                <span>
                                  Coupon applied! You saved ₹{formattedCouponDiscount}
                                  {appliedCoupon.label ? ` · ${appliedCoupon.label}` : ''}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="ck-coupon-remove"
                                onClick={() => { setAppliedCoupon(null); setCouponError(''); setCouponInput(''); }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className={`ck-coupon-input-group${couponError ? ' has-error' : ''}`}>
                                <i className="fa-solid fa-tag ck-coupon-input-icon" aria-hidden="true" />
                                <input
                                  type="text"
                                  placeholder="Enter coupon code"
                                  value={couponInput}
                                  autoCapitalize="characters"
                                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                                />
                                <button
                                  type="button"
                                  disabled={couponApplying || subtotal <= 0}
                                  onClick={() => handleApplyCoupon()}
                                >
                                  {couponApplying ? (
                                    <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />Applying</>
                                  ) : (
                                    'Apply'
                                  )}
                                </button>
                              </div>

                              {couponError && (
                                <p role="alert" className="ck-coupon-error">
                                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {couponError}
                                </p>
                              )}

                              {availableCoupons.length > 0 && (
                                <div className="ck-coupon-list">
                                  <span className="ck-coupon-list-title">
                                    <i className="fa-solid fa-sparkles" aria-hidden="true" />
                                    Available Offers
                                  </span>
                                  {availableCoupons.slice(0, 4).map(c => (
                                    <div key={c.code} className="ck-coupon-card">
                                      <div className="ck-coupon-card-left">
                                        <span className="ck-coupon-card-code">{c.code}</span>
                                        <div className="ck-coupon-card-info">
                                          <strong>{c.type === 'percent' ? `${Number(c.value)}% OFF` : `₹${Number(c.value)} OFF`}</strong>
                                          {Number(c.min_order) > 0 ? (
                                            <span>Min order ₹{Number(c.min_order).toLocaleString('en-IN')}</span>
                                          ) : (
                                            <span>No minimum order required</span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="ck-coupon-card-apply"
                                        disabled={couponApplying}
                                        onClick={() => { setCouponInput(c.code); handleApplyCoupon(c.code); }}
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="ck-summary-row ck-subtotal-row">
                          <div className="ck-subtotal-label">
                            <span className="ck-subtotal-title">Product subtotal</span>
                            {hasGstItems && (
                              <span className="ck-gst-note">
                                <i className="fa-solid fa-check" aria-hidden="true" />
                                Inclusive of GST
                              </span>
                            )}
                          </div>
                          <span className="ck-subtotal-value">₹{formattedSubtotal}</span>
                        </div>
                        {flooredSavings > 0 && (
                          <div className="ck-summary-row" style={{ color: '#E05252' }}>
                            <span style={{ fontWeight: 600 }}>Offer Discount</span>
                            <span style={{ fontFamily: F.main, fontSize: 12, letterSpacing: 1, fontWeight: 600 }}>-₹{formattedSavings}</span>
                          </div>
                        )}
                        {flooredCouponDiscount > 0 && (
                          <div className="ck-summary-row" style={{ color: '#059669' }}>
                            <span style={{ fontWeight: 600 }}>Coupon ({appliedCoupon.code})</span>
                            <span style={{ fontFamily: F.main, fontSize: 12, letterSpacing: 1, fontWeight: 600 }}>-₹{formattedCouponDiscount}</span>
                          </div>
                        )}
                        <div className="ck-summary-row" style={{ alignItems: 'center' }}>
                          <span style={{ color: '#4A4A5E', fontSize: 14, fontWeight: 400, letterSpacing: 0.4 }}>Shipping charges</span>
                          <span
                            onClick={() => {
                              if (!isCustomDelivery && quoteIsCurrent && shippingQuote?.couriers?.length > 0) {
                                setIsCourierModalOpen(true);
                              }
                            }}
                            style={{
                              color: (isCustomDelivery ? customDeliveryRate : selectedCourier) ? BRAND : '#8FA88A',
                              fontFamily: F.main,
                              fontSize: 17,
                              fontWeight: 500,
                              letterSpacing: 0.8,
                              cursor: !isCustomDelivery && quoteIsCurrent && shippingQuote?.couriers?.length > 0 ? 'pointer' : 'default',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                            title={!isCustomDelivery && quoteIsCurrent && shippingQuote?.couriers?.length > 0 ? "Click to change courier" : ""}
                          >
                            {isCustomDelivery ? (
                              customDeliveryLoading
                                ? 'Calculating…'
                                : (customDeliveryRate ? `₹${formattedShipping}` : (customDeliveryError || (form.state ? 'Unavailable' : 'Select State')))
                            ) : (
                              selectedCourier ? `₹${formattedShipping}` : (shippingQuoteError || (quoteIsCurrent ? 'Choose a courier' : 'Enter PIN code for quote'))
                            )}
                            {!isCustomDelivery && quoteIsCurrent && shippingQuote?.couriers?.length > 0 && (
                              <i className="fa-solid fa-pen-to-square" style={{ fontSize: 11, color: BRAND }} />
                            )}
                          </span>
                        </div>
                        {!isCustomDelivery && quoteIsCurrent && shippingQuote?.couriers?.length > 0 && (
                          <div className="ck-courier-box">
                            <div className="ck-courier-section-header">
                              <span className="ck-courier-section-label">DELIVERY PARTNER</span>
                            </div>
                            {selectedCourier ? (
                              <div className="ck-courier-active-card">
                                <div className="ck-courier-active-left">
                                  <div className="ck-courier-active-icon">
                                    <i className={(selectedCourier.courierName || '').toLowerCase().includes('air') ? "fa-solid fa-plane-departure" : "fa-solid fa-truck-fast"} />
                                  </div>
                                  <div className="ck-courier-active-meta">
                                    <div className="ck-courier-active-name" title={selectedCourier.courierName}>
                                      {selectedCourier.courierName}
                                    </div>
                                    <div className="ck-courier-active-eta">
                                      <i className="fa-regular fa-clock" style={{ marginRight: 5 }} />
                                      {selectedCourier.estimatedDeliveryDays ? `${selectedCourier.estimatedDeliveryDays} days delivery` : 'Standard Delivery'}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="ck-courier-change-btn" style={{ minHeight: 36 }}
                                  onClick={() => setIsCourierModalOpen(true)}
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="ck-courier-choose-btn"
                                onClick={() => setIsCourierModalOpen(true)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <i className="fa-solid fa-truck-fast" />
                                  <span>Choose Delivery Courier</span>
                                </div>
                                <span className="ck-courier-options-badge">
                                  {shippingQuote.couriers.length} options <i className="fa-solid fa-chevron-right" style={{ fontSize: 9, marginLeft: 2 }} />
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                        <hr style={{ borderColor: '#EAE4D6', margin: '16px 0' }} />
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="ck-summary-total">Final total</span>
                          <span className="ck-summary-total-val">{quoteIsCurrent ? `₹${formattedTotal}` : "Pending"}</span>
                        </div>
                        
                      </>
                    )}

                    {!billingAddressReady && (
                      <p role="alert" style={{ color: '#b42318', fontSize: 12, margin: '16px 0 0' }}>
                        {user && !billingSame
                          ? 'Select a complete billing address, or check “Billing same as shipping”, before payment.'
                          : 'Complete the shipping address before payment.'}
                      </p>
                    )}
                    <div className="ck-policy-wrap">
                     
                      <label className={`ck-policy-check${policyAccepted ? ' checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={policyAccepted}
                          onChange={e => { setPolicyAccepted(e.target.checked); if (e.target.checked) setPlaceError(''); }}
                        />
                        <span className="ck-policy-box" aria-hidden="true"><i className="fa-solid fa-check" /></span>
                        <span className="ck-policy-text">
                          I have read and agree to the{' '}
                          <a href={POLICY_LINKS.terms} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Terms</a>,{' '}
                          <a href={POLICY_LINKS.shipping} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Shipping Policy</a> and{' '}
                          <a href={POLICY_LINKS.returns} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Return &amp; Cancellation Policy</a>.
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={handlePlaceOrder}
                      className="ck-btn-primary"
                      disabled={payDisabled}
                      style={{ marginTop: 24, opacity: payDisabled ? 0.55 : 1, cursor: payDisabled ? 'not-allowed' : 'pointer' }}
                    >
                      <span>
                        {placing
                          ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />Opening Razorpay…</>
                          : !billingAddressReady
                            ? 'Complete address to pay'
                            : !quoteIsCurrent || !selectedCourier
                              ? 'Select delivery state for shipping'
                              : !policyAccepted
                                ? 'Accept policies to pay'
                                : <>Pay {'₹'}{formattedTotal} now</>
                        }
                      </span>
                    </button>

                    {/* Security badges removed as per request */}
                  </div>
                </div>

              </div>
              </>
            )}
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
};

export default CheckoutPage;
