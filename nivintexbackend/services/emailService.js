// services/emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const smtpPort = Number(process.env.EMAIL_PORT) || 587;
const emailPass = (process.env.EMAIL_PASS || '').trim();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPass,
  },
});

// ── Fashion Aura Brand Tokens ──
const B = {
  navy:       '#1A1040',
  navyDark:   '#120B30',
  gold:       '#C9933A',
  goldLight:  '#F5ECD7',
  ivory:      '#F8F6F2',
  text:       '#4A4A4A',
  textLight:  '#888888',
  border:     '#E7DFD2',
  white:      '#FFFFFF',
  green:      '#2E7D32',
  greenLight: '#EAF3E0',
  red:        '#A32D2D',
  redLight:   '#FCEBEB',
  orange:     '#C9933A',
  orangeLight:'#F5ECD7',
};

const getFrontendBaseUrl = () => {
  const url = process.env.FRONTEND_URL || 'http://localhost:3000';
  return url.replace(/\/+$/, '').trim();
};

const getTrackOrderUrl = (order = {}) => {
  const envTrackUrl = process.env.TRACK_ORDER_URL ? process.env.TRACK_ORDER_URL.trim() : '';
  if (envTrackUrl) {
    let url = envTrackUrl;
    if (order.id && url.includes(':orderId')) {
      return url.replace(':orderId', encodeURIComponent(order.id));
    }
    if (order.awb_code && url.includes(':awb')) {
      return url.replace(':awb', encodeURIComponent(order.awb_code));
    }
    if (order.awb_code && (url.includes('shiprocket') || url.includes('/tracking'))) {
      return `${url.replace(/\/+$/, '')}/${encodeURIComponent(order.awb_code)}`;
    }
    if (order.id) {
      if (url.includes('?')) {
        return `${url}&orderId=${encodeURIComponent(order.id)}`;
      }
      return `${url.replace(/\/+$/, '')}?orderId=${encodeURIComponent(order.id)}`;
    }
    return url;
  }

  const base = getFrontendBaseUrl();
  return order.id ? `${base}/orders?orderId=${encodeURIComponent(order.id)}` : `${base}/orders`;
};

const getCourierTrackingUrl = (awb_code) => {
  if (!awb_code) return null;
  const courierBase = (process.env.COURIER_TRACKING_URL || 'https://shiprocket.co/tracking').replace(/\/+$/, '').trim();
  return `${courierBase}/${encodeURIComponent(awb_code)}`;
};

const getLogoConfig = () => {
  const envLogo = process.env.APP_LOGO_URL || process.env.BRAND_LOGO_URL;
  if (envLogo && envLogo.trim().startsWith('http')) {
    return {
      src: envLogo.trim(),
      attachments: [],
    };
  }
  const logoPath = path.join(__dirname, '../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    return {
      src: 'cid:brandlogo',
      attachments: [
        {
          filename: 'logo.png',
          path: logoPath,
          cid: 'brandlogo',
        },
      ],
    };
  }
  const frontendBase = getFrontendBaseUrl();
  return {
    src: `${frontendBase}/assets/img/logo2.png`,
    attachments: [],
  };
};

