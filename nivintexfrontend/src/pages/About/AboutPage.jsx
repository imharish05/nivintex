import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from "react";
import Footer from "../../components/Footer";

/* ── Fashion Aura imagery (place these in src/assets/img/) ── */
import heroImg from "../../assets/img/img8.png";
import storyImg from "../../assets/img/img7.png";
import tl2018 from "../../assets/img/img6.png";
import tl2020 from "../../assets/img/img5.png";
import tl2022 from "../../assets/img/img4.png";
import tl2024 from "../../assets/img/img3.png";



const F = {
  main: "'Josefin Sans', 'Century Gothic', sans-serif",
  sub:  "'Raleway', 'Josefin Sans', sans-serif",
};

const C = {
  brand:   '#0f5447',
  gold:    '#C9933A',
  bg:      '#EAF0E2',
  border:  '#EAE4D6',
  surface: '#FFFFFF',
  muted:   '#6B6B8A',
  text:    '#2C3E2B',
};

const styles = `
  .nv-page {
    font-family: ${F.sub};
    color: ${C.text};
    background: ${C.bg};
  }

  .nv-page-top-gap { height: 24px; }

  .nv-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px 3rem;
  }

  /* ── Hero ── */
  .nv-hero {
    background: ${C.brand};
    border-radius: 0px;
    overflow: hidden;
    margin-bottom: 2rem;
    position: relative;
    min-height: 520px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .nv-hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
  }
  .nv-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(15, 84, 71, 0.15) 0%,
      rgba(15, 84, 71, 0.3) 35%,
      rgba(15, 84, 71, 0.75) 68%,
      rgba(15, 84, 71, 0.95) 100%
    );
  }
  .nv-hero-content {
    position: relative;
    z-index: 2;
    padding: 2.5rem 2rem 2.5rem;
    margin-top: 0;
    text-align: center;
  }
  .nv-logo {
    font-family: ${F.main};
    font-size: clamp(22px, 6vw, 38px); font-weight: 200;
    color: #F9F6F0; letter-spacing: clamp(4px, 2vw, 12px);
    text-transform: uppercase;
  }
  .nv-logo span { color: ${C.gold}; }
  .nv-tagline {
    font-family: ${F.sub};
    font-weight: 200; font-size: clamp(9px, 2.2vw, 11px);
    letter-spacing: clamp(2px, 1.2vw, 6px); text-transform: uppercase;
    color: rgba(249,246,240,0.65); margin-top: 8px;
  }
  .nv-divider {
    width: 32px; height: 1px;
    background: ${C.gold};
    margin: 1.2rem auto;
  }
  .nv-hero-desc {
    font-family: ${F.sub};
    font-weight: 200; font-style: italic;
    color: rgba(249,246,240,0.85); font-size: 14px;
    max-width: 450px; margin: 0 auto; line-height: 1.9;
    letter-spacing: 0.5px;
  }

  /* ── Section titles ── */
  .nv-section-title {
    font-family: ${F.main};
    font-size: 20px; font-weight: 300;
    color: ${C.brand}; margin-bottom: 1rem;
    letter-spacing: 6px; text-transform: uppercase;
    text-align: center;
  }
  .nv-section-title span { color: ${C.gold}; }
  .nv-section-sub {
    text-align: center;
    color: ${C.muted};
    font-size: 12px; font-weight: 200;
    letter-spacing: 1.5px;
    font-family: ${F.sub};
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto; margin-right: auto;
  }
  .nv-section-label {
    font-size: 10px; font-weight: 400;
    color: ${C.gold};
    letter-spacing: 3px; text-transform: uppercase;
    font-family: ${F.main};
    margin-bottom: 16px;
    text-align: center;
  }

  /* ── Category Showcase ── */
  .nv-category-showcase {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px; margin-bottom: 3rem;
  }
  .nv-category-card {
    background: ${C.surface};
    border-radius: 0px;
    overflow: hidden;
    border: 1px solid ${C.border};
    box-shadow: 0 2px 12px rgba(31,92,68,0.06);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .nv-category-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 28px rgba(31,92,68,0.1);
  }
  .nv-category-img {
    width: 100%; height: 240px;
    object-fit: cover; object-position: center; display: block;
  }
  .nv-category-info { padding: 1.2rem; text-align: center; }
  .nv-category-name {
    font-family: ${F.main};
    font-size: 14px; font-weight: 400;
    color: ${C.brand}; margin-bottom: 6px;
    letter-spacing: 3px; text-transform: uppercase;
  }
  .nv-category-desc {
    font-family: ${F.sub};
    font-size: 12px; color: ${C.muted};
    line-height: 1.7; font-weight: 200;
    letter-spacing: 0.5px;
  }

  /* ── All Collections ── */
  .nv-all-collections { margin-bottom: 3rem; }
  .nv-collections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px; margin-top: 1rem;
  }
  .nv-collection-tag {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 0px;
    padding: 12px 20px;
    text-align: center;
    font-family: ${F.main};
    font-size: 11px; font-weight: 300;
    color: ${C.brand};
    letter-spacing: 2px; text-transform: uppercase;
    transition: all 0.2s; cursor: default;
  }
  .nv-collection-tag:hover {
    border-color: ${C.gold};
    background: rgba(201,147,58,0.05);
    transform: translateY(-2px);
  }

  /* ── Story ── */
  .nv-story-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px; align-items: center;
    margin-bottom: 3rem;
  }
  .nv-story-img-wrap {
    position: relative;
    overflow: hidden; height: 360px;
    border: 1px solid ${C.border};
  }
  .nv-story-img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center; display: block;
  }
  .nv-story-img-frame {
    position: absolute; inset: 12px;
    border: 1px solid ${C.gold};
    pointer-events: none;
  }
  .nv-body {
    font-family: ${F.sub};
    font-size: 13px; line-height: 1.9;
    color: ${C.text}; font-weight: 300;
    letter-spacing: 0.3px;
  }
  .nv-body strong { color: ${C.brand}; font-weight: 500; }

  /* ── Stats ── */
  .nv-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 3rem;
  }
  .nv-stat {
    text-align: center;
    background: ${C.brand};
    border-radius: 0px;
    padding: 1.5rem 0.5rem;
    border: 1px solid rgba(201,147,58,0.15);
  }
  .nv-stat-num {
    font-family: ${F.main};
    font-size: 30px; font-weight: 200;
    color: #F9F6F0; letter-spacing: 3px;
  }
  .nv-stat-num span { color: ${C.gold}; font-size: 18px; }
  .nv-stat-lbl {
    font-family: ${F.main};
    font-size: 9px; letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(249,246,240,0.6);
    margin-top: 8px; font-weight: 300;
  }

  /* ── Values ── */
  .nv-values {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 3rem;
  }
  .nv-val {
    background: ${C.surface};
    border-radius: 0px;
    border: 1px solid ${C.border};
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 2px 12px rgba(31,92,68,0.04);
    transition: transform 0.2s;
  }
  .nv-val:hover { transform: translateY(-3px); }
  .nv-val-icon {
    font-size: 24px; color: ${C.gold}; margin-bottom: 12px;
  }
  .nv-val-label {
    font-family: ${F.main};
    font-size: 10px; font-weight: 400;
    letter-spacing: 2.5px; color: ${C.gold};
    text-transform: uppercase; margin-bottom: 8px;
  }
  .nv-val-text {
    font-family: ${F.sub};
    font-size: 12px; color: ${C.muted};
    line-height: 1.7; font-weight: 200;
  }

  /* ── Promise ── */
  .nv-promise {
    background: ${C.brand};
    border-radius: 0px;
    padding: 2.5rem;
    margin-bottom: 3rem;
    text-align: center;
    border: 1px solid rgba(201,147,58,0.2);
  }
  .nv-promise-icon { font-size: 28px; color: ${C.gold}; margin-bottom: 16px; }
  .nv-promise-text {
    font-family: ${F.sub};
    font-size: 15px; font-weight: 200;
    color: rgba(249,246,240,0.9);
    line-height: 2; max-width: 700px;
    margin: 0 auto; letter-spacing: 1px;
    font-style: italic;
  }

  /* ── Franchise ── */
  .nv-franchise {
    background: ${C.brand};
    border-radius: 0px;
    padding: 3rem 2rem;
    margin-bottom: 3rem;
    text-align: center;
    border: 1px solid rgba(201,147,58,0.15);
  }
  .nv-franchise-icon { font-size: 36px; color: ${C.gold}; margin-bottom: 20px; }
  .nv-franchise-title {
    font-family: ${F.main};
    font-size: 22px; font-weight: 300;
    color: #F9F6F0; margin-bottom: 16px;
    letter-spacing: 5px; text-transform: uppercase;
  }
  .nv-franchise-sub {
    font-family: ${F.sub};
    font-size: 13px; font-weight: 200;
    color: rgba(249,246,240,0.75);
    margin-bottom: 24px;
    max-width: 700px; margin-left: auto; margin-right: auto;
    line-height: 1.9; letter-spacing: 0.5px;
  }
  .nv-franchise-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px; margin: 28px 0; text-align: left;
  }
  .nv-franchise-feature {
    background: rgba(249,246,240,0.07);
    border-radius: 0px;
    border: 1px solid rgba(201,147,58,0.15);
    padding: 20px;
  }
  .nv-franchise-feature-icon { font-size: 22px; color: ${C.gold}; margin-bottom: 12px; }
  .nv-franchise-feature-title {
    font-family: ${F.main};
    font-size: 12px; font-weight: 400;
    color: #F9F6F0; margin-bottom: 8px;
    letter-spacing: 2px; text-transform: uppercase;
  }
  .nv-franchise-feature-text {
    font-family: ${F.sub};
    font-size: 12px; font-weight: 200;
    color: rgba(249,246,240,0.65);
    line-height: 1.7; letter-spacing: 0.3px;
  }
  .nv-franchise-btn {
    background: ${C.gold};
    color: ${C.brand};
    font-family: ${F.main};
    font-size: 11px; font-weight: 400;
    letter-spacing: 3px; text-transform: uppercase;
    padding: 13px 40px;
    border-radius: 8px; border: none;
    cursor: pointer; transition: all 0.2s; margin-top: 16px;
  }
  .nv-franchise-btn:hover { background: #d4a044; transform: scale(1.02); }

  /* ── Testimonials ── */
  .nv-testimonials-wrap {
    background: ${C.surface};
    border-radius: 0px;
    border: 1px solid ${C.border};
    padding: 2rem; margin-bottom: 3rem;
    box-shadow: 0 2px 12px rgba(31,92,68,0.04);
  }
  .nv-testimonials {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px; margin-top: 1rem;
  }
  .nv-testi {
    background: ${C.bg};
    border-radius: 0px;
    border: 1px solid ${C.border};
    padding: 1.5rem;
  }
  .nv-testi-stars {
    color: ${C.gold}; font-size: 11px;
    letter-spacing: 3px; margin-bottom: 10px;
  }
  .nv-testi-text {
    font-family: ${F.sub};
    font-style: italic; font-size: 12px;
    color: ${C.text}; font-weight: 200;
    line-height: 1.8; margin-bottom: 12px;
    letter-spacing: 0.3px;
  }
  .nv-testi-author {
    font-family: ${F.main};
    font-size: 9px; letter-spacing: 2.5px;
    color: ${C.gold}; font-weight: 400;
    text-transform: uppercase;
  }

  /* ── CTA ── */
  .nv-cta {
    background: ${C.brand};
    border-radius: 0px;
    border: 1px solid rgba(201,147,58,0.2);
    padding: 3rem 2rem; text-align: center;
  }
  .nv-cta-title {
    font-family: ${F.main};
    font-size: 22px; font-weight: 300;
    color: #F9F6F0; margin-bottom: 12px;
    letter-spacing: 5px; text-transform: uppercase;
  }
  .nv-cta-sub {
    font-family: ${F.sub};
    font-size: 12px; font-weight: 200;
    color: rgba(249,246,240,0.65);
    margin-bottom: 1.5rem;
    letter-spacing: 1px; line-height: 1.9;
  }
  .nv-btn {
    background: ${C.gold};
    color: ${C.brand};
    font-family: ${F.main};
    font-size: 11px; font-weight: 400;
    letter-spacing: 3px; text-transform: uppercase;
    padding: 12px 36px;
    border-radius: 8px; border: none;
    cursor: pointer; transition: background 0.2s;
  }
  .nv-btn:hover { background: #d4a044; }

  @media (max-width: 768px) {
    .nv-story-grid { grid-template-columns: 1fr; }
    .nv-stats { grid-template-columns: repeat(2, 1fr); }
    .nv-values { grid-template-columns: repeat(2, 1fr); }
    .nv-testimonials { grid-template-columns: 1fr; }
    .nv-category-showcase { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .nv-page-top-gap { height: 16px; }
    .nv-franchise-features { grid-template-columns: 1fr; }
    .nv-hero { min-height: 480px; }
    .nv-hero-img { height: 100%; }
    .nv-hero-content { margin-top: 0; padding: 2rem 1.2rem 2rem; }
    .nv-story-img-wrap { height: 280px; }
    .nv-category-img { height: 200px; }
  }
  @media (max-width: 480px) {
    .nv-stats { grid-template-columns: 1fr; }
    .nv-values { grid-template-columns: 1fr; }
    .nv-promise { padding: 1.8rem 1rem; }
    .nv-franchise { padding: 2rem 1rem; }
    .nv-hero { min-height: 460px; }
    .nv-hero-content { padding: 1.5rem 1rem 1.5rem; }
  }
`;

