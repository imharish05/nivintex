import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

const PaymentPolicyPage = () => {
  return (
    <PolicyLayout
      title="Payment Policy"
      subtitle="Secure Payment Processing Powered by Razorpay · Bank-Grade Encryption"
      badge="Payments & Security"
      lastUpdated="October 2026"
    >
      <p>
        Fashion Aura has integrated with <strong>Razorpay Software Private Limited</strong>, India's leading RBI-authorized payment aggregator, to provide a fast, reliable, and secure checkout experience.
      </p>

      <h2>1. Accepted Payment Methods</h2>
      <p>
        We support a comprehensive array of digital payment channels via the Razorpay checkout portal:
      </p>
      <ul>
        <li>
          <strong>UPI Instant Pay:</strong> Google Pay, PhonePe, Paytm, BHIM, CRED UPI, Amazon Pay, or any bank UPI application with zero transaction surcharge.
        </li>
        <li>
          <strong>Credit & Debit Cards:</strong> Visa, MasterCard, RuPay, Maestro, and American Express with two-factor 3D Secure OTP verification.
        </li>
        <li>
          <strong>Net Banking:</strong> Direct internet banking integration with 50+ leading Indian banks including HDFC, ICICI, SBI, Axis, Kotak Mahindra, and Punjab National Bank.
        </li>
        <li>
          <strong>Digital Wallets:</strong> Major Indian digital wallets including Paytm, Mobikwik, and Freecharge.
        </li>
      </ul>

      <h2>2. Transaction Security & Data Privacy</h2>
      <p>
        Your financial data is protected with bank-grade security standards:
      </p>
      <ul>
        <li>
          <strong>PCI-DSS Level 1 Certified:</strong> Razorpay complies with the highest global Payment Card Industry Data Security Standards.
        </li>
        <li>
          <strong>Zero Card Data Storage:</strong> Fashion Aura <strong>never</strong> stores or accesses your full card numbers, CVVs, UPI PINs, or banking passwords on our servers. All sensitive data is transmitted directly to Razorpay's encrypted banking infrastructure.
        </li>
        <li>
          <strong>256-Bit SSL Encryption:</strong> All communications between your device and the payment gateway are encrypted end-to-end.
        </li>
        <li>
          <strong>Two-Factor Authentication:</strong> Card transactions mandate dynamic One-Time Password (OTP) verification through your respective issuing bank.
        </li>
      </ul>

      <h2>3. Payment Confirmation & Invoicing</h2>
      <p>
        Upon successful payment authorization:
      </p>
      <ul>
        <li>An instant on-screen order confirmation featuring your unique <strong>Order ID</strong> and <strong>Razorpay Payment ID</strong> (e.g. <code>pay_XXXXXXXXXX</code>) will be displayed.</li>
        <li>An automated order confirmation and itemized tax invoice will be sent to your registered email and phone number.</li>
        <li>Your order will instantly progress to warehouse fulfillment and dispatch via <strong>Shiprocket</strong>.</li>
      </ul>

      <h2>4. Failed Transactions & Double Debit Resolution</h2>
      <p>
        In rare instances where money is debited from your bank account or card but you do not receive an order confirmation due to a temporary network drop or banking server timeout:
      </p>
      <ul>
        <li>
          <strong>Automated Bank Reconciliation:</strong> Razorpay's auto-reconciliation engine detects incomplete transactions and initiates an automatic refund back to your source account.
        </li>
        <li>
          <strong>Turnaround Time:</strong> Funds are typically restored by your bank within <strong>5 to 7 business days</strong> (depending on your bank's NEFT/IMPS/UPI clearance cycle).
        </li>
        <li>
          <strong>Support Assistance:</strong> If your funds have not returned within 7 business days, email us at <strong>Fashion Aura@gmail.com</strong> or WhatsApp us at <strong>+91 96291 22122</strong> with your bank transaction reference ID, and our team will resolve it directly with Razorpay.
        </li>
      </ul>

      <h2>5. Pricing, Currency & Taxes</h2>
      <p>
        All prices across the Fashion Aura online catalog are in <strong>Indian National Rupees (INR - ₹)</strong> and inclusive of all applicable Goods and Services Tax (GST). Delivery charges, if applicable, are clearly computed and declared at checkout prior to final payment submission.
      </p>
    </PolicyLayout>
  );
};

export default PaymentPolicyPage;