const statusTemplates = {
  confirmed: {
    subject: 'Order Confirmed – Fashion Aura',
    heading: 'Your Order is Confirmed!',
    message: 'Great news! Your order has been confirmed and is being prepared for fulfillment.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: '',
    stepActive: 1,
    hidePills: false,
  },
  accepted: {
    subject: 'Order Accepted – Fashion Aura',
    heading: 'Your Order Has Been Accepted!',
    message: 'We have accepted your order and it has been routed to our packing department.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: '',
    stepActive: 1,
  },
  packed: {
    subject: 'Order Packed & Ready – Fashion Aura',
    heading: 'Order Packed & Ready!',
    message: 'Your order has been carefully inspected, packed, and is ready for courier handover.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: '',
    stepActive: 2,
  },
  shipped: {
    subject: 'Your Order Has Been Shipped – Fashion Aura',
    heading: 'Order Shipped!',
    message: 'Your order has been picked up by the courier and is on its way to your destination.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: '',
    stepActive: 3,
  },
  in_transit: {
    subject: 'Your Order is In Transit – Fashion Aura',
    heading: 'Order In Transit!',
    message: 'Your order is moving through our logistics network and will reach you very soon.',
    accentColor: B.gold,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: '',
    stepActive: 3,
  },
  out_for_delivery: {
    subject: 'Out for Delivery Today – Fashion Aura',
    heading: 'Out for Delivery!',
    message: 'Your order is out for delivery today. Please keep your phone handy for courier contact.',
    accentColor: B.gold,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: '',
    stepActive: 4,
  },
  delivered: {
    subject: 'Order Delivered – Fashion Aura',
    heading: 'Order Delivered Successfully!',
    message: 'Your order has been delivered. We hope you love your purchase! Thank you for choosing Fashion Aura.',
    accentColor: B.green,
    badgeBg:     B.greenLight,
    badgeColor:  B.green,
    icon: '',
    stepActive: 5,
  },
  cancelled: {
    subject: 'Order Cancelled – Fashion Aura',
    heading: 'Order Cancelled',
    message: 'Your order has been cancelled. If you did not request this, please contact our support team immediately.',
    accentColor: B.red,
    badgeBg:     B.redLight,
    badgeColor:  B.red,
    icon: '',
    stepActive: 0,
  },
  return_requested: {
    subject: 'Return Request Received – Fashion Aura',
    heading: 'Return Request Received',
    message: 'We have received your return request. Our support team will review it and update you within 24–48 hours.',
    accentColor: B.gold,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: '',
    stepActive: 0,
  },
  return_approved: {
    subject: 'Return Approved – Fashion Aura',
    heading: 'Return Approved!',
    message: 'Your return request has been approved. Our courier will pick up the item from your address soon.',
    accentColor: B.green,
    badgeBg:     B.greenLight,
    badgeColor:  B.green,
    icon: '',
    stepActive: 0,
  },
  return_picked_up: {
    subject: 'Return Item Picked Up – Fashion Aura',
    heading: 'Return Item Picked Up!',
    message: 'Our courier has picked up your return item. Your refund will be initiated once verified at our facility.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: '',
    stepActive: 0,
  },
  return_received: {
    subject: 'Return Received at Warehouse – Fashion Aura',
    heading: 'Return Received!',
    message: 'We have received your returned item at our warehouse. Your refund is now being processed.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: '',
    stepActive: 0,
  },
  refunded: {
    subject: 'Refund Processed – Fashion Aura',
    heading: 'Refund Processed!',
    message: 'Your refund has been completed. The amount will reflect in your original payment method within 5–7 business days.',
    accentColor: B.green,
    badgeBg:     B.greenLight,
    badgeColor:  B.green,
    icon: '',
    stepActive: 0,
  },
};

// ── Stepper: 5 Progressive Stages ──
const buildStepper = (activeStep) => {
  if (!activeStep || activeStep <= 0) return '';
  const steps = [
    { label: 'Confirmed',        icon: '✓' },
    { label: 'Packed',           icon: '📦' },
    { label: 'Shipped',          icon: '🚚' },
    { label: 'Out for Delivery', icon: '⏳' },
    { label: 'Delivered',        icon: '✓' },
  ];

  const cells = steps.map((s, i) => {
    const idx        = i + 1;
    const done       = idx < activeStep;
    const active     = idx === activeStep;
    const dotBg      = done ? B.green : (active ? B.gold : B.border);
    const dotColor   = done || active ? B.white : B.navy;
    const labelColor = active ? B.navy : (done ? B.green : B.textLight);
    const fontW      = active ? '700' : '500';
    return `
      <td align="center" style="width:20%;padding:0;">
        <div style="width:34px;height:34px;border-radius:50%;background:${dotBg};color:${dotColor};
                    font-size:13px;font-weight:700;line-height:34px;text-align:center;margin:0 auto 6px;">
          ${done ? '✓' : (active ? s.icon : idx)}
        </div>
        <div style="font-size:10px;font-weight:${fontW};color:${labelColor};line-height:1.3;">${s.label}</div>
      </td>`;
  }).join(`<td style="padding-bottom:22px;"><div style="height:2px;background:${B.border};margin-top:16px;"></div></td>`);

  return `
  <tr>
    <td style="padding:22px 24px 14px;background:${B.ivory};border-bottom:1px solid ${B.border};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${cells}</tr>
      </table>
    </td>
  </tr>`;
};

