import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

const ContactInformationPage = () => {
  return (
    <PolicyLayout
      title="Contact Information"
      subtitle="Reach Our Customer Care, Boutique Concierge & Administrative Team"
      badge="Customer Support"
      lastUpdated="October 2026"
    >
      <p>
        Whether you have questions regarding an upcoming order, need sizing recommendations, or wish to inquire about our bespoke collections, our team is readily available.
      </p>

      <h2>1. Boutique Store Address</h2>
      <p>
        <strong>Fashion Aura</strong><br />
        First floor, NSR Rd, Saibaba Colony, Kuppakonam Pudur,<br />
        Coimbatore, Tamil Nadu 641038 India
      </p>

      <h2>2. Phone & WhatsApp Support</h2>
      <p>
        Direct Line / WhatsApp: <a href="https://wa.me/919629122122" target="_blank" rel="noopener noreferrer" style={{ color: '#0f5447', fontWeight: 'bold' }}>+91 96291 22122</a><br />
        <span>Available Monday to Saturday, 9:00 AM – 7:00 PM IST</span>
      </p>

      <h2>3. Instagram Concierge</h2>
      <p>
        Direct Message: <a href="https://www.instagram.com/fashionaura25/" target="_blank" rel="noopener noreferrer" style={{ color: '#0f5447', fontWeight: 'bold' }}>@fashionaura25</a><br />
        <span>For quick inquiries, styling advice, and latest collection drops</span>
      </p>

      <h2>4. Email Inquiries</h2>
      <p>
        Customer Inquiries & Support: <strong>Fashion Aura@gmail.com</strong><br />
        <span>Average response time within 24 business hours</span>
      </p>

      <h2>5. Store Hours & Availability</h2>
      <ul>
        <li><strong>Monday to Saturday:</strong> 9:00 AM – 7:00 PM IST</li>
        <li><strong>Sundays:</strong> Retail showroom open for walk-ins; online courier dispatches resume Monday</li>
        <li><strong>Public Holidays:</strong> Online orders processed on the subsequent working business day</li>
      </ul>

      <h2>6. Tracking Inquiries</h2>
      <p>
        For orders in transit via our logistics partner <strong>Shiprocket</strong>, please keep your <strong>Order ID</strong> or <strong>Shiprocket AWB Number</strong> handy when contacting us for fast tracking updates.
      </p>
    </PolicyLayout>
  );
};

export default ContactInformationPage;
