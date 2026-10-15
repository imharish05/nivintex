import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

const TermsOfServicePage = () => {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      subtitle="Terms Governing the Use of Fashion Aura's Website, Products & Services"
      badge="Terms of Service"
      lastUpdated="October 2026"
    >
      <p>
        By accessing our website, browsing our collections, or purchasing any garments, you agree to comply with and be bound by the following Terms and Conditions. Please review them attentively prior to placing an order.
      </p>

      <h2>1. General Terms & Store Operations</h2>
      <p>
        This website is owned and operated by <strong>Fashion Aura</strong>. Throughout the site, the terms "we", "us", and "our" refer to Fashion Aura. By engaging with our site or completing a purchase, you participate in our "Service" and acknowledge that you are at least the age of majority in your jurisdiction.
      </p>

      <h2>2. Products, Fabric Descriptions & Pricing</h2>
      <p>
        We make every reasonable effort to display the colors, textures, and tailoring details of our products accurately. However, because actual colors depend on individual device screens, slight color variations between digital photography and physical fabric may occur.
      </p>
      <ul>
        <li>All product prices, descriptions, and promotional offers are subject to change without prior notice.</li>
        <li>We reserve the right to discontinue any garment design or restrict purchase quantities per individual customer or household where deemed necessary.</li>
      </ul>

      <h2>3. Payment Gateway & Razorpay Terms</h2>
      <p>
        Payment processing services for purchases on Fashion Aura are provided by <strong>Razorpay Software Private Limited</strong>:
      </p>
      <ul>
        <li>You agree to provide valid, up-to-date, and authorized payment credentials (UPI, credit/debit card, or net banking) when ordering.</li>
        <li>All card transactions are processed securely through Razorpay's PCI-DSS Level 1 compliant gateway.</li>
        <li><strong>Zero Cancellation Policy:</strong> Orders once placed and confirmed cannot be cancelled under any circumstances.</li>
        <li><strong>Returns & Refunds:</strong> Refunds are strictly limited to verified physically damaged products and require a mandatory, continuous, unedited parcel opening video.</li>
        <li>In the event of a payment deduction without an order confirmation, Razorpay's automated reconciliation protocol initiates a full refund back to the source account within 5–7 business days.</li>
      </ul>

      <h2>4. Logistics & Shiprocket Courier Terms</h2>
      <p>
        All domestic order fulfillments and doorstep deliveries are handled through our integrated logistics aggregator, <strong>Shiprocket</strong>:
      </p>
      <ul>
        <li>Dispatch occurs within 24–48 hours for ready items and 3–5 business days for bespoke items.</li>
        <li>You agree to provide a complete, accurate shipping address, landmark, and pin code. Incomplete addresses causing Return-to-Origin (RTO) may be subject to a reshipment fee of ₹200.</li>
        <li>Delivery milestones are tracked via Shiprocket AWB numbers issued to your contact details upon dispatch.</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        All content on this website—including brand logos, imagery, designs, text, and catalog graphics—is the intellectual property of Fashion Aura and is protected by Indian copyright and trademark statutes. Any unauthorized duplication, exploitation, or reproduction is strictly prohibited without explicit written consent.
      </p>

      <h2>6. Governing Law & Jurisdiction</h2>
      <p>
        These Terms and Conditions, as well as any separate agreements whereby we provide you Services, shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising in connection with these terms shall fall under the exclusive jurisdiction of the competent courts in <strong>Coimbatore, Tamil Nadu, India</strong>.
      </p>

      <h2>7. Questions & Contact Information</h2>
      <p>
        Questions regarding our Terms and Conditions should be directed to:
      </p>
      <p>
        <strong>Fashion Aura Legal Desk</strong><br />
        First floor, NSR Rd, Saibaba Colony, Kuppakonam Pudur,<br />
        Coimbatore, Tamil Nadu 641038 India<br />
        <strong>WhatsApp:</strong> +91 96291 22122<br />
        <strong>Email:</strong> Fashion Aura@gmail.com
      </p>
    </PolicyLayout>
  );
};

export default TermsOfServicePage;