// ── Items Table ──
const buildItemsTable = (items = []) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return '';

  const rows = list.map(item => {
    const details = [
      item.size ? `Size: ${item.size}` : '',
      item.color ? `Color: ${item.color}` : '',
      item.fabric ? `Fabric: ${item.fabric}` : '',
      item.weight ? `${item.weight}` : ''
    ].filter(Boolean).join(' · ');

    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity, 10) || 1;
    const itemTotal = (price * qty).toFixed(2);

    return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${B.border};font-size:13px;color:${B.navy};font-weight:600;">
        ${item.name || item.productName || 'Fashion Apparel'}
        ${details ? `<div style="font-size:11px;color:${B.textLight};font-weight:400;margin-top:3px;">${details}</div>` : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${B.border};font-size:13px;color:${B.text};text-align:center;white-space:nowrap;">
        × ${qty}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${B.border};font-size:13px;font-weight:700;color:${B.gold};text-align:right;white-space:nowrap;">
        ₹${itemTotal}
      </td>
    </tr>`;
  }).join('');

  return `
  <tr>
    <td style="padding:20px 24px 8px;">
      <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;letter-spacing:0.07em;
                  border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">Items Ordered</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <th style="font-size:10px;font-weight:700;color:${B.textLight};text-align:left;padding-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Product</th>
          <th style="font-size:10px;font-weight:700;color:${B.textLight};text-align:center;padding-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Qty</th>
          <th style="font-size:10px;font-weight:700;color:${B.textLight};text-align:right;padding-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Price</th>
        </tr>
        ${rows}
      </table>
    </td>
  </tr>`;
};

// ── Price Summary ──
const buildPriceSummary = (order, extra = {}) => {
  const subtotal       = parseFloat(order.subtotal        || 0);
  const tax            = parseFloat(order.tax             || 0);
  const deliveryCharge = parseFloat(order.delivery_charge || 0);
  const discount       = parseFloat(order.discount        || 0);
  const total          = parseFloat(order.total           || 0);

  const discountRow = discount > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.green};">
        Discount ${order.coupon_code ? `(${order.coupon_code})` : ''}
      </td>
      <td style="padding:5px 0;font-size:13px;color:${B.green};text-align:right;font-weight:600;">−₹${discount.toFixed(2)}</td>
    </tr>` : '';

  const refundRows = extra.refund_id ? `
    <tr>
      <td colspan="2" style="padding:10px 0 4px;"><div style="border-top:1px dashed ${B.border};"></div></td>
    </tr>
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Refund ID</td>
      <td style="padding:5px 0;font-size:12px;font-family:monospace;color:${B.gold};text-align:right;">${extra.refund_id}</td>
    </tr>
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Refund Amount</td>
      <td style="padding:5px 0;font-size:13px;font-weight:700;color:${B.green};text-align:right;">₹${extra.refund_amount}</td>
    </tr>` : '';

  const courierTrackLink = getCourierTrackingUrl(order.awb_code);
  const trackingRows = order.awb_code ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Courier Partner</td>
      <td style="padding:5px 0;font-size:13px;color:${B.navy};font-weight:600;text-align:right;">${order.courier_name || 'Courier Assigned'}</td>
    </tr>
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">AWB Tracking No.</td>
      <td style="padding:5px 0;font-size:12px;font-family:monospace;color:${B.gold};font-weight:700;text-align:right;">
        ${courierTrackLink ? `<a href="${courierTrackLink}" target="_blank" style="color:${B.gold};text-decoration:underline;">${order.awb_code} ↗</a>` : order.awb_code}
      </td>
    </tr>` : '';

  const deliveryRow = deliveryCharge > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery Charge</td>
      <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;font-weight:600;">₹${deliveryCharge.toFixed(2)}</td>
    </tr>` : `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery Charge</td>
      <td style="padding:5px 0;text-align:right;">
        <span style="background:${B.greenLight};color:${B.green};font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;">FREE</span>
      </td>
    </tr>`;

  return `
  <tr>
    <td style="padding:0 24px 20px;">
      <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:12px;padding:16px 18px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:${B.text};">Order ID</td>
            <td style="padding:5px 0;font-size:13px;font-family:monospace;font-weight:700;color:${B.navy};text-align:right;">#${order.id}</td>
          </tr>
          ${order.payment_id ? `
          <tr>
            <td style="padding:5px 0;font-size:13px;color:${B.text};">Payment ID</td>
            <td style="padding:5px 0;font-size:11px;font-family:monospace;color:${B.textLight};text-align:right;">${order.payment_id}</td>
          </tr>` : ''}
          ${trackingRows}
          ${refundRows}
          ${subtotal > 0 ? `
          <tr><td colspan="2" style="padding:8px 0 4px;"><div style="border-top:1px dashed ${B.border};"></div></td></tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:${B.text};">Subtotal</td>
            <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;">₹${subtotal.toFixed(2)}</td>
          </tr>
          ${tax > 0 ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:${B.text};">GST (Tax)</td>
            <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;">+₹${tax.toFixed(2)}</td>
          </tr>` : ''}
          ${deliveryRow}
          ${discountRow}
          <tr><td colspan="2" style="padding:8px 0 4px;"><div style="border-top:1.5px solid ${B.border};"></div></td></tr>
          <tr>
            <td style="padding:6px 0;font-size:15px;font-weight:700;color:${B.navy};">Total Paid</td>
            <td style="padding:6px 0;font-size:18px;font-weight:800;color:${B.gold};text-align:right;">₹${total.toFixed(2)}</td>
          </tr>` : ''}
        </table>
      </div>
    </td>
  </tr>`;
};

// ── Header Builder ──
const buildBrandHeader = (heading, message, pillsHtml = '', logoSrc) => {
  const resolvedLogo = logoSrc || getLogoConfig().src;
  const frontendBase = getFrontendBaseUrl();
  return `
  <tr>
    <td style="background:linear-gradient(135deg, ${B.navy} 0%, ${B.navyDark} 100%);padding:32px 28px 26px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
        <tr>
          <td align="center" style="vertical-align:middle;text-align:center;">
            <a href="${frontendBase}" style="text-decoration:none;display:inline-block;">
              <img src="${resolvedLogo}" alt="Fashion Aura" style="max-height:44px;max-width:220px;height:auto;display:block;margin:0 auto;border:0;outline:none;" />
            </a>
            <div style="font-size:10px;font-weight:600;color:${B.gold};letter-spacing:2px;text-transform:uppercase;margin-top:6px;">Elegance &amp; Couture</div>
          </td>
        </tr>
      </table>
      <h1 style="color:${B.white};font-size:24px;font-weight:800;margin:0 0 8px;line-height:1.2;">
        ${heading}
      </h1>
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;line-height:1.6;">
        ${message}
      </p>
      ${pillsHtml}
    </td>
  </tr>`;
};

// ── Footer Builder ──
const buildBrandFooter = (logoSrc) => {
  const year = new Date().getFullYear();
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@fashionaura.in';
  const resolvedLogo = logoSrc || getLogoConfig().src;
  const frontendBase = getFrontendBaseUrl();
  return `
  <!-- Support info -->
  <tr>
    <td style="padding:0 24px 24px;text-align:center;">
      <p style="font-size:12px;color:${B.textLight};margin:0;line-height:1.7;">
        Need help with your order? Contact our support team at<br/>
        <a href="mailto:${supportEmail}" style="color:${B.gold};font-weight:600;text-decoration:none;">${supportEmail}</a>
      </p>
    </td>
  </tr>
  <!-- Footer bar -->
  <tr>
    <td style="background:${B.navyDark};padding:22px 24px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
        <tr>
          <td align="center" style="vertical-align:middle;text-align:center;">
            <a href="${frontendBase}" style="text-decoration:none;display:inline-block;">
              <img src="${resolvedLogo}" alt="Fashion Aura" style="max-height:26px;max-width:140px;height:auto;display:block;margin:0 auto;border:0;outline:none;opacity:0.9;" />
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:rgba(255,255,255,0.6);margin:6px 0 0;line-height:1.6;">
        © ${year} Fashion Aura. All rights reserved.<br/>
        Thank you for choosing elegance!
      </p>
    </td>
  </tr>`;
};

// ── Status Email HTML ──
const buildEmailHTML = (order, template, extra = {}, logoSrc) => {
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const firstName = (order.customer_name || '').split(' ')[0] || 'Customer';
  const stepper   = buildStepper(template.stepActive || 0);
  const items     = order.items || order.OrderItems || extra.items || [];
  const itemsTable = buildItemsTable(items);
  const summary   = buildPriceSummary(order, extra);
  const currentLogo = logoSrc || getLogoConfig().src;
  const trackUrl = getTrackOrderUrl(order);

  const pills = template.hidePills ? '' : `
    <table cellpadding="0" cellspacing="0" style="margin:18px auto 0;">
      <tr>
        <td style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);
                   border-radius:50px;padding:5px 14px;font-size:11px;font-weight:700;color:${B.white};">
          ✅ Verified Order
        </td>
        <td style="width:10px;"></td>
        <td style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);
                   border-radius:50px;padding:5px 14px;font-size:11px;font-weight:700;color:${B.white};">
          ✨ Express Fulfillment
        </td>
      </tr>
    </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${template.subject}</title>
