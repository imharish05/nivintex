import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../config/api';

const BASE = API_BASE_URL;

const SETTING_GROUPS = [
  {
    group: 'Header Colors',
    icon: '🎨',
    keys: [
      { key: 'headerBgColor',      label: 'Header Background Color',  hint: 'Main background of the top bar & nav' },
      { key: 'headerTextColor',    label: 'Header Text / Icon Color',  hint: 'Color of nav links and icons' },
      { key: 'headerAccentColor',  label: 'Header Accent Color',       hint: 'Hover & active state accent' },
      { key: 'headerNavHoverColor',label: 'Nav Hover Color',           hint: 'Color of nav links on hover' },
    ],
  },
];

export default function SiteSettingsPage({ showToast }) {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [syncingBilling, setSyncingBilling] = useState(false);
  const [billingSyncResult, setBillingSyncResult] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/site-settings/public`);
      const data = await res.json();
      setSettings(data);
      setOriginal(data);
    } catch {
      showToast?.('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setOriginal(data.settings || settings);
      setSettings(data.settings || settings);
      showToast?.('Saved!', 'Site settings updated successfully');
    } catch {
      showToast?.('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setSettings(original);

  const handleBillingSync = async () => {
    setSyncingBilling(true);
    setBillingSyncResult('');
    try {
      const response = await fetch(`${BASE}/sync/billing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Billing sync failed.');
      const counts = data.counts || {};
      const warningSummary = Array.isArray(counts.warnings) && counts.warnings.length ? ` Warning: ${counts.warnings.join(' ')}` : '';
      const summary = `Synced ${counts.categories || 0} categories, ${counts.products || 0} products, ${counts.variants || 0} variants, and ${counts.franchises || 0} franchises.${warningSummary}`;
      setBillingSyncResult(summary);
      showToast?.('Billing sync complete', summary);
    } catch (error) {
      setBillingSyncResult(error.message || 'Billing sync failed.');
      showToast?.('Billing sync failed', error.message || 'Check the billing API configuration.');
    } finally {
      setSyncingBilling(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>🎨 Site Settings</h2>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
          Customize the look and feel of your storefront. Changes apply live after saving.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 40, justifyContent: 'center' }}>
          <div style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#0f5447', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ color: '#6b7280' }}>Loading settings…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 17 }}>Billing software sync</h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13, lineHeight: 1.5 }}>
              Import categories, products, variant prices and stock, and franchises from the billing system.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleBillingSync} disabled={syncingBilling} style={{ border: 0, borderRadius: 8, padding: '10px 16px', color: '#fff', background: syncingBilling ? '#8aa79f' : '#0f5447', fontWeight: 600, cursor: syncingBilling ? 'wait' : 'pointer' }}>
              {syncingBilling ? 'Syncing billing data…' : 'Sync billing data now'}
            </button>
            </div>
            {billingSyncResult && <p role="status" style={{ margin: '12px 0 0', color: '#374151', fontSize: 13 }}>{billingSyncResult}</p>}
          </div>
          {SETTING_GROUPS.map(group => (
            <div key={group.group} style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              marginBottom: 24,
              overflow: 'hidden',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            }}>
              {/* Group header */}
              <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #0f5447 0%, #126354 100%)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{group.icon}</span>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 600 }}>{group.group}</h3>
              </div>

              {/* Settings rows */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {group.keys.map(({ key, label, hint }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                    {/* Color swatch + picker */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        background: settings[key] || '#ffffff',
                        border: '3px solid #e5e7eb',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <input
                          type="color"
                          value={settings[key] || '#ffffff'}
                          onChange={e => handleChange(key, e.target.value)}
                          style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }}
                          title={label}
                        />
                      </div>
                    </div>

                    {/* Label + hex input */}
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                        {label}
                      </label>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>{hint}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="text"
                          value={settings[key] || ''}
                          onChange={e => handleChange(key, e.target.value)}
                          placeholder="#0f5447"
                          maxLength={7}
                          style={{
                            width: 110,
                            padding: '7px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: 13,
                            fontFamily: 'monospace',
                            color: '#374151',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={e => e.target.style.borderColor = '#0f5447'}
                          onBlur={e => e.target.style.borderColor = '#d1d5db'}
                        />
                        {/* Preview chip */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: settings[key] || '#fff', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 600, color: isLight(settings[key]) ? '#1a1a1a' : '#ffffff', transition: 'all 0.3s' }}>
                          <span>Preview</span>
                        </div>
                        {/* Changed indicator */}
                        {settings[key] !== original[key] && (
                          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, background: '#fef3c7', padding: '3px 8px', borderRadius: 20 }}>
                            ● Changed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Header live preview */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 24 }}>
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>👁️</span>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 600 }}>Live Preview</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{
                background: settings.headerBgColor || '#0f5447',
                borderRadius: 10,
                padding: '14px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'background 0.4s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: settings.headerTextColor || '#fff', opacity: 0.9 }} />
                  <span style={{ color: settings.headerTextColor || '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>Fashion Aura</span>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {['Home', 'Shop', 'About', 'Contact'].map(item => (
                    <span key={item} style={{ color: settings.headerTextColor || '#fff', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = settings.headerNavHoverColor || '#A2C579'}
                      onMouseLeave={e => e.target.style.color = settings.headerTextColor || '#fff'}
                    >{item}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['♡', '🛒', '👤'].map((icon, i) => (
                    <span key={i} style={{ color: settings.headerTextColor || '#fff', fontSize: 18, cursor: 'pointer' }}>{icon}</span>
                  ))}
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
                ↑ This is how your header will look
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={handleReset}
              disabled={!isDirty || saving}
              style={{
                padding: '10px 24px', borderRadius: 8, border: '1px solid #d1d5db',
                background: isDirty ? '#fff' : '#f9fafb',
                color: isDirty ? '#374151' : '#9ca3af',
                fontWeight: 600, fontSize: 14, cursor: isDirty ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              Reset Changes
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              style={{
                padding: '10px 28px', borderRadius: 8, border: 'none',
                background: isDirty && !saving ? 'linear-gradient(135deg, #0f5447, #126354)' : '#9ca3af',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
                boxShadow: isDirty ? '0 4px 14px rgba(15,84,71,0.35)' : 'none',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {saving ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Saving…
                </>
              ) : '💾 Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Utility: detect if a hex color is light (to auto-pick readable text)
function isLight(hex) {
  if (!hex || hex.length < 4) return true;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
