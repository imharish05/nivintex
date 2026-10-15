import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

const PrivacyPolicyPage = () => {
  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="How Fashion Aura Safeguards, Manages & Respects Your Personal Data"
      badge="Privacy & Data Protection"
      lastUpdated="October 2026"
    >
      <p>
        This Privacy Policy explains how <strong>Fashion Aura</strong> ("we", "us", or "our") collects, protects, utilizes, and manages personal data collected through our e-commerce platform and services.
      </p>

      <h2>1. Personal Information We Collect</h2>
      <p>
        When you browse our storefront, create an account, or place an order, we may collect:
      </p>
      <ul>
        <li>
          <strong>Contact Information:</strong> Your full name, delivery address, billing address, active mobile phone number, and email address.
        </li>
        <li>
          <strong>Order & Transaction Records:</strong> Purchased garments, sizes, cart items, wishlist selections, shipping preferences, and Razorpay transaction identifier codes.
        </li>
        <li>
          <strong>Technical & Device Data:</strong> IP address, browser type, device identifiers, and browsing activity collected automatically through standard secure cookies to ensure smooth website performance.
        </li>
      </ul>

      <h2>2. Authorized Third-Party Service Providers (Razorpay & Shiprocket)</h2>
      <p>
        Fashion Aura partners only with certified, reputable enterprise service providers strictly necessary to execute our retail contract with you:
      </p>
      <ul>
        <li>
          <strong>Razorpay (Payment Gateway):</strong> All card numbers, UPI handles, and banking credentials are processed directly by <strong>Razorpay Software Private Limited</strong> via PCI-DSS Level 1 compliant bank channels. Fashion Aura never stores your sensitive payment credentials.
        </li>
        <li>
          <strong>Shiprocket (Logistics & Delivery):</strong> Your name, shipping address, and phone number are securely shared with <strong>Shiprocket</strong> and assigned courier partners solely for dispatch, real-time AWB tracking, and doorstep parcel delivery.
        </li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>
        We utilize collected customer information solely for legitimate retail business purposes:
      </p>
      <ul>
        <li>To fulfill, pack, invoice, and dispatch your orders.</li>
        <li>To provide real-time automated SMS and WhatsApp delivery tracking milestones via Shiprocket.</li>
        <li>To process verified returns, refunds, or billing inquiries via Razorpay.</li>
        <li>To detect, investigate, and prevent fraudulent transactions or unauthorized access.</li>
        <li>To send periodic styling tips or promotional updates (only where you have explicitly opted in).</li>
      </ul>

      <h2>4. Data Security & Storage</h2>
      <p>
        We employ robust technical safeguards including 256-bit SSL transport layer encryption, secure database access tokens, and industry-standard security firewalls. While we implement bank-grade standards, we also encourage customers to keep their login passwords confidential and avoid sharing OTPs.
      </p>

      <h2>5. Your Rights & Choices</h2>
      <p>
        You have the right to access, rectify, or request deletion of your personal account data at any time. To update your profile or request removal from promotional newsletters, contact us at <strong>Fashion Aura@gmail.com</strong>.
      </p>

      <h2>6. Official Store Address & Legal Contact</h2>
      <p>
        For any privacy or data protection inquiries, you may reach us directly at:
      </p>
      <p>
        <strong>Fashion Aura</strong><br />
        First floor, NSR Rd, Saibaba Colony, Kuppakonam Pudur,<br />
        Coimbatore, Tamil Nadu 641038 India<br />
        <strong>Phone / WhatsApp:</strong> +91 96291 22122<br />
        <strong>Email:</strong> Fashion Aura@gmail.com
      </p>
    </PolicyLayout>
  );
};

export default PrivacyPolicyPage;
