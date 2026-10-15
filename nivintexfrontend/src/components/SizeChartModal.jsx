import React, { useEffect, useState } from 'react';

const BRAND = '#0f5447';
const BORDER = '#EAE4D6';
const convertMeasurement = (value, fromUnit, toUnit) => {
  if (value === null || value === undefined || String(value).trim() === '') return '—';
  if (fromUnit === toUnit) return value;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  const converted = fromUnit === 'IN' ? numeric * 2.54 : numeric / 2.54;
  return Number(converted.toFixed(2)).toString();
};
const parseList = value => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; }
    catch (_) { return []; }
  }
  return [];
};

export default function SizeChartModal({ isOpen, onClose, productName, productImage, chart }) {
  const chartUnit = String(chart?.unit || 'IN').toUpperCase() === 'CM' ? 'CM' : 'IN';
  const [unit, setUnit] = useState(chartUnit);
  useEffect(() => { setUnit(chartUnit); }, [chartUnit]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const columns = parseList(chart?.columns).filter(column => column && typeof column === 'object');
  const rows = parseList(chart?.rows).filter(row => row && typeof row === 'object');
  const shownUnit = unit === 'CM' ? 'CM' : 'IN';
  const displayValue = raw => convertMeasurement(raw, chartUnit, shownUnit);

  return (
    <div role="presentation" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,.66)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <section role="dialog" aria-modal="true" aria-labelledby="size-chart-title" onClick={event => event.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 'min(1080px, 94vw)', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 16px', background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
          <div><h2 id="size-chart-title" style={{ margin: 0, color: BRAND, fontSize: 16 }}>{chart?.title || 'Size guide'}</h2><p style={{ margin: '3px 0 0', color: '#667085', fontSize: 12 }}>{productName}</p></div>
          <button type="button" onClick={onClose} aria-label="Close size chart" style={{ flex: '0 0 38px', height: 38, border: 0, borderRadius: 20, background: '#f1f5f9', color: BRAND, fontSize: 24, cursor: 'pointer' }}>×</button>
        </header>
        <div className="size-chart-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .82fr) minmax(0, 1.18fr)', alignItems: 'start', gap: 18, padding: 14, boxSizing: 'border-box' }}>
          <div style={{ minHeight: 0, maxHeight: '68vh', aspectRatio: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, background: '#f7f7f3' }}>
            {productImage ? <img src={productImage} alt={productName} onError={event => { event.currentTarget.style.display = 'none'; }} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ padding: 30, textAlign: 'center', color: '#718079' }}>Product image unavailable</div>}
          </div>
          <div style={{ minWidth: 0, padding: '2px 2px 8px' }}>
            <div style={{ margin: '0 auto 10px', maxWidth: 760 }}>
              <div style={{ color: BRAND, fontWeight: 700, fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase' }}>Find your perfect fit</div>
              <p style={{ margin: '5px 0 0', color: '#59645f', lineHeight: 1.5, fontSize: 12 }}>{chart?.description || 'Compare these measurements with a similar garment that fits you well.'}</p>
            </div>
            <div aria-label="Measurement units" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ color: '#667085', fontSize: 11, marginRight: 3 }}>Show measurements in</span>
              {['IN', 'CM'].map(value => <button type="button" key={value} onClick={() => setUnit(value)} aria-pressed={shownUnit === value} style={{ minWidth: 42, padding: '6px 12px', borderRadius: 18, border: `1px solid ${shownUnit === value ? '#111827' : BORDER}`, color: shownUnit === value ? '#fff' : '#475569', background: shownUnit === value ? '#111827' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>{value}</button>)}
              {/* <span style={{ color: '#667085', fontSize: 10, marginLeft: 3 }}>1 in = 2.54 cm</span> */}
            </div>
            {rows.length && columns.length ? <div style={{ overflowX: 'auto', border: '1px solid #dce2f4' }}>
              <table style={{ width: '100%', minWidth: `${Math.max(360, (columns.length + 1) * 82)}px`, borderCollapse: 'collapse', textAlign: 'center', color: '#334155', fontSize: 12 }}>
                <thead><tr style={{ background: '#fbfcff' }}><th style={{ padding: '8px 7px', color: '#25314f', borderBottom: '1px solid #dce2f4' }}>SIZE ({shownUnit})</th>{columns.map(column => <th key={column.key} style={{ padding: '8px 7px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #dce2f4' }}>{column.label} ({shownUnit})</th>)}</tr></thead>
                <tbody>{rows.map((row, index) => <tr key={`${row.size}-${index}`} style={{ borderTop: '1px solid #e6eafa' }}><th scope="row" style={{ padding: '7px', color: '#33415f', fontWeight: 600 }}>{row.size}</th>{columns.map(column => <td key={column.key} style={{ padding: '7px' }}>{displayValue(row.measurements?.[column.key])}</td>)}</tr>)}</tbody>
              </table>
            </div> : <p style={{ margin: 0, padding: 14, color: '#64748b', textAlign: 'center', border: `1px solid ${BORDER}` }}>A size guide has not been added for this product yet.</p>}
            <div className="size-chart-guide" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 18 }}>
              <div style={{ color: '#3d4652', fontSize: 13, lineHeight: 1.6 }}>
                <h3 style={{ margin: '0 0 6px', color: '#222d41', fontSize: 16, lineHeight: 1.3 }}>How to measure</h3>
                <ol style={{ margin: 0, paddingLeft: 18 }}><li><strong>Bust:</strong> Measure around the fullest part of the chest.</li><li><strong>Waist:</strong> Measure around the natural waist, without pulling the tape tight.</li><li><strong>Hip:</strong> Measure around the fullest part of the hips.</li><li><strong>Shoulder:</strong> Measure from one shoulder edge to the other across the back.</li></ol>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #d9dee7', marginTop: 12, paddingTop: 9, color: '#45505e', fontSize: 12, lineHeight: 1.55 }}><strong style={{ color: '#25314f', display: 'block', fontSize: 15, lineHeight: 1.4 }}>Tips for accurate measurements</strong><ul style={{ margin: '5px 0 0', paddingLeft: 18 }}><li>Use a soft measuring tape and keep it level.</li><li>Measure over light clothing or directly on the body.</li><li>If between sizes, choose the larger size for a more relaxed fit.</li></ul></div>
          </div>
        </div>
        <style>{`@media (max-width: 760px) { .size-chart-layout { grid-template-columns: 1fr !important; gap: 12px !important; padding: 10px !important; } .size-chart-layout > div:first-child { min-height: 0 !important; height: 32vh !important; max-height: 260px; } .size-chart-layout > div:first-child img { min-height: 0 !important; } .size-chart-guide { grid-template-columns: 1fr !important; } }`}</style>
      </section>
    </div>
  );
}
