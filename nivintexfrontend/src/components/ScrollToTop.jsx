import React, { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <style>{`
        .fa-scroll-top-btn {
          position: fixed;
          bottom: 96px;
          right: 32px;
          width: 48px;
          height: 48px;
          border-radius: 50% !important;
          background: #1B6153;
          color: #ffffff !important;
          border: none !important;
          outline: none !important;
          padding: 0 !important;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(27, 97, 83, 0.35);
          z-index: 9998;
          opacity: 0;
          visibility: hidden;
          transform: translateY(12px) scale(0.9);
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                      visibility 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                      background-color 0.25s ease,
                      box-shadow 0.25s ease;
        }

        .fa-scroll-top-btn.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        .fa-scroll-top-btn:hover {
          background-color: #C9A84C !important;
          box-shadow: 0 6px 20px rgba(201, 168, 76, 0.45);
          transform: translateY(-3px) scale(1.05);
        }

        .fa-scroll-top-btn:active {
          transform: translateY(0) scale(0.95);
        }

        .fa-scroll-top-btn i {
          font-size: 16px;
          line-height: 1;
          color: #ffffff;
          transition: transform 0.2s ease;
        }

        .fa-scroll-top-btn:hover i {
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .fa-scroll-top-btn {
            bottom: 82px;
            right: 26px;
            width: 42px;
            height: 42px;
            border-radius: 50% !important;
          }
          .fa-scroll-top-btn i {
            font-size: 14px;
          }
        }
      `}</style>

      <button
        type="button"
        style={{ borderRadius: '50%' }}
        className={`fa-scroll-top-btn ${visible ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
        title="Scroll to top"
      >
        <i className="fa-solid fa-arrow-up" />
      </button>
    </>
  );
}
