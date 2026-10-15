import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/img/logo2.png';

const Footer = () => (
  <footer style={{
  background: '#0f5447',
  fontFamily: "'Raleway', 'Josefin Sans', sans-serif",
  minHeight: '380px',
  height: 'auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}}>
    <style>{`
      .ft-main {
        max-width: 1280px;
        margin: 0 auto;
        padding: 48px 24px 24px;
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr 1fr;
        gap: 40px 30px;
        width: 100%;
      }

      .ft-logo {
        height: 52px;
        width: auto;
        display: block;
        margin-bottom: 16px;
      }

      .ft-brand-tag {
        font-size: 11px;
        letter-spacing: 3.5px;
        text-transform: uppercase;
        color: #FFD700;
        font-weight: 500;
        margin-bottom: 22px;
      }
      .ft-brand-desc {
        font-size: 15px;
        font-weight: 300;
        color: #FFFFFF;
        line-height: 1.85;
        margin-bottom: 18px;
        opacity: 0.8;
      }
      .ft-brand-phone {
        color: #FFD700;
        font-size: 15px;
        font-weight: 500;
        text-decoration: none;
        letter-spacing: 0.3px;
        transition: opacity 0.2s;
      }
      .ft-brand-phone:hover { opacity: 0.75; }

      .ft-col-head {
        font-family: 'Josefin Sans', 'Raleway', sans-serif;
        font-size: 20px;
        font-weight: 700;
        color: #FFFFFF;
        letter-spacing: 0.5px;
        margin-bottom: 18px;
        padding-bottom: 14px;
        position: relative;
      }
      .ft-col-head::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0;
        width: 28px; height: 2px;
        background: #FFD700;
      }

      .ft-link {
        display: block;
        color: #FFFFFF;
        opacity: 0.8;
        text-decoration: none;
        font-size: 15px;
        font-weight: 300;
        margin-bottom: 14px;
        letter-spacing: 0.2px;
        transition: color 0.22s, opacity 0.22s;
      }
      .ft-link:hover { color: #FFD700; opacity: 1; }

      .ft-addr {
        font-size: 15px;
        font-weight: 300;
        color: #FFFFFF;
        opacity: 0.8;
        line-height: 1.85;
        margin-bottom: 16px;
      }
      .ft-addr strong {
        color: #FFD700;
        font-weight: 500;
        display: block;
        margin-bottom: 4px;
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        opacity: 1;
      }

      .ft-social-row {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .ft-soc {
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center;
        color: #FFFFFF;
        font-size: 11px;
        text-decoration: none;
        transition: all 0.25s;
      }
      .ft-soc:hover {
        border-color: #FFD700;
        color: #FFD700;
      }

      .ft-bottom {
        border-top: 1px solid rgba(255,255,255,0.15);
        max-width: 1280px;
        margin: 0 auto;
        padding: 22px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }
      .ft-copy {
        font-size: 13px;
        color: #FFFFFF;
        opacity: 0.6;
        font-weight: 300;
      }
      .ft-policy-link {
        font-size: 13px;
        color: #FFFFFF;
        opacity: 0.6;
        text-decoration: none;
        font-weight: 300;
        transition: color 0.2s, opacity 0.2s;
      }
      .ft-policy-link:hover { color: #FFD700; opacity: 1; }

      @media (max-width: 900px) {
        .ft-main { grid-template-columns: 1fr 1fr; gap: 32px 24px; padding: 40px 20px 20px; }
      }
      @media (max-width: 520px) {
        .ft-main { grid-template-columns: 1fr; padding: 36px 18px 20px; gap: 26px; }
        .ft-bottom { padding: 18px 18px; text-align: center; justify-content: center; }
      }
    `}</style>

    <div className="ft-main">

      {/* Brand */}
      <div>
        <img src={logo} alt="Fashion Aura" className="ft-logo" />
        <div className="ft-brand-tag">Timeless Fashion, Everyday Elegance</div>
        <p className="ft-brand-desc">
         Style, Comfort & Elegance – Your destination for the latest women's fashion
        </p>
        <a href="tel:+919629122122" className="ft-brand-phone">+91 96291 22122</a>
        <div className="ft-social-row">
          <a
            href="https://www.instagram.com/fashionaura25/"
            target="_blank"
            rel="noopener noreferrer"
            className="ft-soc"
            aria-label="Instagram"
          >
            <i className="fa-brands fa-instagram"></i>
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <div className="ft-col-head">Quick Links</div>
        {[
          ['Home',    '/home'],
          ['About',   '/about'],
          ['Shop',    '/shop'],
          ['Contact', '/contact'],
        ].map(([label, path]) => (
          <Link key={label} to={path} className="ft-link">
            {label}
          </Link>
        ))}
      </div>

      {/* Policy */}
      <div>
        <div className="ft-col-head">Policy</div>
        {[
          ['Privacy Policy',   '/privacy-policy'],
          ['Terms and Conditions', '/terms-of-service'],
          ['Shipping Policy',  '/shipping-policy'],
          ['Payment Policy',   '/payment-policy'],
          ['Refund & Cancellation', '/refund-cancellation'],
          ['Contact Information',  '/contact-information'],
        ].map(([label, path]) => (
          <Link key={label} to={path} className="ft-link">
            {label}
          </Link>
        ))}
      </div>

      {/* Address */}
      <div>
        <div className="ft-col-head">Address</div>
        <div className="ft-addr">
          <strong>Store</strong>
          Fashion Aura<br />
          First floor, NSR Rd, Saibaba Colony, Kuppakonam Pudur, Coimbatore, Tamil Nadu 641038 India<br />
        </div>
        {/* <div className="ft-addr">
          <strong>Email</strong>
          Fashion Aura@gmail.com
        </div> */}
        <div className="ft-addr">
          <strong>Hours</strong>
          Mon – Sat, 10 am – 7 pm
        </div>
      </div>

    </div>

    <div className="ft-bottom">
      <span className="ft-copy">Crafted with ❤️ by Sai Techno Solutions</span>
    
    </div>
  </footer>
);

export default Footer;