</head>
<body style="margin:0;padding:0;background:${B.ivory};font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader text -->
  <div style="display:none;font-size:1px;color:${B.ivory};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${template.heading} – Hi ${firstName}, ${template.message}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:${B.ivory};padding:32px 16px;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
           style="max-width:600px;background:${B.white};border-radius:20px;overflow:hidden;border:1px solid ${B.border};box-shadow:0 6px 20px rgba(0,0,0,0.06);">

      <!-- Header -->
      ${buildBrandHeader(template.heading, `Hi <strong style="color:${B.white};">${firstName}</strong> — ${template.message}`, pills, currentLogo)}

      <!-- Stepper -->
      ${stepper}

      <!-- Items Ordered -->
      ${itemsTable}

      <!-- Order Details Summary -->
      <tr><td style="padding:16px 24px 0;">
        <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;
                    letter-spacing:0.07em;border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">
          Order Summary
        </div>
      </td></tr>
      ${summary}

      <!-- Order Meta Info -->
      <tr>
        <td style="padding:0 24px 20px;">
          <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 18px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size:13px;color:${B.text};">Order Date</td>
                <td style="font-size:13px;font-weight:600;color:${B.navy};text-align:right;">${orderDate}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:${B.text};">Recipient</td>
                <td style="font-size:13px;font-weight:600;color:${B.navy};text-align:right;">${order.customer_name}</td>
              </tr>
              ${order.customer_email ? `
              <tr>
                <td style="font-size:13px;color:${B.text};">Notification Email</td>
                <td style="font-size:13px;color:${B.gold};text-align:right;">${order.customer_email}</td>
              </tr>` : ''}
            </table>
          </div>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td style="padding:0 24px 28px;text-align:center;">
          <a href="${trackUrl}"
             style="display:inline-block;background:linear-gradient(45deg, ${B.navy}, ${B.gold});color:${B.white};
                    font-size:14px;font-weight:700;padding:13px 32px;border-radius:50px;
                    text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(26,16,64,0.25);">
            Track Order Details →
          </a>
        </td>
      </tr>

      <!-- Footer -->
      ${buildBrandFooter(currentLogo)}

    </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ── Confirmation Email HTML ──
