import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from './Footer';

const PolicyLayout = ({ title, subtitle, badge, lastUpdated, children }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <style>{`
        .plc-minimal-root {
          background-color: #ffffff;
          min-height: 100vh;
          color: #2c382f;
          font-family: 'Raleway', 'Josefin Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 50px 0 70px;
        }

        .plc-minimal-wrap {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Minimal Header ── */
        .plc-min-header {
          margin-bottom: 38px;
          padding-bottom: 22px;
          border-bottom: 1px solid #EAE4D6;
        }

        .plc-min-badge {
          display: inline-block;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #C9933A;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .plc-min-title {
          font-family: 'Cormorant Garamond', 'Playfair Display', serif;
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 600;
          color: #0f5447;
          margin: 0 0 8px;
          letter-spacing: 0.3px;
          line-height: 1.25;
        }

        .plc-min-sub {
          color: #6B7A6B;
          font-size: 14.5px;
          font-weight: 300;
          line-height: 1.6;
          margin: 0 0 8px;
        }

        .plc-min-updated {
          color: #8C998C;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-family: 'Josefin Sans', sans-serif;
        }

        /* ── Minimal Content Flow ── */
        .plc-content {
          font-size: 15px;
          line-height: 1.9;
          color: #38483B;
          font-weight: 300;
        }

        .plc-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 23px;
          font-weight: 600;
          color: #0f5447;
          margin: 36px 0 12px;
          letter-spacing: 0.3px;
        }

        .plc-content h2:first-of-type {
          margin-top: 0;
        }

        .plc-content h3 {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: #0f5447;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 24px 0 8px;
        }

        .plc-content p {
          margin-bottom: 14px;
        }

        .plc-content strong {
          color: #1a291e;
          font-weight: 600;
        }

        .plc-content ul, .plc-content ol {
          padding-left: 20px;
          margin-bottom: 20px;
        }

        .plc-content li {
          margin-bottom: 8px;
          line-height: 1.8;
        }

        /* ── Minimal Clean Table ── */
        .plc-min-table-wrap {
          overflow-x: auto;
          margin: 22px 0 28px;
        }

        .plc-min-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          text-align: left;
        }

        .plc-min-table th {
          border-bottom: 2px solid #0f5447;
          padding: 10px 12px;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #0f5447;
          font-weight: 600;
        }

        .plc-min-table td {
          padding: 12px;
          border-bottom: 1px solid #EAE4D6;
          color: #38483B;
        }

        .plc-min-table tr:hover td {
          background: #FAF8F5;
        }

        /* ── Minimal Clean Note ── */
        .plc-min-note {
          padding: 14px 18px;
          border-left: 3px solid #C9933A;
          background: #FAF8F5;
          margin: 20px 0;
          font-size: 14px;
          line-height: 1.7;
          color: #4A564C;
        }

        .plc-min-divider {
          border: none;
          border-top: 1px solid #EAE4D6;
          margin: 44px 0 28px;
        }

        /* ── Minimal Support Section ── */
        .plc-min-support {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          padding-top: 8px;
        }

        .plc-min-support-text h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          color: #0f5447;
          margin: 0 0 4px;
          font-weight: 600;
        }

        .plc-min-support-text p {
          margin: 0;
          font-size: 13px;
          color: #6B7A6B;
        }

        .plc-min-support-links {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .plc-min-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 3px;
          font-size: 11.5px;
          font-family: 'Josefin Sans', sans-serif;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-decoration: none;
          line-height: 1;
          vertical-align: middle;
          transition: all 0.2s ease;
        }

        .plc-min-btn.wa {
          background: #25D366;
          color: #ffffff;
        }
        .plc-min-btn.wa:hover {
          background: #20BA5A;
          color: #ffffff;
        }

        .plc-min-btn.ig {
          background: #E1306C;
          color: #ffffff;
        }
        .plc-min-btn.ig:hover {
          background: #C1275B;
          color: #ffffff;
        }

        .plc-min-btn.contact {
          background: #0f5447;
          color: #ffffff;
        }
        .plc-min-btn.contact:hover {
          background: #0a3a31;
          color: #ffffff;
        }

        .plc-btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: 13px;
        }
        .plc-btn-icon i {
          display: block;
          line-height: 1;
          margin: 0;
          padding: 0;
        }

        .plc-btn-text {
          display: inline-flex;
          align-items: center;
          line-height: 1;
          transform: translateY(1.5px);
        }

        @media (max-width: 768px) {
          .plc-minimal-root { padding: 35px 0 50px; }
          .plc-min-support { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="plc-minimal-root">
        <div className="plc-minimal-wrap">
          {/* Header */}
          <header className="plc-min-header">
            {badge && <span className="plc-min-badge">{badge}</span>}
            <h1 className="plc-min-title">{title}</h1>
            {subtitle && <p className="plc-min-sub">{subtitle}</p>}
            <div className="plc-min-updated">
              Last Updated: {lastUpdated || 'October 2026'} · Fashion Aura
            </div>
          </header>

          {/* Content */}
          <main className="plc-content">
            {children}

            <hr className="plc-min-divider" />

            {/* Minimal support footer */}
            <div className="plc-min-support">
              <div className="plc-min-support-text">
                <h4>Have Questions Regarding This Policy?</h4>
                <p>Our support desk is available Monday to Saturday, 9:00 AM – 7:00 PM IST.</p>
              </div>
              <div className="plc-min-support-links">
                <a
                  href="https://wa.me/919629122122?text=Hello%20Fashion%20Aura!%20I%20have%20a%20question%20regarding%20your%20policies."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plc-min-btn wa"
                >
                  <span className="plc-btn-icon"><i className="fa-brands fa-whatsapp"></i></span>
                  <span className="plc-btn-text">WhatsApp</span>
                </a>
                <a
                  href="https://www.instagram.com/fashionaura25/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plc-min-btn ig"
                >
                  <span className="plc-btn-icon"><i className="fa-brands fa-instagram"></i></span>
                  <span className="plc-btn-text">Instagram</span>
                </a>
                <Link to="/contact" className="plc-min-btn contact">
                  <span className="plc-btn-icon"><i className="fa-solid fa-envelope"></i></span>
                  <span className="plc-btn-text">Contact Us</span>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PolicyLayout;
