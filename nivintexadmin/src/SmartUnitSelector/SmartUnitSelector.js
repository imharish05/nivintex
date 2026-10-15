import { useState, useEffect } from 'react';

const KM = {
  orange: '#A2C579', orangeLight: '#e8f5f0',
  blue: '#2C2F33', green: '#0f5447',
  teal: '#0f5447', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280',
};

const inputStyle = {
  padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8,
  fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none',
};

// ─── Global Unit Store ────────────────────────────────────────────────────────
const DEFAULT_UNIT_GROUPS = [
  { type: 'Weight', icon: '⚖️', units: ['KG', 'G', 'MG'], custom: false },
  { type: 'Size',   icon: '📐', units: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'], custom: false },
  { type: 'Volume', icon: '🧴', units: ['L', 'ML'], custom: false },
  { type: "No's",   icon: '🔢', units: ["No's"], custom: false },
];

export const SIZE_UNITS = DEFAULT_UNIT_GROUPS.find(g => g.type === 'Size')?.units || [];

let _unitGroups = [...DEFAULT_UNIT_GROUPS];
const _unitGroupListeners = new Set();

export function getUnitGroups() { return _unitGroups; }
export function notifyListeners() { _unitGroupListeners.forEach(fn => fn([..._unitGroups])); }

export function addCustomUnitType(typeName) {
  _unitGroups = [..._unitGroups, { type: typeName, icon: '🏷️', units: [], custom: true }];
  notifyListeners();
}
export function addUnitToType(typeName, unit) {
  _unitGroups = _unitGroups.map(g =>
    g.type === typeName ? { ...g, units: [...g.units, unit] } : g
  );
  notifyListeners();
}
export function removeUnitFromType(typeName, unit) {
  _unitGroups = _unitGroups.map(g =>
    g.type === typeName ? { ...g, units: g.units.filter(u => u !== unit) } : g
  );
  notifyListeners();
}
export function deleteCustomType(typeName) {
  _unitGroups = _unitGroups.filter(g => g.type !== typeName);
  notifyListeners();
}

// ─── SmartUnitSelector Component ─────────────────────────────────────────────
export default function SmartUnitSelector({ value, onChange }) {
  const [isOpen, setIsOpen]             = useState(false);
  const [openType, setOpenType]         = useState(null);
  const [unitGroups, setUnitGroups]     = useState(getUnitGroups());
  const [showAddType, setShowAddType]   = useState(false);
  const [newTypeName, setNewTypeName]   = useState('');
  const [addingUnitTo, setAddingUnitTo] = useState(null);
  const [newUnitName, setNewUnitName]   = useState('');

  useEffect(() => {
    const listener = (groups) => setUnitGroups([...groups]);
    _unitGroupListeners.add(listener);
    return () => _unitGroupListeners.delete(listener);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    if (isOpen) { setShowAddType(false); setOpenType(null); setAddingUnitTo(null); }
  };

  const handleTypeClick = (type) => {
    setOpenType(prev => (prev === type ? null : type));
    setAddingUnitTo(null);
    setNewUnitName('');
  };

  const handleUnitSelect = (unit) => {
    onChange(unit);
    setIsOpen(false);
    setOpenType(null);
    setShowAddType(false);
    setAddingUnitTo(null);
  };

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (unitGroups.find(g => g.type.toLowerCase() === trimmed.toLowerCase())) return;
    addCustomUnitType(trimmed);
    setNewTypeName('');
    setShowAddType(false);
    setTimeout(() => { setOpenType(trimmed); setAddingUnitTo(trimmed); }, 0);
  };

  const handleAddUnit = (typeName) => {
    const trimmed = newUnitName.trim().toUpperCase();
    if (!trimmed) return;
    const group = unitGroups.find(g => g.type === typeName);
    if (!group || group.units.includes(trimmed)) return;
    addUnitToType(typeName, trimmed);
    setNewUnitName('');
  };

  const handleRemoveUnit = (e, typeName, unit) => {
    e.stopPropagation();
    removeUnitFromType(typeName, unit);
  };

  const handleDeleteType = (e, typeName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${typeName}" type?`)) return;
    deleteCustomType(typeName);
    if (openType === typeName) setOpenType(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger box */}
      <div
        style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderColor: isOpen ? KM.teal : KM.border, userSelect: 'none' }}
        onClick={toggleDropdown}
      >
        <span style={{ color: value ? KM.text : KM.muted, fontSize: 13 }}>{value || 'Select Unit'}</span>
        <span style={{ fontSize: 10, color: KM.muted }}>{isOpen ? '▴' : '▾'}</span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 999, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 250, overflow: 'hidden' }}>

          {unitGroups.map(group => (
            <div key={group.type}>
              {/* Group header */}
              <div
                onClick={() => handleTypeClick(group.type)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', cursor: 'pointer', background: openType === group.type ? KM.orangeLight : '#fff', borderBottom: `1px solid ${KM.border}`, fontWeight: 600, fontSize: 13, color: openType === group.type ? KM.orange : KM.text, transition: 'background 0.15s' }}
              >
                <span>{group.icon} {group.type}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {group.custom && (
                    <span onClick={(e) => handleDeleteType(e, group.type)} title="Delete this type"
                      style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#FEE2E2', lineHeight: 1.4, cursor: 'pointer' }}>
                      🗑
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: KM.muted }}>{openType === group.type ? '▴' : '▾'}</span>
                </div>
              </div>

              {/* Sub-units panel */}
              {openType === group.type && (
                <div style={{ background: '#FAFAFA', borderBottom: `1px solid ${KM.border}`, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: group.units.length ? 8 : 0 }}>
                    {group.units.map(unit => (
                      <div key={unit} style={{ display: 'flex', alignItems: 'center', borderRadius: 20, border: `1.5px solid ${value === unit ? KM.orange : KM.border}`, background: value === unit ? KM.orange : '#fff', overflow: 'hidden' }}>
                        <button type="button" onClick={() => handleUnitSelect(unit)}
                          style={{ padding: '5px 10px', background: 'none', border: 'none', color: value === unit ? '#fff' : KM.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {unit}
                        </button>
                        <button type="button" onClick={(e) => handleRemoveUnit(e, group.type, unit)}
                          style={{ padding: '4px 7px 4px 2px', background: 'none', border: 'none', color: value === unit ? 'rgba(255,255,255,0.8)' : '#EF4444', fontSize: 10, cursor: 'pointer', lineHeight: 1 }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {addingUnitTo === group.type ? (
                    <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                      <input autoFocus placeholder="e.g. CM" value={newUnitName}
                        onChange={e => setNewUnitName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(group.type); } if (e.key === 'Escape') { setAddingUnitTo(null); setNewUnitName(''); } }}
                        style={{ ...inputStyle, flex: 1, padding: '5px 9px', fontSize: 12, borderColor: KM.green }} />
                      <button type="button" onClick={() => handleAddUnit(group.type)}
                        style={{ padding: '5px 10px', background: KM.green, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
                      <button type="button" onClick={() => { setAddingUnitTo(null); setNewUnitName(''); }}
                        style={{ padding: '5px 8px', background: 'none', border: `1px solid ${KM.border}`, borderRadius: 7, fontSize: 12, cursor: 'pointer', color: KM.muted, fontFamily: 'inherit' }}>✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setAddingUnitTo(group.type); setNewUnitName(''); }}
                      style={{ fontSize: 11, color: KM.green, fontWeight: 600, background: 'none', border: `1px dashed ${KM.green}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Add Unit
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* + Add New Type */}
          {!showAddType ? (
            <div onClick={(e) => { e.stopPropagation(); setShowAddType(true); setOpenType(null); setAddingUnitTo(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: KM.teal, borderTop: `1px solid ${KM.border}`, background: '#e8f5f0' }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span> Add New Type
            </div>
          ) : (
            <div style={{ padding: '10px 12px', background: '#e8f5f0', borderTop: `1px solid ${KM.border}`, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
              <input autoFocus placeholder="e.g. Dimension" value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddType(); } if (e.key === 'Escape') setShowAddType(false); }}
                style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12, borderColor: KM.teal }} />
              <button type="button" onClick={handleAddType}
                style={{ padding: '6px 12px', background: KM.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
              <button type="button" onClick={() => { setShowAddType(false); setNewTypeName(''); }}
                style={{ padding: '6px 8px', background: 'none', color: KM.muted, border: `1px solid ${KM.border}`, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}