import React, { useState, useEffect, useMemo } from 'react';
import { State } from 'country-state-city';
import { deliveryZoneApi, siteSettingsApi } from '../../api';
import { confirmToast } from '../../utils/confirmToast';

const ALL_INDIAN_STATES = State.getStatesOfCountry('IN').map(s => s.name);

export default function Deliveryzones({ showToast }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [shippingMethod, setShippingMethod] = useState('custom');
  const [togglingMethod, setTogglingMethod] = useState(false);

  // Collapsible FAQ / Accordion State
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [selectedState, setSelectedState] = useState('');
  const [basePrice, setBasePrice] = useState('120.00');
  const [perKgPrice, setPerKgPrice] = useState('35.00');
  const [baseWeightKg, setBaseWeightKg] = useState('1.00');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchZones();
    fetchShippingMethod();
  }, []);

  const fetchShippingMethod = async () => {
    try {
      const res = await siteSettingsApi.getPublic();
      if (res && res.shipping_method) {
        setShippingMethod(res.shipping_method);
      }
    } catch (err) {
      console.error('Failed to load shipping method setting:', err);
    }
  };

  const handleToggleShippingMethod = async (newMethod) => {
    if (togglingMethod || newMethod === shippingMethod) return;
    setTogglingMethod(true);
    try {
      await siteSettingsApi.update('shipping_method', newMethod);
      setShippingMethod(newMethod);
      const label = newMethod === 'custom' ? 'Custom Delivery' : '🚀 Shiprocket Courier';
      showToast?.('Shipping Mode Updated', `Storefront checkout is now set to ${label}.`);
    } catch (err) {
      console.error('Failed to update shipping method:', err);
      showToast?.('Update Failed', err.message || 'Could not update shipping method.');
    } finally {
      setTogglingMethod(false);
    }
  };

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await deliveryZoneApi.getAll();
      if (res && res.success) {
        setZones(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Failed to load delivery zones:', err);
      showToast?.('Load Failed', 'Could not load delivery zones.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zone) => {
    setEditingId(zone.id);
    setSelectedState(zone.state_name);
    setBasePrice(String(zone.base_price));
    setPerKgPrice(String(zone.per_kg_price));
    setBaseWeightKg(String(zone.base_weight_kg || '1.00'));
    setIsActive(Boolean(zone.is_active));
    setIsAccordionOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedState('');
    setBasePrice('120.00');
    setPerKgPrice('35.00');
    setBaseWeightKg('1.00');
    setIsActive(true);
    setIsAccordionOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedState.trim()) {
      showToast?.('Validation Error', 'Please select a state.');
      return;
    }
    const numBase = parseFloat(basePrice);
    const numPerKg = parseFloat(perKgPrice);
    const numWeight = parseFloat(baseWeightKg);

    if (isNaN(numBase) || numBase < 0) {
      showToast?.('Validation Error', 'Base shipping price must be a valid non-negative number.');
      return;
    }
    if (isNaN(numPerKg) || numPerKg < 0) {
      showToast?.('Validation Error', 'Per Kg increment price must be a valid non-negative number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        state_name: selectedState.trim(),
        base_price: numBase,
        per_kg_price: numPerKg,
        base_weight_kg: isNaN(numWeight) || numWeight <= 0 ? 1.00 : numWeight,
        is_active: isActive,
      };

      if (editingId) {
        await deliveryZoneApi.update(editingId, payload);
        showToast?.('Updated!', `Delivery rate for ${selectedState} updated successfully.`);
      } else {
        await deliveryZoneApi.create(payload);
        showToast?.('Created!', `Delivery rate for ${selectedState} added successfully.`);
      }
      resetForm();
      fetchZones();
    } catch (err) {
      showToast?.('Error', err.message || 'Failed to save delivery zone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (zone) => {
    const confirmed = await confirmToast(
      `Are you sure you want to delete delivery zone for "${zone.state_name}"?`,
      'Delete'
    );
    if (!confirmed) return;

    try {
      await deliveryZoneApi.delete(zone.id);
      showToast?.('Deleted', `Delivery zone for "${zone.state_name}" deleted.`);
      fetchZones();
    } catch (err) {
      showToast?.('Delete Failed', err.message || 'Could not delete delivery zone.');
    }
  };

  const handleToggleStatus = async (zone) => {
    try {
      await deliveryZoneApi.update(zone.id, { is_active: !zone.is_active });
      showToast?.('Status Updated', `"${zone.state_name}" is now ${!zone.is_active ? 'Active' : 'Inactive'}.`);
      fetchZones();
    } catch (err) {
      showToast?.('Error', err.message || 'Could not update status.');
    }
  };

  const handleSeedDefaults = async () => {
    const confirmed = await confirmToast(
      'Reset all 36 Indian states to standard rates? (Tamil Nadu: ₹80, Others: ₹120, Extra: ₹35/Kg)',
      'Confirm Reset'
    );
    if (!confirmed) return;

    setIsSeeding(true);
    try {
      const res = await deliveryZoneApi.seedDefaults();
      showToast?.('Rates Seeded!', res.message || 'All delivery zones populated with standard defaults.');
      fetchZones();
    } catch (err) {
      showToast?.('Seed Failed', err.message || 'Could not seed delivery zones.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Filtered rows for the table
  const filteredZones = useMemo(() => {
    return zones.filter(zone => {
      const matchesSearch = zone.state_name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesStatus = filterStatus === 'all'
        ? true
        : filterStatus === 'active' ? Boolean(zone.is_active) : !zone.is_active;
      return matchesSearch && matchesStatus;
    });
  }, [zones, searchQuery, filterStatus]);

  // States already configured
  const configuredStateNames = useMemo(() => {
    return new Set(zones.map(z => z.state_name.toLowerCase()));
  }, [zones]);

  return (
    <div className="delivery-zones-page" style={{ padding: '24px 0' }}>
      {/* Top Banner / Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A1A1A' }}>
            Delivery Zones & Weight Rates
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            Configure state-wise shipping charges and per-kilogram weight increment rates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            style={{
              background: '#f4f6f8',
              color: '#333',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isSeeding ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Reset/Seed all 36 Indian states (Tamil Nadu ₹80, others ₹120, +₹35/Kg)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isSeeding ? 'spin 1s linear infinite' : 'none' }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
            {isSeeding ? 'Seeding...' : 'Quick Seed Standard Rates'}
          </button>
        </div>
      </div>

      {/* Shipping Delivery Mode Toggle Card: Custom Delivery vs 🚀 Shiprocket Courier */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>🚚</span>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
                Checkout Shipping Method
              </h3>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  background: shippingMethod === 'custom' ? '#ecfdf5' : '#f5f3ff',
                  color: shippingMethod === 'custom' ? '#047857' : '#6d28d9',
                  border: `1px solid ${shippingMethod === 'custom' ? '#a7f3d0' : '#ddd6fe'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: shippingMethod === 'custom' ? '#10b981' : '#8b5cf6' }} />
                {shippingMethod === 'custom' ? 'CUSTOM DELIVERY ACTIVE' : '🚀 SHIPROCKET ACTIVE'}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#4b5563' }}>
              Switch between manual state-based Delivery Zone rates and automated live 🚀 Shiprocket couriers.
            </p>
          </div>

          {/* Toggle Segment Controls */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f5f9',
              borderRadius: 30,
              padding: 4,
              border: '1px solid #cbd5e1',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
            }}
          >
            <button
              type="button"
              onClick={() => handleToggleShippingMethod('custom')}
              disabled={togglingMethod}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 24,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: togglingMethod ? 'wait' : 'pointer',
                transition: 'all 0.25s ease',
                background: shippingMethod === 'custom' ? '#0f5447' : 'transparent',
                color: shippingMethod === 'custom' ? '#ffffff' : '#64748b',
                boxShadow: shippingMethod === 'custom' ? '0 2px 6px rgba(15, 84, 71, 0.35)' : 'none',
              }}
            >
              <span>📦 Custom Delivery</span>
              {shippingMethod === 'custom' && (
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: 10 }}>ACTIVE</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleToggleShippingMethod('shiprocket')}
              disabled={togglingMethod}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 24,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: togglingMethod ? 'wait' : 'pointer',
                transition: 'all 0.25s ease',
                background: shippingMethod === 'shiprocket' ? '#6d28d9' : 'transparent',
                color: shippingMethod === 'shiprocket' ? '#ffffff' : '#64748b',
                boxShadow: shippingMethod === 'shiprocket' ? '0 2px 6px rgba(109, 40, 217, 0.35)' : 'none',
              }}
            >
              <span>🚀 Shiprocket Courier</span>
              {shippingMethod === 'shiprocket' && (
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: 10 }}>ACTIVE</span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Context Banner */}
        {/* <div
          style={{
            marginTop: 14,
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 12.5,
            lineHeight: 1.5,
            background: shippingMethod === 'custom' ? '#f0fdf4' : '#faf5ff',
            borderLeft: `4px solid ${shippingMethod === 'custom' ? '#10b981' : '#8b5cf6'}`,
            color: shippingMethod === 'custom' ? '#065f46' : '#5b21b6',
          }}
        >
          {shippingMethod === 'custom' ? (
            <span>
              <strong>📦 Custom Delivery is active:</strong> Customer orders calculate shipping instantly based on delivery state and parcel weight using the rates configured below (Tamil Nadu: ₹80, Other states: ₹120, +₹35/Kg). No Shiprocket courier selection popup or wallet balance is needed.
            </span>
          ) : (
            <span>
              <strong>🚀 Shiprocket Courier is active:</strong> Real-time courier partners (Delhivery, Blue Dart, Ekart) and live shipping quotes are fetched via Shiprocket API based on customer PIN code. Customers select their courier before payment.
            </span>
          )}
        </div> */}
      </div>

      {/* Quick Summary Cards */}
      {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Total Configured Zones</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f5447', marginTop: 4 }}>{zones.length} States</div>
        </div>
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>Tamil Nadu Rule</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#047857', marginTop: 4 }}>₹80.00 <span style={{ fontSize: 13, fontWeight: 500 }}>(+₹35/Kg)</span></div>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Other States Rule</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8', marginTop: 4 }}>₹120.00 <span style={{ fontSize: 13, fontWeight: 500 }}>(+₹35/Kg)</span></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Active Delivery Zones</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
            {zones.filter(z => z.is_active).length} / {zones.length}
          </div>
        </div>
      </div> */}

      {/* Simplified Top Collapsible / Accordion Section */}
      <div
        className="km-form-card"
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          background: '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: 24,
          overflow: 'hidden',
          transition: 'all 0.25s ease'
        }}
      >
        {/* Accordion Header */}
        <div
          onClick={() => setIsAccordionOpen(prev => !prev)}
          style={{
            padding: '16px 20px',
            background: isAccordionOpen ? '#f9fafb' : '#ffffff',
            borderBottom: isAccordionOpen ? '1px solid #edf2f7' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background 0.2s ease',
          }}
        >
          {/* Left: Icon Badge & Clean Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: isAccordionOpen ? '#0f5447' : '#ecfdf5',
                color: isAccordionOpen ? '#ffffff' : '#0f5447',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              {editingId ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              )}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{editingId ? `Edit Rate: ${selectedState}` : 'Configure / Add Delivery Zone Pricing Rule'}</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                Set base delivery fee and extra per-kg rate for any state
              </div>
            </div>
          </div>

          {/* Right: Dropdown Symbol & Action Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {editingId && (
              <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: 12, fontWeight: 700, border: '1px solid #fde68a' }}>
                Editing Mode
              </span>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: isAccordionOpen ? '#0f5447' : '#f1f5f9',
                color: isAccordionOpen ? '#ffffff' : '#475569',
                fontSize: 12.5,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {/* <span>{isAccordionOpen ? 'Close' : 'Configure'}</span> */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'transform 0.25s ease',
                  transform: isAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Accordion Body: Simple & Spacious */}
        {isAccordionOpen && (
          <div className="km-form-body" style={{ padding: '24px 24px 20px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                {/* State Field */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f5447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>State / Union Territory *</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      const stateVal = e.target.value;
                      setSelectedState(stateVal);
                      if (!editingId && stateVal) {
                        const existing = zones.find(z => z.state_name.toLowerCase() === stateVal.toLowerCase());
                        if (existing) {
                          setEditingId(existing.id);
                          setBasePrice(String(existing.base_price));
                          setPerKgPrice(String(existing.per_kg_price));
                          setBaseWeightKg(String(existing.base_weight_kg || '1.00'));
                          setIsActive(Boolean(existing.is_active));
                        } else {
                          const isTN = stateVal.toLowerCase() === 'tamil nadu';
                          setBasePrice(isTN ? '80.00' : '120.00');
                          setPerKgPrice('35.00');
                          setBaseWeightKg('1.00');
                        }
                      }
                    }}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff', color: '#1f2937' }}
                  >
                    <option value="">-- Choose State --</option>
                    {ALL_INDIAN_STATES.map(st => {
                      const isConfigured = configuredStateNames.has(st.toLowerCase()) && (!editingId || selectedState.toLowerCase() !== st.toLowerCase());
                      return (
                        <option key={st} value={st}>
                          {st} {isConfigured ? '(Configured)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Base Shipping Price */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#0f5447', fontWeight: 700 }}>₹</span>
                    <span>Base Delivery Fee *</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      required
                      placeholder="80.00 or 120.00"
                      style={{ width: '100%', padding: '9px 12px 9px 28px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#1f2937' }}
                    />
                  </div>
                </div>

                {/* Additional Per Kg Rate */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f5447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Extra Per Kg Rate *</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>+₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={perKgPrice}
                      onChange={(e) => setPerKgPrice(e.target.value)}
                      required
                      placeholder="35.00"
                      style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#1f2937' }}
                    />
                  </div>
                </div>

                {/* Base Weight Limit */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f5447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>Base Weight (Kg) *</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={baseWeightKg}
                      onChange={(e) => setBaseWeightKg(e.target.value)}
                      required
                      placeholder="1.00"
                      style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#1f2937' }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 12, fontWeight: 500 }}>Kg</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#10b981' : '#94a3b8' }} />
                    <span>Status</span>
                  </label>
                  <select
                    value={isActive ? 'Active' : 'Inactive'}
                    onChange={(e) => setIsActive(e.target.value === 'Active')}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff', color: '#1f2937' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 4 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#0f5447',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 1px 3px rgba(15, 84, 71, 0.25)'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isSubmitting ? 'spin 1s linear infinite' : 'none' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{editingId ? 'Update Rate' : 'Save Rate'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Table Controls (Search & Filter) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search state (e.g. Tamil Nadu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}
          >
            <option value="all">All Statuses ({zones.length})</option>
            <option value="active">Active Only ({zones.filter(z => z.is_active).length})</option>
            <option value="inactive">Inactive Only ({zones.filter(z => !z.is_active).length})</option>
          </select>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Showing <strong>{filteredZones.length}</strong> of <strong>{zones.length}</strong> zones
        </div>
      </div>

      {/* Delivery Zones Table */}
      <div className="km-table-wrap" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#374151' }}>ID</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#374151' }}>State / Zone</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Base Fee (₹)</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Extra Weight Increment</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Base Weight</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading delivery zones...
                </td>
              </tr>
            ) : filteredZones.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
                  No delivery zones match your search.
                </td>
              </tr>
            ) : (
              filteredZones.map((zone) => {
                const isTN = zone.state_name.toLowerCase() === 'tamil nadu';
                return (
                  <tr
                    key={zone.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: isTN ? 'rgba(16, 185, 129, 0.04)' : '#fff',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>
                      #{zone.id}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{zone.state_name}</span>
                        {isTN && (
                          <span style={{ fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Local State
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: isTN ? '#047857' : '#1f2937' }}>
                      ₹{parseFloat(zone.base_price).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#4b5563' }}>
                      <span style={{ fontWeight: 600, color: '#d97706' }}>+₹{parseFloat(zone.per_kg_price).toFixed(2)}</span> / Kg
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                      Up to {parseFloat(zone.base_weight_kg || 1).toFixed(2)} Kg
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(zone)}
                        style={{
                          background: zone.is_active ? '#dcfce7' : '#f3f4f6',
                          color: zone.is_active ? '#15803d' : '#6b7280',
                          border: 'none',
                          borderRadius: 12,
                          padding: '3px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Click to toggle status"
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: zone.is_active ? '#22c55e' : '#9ca3af' }} />
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => handleEdit(zone)}
                          style={{
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Edit delivery rate"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-del"
                          onClick={() => handleDelete(zone)}
                          style={{
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Delete zone"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