function useInView(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return visible;
}

function Anim({ children, style = {}, delay = 0 }) {

  const ref = useRef();
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const featuredCategories = [
  { name: "Kurtis",     desc: "Elegant and comfortable everyday wear with traditional charm.", img: heroImg },
  { name: "Maxis",      desc: "Floor-length grace that flows with you.",                       img: tl2022 },
  { name: "Nighties",   desc: "Soft, breathable fabrics for restful nights.",                  img: tl2020 },
  { name: "Co-ord Sets",desc: "Perfectly matched sets for effortless style.",                  img: storyImg },
];

const allCollections = [
  "Short tops", "Maxis", "Nighties", "Co ord sets / 2pcs set",
  "Salwar sets / 3 pcs set", "Unstitched salwar suits", "Pants", "Kurtis",
];

const stats = [
  { num: "500", accent: "+",  label: "Styles" },
  { num: "10",  accent: "k+", label: "Happy Customers" },
  { num: "6",   accent: "+",  label: "Years of Excellence" },
  { num: "25",  accent: "+",  label: "Cities Served" },
];

const values = [
  { icon: "fa-solid fa-feather",      label: "Quality",      text: "Premium fabrics curated for softness and durability." },
  { icon: "fa-solid fa-couch",        label: "Comfort",      text: "Designs built for how women actually move and live." },
  { icon: "fa-solid fa-heart",        label: "Inclusivity",  text: "Celebrating every body shape and skin tone." },
  { icon: "fa-solid fa-tag",          label: "Affordability",text: "Luxury feel at prices you'll love." },
];

const franchiseFeatures = [
  { icon: "fa-solid fa-store",              title: "Prime Location Support",   text: "We help you identify and secure the best retail locations for maximum footfall." },
  { icon: "fa-solid fa-chart-line",         title: "High Profit Margins",      text: "Enjoy industry-leading profit margins with our premium yet affordable product range." },
  { icon: "fa-solid fa-hand-holding-heart", title: "Full Training & Support",  text: "Comprehensive training in operations, inventory management, and customer service." },
  { icon: "fa-solid fa-truck-fast",         title: "Seamless Supply Chain",    text: "Direct access to our latest collections with efficient inventory restocking." },
  { icon: "fa-solid fa-bullhorn",           title: "Marketing Assistance",     text: "National and local marketing support to build brand presence in your territory." },
  { icon: "fa-solid fa-shield-heart",       title: "Exclusive Territory Rights",text: "Protected geographical zones to ensure you maximize your market potential." },
];

const testimonials = [
  { text: "The kurtis from Fashion Aura are my go-to for work. So comfortable and stylish!", author: "Priya M.",  location: "Chennai" },
  { text: "I love their co-ord sets! Perfect for parties and so easy to style.",              author: "Anitha R.", location: "Coimbatore" },
  { text: "Finally found a brand where comfort meets fashion. The maxi dresses are a dream.", author: "Divya S.",  location: "Madurai" },
];

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>{styles}</style>

      <div className="nv-page">
        <div className="nv-page-top-gap"></div>

        <div className="nv-content">

          {/* ── Hero ── */}
          <Anim>
            <div className="nv-hero">
              <img src={heroImg} alt="Fashion Aura" className="nv-hero-img" />
              <div className="nv-hero-overlay" />
              <div className="nv-hero-content">
                <div className="nv-logo"><span>F</span>ASHION AURA</div>
                <div className="nv-tagline">Elegance in Every Thread</div>
                <div className="nv-divider" />
                <div className="nv-hero-desc">
                  Where comfort meets couture — crafting women's wear that flows through every moment of your day.
                </div>
              </div>
            </div>
          </Anim>

          {/* ── Our Story ── */}
          <Anim delay={50}>
            <div className="nv-story-grid">
              <div>
                <div className="nv-section-title" style={{ textAlign: "left" }}>Our <span>Story</span></div>
                <p className="nv-body">
                  Born from a passion for feminine grace and everyday comfort,{" "}
                  <strong>Fashion Aura</strong> was founded with one clear vision — to design clothing that
                  makes every woman feel effortlessly beautiful. From the quiet luxury of a satin nighty
                  to the breezy sweep of a maxi dress, we believe fashion belongs to real life, real
                  moments, and real women.
                </p>
                <br />
                <p className="nv-body">
                  What started as a small family-run label in the heart of Tamil Nadu has grown into a
                  brand trusted by over <strong>10,000 customers</strong> across India. Every collection
                  we release carries the same promise — clothing that respects your body, your time, and your budget.
                </p>
              </div>
              <div className="nv-story-img-wrap">
                <img src={storyImg} alt="Fashion Aura craftsmanship" className="nv-story-img" />
                <div className="nv-story-img-frame" />
              </div>
            </div>
          </Anim>

          {/* ── Stats ── */}
          <Anim delay={80}>
            <div className="nv-stats">
              {stats.map((s) => (
                <div className="nv-stat" key={s.label}>
                  <div className="nv-stat-num">{s.num}<span>{s.accent}</span></div>
                  <div className="nv-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </Anim>

          {/* ── Featured Categories ── */}
          <Anim delay={50}>
            <div>
              <div className="nv-section-title">Our <span>Collections</span></div>
              <div className="nv-section-sub">Discover our range of thoughtfully designed women's wear</div>
            </div>
            <div className="nv-category-showcase">
              {featuredCategories.map((cat, idx) => (
                <div className="nv-category-card" key={idx}>
                  <img src={cat.img} alt={cat.name} className="nv-category-img" />
                  <div className="nv-category-info">
                    <div className="nv-category-name">{cat.name}</div>
                    <div className="nv-category-desc">{cat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Anim>

          {/* ── All Collections ── */}
          <Anim delay={50}>
            <div className="nv-all-collections">
              <div className="nv-section-title">All <span>Collections</span></div>
              <div className="nv-collections-grid">
                {allCollections.map((collection, idx) => (
                  <div className="nv-collection-tag" key={idx}>{collection}</div>
                ))}
              </div>
            </div>
          </Anim>

          {/* ── Values ── */}
          <Anim delay={50}>
            <div>
              <div className="nv-section-title">What We <span>Stand For</span></div>
              <div className="nv-section-sub">Our core principles that guide everything we do</div>
            </div>
            <div className="nv-values">
              {values.map((v) => (
                <div className="nv-val" key={v.label}>
                  <div className="nv-val-icon"><i className={v.icon}></i></div>
                  <div className="nv-val-label">{v.label}</div>
                  <div className="nv-val-text">{v.text}</div>
                </div>
              ))}
            </div>
          </Anim>

          {/* ── Promise ── */}
          <Anim delay={50}>
            <div className="nv-promise">
              <div className="nv-promise-icon"><i className="fa-solid fa-star-of-life"></i></div>
              <div className="nv-promise-text">
                "Every stitch is a promise — that you deserve to look stunning in your kurti,<br />
                confident in your co-ord, and radiant in your maxi, every single day."
              </div>
            </div>
          </Anim>

          {/* ── Franchise ── */}
          <Anim delay={50}>
            <div className="nv-franchise">
              <div className="nv-franchise-icon"><i className="fa-solid fa-handshake"></i></div>
              <div className="nv-franchise-title">Own a Fashion Aura Franchise</div>
              <div className="nv-franchise-sub">
                Join India's fastest-growing women's wear brand. Bring affordable luxury and timeless elegance
                to your city with our proven business model.
              </div>
              <div className="nv-franchise-features">
                {franchiseFeatures.map((feature, idx) => (
                  <div className="nv-franchise-feature" key={idx}>
                    <div className="nv-franchise-feature-icon"><i className={feature.icon}></i></div>
                    <div className="nv-franchise-feature-title">{feature.title}</div>
                    <div className="nv-franchise-feature-text">{feature.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </Anim>

          {/* ── Testimonials ── */}
          <Anim delay={50}>
            <div className="nv-testimonials-wrap">
              <div className="nv-section-title">What Our <span>Customers Say</span></div>
              <div className="nv-testimonials">
                {testimonials.map((t, i) => (
                  <div className="nv-testi" key={i}>
                    <div className="nv-testi-stars">★★★★★</div>
                    <div className="nv-testi-text">"{t.text}"</div>
                    <div className="nv-testi-author">{t.author} · {t.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </Anim>

          {/* ── CTA ── */}
          <Anim delay={50}>
            <div className="nv-cta">
              <div className="nv-cta-title">Dress the Life You Love</div>
              <div className="nv-cta-sub">
                Explore the latest Fashion Aura collection — crafted for you.<br />
                New styles added every season.
              </div>
              <button className="nv-btn" onClick={() => navigate('/shop')}>Shop Now</button>
            </div>
          </Anim>

        </div>
      </div>

      <Footer />
    </>
  );
}
