import React from 'react';

const WhatsAppFloat = () => {
  const phoneNumber = '919629122122';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello Fashion Aura! I would like to inquire about your products.')}`;

  return (
    <>
      <style>{`
        .wa-float-btn {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 56px;
          height: 56px;
          background-color: #25D366;
          color: #ffffff !important;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.45);
          z-index: 9999;
          text-decoration: none;
          transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
          cursor: pointer;
        }

        .wa-float-btn:hover {
          transform: scale(1.1);
          background-color: #20bd5a;
          box-shadow: 0 6px 22px rgba(37, 211, 102, 0.6);
          color: #ffffff !important;
        }

        .wa-float-btn svg {
          width: 32px;
          height: 32px;
          fill: #ffffff;
        }

        .wa-tooltip {
          position: absolute;
          right: 68px;
          background-color: #0f5447;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-family: 'Raleway', 'Josefin Sans', sans-serif;
          font-weight: 500;
          letter-spacing: 0.5px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateX(8px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .wa-tooltip::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -5px;
          transform: translateY(-50%);
          border-width: 5px 0 5px 5px;
          border-style: solid;
          border-color: transparent transparent transparent #0f5447;
        }

        .wa-float-btn:hover .wa-tooltip {
          opacity: 1;
          transform: translateX(0);
        }

        /* Adjust back-to-top button so it doesn't overlap WhatsApp */
        .back-to-top {
          bottom: 96px !important;
          right: 28px !important;
        }

        @media (max-width: 768px) {
          .wa-float-btn {
            bottom: 22px;
            right: 22px;
            width: 50px;
            height: 50px;
          }
          .wa-float-btn svg {
            width: 28px;
            height: 28px;
          }
          .back-to-top {
            bottom: 82px !important;
            right: 22px !important;
            width: 44px;
            height: 44px;
            line-height: 44px;
            font-size: 16px;
          }
        }
      `}</style>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-float-btn"
        aria-label="Chat on WhatsApp (+91 96291 22122)"
      >
        <span className="wa-tooltip">Chat with us</span>
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.01 2.01C8.28 2.01 2 8.29 2 16.02c0 2.47.64 4.88 1.87 7.01L2 30l7.21-1.84c2.06 1.12 4.39 1.72 6.8 1.72 7.73 0 14.01-6.28 14.01-14.01 0-3.74-1.46-7.26-4.1-9.91-2.65-2.64-6.17-4.1-9.91-3.95zm0 25.68c-2.14 0-4.24-.57-6.07-1.66l-.43-.26-4.51 1.15 1.2-4.39-.28-.46c-1.2-1.92-1.83-4.14-1.83-6.42 0-6.6 5.37-11.97 11.97-11.97 3.2 0 6.2 1.25 8.46 3.51 2.26 2.26 3.51 5.27 3.51 8.47 0 6.6-5.37 11.97-12.02 11.97zm6.56-8.97c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.79-1.07-.96-1.8-2.14-2.01-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.61-.81-.62h-.69c-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.15 5.44.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.7-.1 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.69-.42z" />
        </svg>
      </a>
    </>
  );
};

export default WhatsAppFloat;