const buildConfirmationHTML = ({ email, name, paymentId, orderId, items = [], subtotal, tax, delivery_charge, discount, total, coupon, billingAddress, phone, phone2 }, logoSrc) => {
  const orderDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const firstName = (name || '').split(' ')[0] || 'Customer';
  const currentLogo = logoSrc || getLogoConfig().src;
  const trackUrl = getTrackOrderUrl({ id: orderId });
  const itemsTable = buildItemsTable(items);

  const billingBlock = billingAddress ? (() => {
    let addr = billingAddress;
    if (typeof addr === 'string') { try { addr = JSON.parse(addr); } catch { addr = {}; } }
    const line1 = [addr.address || addr.address1, addr.address2].filter(Boolean).join(', ');
    const line2 = [addr.city, addr.state, addr.zip || addr.postcode].filter(Boolean).join(', ');
    const biz   = addr.company ? `<div style="font-size:12px;color:${B.text};">${addr.company}</div>` : '';
    const ph2   = (addr.phone2 || phone2)
      ? `<div style="color:${B.text};">📞 ${addr.phone2 || phone2} <span style="font-size:10px;color:${B.gold};font-weight:700;">(Alt)</span></div>`
      : '';
    return `
    <tr><td style="padding:0 24px 20px;">
      <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;
                  letter-spacing:0.07em;border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">
        Billing &amp; Delivery Address
      </div>
      <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:12px;padding:14px 18px;font-size:13px;line-height:1.8;color:${B.navy};">
        <div style="font-weight:700;">${name}</div>
        ${biz}
        ${line1 ? `<div style="color:${B.text};">${line1}</div>` : ''}
        ${line2 ? `<div style="color:${B.text};">${line2}</div>` : ''}
        ${phone ? `<div style="color:${B.text};">📞 ${phone}</div>` : ''}
        ${ph2}
        <div style="color:${B.gold};">${email}</div>
      </div>
    </td></tr>`;
  })() : '';

  const parsedSubtotal = parseFloat(subtotal || 0);
  const parsedTax = parseFloat(tax || 0);
  const parsedDelivery = parseFloat(delivery_charge || 0);
  const parsedDiscount = parseFloat(discount || 0);
  const parsedTotal = parseFloat(total || 0);

  const discountRow = parsedDiscount > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.green};">Coupon Discount ${coupon ? `(${coupon.code || coupon})` : ''}</td>
      <td style="padding:5px 0;font-size:13px;font-weight:700;color:${B.green};text-align:right;">−₹${parsedDiscount.toFixed(2)}</td>
    </tr>` : '';

  const deliveryRow = parsedDelivery > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery Charge</td>
      <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;font-weight:600;">₹${parsedDelivery.toFixed(2)}</td>
    </tr>` : `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery Charge</td>
      <td style="padding:5px 0;text-align:right;">
        <span style="background:${B.greenLight};color:${B.green};font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;">FREE</span>
      </td>
    </tr>`;

  // Stepper starting at Confirmed (Step 1)
  const stepper = buildStepper(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmed – Fashion Aura</title>
</head>
<body style="margin:0;padding:0;background:${B.ivory};font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:${B.ivory};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Thank you for your order, ${firstName}! Your payment was verified and your order #${orderId} is confirmed.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:${B.ivory};padding:32px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0"
         style="max-width:600px;background:${B.white};border-radius:20px;overflow:hidden;border:1px solid ${B.border};box-shadow:0 6px 20px rgba(0,0,0,0.06);">

    <!-- Header -->
    ${buildBrandHeader('Order Confirmed! 🎉', `Thank you, <strong style="color:${B.white};">${firstName}</strong>! Your payment was successful and your order is being processed.`, '', currentLogo)}

    <!-- Stepper -->
    ${stepper}

    <!-- Items -->
    ${itemsTable}

    <!-- Price Summary -->
    <tr><td style="padding:16px 24px 20px;">
      <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:12px;padding:16px 18px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:${B.text};">Subtotal</td>
            <td style="padding:5px 0;font-size:13px;color:${B.navy};font-weight:600;text-align:right;">₹${parsedSubtotal.toFixed(2)}</td>
          </tr>
          ${parsedTax > 0 ? `
          <tr>
            <td style="padding:5px 0;font-size:13px;color:${B.text};">GST (Tax)</td>
            <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;">+₹${parsedTax.toFixed(2)}</td>
          </tr>` : ''}
          ${deliveryRow}
          ${discountRow}
          <tr><td colspan="2" style="padding:6px 0 4px;"><div style="border-top:1.5px solid ${B.border};"></div></td></tr>
          <tr>
            <td style="padding:6px 0;font-size:15px;font-weight:700;color:${B.navy};">Total Paid</td>
            <td style="padding:6px 0;font-size:18px;font-weight:800;color:${B.gold};text-align:right;">₹${parsedTotal.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </td></tr>

    <!-- Payment & Order Meta Details -->
    <tr><td style="padding:0 24px 20px;">
      <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;
                  letter-spacing:0.07em;border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">
        Payment &amp; Order Details
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding-right:6px;">
            <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
              <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Order ID</div>
              <div style="font-size:12px;font-family:monospace;color:${B.navy};font-weight:700;word-break:break-all;">#${orderId}</div>
            </div>
          </td>
          <td width="50%" style="padding-left:6px;">
            <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
              <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Payment ID</div>
              <div style="font-size:11px;font-family:monospace;color:${B.gold};font-weight:600;word-break:break-all;">${paymentId || 'Verified'}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding-right:6px;padding-top:10px;">
            <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
              <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Order Date</div>
              <div style="font-size:13px;color:${B.navy};font-weight:600;">${orderDate}</div>
            </div>
          </td>
          <td width="50%" style="padding-left:6px;padding-top:10px;">
            <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
              <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Amount Paid</div>
              <div style="font-size:15px;color:${B.gold};font-weight:800;">₹${parsedTotal.toFixed(2)}</div>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Billing Address -->
    ${billingBlock}

    <!-- CTA Button -->
    <tr>
      <td style="padding:0 24px 28px;text-align:center;">
        <a href="${trackUrl}"
           style="display:inline-block;background:linear-gradient(45deg, ${B.navy}, ${B.gold});color:${B.white};
                  font-size:14px;font-weight:700;padding:13px 32px;border-radius:50px;
                  text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(26,16,64,0.25);">
          Track Order Details →
        </a>
      </td>
    </tr>

    <!-- Footer -->
    ${buildBrandFooter(currentLogo)}

  </table>
  </td></tr>
  </table>
</body>
</html>`;
};

// ── Send Order Confirmation Email ──
exports.sendOrderConfirmationEmail = async ({ email, name, paymentId, orderId, items, subtotal, tax, delivery_charge, discount, total, coupon, billingAddress, phone, phone2 }) => {
  try {
    if (!email) {
      console.warn('⚠️ No customer email provided for order confirmation.');
      return;
    }
    const logoConfig = getLogoConfig();
    console.log(`📧 Sending confirmation email → ${email} for Order #${orderId}`);
    await transporter.sendMail({
      from:        `"Fashion Aura" <${process.env.EMAIL_USER}>`,
      to:          email,
      subject:     'Order Confirmed – Fashion Aura',
      html:        buildConfirmationHTML({ email, name, paymentId, orderId, items, subtotal, tax, delivery_charge, discount, total, coupon, billingAddress, phone, phone2 }, logoConfig.src),
      attachments: logoConfig.attachments,
    });
    console.log(`✅ Order confirmation email sent → ${email}`);
  } catch (err) {
    console.error('❌ Order confirmation email failed:', err.message);
  }
};

