import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

const RefundCancellationPolicyPage = () => {
  return (
    <PolicyLayout
      title="Refund & Cancellation Policy"
      subtitle="Order Cancellation, Damaged Product Returns & Mandatory Parcel Opening Guidelines"
      badge="Order & Returns Policy"
      lastUpdated="October 2026"
    >
      <h2>1. Strict No-Cancellation Policy</h2>
      <p>
        At Fashion Aura, all orders are processed swiftly. Once your order has been placed and payment has been confirmed via Razorpay, our procurement, custom tailoring, cutting, and automated Shiprocket warehouse dispatch workflows begin immediately.
      </p>
      <ul>
        <li>
          <strong>No Cancellations Allowed:</strong> We strictly follow a <strong>Zero Cancellation Policy</strong>. Orders cannot be cancelled, revoked, or modified once successfully submitted.
        </li>
        <li>
          <strong>No Change-of-Mind Requests:</strong> We do not accept cancellation requests due to change of mind, duplicate orders placed by error, or personal reasons.
        </li>
        <li>
          Please verify your cart, garment selections, sizes, and recipient shipping address thoroughly prior to completing payment.
        </li>
      </ul>

      <h2>2. Mandatory Parcel Opening Video Requirement</h2>
      <p>
        To prevent fraudulent claims and ensure transparent courier accountability with our logistics partner Shiprocket, an <strong>uncut parcel opening / unboxing video is strictly compulsory</strong> to consider any return or refund:
      </p>
      <ol>
        <li>
          <strong>Record Before Opening:</strong> The video recording <strong>must begin before the courier package is cut, torn, or unsealed</strong>. The outer box or flyer must be shown from all sides to prove it is completely sealed and intact.
        </li>
        <li>
          <strong>Clear Shipping Label:</strong> The Shiprocket shipping label with your <strong>Name, Address, and Tracking/AWB Number</strong> must be clearly visible and legible in the video frame.
        </li>
        <li>
          <strong>Single Continuous Recording:</strong> The video must be a single, continuous, unedited recording from start to finish. <strong>Any video that is paused, edited, spliced, cropped, or recorded after the package was already opened will be rejected automatically.</strong>
        </li>
        <li>
          <strong>Clear View of Damage:</strong> Once the garment is taken out of the package, the camera must clearly capture and zoom into the physical damage, tear, or manufacturing flaw.
        </li>
      </ol>
      <p>
        <strong>Please Note:</strong> Claims submitted without this mandatory, uncut parcel opening video will <strong>not</strong> be entertained or approved under any circumstance.
      </p>

      <h2>3. Returns & Refunds (Damaged Products Only)</h2>
      <p>
        We take immense pride in our quality standards. Returns and refunds are strictly limited to verified transit damages or manufacturer defects:
      </p>
      <ul>
        <li>
          <strong>Only Damaged Products Eligible:</strong> We exclusively process returns and refunds for products received in a physically damaged or defective state.
        </li>
        <li>
          <strong>Non-Eligible Returns:</strong> We do not offer returns, replacements, or refunds for:
          <ul>
            <li>Size mismatches (please consult our detailed size chart before ordering).</li>
            <li>Subjective color variations (minor screen-to-fabric display variance).</li>
            <li>Change of mind, personal disliking of style or fabric drape.</li>
            <li>Items damaged due to rough handling, washing, or post-delivery alterations.</li>
            <li>Items purchased during clearance or flash sale promotions.</li>
          </ul>
        </li>
        <li>
          <strong>Reporting Deadline:</strong> Any damage must be reported within <strong>24 hours of delivery</strong> by sending the mandatory unboxing video to our WhatsApp at <strong>+91 96291 22122</strong> or email at <strong>Fashion Aura@gmail.com</strong>.
        </li>
      </ul>

      <h2>4. Refund Settlement via Razorpay</h2>
      <p>
        Once your damaged product claim and mandatory unboxing video are reviewed and approved by our quality control department:
      </p>
      <ul>
        <li>
          <strong>Return Verification:</strong> Return shipment is arranged via Shiprocket or return receipt is verified at our boutique within 24–48 working hours.
        </li>
        <li>
          <strong>Direct Source Refund:</strong> The full amount is credited electronically back to your original source payment method (UPI account, Credit/Debit card, or Net Banking) via <strong>Razorpay</strong> within <strong>5 to 7 business days</strong>.
        </li>
        <li>
          <strong>Bank Posting Time:</strong> While Razorpay initiates the credit immediately upon approval, individual issuing banks may take 5 to 7 working business days to reflect the balance on your account statement.
        </li>
      </ul>
    </PolicyLayout>
  );
};

export default RefundCancellationPolicyPage;
