// services/emailService.js
const nodemailer = require('nodemailer');

const smtpPort = Number(process.env.EMAIL_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Brand tokens ──
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

const statusTemplates = {
  confirmed: {
    subject: 'Order Confirmed – Fashion Aura',
    heading: 'Your Order is Confirmed!',
    message: 'Great news! Your order has been confirmed and is being prepared for shipment.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: ``,
    stepActive: 0,
    hidePills: true,
  },
  shipped: {
    subject: 'Your Order Has Been Shipped – Fashion Aura',
    heading: 'Order Shipped!',
    message: 'Your order has been picked up by the courier and is on its way to you.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: ``,
    stepActive: 2,
  },
  in_transit: {
    subject: 'Your Order is In Transit – Fashion Aura',
    heading: 'Order In Transit!',
    message: 'Your order is moving through our logistics network and will reach you soon.',
    accentColor: B.gold,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: ``,
    stepActive: 3,
  },
  out_for_delivery: {
    subject: 'Out for Delivery Today – Fashion Aura',
    heading: 'Out for Delivery!',
    message: 'Your order is out for delivery today. Please keep your phone handy.',
    accentColor: B.gold,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: ``,
    stepActive: 4,
  },
  delivered: {
    subject: 'Order Delivered – Fashion Aura',
    heading: 'Order Delivered!',
    message: 'Your order has been delivered successfully. We hope you love your purchase! Share your experience and help others.',
    accentColor: B.green,
    badgeBg:     B.greenLight,
    badgeColor:  B.green,
    icon: ``,
    stepActive: 5,
  },
  cancelled: {
    subject: 'Order Cancelled – Fashion Aura',
    heading: 'Order Cancelled',
    message: 'Your order has been cancelled. If you did not request this, please contact us immediately.',
    accentColor: B.red,
    badgeBg:     B.redLight,
    badgeColor:  B.red,
    icon: ``,
    stepActive: 0,
  },
  return_requested: {
    subject: 'Return Request Received – Fashion Aura',
    heading: 'Return Request Received',
    message: 'We have received your return request. Our team will review it and respond within 24–48 hours.',
    accentColor: B.gold,
    badgeBg:     B.goldLight,
    badgeColor:  B.navy,
    icon: ``,
    stepActive: 0,
  },
  return_approved: {
    subject: 'Return Approved – Fashion Aura',
    heading: 'Return Approved!',
    message: 'Your return request has been approved. Our courier will pick up the item from your address soon.',
    accentColor: B.green,
    badgeBg:     B.greenLight,
    badgeColor:  B.green,
    icon: ``,
    stepActive: 0,
  },
  return_picked_up: {
    subject: 'Return Item Picked Up – Fashion Aura',
    heading: 'Return Item Picked Up!',
    message: 'Our courier has picked up your return item. Refund will be processed once we verify it.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: ``,
    stepActive: 0,
  },
  return_received: {
    subject: 'Return Received at Warehouse – Fashion Aura',
    heading: 'Return Received!',
    message: 'We have received your return item at our warehouse. Your refund is now being processed.',
    accentColor: B.navy,
    badgeBg:     B.goldLight,
    badgeColor:  B.gold,
    icon: ``,
    stepActive: 0,
  },
  refunded: {
    subject: 'Refund Processed – Fashion Aura',
    heading: 'Refund Processed!',
    message: 'Your refund has been processed. The amount will be credited to your original payment method within 5–7 business days.',
    accentColor: B.green,
    badgeBg:     B.greenLight,
    badgeColor:  B.green,
    icon: ``,
    stepActive: 0,
  },
};

// ── Order tracking stepper ──
const buildStepper = (activeStep) => {
  if (activeStep === 0) return '';
  const steps = [
    { label: 'Confirmed',  icon: '✓' },
    { label: 'Shipped',    icon: '⬆' },
    { label: 'In Transit', icon: '→' },
    { label: 'Delivery',   icon: '⏳' },
    { label: 'Delivered',  icon: '✓' },
  ];
  const cells = steps.map((s, i) => {
    const idx        = i + 1;
    const done       = idx < activeStep;
    const active     = idx === activeStep;
    const dotBg      = done || active ? B.navy    : B.border;
    const dotColor   = done || active ? B.white   : B.gold;
    const labelColor = active ? B.gold : done ? B.navy : B.textLight;
    const fontW      = active ? '700' : '500';
    return `
      <td align="center" style="width:20%;padding:0;">
        <div style="width:32px;height:32px;border-radius:50%;background:${dotBg};color:${dotColor};
                    font-size:13px;font-weight:700;line-height:32px;text-align:center;margin:0 auto 6px;">
          ${done ? '✓' : s.icon}
        </div>
        <div style="font-size:10px;font-weight:${fontW};color:${labelColor};line-height:1.3;">${s.label}</div>
      </td>`;
  }).join(`<td style="padding-bottom:22px;"><div style="height:2px;background:${B.border};margin-top:16px;"></div></td>`);

  return `
  <tr>
    <td style="padding:20px 24px 10px;background:${B.ivory};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${cells}</tr>
      </table>
    </td>
  </tr>`;
};

// ── Items table ──
const buildItemsTable = (items = []) => {
  if (!items || items.length === 0) return '';
  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${B.border};font-size:13px;color:${B.navy};font-weight:600;">
        ${item.name}
        ${item.weight ? `<div style="font-size:11px;color:${B.textLight};font-weight:400;margin-top:2px;">${item.weight}</div>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${B.border};font-size:13px;color:${B.text};text-align:center;">×${item.quantity || 1}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${B.border};font-size:13px;font-weight:700;color:${B.gold};text-align:right;">
        ₹${((parseFloat(item.price) || 0) * (item.quantity || 1)).toFixed(2)}
      </td>
    </tr>`).join('');

  return `
  <tr>
    <td style="padding:0 24px 4px;">
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

// ── Price summary ──
const buildPriceSummary = (order, extra = {}) => {
  const subtotal       = parseFloat(order.subtotal        || 0);
  const tax            = parseFloat(order.tax             || 0);
  const deliveryCharge = parseFloat(order.delivery_charge || 0);
  const discount       = parseFloat(order.discount        || 0);
  const total          = parseFloat(order.total           || 0);

  const discountRow = discount > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.green};">
        Coupon ${order.coupon_code ? `(${order.coupon_code})` : ''}
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

  const trackingRows = order.awb_code ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Tracking No.</td>
      <td style="padding:5px 0;font-size:12px;font-family:monospace;color:${B.gold};text-align:right;">${order.awb_code}</td>
    </tr>
    ${order.courier_name ? `<tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Courier</td>
      <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;">${order.courier_name}</td>
    </tr>` : ''}` : '';

  const deliveryRow = deliveryCharge > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery</td>
      <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;font-weight:600;">₹${deliveryCharge.toFixed(2)}</td>
    </tr>` : `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery</td>
      <td style="padding:5px 0;text-align:right;">
        <span style="background:${B.greenLight};color:${B.green};font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;">FREE</span>
      </td>
    </tr>`;

  return `
  <tr>
    <td style="padding:0 24px 20px;">
      <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:16px 18px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:${B.text};">Order ID</td>
            <td style="padding:5px 0;font-size:12px;font-family:monospace;font-weight:700;color:${B.gold};text-align:right;">#${order.id}</td>
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
            <td style="padding:5px 0;font-size:13px;color:${B.text};">GST (5%)</td>
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

// ── Main HTML builder (status emails) ──
const buildEmailHTML = (order, template, extra = {}) => {
  const year      = new Date().getFullYear();
  const orderDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const firstName = (order.customer_name || '').split(' ')[0] || 'Customer';
  const stepper   = buildStepper(template.stepActive || 0);
  const itemsTable = buildItemsTable(order.items || extra.items || []);
  const summary   = buildPriceSummary(order, extra);

  const iconCircle = template.icon ? `
        <div style="width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.15);
                    display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;
                    line-height:68px;vertical-align:middle;">
          <div style="width:52px;height:52px;border-radius:50%;background:${B.white};
                      display:inline-flex;align-items:center;justify-content:center;
                      line-height:52px;text-align:center;">
            ${template.icon}
          </div>
        </div>` : '';

  const pills = template.hidePills ? '' : `
        <table cellpadding="0" cellspacing="0" style="margin:20px auto 0;">
          <tr>
            <td style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);
                       border-radius:50px;padding:5px 14px;font-size:11px;font-weight:700;color:${B.white};">
              ✅ Payment Verified
            </td>
            <td style="width:10px;"></td>
            <td style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);
                       border-radius:50px;padding:5px 14px;font-size:11px;font-weight:700;color:${B.white};">
              🚚 FREE Delivery
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

<table width="100%" cellpadding="0" cellspacing="0" style="background:${B.ivory};padding:32px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0"
         style="max-width:600px;background:${B.white};border-radius:20px;overflow:hidden;border:1px solid ${B.border};">

    <!-- ── HEADER ── -->
    <tr>
      <td style="background:linear-gradient(135deg,${B.navy} 0%,${B.navyDark} 100%);padding:36px 32px 28px;text-align:center;">

        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
          <tr>
            <td style="background:${B.gold};border-radius:9px;width:36px;height:36px;text-align:center;vertical-align:middle;">
              <span style="font-size:18px;font-weight:800;color:${B.white};line-height:36px;">E</span>
            </td>
            <td style="padding-left:10px;vertical-align:middle;">
              <span style="font-size:20px;font-weight:800;color:${B.white};letter-spacing:-0.3px;">Fashion Aura</span>
            </td>
          </tr>
        </table>

        ${iconCircle}

        <h1 style="color:${B.white};font-size:24px;font-weight:800;margin:0 0 8px;line-height:1.2;">
          ${template.heading}
        </h1>
        <p style="color:rgba(255,255,255,0.82);font-size:13px;margin:0;line-height:1.6;">
          Hi <strong style="color:${B.white};">${firstName}</strong> — ${template.message}
        </p>
        ${pills}
      </td>
    </tr>

    <!-- ── STEPPER ── -->
    ${stepper}

    <!-- ── ITEMS ── -->
    ${itemsTable ? `<tr><td style="padding:24px 24px 0;"></td></tr>${itemsTable}` : ''}

    <!-- ── ORDER SUMMARY ── -->
    <tr><td style="padding:${itemsTable ? '16px' : '24px'} 24px 0;">
      <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;
                  letter-spacing:0.07em;border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">
        Order Details
      </div>
    </td></tr>
    ${summary}

    <!-- ── ORDER DATE ── -->
    <tr>
      <td style="padding:0 24px 24px;">
        <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 18px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size:13px;color:${B.text};">Order Date</td>
              <td style="font-size:13px;font-weight:600;color:${B.navy};text-align:right;">${orderDate}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${B.text};">Customer</td>
              <td style="font-size:13px;font-weight:600;color:${B.navy};text-align:right;">${order.customer_name}</td>
            </tr>
            ${order.customer_email ? `
            <tr>
              <td style="font-size:13px;color:${B.text};">Email</td>
              <td style="font-size:13px;color:${B.gold};text-align:right;">${order.customer_email}</td>
            </tr>` : ''}
          </table>
        </div>
      </td>
    </tr>

    <!-- ── SUPPORT ── -->
    <tr>
      <td style="padding:0 24px 28px;text-align:center;">
        <p style="font-size:12px;color:${B.textLight};margin:0;line-height:1.7;">
          Questions? Contact us at
          <a href="mailto:${process.env.EMAIL_USER}"
             style="color:${B.gold};font-weight:600;">${process.env.EMAIL_USER}</a>
        </p>
      </td>
    </tr>

    <!-- ── FOOTER ── -->
    <tr>
      <td style="background:${B.navyDark};padding:18px 24px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
          <tr>
            <td style="background:${B.gold};border-radius:6px;width:24px;height:24px;
                       text-align:center;vertical-align:middle;">
              <span style="font-size:12px;font-weight:800;color:${B.white};line-height:24px;">E</span>
            </td>
            <td style="padding-left:8px;vertical-align:middle;">
              <span style="font-size:14px;font-weight:700;color:${B.white};">Fashion Aura</span>
            </td>
          </tr>
        </table>
        <p style="font-size:11px;color:rgba(255,255,255,0.55);margin:6px 0 0;">
          © ${year} Fashion Aura. All rights reserved.<br/>
          Thank you for shopping with us!
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>

</body>
</html>`;
};

// ── Confirmation email HTML ──
const buildConfirmationHTML = ({ email, name, paymentId, orderId, items = [], subtotal, tax, delivery_charge, discount, total, coupon, billingAddress, phone, phone2 }) => {
  const year      = new Date().getFullYear();
  const orderDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const firstName = (name || '').split(' ')[0] || 'Customer';

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${B.border};font-size:13px;color:${B.navy};font-weight:600;">
        ${item.name}
        ${item.weight ? `<div style="font-size:11px;color:${B.textLight};font-weight:400;margin-top:2px;">${item.weight}</div>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${B.border};font-size:13px;color:${B.text};text-align:center;white-space:nowrap;">
        × ${item.quantity || 1}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${B.border};font-size:13px;font-weight:700;color:${B.gold};text-align:right;white-space:nowrap;">
        ₹${((parseFloat(item.price) || 0) * (item.quantity || 1)).toFixed(2)}
      </td>
    </tr>`).join('');

  const billingBlock = billingAddress ? (() => {
    let addr = billingAddress;
    if (typeof addr === 'string') { try { addr = JSON.parse(addr); } catch { addr = {}; } }
    const line1 = [addr.address1, addr.address2].filter(Boolean).join(', ');
    const line2 = [addr.city, addr.state, addr.postcode].filter(Boolean).join(', ');
    const biz   = addr.company ? `<div style="font-size:12px;color:${B.text};">${addr.company}</div>` : '';
    const ph2   = (addr.phone2 || phone2)
      ? `<div style="color:${B.text};">📞 ${addr.phone2 || phone2} <span style="font-size:10px;color:${B.gold};font-weight:700;">(Alt)</span></div>`
      : '';
    return `
  <tr><td style="padding:0 24px 20px;">
    <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;
                letter-spacing:0.07em;border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">
      Billing Address
    </div>
    <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.8;color:${B.navy};">
      <div style="font-weight:700;">${name}</div>
      ${biz}
      ${line1 ? `<div style="color:${B.text};">${line1}</div>` : ''}
      ${line2 ? `<div style="color:${B.text};">${line2}</div>` : ''}
      ${phone  ? `<div style="color:${B.text};">📞 ${phone}</div>` : ''}
      ${ph2}
      <div style="color:${B.gold};">${email}</div>
    </div>
  </td></tr>`;
  })() : '';

  const couponRow = (coupon && parseFloat(discount) > 0) ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.green};">Coupon (${coupon.code || coupon})</td>
      <td style="padding:5px 0;font-size:13px;font-weight:700;color:${B.green};text-align:right;">−₹${parseFloat(discount).toFixed(2)}</td>
    </tr>` : '';

  const parsedDelivery = parseFloat(delivery_charge || 0);
  const deliveryRow = parsedDelivery > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery</td>
      <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;font-weight:600;">₹${parsedDelivery.toFixed(2)}</td>
    </tr>` : `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${B.text};">Delivery</td>
      <td style="padding:5px 0;text-align:right;">
        <span style="background:${B.greenLight};color:${B.green};font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;">FREE</span>
      </td>
    </tr>`;

  const parsedTax = parseFloat(tax || 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmed – Fashion Aura</title>
</head>
<body style="margin:0;padding:0;background:${B.ivory};font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:${B.ivory};padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
       style="max-width:600px;background:${B.white};border-radius:20px;overflow:hidden;border:1px solid ${B.border};">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background:linear-gradient(135deg,${B.navy} 0%,${B.navyDark} 100%);padding:36px 32px 28px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background:${B.gold};border-radius:9px;width:36px;height:36px;text-align:center;vertical-align:middle;">
            <span style="font-size:18px;font-weight:800;color:${B.white};line-height:36px;">E</span>
          </td>
          <td style="padding-left:10px;vertical-align:middle;">
            <span style="font-size:20px;font-weight:800;color:${B.white};letter-spacing:-0.3px;">Fashion Aura</span>
          </td>
        </tr>
      </table>
      <h1 style="color:${B.white};font-size:24px;font-weight:800;margin:0 0 8px;line-height:1.2;">Order Confirmed! 🎉</h1>
      <p style="color:rgba(255,255,255,0.82);font-size:13px;margin:0 0 4px;line-height:1.6;">
        Thank you, <strong style="color:${B.white};">${firstName}</strong>! Your payment was successful and your order is being processed.
      </p>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">
        A confirmation copy has been sent to <strong style="color:${B.white};">${email}</strong>
      </p>
    </td>
  </tr>

  <!-- ── ITEMS ORDERED ── -->
  <tr><td style="padding:24px 24px 0;">
    <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;
                letter-spacing:0.07em;border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">
      Items Ordered
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="font-size:10px;font-weight:700;color:${B.textLight};text-align:left;padding-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Product</th>
        <th style="font-size:10px;font-weight:700;color:${B.textLight};text-align:center;padding-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Qty</th>
        <th style="font-size:10px;font-weight:700;color:${B.textLight};text-align:right;padding-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Price</th>
      </tr>
      ${itemRows}
    </table>
  </td></tr>

  <!-- ── PRICE SUMMARY ── -->
  <tr><td style="padding:16px 24px 20px;">
    <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:16px 18px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:5px 0;font-size:13px;color:${B.text};">Subtotal</td>
          <td style="padding:5px 0;font-size:13px;color:${B.navy};font-weight:600;text-align:right;">₹${parseFloat(subtotal || 0).toFixed(2)}</td>
        </tr>
        ${parsedTax > 0 ? `
        <tr>
          <td style="padding:5px 0;font-size:13px;color:${B.text};">GST (5%)</td>
          <td style="padding:5px 0;font-size:13px;color:${B.navy};text-align:right;">+₹${parsedTax.toFixed(2)}</td>
        </tr>` : ''}
        ${deliveryRow}
        ${couponRow}
        <tr><td colspan="2" style="padding:6px 0 4px;"><div style="border-top:1.5px solid ${B.border};"></div></td></tr>
        <tr>
          <td style="padding:6px 0;font-size:15px;font-weight:700;color:${B.navy};">Total Paid</td>
          <td style="padding:6px 0;font-size:18px;font-weight:800;color:${B.gold};text-align:right;">₹${parseFloat(total || 0).toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </td></tr>

  <!-- ── PAYMENT DETAILS ── -->
  <tr><td style="padding:0 24px 20px;">
    <div style="font-size:11px;font-weight:700;color:${B.navy};text-transform:uppercase;
                letter-spacing:0.07em;border-left:3px solid ${B.gold};padding-left:8px;margin-bottom:12px;">
      Payment Details
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0 8px;">
      <tr>
        <td width="50%" style="padding-right:6px;">
          <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
            <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Payment ID</div>
            <div style="font-size:11px;font-family:monospace;color:${B.gold};font-weight:600;word-break:break-all;">${paymentId}</div>
          </div>
        </td>
        <td width="50%" style="padding-left:6px;">
          <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
            <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Order ID</div>
            <div style="font-size:11px;font-family:monospace;color:${B.gold};font-weight:600;word-break:break-all;">${orderId}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding-right:6px;padding-top:8px;">
          <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
            <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Order Date</div>
            <div style="font-size:13px;color:${B.navy};font-weight:600;">${orderDate}</div>
          </div>
        </td>
        <td width="50%" style="padding-left:6px;padding-top:8px;">
          <div style="background:${B.ivory};border:1px solid ${B.border};border-radius:10px;padding:12px 14px;">
            <div style="font-size:11px;color:${B.textLight};font-weight:500;margin-bottom:4px;">Amount Paid</div>
            <div style="font-size:15px;color:${B.gold};font-weight:800;">₹${parseFloat(total || 0).toFixed(2)}</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ── BILLING ADDRESS ── -->
  ${billingBlock}

  <!-- ── CTA BUTTON ── -->
  <tr>
    <td style="padding:0 24px 28px;text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'https://Fashion Aura.in'}/orders"
         style="display:inline-block;background:linear-gradient(45deg,${B.navy},${B.gold});color:${B.white};
                font-size:14px;font-weight:700;padding:13px 32px;border-radius:50px;
                text-decoration:none;letter-spacing:0.2px;">
        View My Orders →
      </a>
    </td>
  </tr>

  <!-- ── SUPPORT ── -->
  <tr>
    <td style="padding:0 24px 28px;text-align:center;">
      <p style="font-size:12px;color:${B.textLight};margin:0;line-height:1.7;">
        Questions? Contact us at
        <a href="mailto:${process.env.EMAIL_USER}" style="color:${B.gold};font-weight:600;">${process.env.EMAIL_USER}</a>
      </p>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background:${B.navyDark};padding:18px 24px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
        <tr>
          <td style="background:${B.gold};border-radius:6px;width:24px;height:24px;text-align:center;vertical-align:middle;">
            <span style="font-size:12px;font-weight:800;color:${B.white};line-height:24px;">E</span>
          </td>
          <td style="padding-left:8px;vertical-align:middle;">
            <span style="font-size:14px;font-weight:700;color:${B.white};">Fashion Aura</span>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:rgba(255,255,255,0.55);margin:6px 0 0;">
        © ${year} Fashion Aura. All rights reserved.<br/>
        Thank you for shopping with us!
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
};

// ── Send Order Confirmation Email ──
exports.sendOrderConfirmationEmail = async ({ email, name, paymentId, orderId, items, subtotal, tax, delivery_charge, discount, total, coupon, billingAddress, phone, phone2 }) => {
  try {
    if (!email) { console.log('⚠️ No email provided for confirmation'); return; }
    console.log(`📧 Sending confirmation email → ${email}`);
    await transporter.sendMail({
      from:    `"Fashion Aura" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'Order Confirmed – Fashion Aura',
      html:    buildConfirmationHTML({ email, name, paymentId, orderId, items, subtotal, tax, delivery_charge, discount, total, coupon, billingAddress, phone, phone2 }),
    });
    console.log(`✅ Confirmation email sent → ${email}`);
  } catch (err) {
    console.error('❌ Confirmation email failed:', err.message);
    console.error('Full error:', err);
  }
};

// ── Send Order Status Update Email ──
exports.sendOrderStatusEmail = async (order, status, extra = {}) => {
  try {
    const template = statusTemplates[status];
    if (!template) { console.log(`⚠️ No email template for status: ${status}`); return; }
    if (!order.customer_email) { console.log(`⚠️ No customer email for Order #${order.id}`); return; }

    console.log(`📧 Sending email → ${order.customer_email} [${status}]`);
    await transporter.sendMail({
      from:    `"Fashion Aura" <${process.env.EMAIL_USER}>`,
      to:      order.customer_email,
      subject: template.subject,
      html:    buildEmailHTML(order, template, extra),
    });
    console.log(`✅ Email sent → ${order.customer_email} [${status}]`);
  } catch (err) {
    console.error(`❌ Email failed for Order #${order.id} (${status}):`, err.message);
    console.error('Full error:', err);
  }
};

// ── Send OTP Email (Password Reset) ──
exports.sendOtpEmail = async (email, otp) => {
  try {
    console.log(`📧 Sending OTP → ${email}`);
    
    // Attempt to extract first name from email if no name is provided
    const firstName = email.split('@')[0].replace(/[0-9]/g, '');
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    
    const formattedOtp = otp.toString().split('').join(' ');
    const path = require('path');
    await transporter.sendMail({
      from: `"Fashion Aura" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP – Fashion Aura',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <title>Password Reset OTP - Fashion Aura</title>
          <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;800&family=Raleway:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;800&family=Raleway:wght@400;500;600;700&display=swap');
            body, table, td, p, a, h1, h2, h3, h4, h5, h6 { font-family: 'Josefin Sans', Raleway, 'Century Gothic', sans-serif !important; }
          </style>
        </head>
        <body style="margin:0;padding:0;background:#FDFDFD;font-family:'Josefin Sans', Raleway, 'Century Gothic', sans-serif;-webkit-font-smoothing:antialiased;">
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFDFD;padding:32px 16px;">
            <tr><td align="center">
            
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #EAE4D6;">
              
              <!-- TOP BANNER -->
              <tr>
                <td style="background:#126354;padding:16px 16px 12px;text-align:center;">
                  <img src="https://nivintex.saitechnosolutions.in/assets/images/logo.png" alt="Fashion Aura" style="height:85px; display:inline-block;" />
                </td>
              </tr>
              
              <!-- MAIN CONTENT -->
              <tr>
                <td style="padding:40px 32px 32px;text-align:center;">
                  <div style="font-size:40px;margin-bottom:16px;">🔐</div>
                  
                  <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1A1A1A;">Hi ${capitalizedName},</h2>
                  <p style="margin:0 0 32px;font-size:14px;color:#6B6B8A;line-height:1.6;">
                    We received a request to reset your Fashion Aura account password.<br>Use the OTP below to proceed.
                  </p>
                  
                  <!-- OTP BOX -->
                  <table cellpadding="0" cellspacing="0" width="100%" style="max-width:320px;margin:0 auto;border:2px dashed #0f5447;border-radius:12px;background:#fff;">
                    <tr>
                      <td style="padding:24px 24px 20px;text-align:center;">
                        <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#8FA88A;letter-spacing:1px;text-transform:uppercase;">Your OTP Code</p>
                        <p style="margin:0 0 16px;font-size:36px;font-weight:800;color:#0f5447;letter-spacing:10px;">${formattedOtp}</p>
                        <p style="margin:0;font-size:12px;font-weight:600;color:#e74c3c;">⏱ Expires in 15 minutes</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- INFO CARDS -->
              <tr>
                <td style="padding:0 32px 32px;">
                  
                  <div style="background:#F8F9FA;border-radius:8px;padding:24px;margin-bottom:16px;text-align:left;">
                    <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1A1A1A;">Steps to reset your password:</h3>
                    <p style="margin:0 0 8px;font-size:13px;color:#6B6B8A;">1. Enter the OTP code on the verification page.</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#6B6B8A;">2. Create a new, strong password.</p>
                    <p style="margin:0;font-size:13px;color:#6B6B8A;">3. You'll be redirected to sign in automatically.</p>
                  </div>
                  
                  <div style="background:rgba(231, 76, 60, 0.08);border-left:4px solid #e74c3c;border-radius:4px;padding:16px;text-align:left;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#1A1A1A;">
                      <strong style="color:#e74c3c;">Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your account remains secure. Never share this OTP with anyone — Fashion Aura will never ask for it.
                    </p>
                  </div>
                  
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="padding:32px;text-align:center;border-top:1px solid #EAE4D6;">
                  <p style="margin:0 0 8px;font-size:12px;color:#6B6B8A;">Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color:#0f5447;text-decoration:none;font-weight:600;">${process.env.EMAIL_USER}</a></p>
                  <p style="margin:0;font-size:11px;color:#A0A0B0;">© ${new Date().getFullYear()} Fashion Aura. All rights reserved.</p>
                </td>
              </tr>
              
            </table>
            
            </td></tr>
          </table>
          
        </body>
        </html>
      `,
    });
    console.log(`✅ OTP email sent → ${email}`);
  } catch (err) {
    console.error('❌ OTP email failed:', err.message);
    throw err;
  }
};
