import React, { useState, useEffect, useRef } from "react";
import { instagramApi, getLocalImageUrl } from "../utils/api";

const styles = `
  .ig-section {
    position: relative;
    overflow: hidden;
    padding-bottom: 56px;
    padding-top: 48px;
    background: #EAF0E2;
  }

  .ig-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 clamp(16px, 4vw, 44px) 24px;
    gap: 12px;
  }

  .ig-title {
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
  }

  .ig-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 2px;
    background: #C9A84C;
  }

  .ig-nav-arrows {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .ig-nav-arrow-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid rgba(15, 84, 71, 0.3);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #0f5447;
    transition: all 0.2s ease;
    box-shadow: 0 1px 4px rgba(15, 84, 71, 0.08);
    padding: 0;
    line-height: 1;
  }

  .ig-nav-arrow-btn:hover:not(:disabled) {
    background: #0f5447;
    color: #ffffff;
    border-color: #0f5447;
    box-shadow: 0 3px 10px rgba(15, 84, 71, 0.2);
    transform: translateY(-1px);
  }

  .ig-nav-arrow-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: rgba(15, 84, 71, 0.15);
  }

  .ig-nav-arrow-btn svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
  }

  .ig-track-wrapper {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 0 0 10px;
  }

  .ig-track-wrapper::-webkit-scrollbar {
    display: none;
  }

  .ig-track {
    display: flex;
    flex-direction: row;
    width: max-content;
    min-width: 100%;
  }

  .ig-item {
    flex: 0 0 calc(100vw / 6);
    max-width: 300px;
    min-width: 140px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    scroll-snap-align: start;
  }

  .ig-item img,
  .ig-item video {
    width: 100%;
    height: 360px;
    object-fit: cover;
    object-position: top;
    display: block;
    transition: transform 0.4s ease;
  }

  .ig-item:hover img,
  .ig-item:hover video {
    transform: scale(1.05);
  }

  .ig-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
  }

  .ig-item:hover .ig-overlay {
    background: rgba(0,0,0,0.3);
  }

  .ig-overlay-icon {
    opacity: 0;
    transition: opacity 0.3s;
    color: #fff;
  }

  .ig-item:hover .ig-overlay-icon {
    opacity: 1;
  }

  .ig-play-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.5);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .ig-play-badge svg {
    width: 14px;
    height: 14px;
    fill: #fff;
  }

  .ig-arr {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 40px;
    height: 40px;
    border-radius: 50% !important;
    border: 1px solid #d4ddd0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(0,0,0,0.14);
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }

  .ig-arr:hover {
    background: #0f5447;
    border-color: #0f5447;
    color: #fff;
    transform: translateY(-50%) scale(1.06);
    box-shadow: 0 4px 16px rgba(15, 84, 71, 0.25);
  }
  .ig-arr:hover svg {
    stroke: #fff;
  }
  .ig-arr.prev { left: 12px; }
  .ig-arr.next { right: 12px; }
  .ig-arr svg { width: 16px; height: 16px; stroke: #0f5447; stroke-width: 2.2; transition: stroke 0.2s; }

  .ig-empty {
    text-align: center;
    padding: 60px 20px;
    color: #aaa;
    font-size: 15px;
    font-family: 'Raleway', 'Josefin Sans', sans-serif;
  }

  @media (max-width: 1100px) {
    .ig-item { flex: 0 0 calc(100vw / 4); }
    .ig-item img, .ig-item video { height: 280px; }
  }

  @media (max-width: 768px) {
    .ig-header { margin: 0 16px 16px; }
    .ig-item { flex: 0 0 calc(100vw / 3); }
    .ig-item img, .ig-item video { height: 220px; }
    .ig-nav-arrow-btn { width: 28px; height: 28px; }
    .ig-nav-arrow-btn svg { width: 12px; height: 12px; }
    .ig-arr {
      width: 32px;
      height: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .ig-arr.prev { left: 6px; }
    .ig-arr.next { right: 6px; }
    .ig-arr svg { width: 14px; height: 14px; }
  }

  @media (max-width: 480px) {
    .ig-item { flex: 0 0 calc(100vw / 2.15); }
    .ig-item img, .ig-item video { height: 190px; }
    .ig-arr {
      width: 30px;
      height: 30px;
    }
    .ig-arr.prev { left: 4px; }
    .ig-arr.next { right: 4px; }
    .ig-arr svg { width: 13px; height: 13px; }
  }
`;

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function MediaItem({ post }) {
  const src = getLocalImageUrl(post.image);
  const href = post.postUrl || "#";
  const isVideo = post.mediaType === "video";

  return (
    <div className="ig-item">
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
        {src ? (
          isVideo ? (
            <video
              src={src}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img src={src} alt={post.label || `Post #${post.id}`} loading="lazy" decoding="async" />
          )
        ) : (
          <div style={{
            width: "100%", height: 360,
            background: "#f5f5f5",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#bbb", fontSize: 13,
          }}>
            {post.label || "No media"}
          </div>
        )}

        {isVideo && src && (
          <div className="ig-play-badge">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        )}

        <div className="ig-overlay">
          <div className="ig-overlay-icon">
            <IgIcon />
          </div>
        </div>
      </a>
    </div>
  );
}

export default function InstagramSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    instagramApi.getAll()
      .then((data) => {
        const arr = data?.posts || data || [];
        setPosts(Array.isArray(arr) ? arr : []);
        setLoading(false);
      })
      .catch((err) => { 
        console.error("InstagramSection:", err); 
        setLoading(false); 
      });
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [posts]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const scrollAmount = Math.max(scrollRef.current.clientWidth * 0.75, 260);
    scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
  };

  if (loading) return null;

  if (posts.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <section className="ig-section">
          <p className="ig-empty">No Instagram posts yet.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <section className="ig-section">
        <div className="ig-header">
          <h2 className="ig-title">Instagram Feeds</h2>
          {posts.length > 1 && (
            <div className="ig-nav-arrows">
              <button
                className="ig-nav-arrow-btn prev"
                onClick={() => scroll(-1)}
                aria-label="Previous posts"
                disabled={!canScrollLeft}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className="ig-nav-arrow-btn next"
                onClick={() => scroll(1)}
                aria-label="Next posts"
                disabled={!canScrollRight}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          {posts.length > 1 && canScrollLeft && (
            <button className="ig-arr prev" onClick={() => scroll(-1)} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <div className="ig-track-wrapper" ref={scrollRef} onScroll={checkScroll}>
            <div className="ig-track">
              {posts.map((post) => (
                <MediaItem key={post.id} post={post} />
              ))}
            </div>
          </div>

          {posts.length > 1 && canScrollRight && (
            <button className="ig-arr next" onClick={() => scroll(1)} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </section>
    </>
  );
}
