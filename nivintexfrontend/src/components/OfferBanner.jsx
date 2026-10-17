import React, { useState, useEffect, useRef } from "react";
import { offerBannerApi, getLocalImageUrl } from "../utils/api";
import { Link } from 'react-router-dom';
import { OfferBannerSkeleton } from "./Skeleton";

function OfferCard({ offer }) {
  return (
    <Link to={offer.href} className="fa-offer-card">
      <div className="fa-offer-frame">
        <img
          src={offer.image}
          alt={offer.title}
          className="fa-offer-photo"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.target.dataset.fallbackApplied) return;
            e.target.dataset.fallbackApplied = "true";
            e.target.src = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {offer.numeral ? (
          <div className="fa-offer-numeral">
            <div className="fa-offer-numeral-num">
              {offer.numeral}
              <sup>{offer.numeralSup}</sup>
            </div>
            {offer.numeralCaption && <div className="fa-offer-numeral-cap">{offer.numeralCaption}</div>}
          </div>
        ) : null}

        <div className="fa-offer-content">
          {offer.kicker && <div className="fa-offer-kicker">{offer.kicker}</div>}
          <h3 className="fa-offer-title">{offer.title}</h3>
          <div className="fa-offer-stitch" />
          <span className="fa-offer-cta">
            {offer.btnText || "Shop now"}
            <span className="fa-offer-arrow" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function OffersBanner() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector('.fa-offer-card');
    if (card) {
      const scrollAmount = card.offsetWidth + 28; // card width + gap
      scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    offerBannerApi.getAll()
      .then(data => {
        const active = (Array.isArray(data) ? data : []).filter(b => b.status === "Active");
        const mapped = active.map(b => {
          let numeral = "";
          let numeralSup = "";
          let numeralCaption = "";
          
          const label = (b.offerLabel || "").toLowerCase();
          if (label.includes("buy one")) {
            numeral = "1";
            numeralSup = "+1";
            numeralCaption = "Free piece";
          } else {
            const match = label.match(/(\d+)/);
            if (match) {
              numeral = match[1];
              numeralSup = label.includes("%") ? "%" : "";
              numeralCaption = "Off today";
            }
          }

          return {
            id: b.id,
            tag: b.offerLabel,
            numeral,
            numeralSup,
            numeralCaption,
            kicker: b.subtitle || b.offerLabel || "",
            title: b.title,
            btnText: b.btnText || "Shop now",
            image: getLocalImageUrl(b.image),
            href: b.btnLink || "/shop",
          };
        });
        setOffers(mapped);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <OfferBannerSkeleton />;
  if (offers.length === 0) return null;

  return (
    <section className="fa-offers-section">
      <style>{`
        .fa-offers-section {
          font-family: 'Jost', sans-serif;
          background: #EAF0E2;
          padding: 48px 0 56px;
          color: #152018;
        }
        .fa-offers-eyebrow {
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: 1180px;
          margin: 0 auto 36px;
        }
        .fa-offers-eyebrow .fa-line {
          width: 46px;
          height: 1px;
          background: #c69a3f;
        }
        .fa-offers-eyebrow span {
          font-size: 12px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: #123526;
          font-weight: 600;
        }
        .fa-offers-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 3.5vw, 32px) 24px;
          gap: 12px;
        }
        .fa-offers-heading {
          font-family: 'Cormorant Garamond', 'Playfair Display', serif;
          font-size: clamp(20px, 2.5vw, 32px);
          color: #0f5447;
          text-align: left;
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          position: relative;
          padding-bottom: 8px;
          display: inline-block;
          line-height: 1.15;
        }
        .fa-offers-heading::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 2px;
          background: #C9A84C;
        }
        .fa-offers-viewall {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #0f5447;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #ffffff;
          border: 1px solid rgba(15, 84, 71, 0.3);
          border-radius: 8px !important;
          padding: 6px 14px;
          transition: all 0.22s ease;
          cursor: pointer;
          line-height: 1;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(15, 84, 71, 0.06);
          flex-shrink: 0;
          text-decoration: none;
        }
        .fa-offers-viewall:hover {
          background: #0f5447;
          color: #ffffff;
          border-color: #0f5447;
          box-shadow: 0 3px 10px rgba(15, 84, 71, 0.2);
          transform: translateY(-1px);
        }
        .fa-offers-viewall svg {
          width: 12px;
          height: 12px;
          stroke: currentColor;
          transition: transform 0.2s ease;
        }
        .fa-offers-viewall:hover svg {
          transform: translateX(2px);
        }
        .fa-offers-grid-wrap {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0 0 20px;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .fa-offers-grid-wrap::-webkit-scrollbar { display: none; }
        .fa-offers-carousel {
          position: relative;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 clamp(16px, 3.5vw, 32px);
        }
        .fa-offers-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #e8e8e8;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s, border-color 0.2s;
          color: #152018;
        }
        .fa-offers-arrow:hover { background: #0f5447; border-color: #0f5447; color: #fff; }
        .fa-offers-arrow svg {
          width: 18px;
          height: 18px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
        }
        .fa-offers-arrow-prev { left: 12px; }
        .fa-offers-arrow-next { right: 12px; }
        .fa-offers-grid {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: calc(50% - 14px);
          gap: clamp(14px, 2.5vw, 28px);
        }
        .fa-offer-card {
          position: relative;
          display: block;
          text-decoration: none;
          color: inherit;
          scroll-snap-align: start;
        }
        @media (max-width: 820px) {
          .fa-offers-grid { grid-auto-columns: 100%; }
        }
        @media (max-width: 600px) {
          .fa-offers-header { padding: 0 16px 18px; align-items: center; }
          .fa-offers-heading { font-size: clamp(20px, 5.2vw, 24px); }
          .fa-offers-viewall { font-size: 11px; padding: 5px 11px; gap: 4px; }
          .fa-offers-viewall svg { width: 10px; height: 10px; }
          .fa-offers-grid { grid-auto-columns: 100%; }
          .fa-offers-arrow { display: none !important; }
        }
        .fa-offer-frame {
          position: relative;
          height: clamp(340px, 50vh, 480px);
          border-radius: 4px;
          overflow: hidden;
          background: #123526;
        }
        .fa-offer-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(11,36,25,0) 30%, rgba(11,36,25,0.7) 65%, rgba(11,36,25,0.95) 100%);
        }
        .fa-offer-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 1.1s cubic-bezier(.16,1,.3,1);
        }
        .fa-offer-card:hover .fa-offer-photo { transform: scale(1.06); }
        .fa-offer-tag {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: rotate(-4deg);
          transition: transform .5s cubic-bezier(.16,1,.3,1);
        }
        .fa-offer-card:hover .fa-offer-tag { transform: rotate(0deg) translateY(-3px); }
        .fa-offer-tag-string {
          display: none;
        }
        .fa-offer-tag-body {
          background: #f6f2e6;
          border: 1px solid #0b2419;
          padding: 8px 16px;
          border-radius: 3px;
          box-shadow: 0 6px 14px rgba(11,36,25,0.28);
        }
        .fa-offer-tag-label {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 500;
          font-size: 13px;
          color: #0b2419;
          white-space: nowrap;
        }
        .fa-offer-numeral {
          position: absolute;
          top: clamp(14px, 2.5vw, 18px);
          right: clamp(16px, 2.5vw, 22px);
          z-index: 2;
          text-align: right;
          line-height: 0.82;
        }
        .fa-offer-numeral-num {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: clamp(48px, 10vw, 74px);
          color: #ffffff;
          text-shadow: none;
        }
        .fa-offer-numeral-num sup {
          font-size: clamp(18px, 3.5vw, 26px);
          vertical-align: clamp(12px, 2.5vw, 22px);
          margin-left: 2px;
        }
        .fa-offer-numeral-cap {
          font-size: 11px;
          letter-spacing: 0.24em;
          color: #DFB76C;
          text-transform: uppercase;
          margin-top: 6px;
          font-weight: 600;
        }
        .fa-offer-content {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          padding: clamp(18px, 3.5vw, 28px) clamp(18px, 3.5vw, 34px) clamp(20px, 3.5vw, 30px);
        }
        .fa-offer-kicker {
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #DFB76C;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .fa-offer-title {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: clamp(22px, 4.5vw, 34px);
          color: #fff;
          margin: 0 0 14px;
          text-shadow: none;
        }
        .fa-offer-stitch {
          width: 56px;
          border-top: 1px dashed rgba(246,242,230,0.55);
          margin-bottom: 16px;
        }
        .fa-offer-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #fff;
          font-weight: 600;
        }
        .fa-offer-arrow {
          width: 26px;
          height: 1px;
          background: #c69a3f;
          position: relative;
          transition: width .35s ease;
          display: inline-block;
        }
        .fa-offer-arrow::after {
          content: "";
          position: absolute;
          right: 0;
          top: -3px;
          width: 7px;
          height: 7px;
          border-top: 1px solid #c69a3f;
          border-right: 1px solid #c69a3f;
          transform: rotate(45deg);
        }
        .fa-offer-card:hover .fa-offer-arrow { width: 38px; }
      `}</style>

      <div className="fa-offers-header">
        <h2 className="fa-offers-heading">Offers</h2>
        <Link to="/sale" className="fa-offers-viewall">
          <span>View all</span>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="fa-offers-carousel">
        {offers.length > 2 && (
          <button className="fa-offers-arrow fa-offers-arrow-prev" onClick={() => scroll(-1)} aria-label="Previous">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        )}

        <div className="fa-offers-grid-wrap" ref={scrollRef}>
          <div className="fa-offers-grid">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

        {offers.length > 2 && (
          <button className="fa-offers-arrow fa-offers-arrow-next" onClick={() => scroll(1)} aria-label="Next">
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>
    </section>
  );
}