// ── Send Order Status Update Email ──
exports.sendOrderStatusEmail = async (order, status, extra = {}) => {
  try {
    const template = statusTemplates[status];
    if (!template) {
      console.warn(`⚠️ No email template registered for status: ${status}`);
      return;
    }
    if (!order.customer_email) {
      console.warn(`⚠️ No customer email found for Order #${order.id}`);
      return;
    }

    // Ensure items are loaded for status email
    let items = order.items || order.OrderItems || extra.items;
    if ((!items || items.length === 0) && order.id) {
      try {
        const OrderItem = require('../models/OrderItem');
        items = await OrderItem.findAll({ where: { orderId: order.id } });
      } catch (itemErr) {
        console.warn('Could not auto-fetch items for status email:', itemErr.message);
      }
    }

    const orderData = {
      ...(typeof order.toJSON === 'function' ? order.toJSON() : order),
      items: items || [],
    };

    const logoConfig = getLogoConfig();
    console.log(`📧 Sending status update email [${status}] → ${order.customer_email} for Order #${order.id}`);
    await transporter.sendMail({
      from:        `"Fashion Aura" <${process.env.EMAIL_USER}>`,
      to:          order.customer_email,
      subject:     template.subject,
      html:        buildEmailHTML(orderData, template, extra, logoConfig.src),
      attachments: logoConfig.attachments,
    });
    console.log(`✅ Status update email sent [${status}] → ${order.customer_email}`);
  } catch (err) {
    console.error(`❌ Status email failed for Order #${order?.id} (${status}):`, err.message);
  }
};

