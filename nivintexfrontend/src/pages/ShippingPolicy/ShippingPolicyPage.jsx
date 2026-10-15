import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

const ShippingPolicyPage = () => {
  return (
    <PolicyLayout
      title="Shipping & Delivery Policy"
      subtitle="Nationwide Express Logistics & Doorstep Fulfillment Powered by Shiprocket"
      badge="Logistics & Delivery"
      lastUpdated="October 2026"
    >
      <p>
        Fashion Aura partners with <strong>Shiprocket</strong>, India's leading automated logistics platform, connecting our fulfillment warehouse directly with premier courier networks including <strong>Blue Dart, Delhivery, DTDC, Shadowfax, Xpressbees, Ekart, and India Post Speed Post</strong> across 29,000+ pin codes nationwide.
      </p>

      <h2>1. Order Processing & Dispatch Timelines</h2>
      <p>
        Because portions of our designer women's wear line are crafted and tailored on a Made-to-Order basis:
      </p>
      <ul>
        <li>
          <strong>Ready-to-Ship Collections:</strong> Inspected, custom packaged, and dispatched into the Shiprocket courier network within <strong>24 to 48 business hours</strong>.
        </li>
        <li>
          <strong>Bespoke & Made-to-Order Collections:</strong> Tailored to individual measurements and dispatched within <strong>3 to 5 business days</strong>.
        </li>
        <li>
          <strong>Operating Schedule:</strong> Dispatches occur Monday through Saturday (excluding public and national holidays).
        </li>
      </ul>

      <h2>2. Real-Time Order Tracking via Shiprocket AWB</h2>
      <p>
        Upon package dispatch from our Coimbatore facility:
      </p>
      <ul>
        <li>Shiprocket automatically generates a unique <strong>Air Waybill (AWB) Tracking Number</strong>.</li>
        <li>You will immediately receive an automated SMS, WhatsApp alert, and Email containing the direct real-time tracking link.</li>
        <li>You can monitor real-time delivery milestones from dispatch to doorstep delivery, or track live within your <strong>Fashion Aura Account</strong> under the "My Orders" tab.</li>
      </ul>

      <h2>3. Shipping Charges</h2>
      <ul>
        <li>
          <strong>Domestic Orders:</strong> Shipping charges are calculated dynamically at checkout based on package weight and destination pin code via Shiprocket. Promotional free shipping applies automatically on eligible cart totals.
        </li>
        <li>
          <strong>International Orders:</strong> Assessed according to cumulative parcel weight and destination international country zones.
        </li>
      </ul>

      <h2>4. Delivery Attempts & Verification</h2>
      <ul>
        <li>Couriers make up to <strong>3 delivery attempts</strong> before returning parcels to our Coimbatore hub.</li>
        <li>To safeguard high-value apparel, courier personnel may request an <strong>OTP verification</strong> sent to your registered mobile phone before releasing the parcel.</li>
        <li><strong>Address Accuracy:</strong> An incorrect or incomplete address that results in Return-to-Origin (RTO) by the courier may incur a reshipment fee of <strong>₹200</strong>.</li>
      </ul>

      <h2>5. Damaged Packaging & Mandatory Parcel Opening Video</h2>
      <p>
        If the outer courier bag or carton appears torn, crushed, or tampered with:
      </p>
      <ul>
        <li><strong>Refusal of Delivery:</strong> You have the right to refuse delivery and mark "Tampered packaging" on the courier device.</li>
        <li><strong>Mandatory Opening Video:</strong> If accepted, an <strong>uncut, continuous 360° parcel opening video</strong> showing the intact Shiprocket shipping label and the unboxing process is strictly mandatory to claim transit damage or defects.</li>
        <li>Notify our support team within <strong>24 hours of delivery</strong> via WhatsApp at <strong>+91 96291 22122</strong> or email at <strong>Fashion Aura@gmail.com</strong>.</li>
      </ul>

      <h2>6. International Customs & Duties</h2>
      <p>
        For orders dispatched outside India, any local import duties, tariffs, or clearance taxes levied by the recipient country's government remain the responsibility of the customer.
      </p>
    </PolicyLayout>
  );
};

export default ShippingPolicyPage;
