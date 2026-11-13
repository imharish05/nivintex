import { useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import Footer from "../../components/Footer";
import { contactApi } from "../../utils/api";
import {
  sanitizeIndianPhone,
  validateEmail,
  validateIndianPhone,
  validateName,
} from "../../utils/formValidation";





const F = {
  main: "'Josefin Sans', 'Raleway', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

const Contact = () => {
  const navigate = useNavigate();

  const [submitted,   setSubmitted]   = useState(false);
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form,        setForm]        = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((errs) => (errs[key] ? { ...errs, [key]: '' } : errs));
    setError('');
  };

  const handlePhoneChange = (e) => {
    const val = sanitizeIndianPhone(e.target.value);
    setForm((f) => ({ ...f, phone: val }));
    setFieldErrors((errs) => (errs.phone ? { ...errs, phone: '' } : errs));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = sanitizeIndianPhone(form.phone);
    const subject = form.subject.trim();
    const message = form.message.trim();

    const errs = {};
    const nameErr = validateName(name, 'Full name');
    if (nameErr) errs.name = nameErr;
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validateIndianPhone(phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!subject) {
      errs.subject = 'Please enter a subject.';
    } else if (subject.length < 2) {
      errs.subject = 'Subject must be at least 2 characters.';
    }
    if (!message) {
      errs.message = 'Please enter your message.';
    } else if (message.length < 5) {
      errs.message = 'Message must be at least 5 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(Object.values(errs)[0]);
      return;
    }

    setFieldErrors({});
    setSending(true);
    setError('');
    try {
      await contactApi.send({ name, email, phone, subject, message });
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cp-root {
          font-family: ${F.sub};
          background: #EAF0E2;
          min-height: 100vh;
        }

        .cp-top-gap { height: 8px; }
        @media (max-width: 600px) {
          .cp-body { padding: 0 14px 50px !important; }
          .cp-breadcrumb { font-size: 16px; margin-bottom: 12px; }
          .cp-top-row { padding-bottom: 12px; margin-bottom: 16px; }
        }

        .cp-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        .cp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 0 0 22px;
          color: #52615B;
          font-size: 18px;
          letter-spacing: .5px;
          font-family: ${F.sub};
        }
        .cp-breadcrumb a {
          color: #0f5447;
          text-decoration: none;
          font-weight: 600;
          transition: color .2s ease;
        }
        .cp-breadcrumb a:hover { color: #8A5B16; text-decoration: underline; }
        .cp-breadcrumb [aria-current="page"] { color: #20332C; font-weight: 600; }

        /* ── Page Heading (matches Orders page) ── */
        .cp-top-row {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 0 0 12px;
          border-bottom: 1px solid #D9E2D6;
        }
        .cp-heading-line {
          display: none;
          flex-shrink: 0;
        }
        .cp-heading {
          margin: 0;
          font-size: clamp(28px, 4vw, 34px);
          font-weight: 400;
          color: #0f5447;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-family: ${F.main};
        }
        .cp-sub-head {
          margin: 7px 0 0;
          font-size: 14px;
          color: #52615B;
          letter-spacing: .3px;
          font-weight: 400;
          font-family: ${F.sub};
        }
        .cp-section-label {
          font-size: 10px;
          font-weight: 400;
          color: #C9933A;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-family: ${F.main};
          margin-bottom: 10px;
        }

        /* ── Main Grid ── */
        .cp-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 28px;
          margin-bottom: 50px;
        }

        /* ── Reach Us Card ── */
        .cp-info {
          background: #0f5447;
          border-radius: 12px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
        }
        .cp-info::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 140px; height: 140px;
          border-radius: 50%;
          border: 1px solid rgba(201,147,58,0.15);
        }
        .cp-info::before {
          content: '';
          position: absolute;
          bottom: -20px; right: -20px;
          width: 90px; height: 90px;
          border-radius: 50%;
          border: 1px solid rgba(201,147,58,0.25);
        }
        .cp-info-heading {
          font-family: ${F.main};
          font-size: 20px;
          font-weight: 300;
          color: #F8F4EE;
          margin-bottom: 4px;
          letter-spacing: 5px;
          text-transform: uppercase;
        }
        .cp-info-sub {
          font-size: 11px;
          color: rgba(248,244,238,0.45);
          margin-bottom: 28px;
          font-weight: 200;
          letter-spacing: 2px;
          font-family: ${F.sub};
          text-transform: uppercase;
        }
        .cp-info-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 22px;
        }
        .cp-info-icon {
          width: 36px; height: 36px;
          border-radius: 0px;
          background: rgba(201,147,58,0.12);
          border: 1px solid rgba(201,147,58,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: #C9933A;
          font-size: 15px;
        }
        .cp-info-label {
          font-size: 9px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #C9933A;
          margin-bottom: 3px;
          font-weight: 400;
          font-family: ${F.main};
        }
        .cp-info-value {
          font-size: 12px;
          color: rgba(248,244,238,0.75);
          line-height: 1.6;
          font-weight: 200;
          font-family: ${F.sub};
          letter-spacing: 0.5px;
        }
        .cp-info-value a {
          color: inherit;
          text-decoration: none;
        }
        .cp-info-value a:hover {
          color: #C9933A;
          text-decoration: underline;
        }
        .cp-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.07);
          margin: 24px 0;
        }
        .cp-follow-label {
          font-size: 9px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #C9933A;
          margin-bottom: 12px;
          font-family: ${F.main};
          font-weight: 400;
        }
        .cp-social-row {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .cp-soc {
          width: 32px; height: 32px;
          border-radius: 0px;
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          color: rgba(248,244,238,0.5);
          font-size: 12px;
          text-decoration: none;
          transition: all 0.25s;
        }
        .cp-soc:hover {
          border-color: #C9933A;
          color: #C9933A;
          background: rgba(201,147,58,0.08);
        }

        /* ── Send Message Card ── */
        .cp-form-panel {
          background: #fff;
          border-radius: 12px;
          padding: 32px 32px;
          border: 1px solid #EAE4D6;
          box-shadow: 0 2px 12px rgba(31,92,68,0.06);
        }
        .cp-form-heading {
          font-family: ${F.main};
          font-size: 22px;
          font-weight: 300;
          color: #0f5447;
          margin-bottom: 4px;
          letter-spacing: 5px;
          text-transform: uppercase;
        }
        .cp-form-sub {
          font-size: 12px;
          color: #6B6B8A;
          margin-bottom: 28px;
          font-weight: 200;
          letter-spacing: 1.5px;
          font-family: ${F.sub};
        }
        .cp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .cp-field { display: flex; flex-direction: column; gap: 6px; }
        .cp-label {
          font-size: 9px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #0f5447;
          font-weight: 400;
          font-family: ${F.main};
        }
        .cp-input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #EAE4D6;
          border-radius: 0px;
          background: #F4F0E8;
          font-family: ${F.sub};
          font-size: 12px;
          color: #0f5447 !important;
          outline: none;
          transition: all 0.25s;
          font-weight: 400;
          letter-spacing: 0.5px;
        }
        .cp-input:focus {
          border-color: #C9933A !important;
          background: #fff !important;
          color: #0f5447 !important;
          box-shadow: 0 0 0 3px rgba(201,147,58,0.08);
        }
        .cp-input::placeholder {
          color: #9BBFB3;
          font-weight: 300;
          font-family: ${F.sub};
        }
        .cp-input::selection,
        .cp-textarea::selection {
          background: #C9933A;
          color: #ffffff;
        }
        .cp-input::-moz-selection,
        .cp-textarea::-moz-selection {
          background: #C9933A;
          color: #ffffff;
        }
        .cp-input:-webkit-autofill,
        .cp-input:-webkit-autofill:hover,
        .cp-input:-webkit-autofill:focus,
        .cp-input:-webkit-autofill:active {
          -webkit-text-fill-color: #0f5447 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .cp-textarea { resize: none; min-height: 100px; }
        .cp-input-error {
          border-color: #c0392b !important;
          background: #fff8f7 !important;
        }
        .cp-field-error {
          font-size: 11px;
          color: #c0392b;
          font-family: ${F.sub};
          font-weight: 400;
          margin-top: 2px;
        }

        .cp-submit { margin-top: 24px; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
        .cp-btn {
          background: #0f5447;
          color: #fff;
          border: none;
          min-height: 44px;
          padding: 12px 28px;
          border-radius: 8px;
          font-family: ${F.main};
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .cp-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #C9933A;
          transform: translateX(-100%);
          transition: transform 0.35s ease;
        }
        .cp-btn:hover::before { transform: translateX(0); }
        .cp-btn span { position: relative; z-index: 1; }
        .cp-btn:hover { box-shadow: 0 6px 18px rgba(201,147,58,0.3); }

        .cp-sent {
          font-size: 11px;
          color: #0f5447;
          font-weight: 300;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: ${F.main};
          animation: fadeInUp 0.4s ease;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Feature Cards ── */
        .cp-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 50px;
        }
        .cp-feat {
          background: #fff;
          border: 1px solid #EAE4D6;
          border-radius: 0px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: box-shadow 0.3s, transform 0.3s;
          box-shadow: 0 2px 12px rgba(31,92,68,0.06);
        }
        .cp-feat:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(31,92,68,0.08);
        }
        .cp-feat-icon {
          width: 40px; height: 40px;
          border-radius: 0px;
          background: #F4F0E8;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .cp-feat h3 {
          font-family: ${F.main};
          font-size: 13px;
          font-weight: 400;
          color: #0f5447;
          margin-bottom: 3px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .cp-feat p {
          font-size: 11px;
          color: #6B6B8A;
          line-height: 1.5;
          font-weight: 200;
          font-family: ${F.sub};
          letter-spacing: 0.5px;
        }

        .cp-map {
          border-radius: 0px;
          overflow: hidden;
          border: 1px solid #EAE4D6;
          box-shadow: 0 2px 12px rgba(31,92,68,0.05);
        }

        @media (max-width: 900px) {
          .cp-grid { grid-template-columns: 1fr; gap: 24px; }
          .cp-features { grid-template-columns: 1fr; gap: 14px; }
          .cp-row { grid-template-columns: 1fr; gap: 14px; }
          .cp-form-panel { padding: 28px 24px; }
          .cp-info { padding: 28px 24px; }
          .cp-top-gap { height: 8px; }
          .cp-body { padding: 0 20px 60px; }
          .cp-input { font-size: 16px; }
        }
        @media (max-width: 480px) {
          .cp-top-gap { height: 6px; }
          .cp-form-panel { padding: 20px 14px; }
          .cp-info { padding: 20px 14px; }
          .cp-body { padding: 0 14px 40px; }
          .cp-input { font-size: 16px; }
          .cp-map iframe { height: 300px !important; }
          .cp-top-row { margin-bottom: 14px; }
          .cp-section-label { margin-bottom: 8px; }
          .cp-grid { gap: 18px; }
        }
      `}</style>

      <div className="cp-root">
        <div className="cp-top-gap"></div>

        <div className="cp-body">
          {/* ── Page Heading (matches Orders page style) ── */}
          <div className="cp-top-row">
            <span className="cp-heading-line" />
            <div>
              <h1 className="cp-heading">Contact Us</h1>
              <p className="cp-sub-head">We respond within 24 hours</p>
            </div>
          </div>

          <p className="cp-section-label">Get In Touch</p>

          {/* ── Main Grid ── */}
          <div className="cp-grid">
            <div className="cp-info">
              <div className="cp-info-heading">Reach Us</div>
              <div className="cp-info-sub">Always here to help</div>
                            {[
                { icon: "fa-solid fa-phone", label: "Phone", href: "tel:+919629122122", value: "+91 96291 22122" },
                // { icon: "fa-regular fa-envelope", label: "Email", href: "mailto:Fashion%20Aura@gmail.com", value: "Fashion Aura@gmail.com" },
              ].map(({ icon, label, href, value }) => (
                <div className="cp-info-item" key={label}>
                  <div className="cp-info-icon"><i className={icon} /></div>
                  <div>
                    <div className="cp-info-label">{label}</div>
                    <div className="cp-info-value"><a href={href} style={{ display: 'inline-block', padding: '4px 0' }}>{value}</a></div>
                  </div>
                </div>
              ))}


              {[
                { icon: "fa-solid fa-location-dot", label: "Address",       value: "Fashion Aura\nFirst floor, NSR Rd, Saibaba Colony,\nKuppakonam Pudur, Coimbatore,\nTamil Nadu 641038 India" },
                { icon: "fa-regular fa-clock", label: "Working Hours", value: "Monday – Saturday\n9:00 AM – 7:00 PM" },
              ].map(({ icon, label, value }) => (
                <div className="cp-info-item" key={label}>
                  <div className="cp-info-icon"><i className={icon} /></div>
                  <div>
                    <div className="cp-info-label">{label}</div>
                    <div className="cp-info-value" style={{ whiteSpace: "pre-line" }}>{value}</div>
                  </div>
                </div>
              ))}
              <hr className="cp-divider" />

              <div className="cp-follow-label">Follow Us</div>
              <div className="cp-social-row">
                <a
                  href="https://www.instagram.com/fashionaura25/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cp-soc"
                  aria-label="Instagram"
                >
                  <i className="fa-brands fa-instagram"></i>
                </a>
              </div>
            </div>

            <div className="cp-form-panel">
              <div className="cp-form-heading">Send a Message</div>
              <div className="cp-form-sub">Our team will get back to you shortly.</div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="cp-row">
                  <div className="cp-field">
                    <label className="cp-label">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya"
                      className={`cp-input ${fieldErrors.name ? 'cp-input-error' : ''}`}
                      value={form.name}
                      onChange={setField('name')}
                      aria-invalid={fieldErrors.name ? 'true' : 'false'}
                      required
                    />
                    {fieldErrors.name && <span className="cp-field-error" role="alert">{fieldErrors.name}</span>}
                  </div>
                  <div className="cp-field">
                    <label className="cp-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className={`cp-input ${fieldErrors.email ? 'cp-input-error' : ''}`}
                      value={form.email}
                      onChange={setField('email')}
                      aria-invalid={fieldErrors.email ? 'true' : 'false'}
                      required
                    />
                    {fieldErrors.email && <span className="cp-field-error" role="alert">{fieldErrors.email}</span>}
                  </div>
                </div>

                <div className="cp-field" style={{ marginBottom: 16 }}>
                  <label className="cp-label">Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    className={`cp-input ${fieldErrors.phone ? 'cp-input-error' : ''}`}
                    value={form.phone}
                    onChange={handlePhoneChange}
                    aria-invalid={fieldErrors.phone ? 'true' : 'false'}
                    required
                  />
                  {fieldErrors.phone && <span className="cp-field-error" role="alert">{fieldErrors.phone}</span>}
                </div>

                <div className="cp-field" style={{ marginBottom: 16 }}>
                  <label className="cp-label">Subject</label>
                  <input
                    type="text"
                    placeholder="How can we help you?"
                    className={`cp-input ${fieldErrors.subject ? 'cp-input-error' : ''}`}
                    value={form.subject}
                    onChange={setField('subject')}
                    aria-invalid={fieldErrors.subject ? 'true' : 'false'}
                    required
                  />
                  {fieldErrors.subject && <span className="cp-field-error" role="alert">{fieldErrors.subject}</span>}
                </div>

                <div className="cp-field">
                  <label className="cp-label">Message</label>
                  <textarea
                    placeholder="Write your message here..."
                    className={`cp-input cp-textarea ${fieldErrors.message ? 'cp-input-error' : ''}`}
                    value={form.message}
                    onChange={setField('message')}
                    aria-invalid={fieldErrors.message ? 'true' : 'false'}
                    required
                  />
                  {fieldErrors.message && <span className="cp-field-error" role="alert">{fieldErrors.message}</span>}
                </div>

                <div className="cp-submit">
                  <button type="submit" className="cp-btn" disabled={sending}>
                    <span>{sending ? 'Sending…' : 'Send Message →'}</span>
                  </button>
                  {error && <span className="cp-sent" role="alert" style={{ color: '#c0392b' }}>{error}</span>}
                  {submitted && <span className="cp-sent">✓ Sent successfully</span>}
                </div>
              </form>
            </div>
          </div>

          {/* ── Feature Cards ── */}
          <div className="cp-features">
            {[
              { icon: "fa-solid fa-truck-fast",   title: "Fast Delivery",   desc: "Quick & reliable shipping across India" },
              { icon: "fa-solid fa-headset",      title: "24/7 Support",    desc: "Dedicated support team always ready" },
              { icon: "fa-solid fa-shield-halved",title: "Secure Payments", desc: "Protected & trusted payment methods" },
            ].map(({ icon, title, desc }) => (
              <div className="cp-feat" key={title}>
                <div className="cp-feat-icon"><i className={icon} style={{ color: '#0f5447' }} /></div>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Map ── */}
          <div className="cp-map">
            <iframe
              title="Fashion Aura Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14889.73152042209!2d76.9297349!3d11.023363750000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859689cb33935%3A0x243177f5b51ed5c9!2sFashion%20aura!5e1!3m2!1sen!2sin!4v1790766815994!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Contact;