// ── Send OTP Email (Password Reset) ──
exports.sendOtpEmail = async (email, otp) => {
  try {
    console.log(`📧 Sending password reset OTP → ${email}`);
    const firstName = email.split('@')[0].replace(/[0-9]/g, '');
    const capitalizedName = firstName ? (firstName.charAt(0).toUpperCase() + firstName.slice(1)) : 'Customer';
    const formattedOtp = otp.toString().split('').join(' ');
    const logoConfig = getLogoConfig();
    const frontendBase = getFrontendBaseUrl();

    await transporter.sendMail({
      from:        `"Fashion Aura" <${process.env.EMAIL_USER}>`,
      to:          email,
      subject:     'Password Reset OTP – Fashion Aura',
      attachments: logoConfig.attachments,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <title>Password Reset OTP – Fashion Aura</title>
        </head>
        <body style="margin:0;padding:0;background:${B.ivory};font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${B.ivory};padding:32px 16px;">
            <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${B.white};border-radius:16px;overflow:hidden;border:1px solid ${B.border};box-shadow:0 6px 20px rgba(0,0,0,0.06);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background:linear-gradient(135deg, ${B.navy} 0%, ${B.navyDark} 100%);padding:28px 24px;text-align:center;">
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                    <tr>
                      <td align="center" style="vertical-align:middle;text-align:center;">
                        <a href="${frontendBase}" style="text-decoration:none;display:inline-block;">
                          <img src="${logoConfig.src}" alt="Fashion Aura" style="max-height:40px;max-width:200px;height:auto;display:block;margin:0 auto;border:0;outline:none;" />
                        </a>
                      </td>
                    </tr>
                  </table>
                  <div style="font-size:11px;font-weight:600;color:${B.gold};letter-spacing:2px;text-transform:uppercase;">Account Security</div>
                </td>
              </tr>
              
              <!-- Main Body -->
              <tr>
                <td style="padding:36px 32px 28px;text-align:center;">
                  <div style="font-size:36px;margin-bottom:12px;">🔐</div>
                  <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${B.navy};">Hi ${capitalizedName},</h2>
                  <p style="margin:0 0 28px;font-size:14px;color:${B.text};line-height:1.6;">
                    We received a request to reset your Fashion Aura account password.<br/>
                    Please use the one-time verification code below to proceed.
                  </p>
                  
                  <!-- OTP Display Box -->
                  <table cellpadding="0" cellspacing="0" width="100%" style="max-width:320px;margin:0 auto;border:2px dashed ${B.gold};border-radius:12px;background:${B.ivory};">
                    <tr>
                      <td style="padding:22px 20px 18px;text-align:center;">
                        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${B.gold};letter-spacing:1px;text-transform:uppercase;">Your OTP Verification Code</p>
                        <p style="margin:0 0 10px;font-size:34px;font-weight:800;color:${B.navy};letter-spacing:8px;font-family:monospace;">${formattedOtp}</p>
                        <p style="margin:0;font-size:12px;font-weight:600;color:${B.red};">⏱ Valid for 15 minutes</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Instruction cards -->
              <tr>
                <td style="padding:0 32px 28px;">
                  <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:8px;padding:16px 20px;margin-bottom:14px;text-align:left;">
                    <div style="font-size:13px;font-weight:700;color:${B.navy};margin-bottom:6px;">Reset Instructions:</div>
                    <div style="font-size:12px;color:${B.text};line-height:1.6;">
                      1. Enter the code above on the password reset screen.<br/>
                      2. Choose a new, secure password.<br/>
                      3. Sign in to your Fashion Aura account.
                    </div>
                  </div>
                  
                  <div style="background:${B.redLight};border-left:4px solid ${B.red};border-radius:4px;padding:12px 16px;text-align:left;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:${B.red};">
                      <strong>Security Notice:</strong> If you did not request this code, you can safely disregard this email. Never share this OTP with anyone — Fashion Aura representatives will never ask for your code.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              ${buildBrandFooter(logoConfig.src)}
              
            </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`✅ Password reset OTP email sent → ${email}`);
  } catch (err) {
    console.error('❌ Password reset OTP email failed:', err.message);
    throw err;
  }
};

