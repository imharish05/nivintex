import { useEffect, useState, useRef, useCallback } from 'react';
import './Topbar.css';
import logo from '../../assets/logo.png';

const API = process.env.REACT_APP_API_URL;
const STORAGE_KEY = 'kalpana_low_stock_threshold';

export default function Topbar({ title, addBtn, addLabel, onAdd, onNotifClick }) {
  const savedThreshold = parseInt(localStorage.getItem(STORAGE_KEY)) || 10;

  const [alerts, setAlerts]       = useState({ lowStock: [], outOfStock: [], summary: { lowStockCount: 0, outOfStockCount: 0, totalAlerts: 0 } });
  const [threshold, setThreshold] = useState(savedThreshold);
  const [inputVal, setInputVal]   = useState(String(savedThreshold));
  const [dropOpen, setDropOpen]   = useState(false);
  const [activeTab, setActiveTab] = useState('low');
  const [loading, setLoading]     = useState(false);
  const dropRef                   = useRef(null);

  const fetchAlerts = useCallback((t) => {
    setLoading(true);
    fetch(`${API}/dashboard/stock-alerts?threshold=${t}`)
      .then(r => r.json())
      .then(data => { if (data.summary) setAlerts(data); })
      .catch(err => console.error('Stock alerts fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch on mount and whenever threshold changes
  useEffect(() => { fetchAlerts(threshold); }, [threshold, fetchAlerts]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function applyThreshold() {
    const val = Math.max(1, parseInt(inputVal) || 10);
    setInputVal(String(val));
    setThreshold(val);
    localStorage.setItem(STORAGE_KEY, val);

    // Notify Dashboard (same tab) via CustomEvent
    window.dispatchEvent(new CustomEvent('kalpana_threshold_change', { detail: val }));
  }

  function handleThresholdKeyDown(e) {
    if (e.key === 'Enter') applyThreshold();
  }

  const totalAlerts = alerts.summary?.totalAlerts || 0;
  const hasOut      = alerts.summary?.outOfStockCount > 0;


  return (
    <div className="topbar">
      <div className="topbarLeft">
        <div className="topbarTitle">{title}</div>
      </div>

      <div className="topbarActions">

        {(onAdd || addBtn) && (
          <button className="tbBtn btnPrimary" onClick={onAdd}>
            {addLabel || '+ Add New'}
          </button>
        )}

        {/* 🔔 Bell */}
        <div className="notifWrapper" ref={dropRef} style={{ position: 'relative' }}>
          <div
            onClick={() => { setDropOpen(p => !p); if (onNotifClick) onNotifClick(); }}
            style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
            title={`Out of stock: ${alerts.summary?.outOfStockCount || 0}, Low stock (≤${threshold}): ${alerts.summary?.lowStockCount || 0}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke={loading ? '#94a3b8' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>

            {totalAlerts > 0 && (
              <div style={{
                background: hasOut ? '#dc2626' : '#ea580c',
                color: 'white',
                position: 'absolute',
                top: -6, right: -6,
                fontSize: 10,
                minWidth: 18, height: 18,
                padding: '0 4px',
                borderRadius: 10,
                fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {totalAlerts}
              </div>
            )}
          </div>

          {/* ── Dropdown ── */}
          {dropOpen && (
            <div style={{
              position: 'absolute', top: 36, right: 0,
              width: 380,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              zIndex: 9999,
              overflow: 'hidden',
              fontFamily: '"Inter", sans-serif',
            }}>

              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>🔔 Stock Alerts</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', borderRadius: 5, padding: '2px 8px', fontWeight: 700 }}>
                    {alerts.summary?.outOfStockCount || 0} Out
                  </span>
                  <span style={{ fontSize: 11, background: '#fff7ed', color: '#ea580c', borderRadius: 5, padding: '2px 8px', fontWeight: 700 }}>
                    {alerts.summary?.lowStockCount || 0} Low
                  </span>
                </div>
              </div>

              {/* ── Threshold setter ── */}
              <div style={{
                padding: '10px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  ⚙️ Low stock alert if stock ≤
                </span>
                <input
                  type="number"
                  min="1"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={handleThresholdKeyDown}
                  style={{
                    width: 60, padding: '4px 8px',
                    border: '1px solid #cbd5e1', borderRadius: 6,
                    fontSize: 12, fontWeight: 700, color: '#0f172a',
                    textAlign: 'center', outline: 'none',
                  }}
                />
                <button
                  onClick={applyThreshold}
                  style={{
                    padding: '4px 12px',
                    background: '#2C2F33', color: '#fff',
                    border: 'none', borderRadius: 6,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Set
                </button>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  (currently ≤ {threshold})
                </span>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                {[
                  { key: 'out', label: `❌ Out of Stock (${alerts.summary?.outOfStockCount || 0})`, color: '#dc2626' },
                  { key: 'low', label: `⚠️ Low Stock ≤${threshold} (${alerts.summary?.lowStockCount || 0})`, color: '#ea580c' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    flex: 1, padding: '9px 4px',
                    fontSize: 11, fontWeight: 700, border: 'none',
                    borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                    background: activeTab === tab.key ? `${tab.color}08` : 'transparent',
                    color: activeTab === tab.key ? tab.color : '#94a3b8',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Loading…</div>
                ) : activeTab === 'out' ? (
                  alerts.outOfStock?.length === 0
                    ? <EmptyMsg text="✅ No out-of-stock products!" />
                    : alerts.outOfStock.map((item, i) => (
                        <AlertRow key={`out-${item.id}`} item={item} isLast={i === alerts.outOfStock.length - 1} type="out" />
                      ))
                ) : (
                  alerts.lowStock?.length === 0
                    ? <EmptyMsg text={`✅ No products with stock ≤ ${threshold}!`} />
                    : alerts.lowStock.map((item, i) => (
                        <AlertRow key={`low-${item.id}`} item={item} isLast={i === alerts.lowStock.length - 1} type="low" />
                      ))
                )}
              </div>

              {!loading && totalAlerts === 0 && (
                <EmptyMsg text="✅ All products are well stocked!" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyMsg({ text }) {
  return (
    <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#0f5447', fontWeight: 600 }}>
      {text}
    </div>
  );
}

function AlertRow({ item, isLast, type }) {
  const isOut   = type === 'out';
  const color   = isOut ? '#dc2626' : '#ea580c';
  const bgColor = isOut ? '#fef2f2' : '#fff7ed';

  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: isLast ? 'none' : '1px solid #f8fafc',
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#fff',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.productName}
        </div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
          {item.unit ? `${item.unit}` : ''}
          {item.category && item.category !== '—' ? ` · ${item.category}` : ''}
        </div>
      </div>

      <span style={{
        fontSize: 11, fontWeight: 700,
        padding: '2px 8px', borderRadius: 5,
        background: bgColor, color,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {isOut ? 'Out of Stock' : `${item.stock} left`}
      </span>
    </div>
  );
}