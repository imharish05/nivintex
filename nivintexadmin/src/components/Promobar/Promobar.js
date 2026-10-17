import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import CharWordCounter from '../common/CharWordCounter';
import { validateFields, isOverLimit } from '../../utils/textValidation';
import { API_BASE_URL } from '../../config/api';

const API = API_BASE_URL;
const pillClass = { true: 'pill-active', false: 'pill-inactive' };

const DEFAULT_GRADIENT = 'linear-gradient(45deg, #2C2F33 0%, #A2C579 100%)';
const DEFAULT_TEXT     = '#F8F6F2';

export default function PromoBar({ showToast }) {
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [formData, setFormData]     = useState({
    message:    '',
    code:       '',
    codeLabel:  'USE CODE:',
    bgGradient: DEFAULT_GRADIENT,
    textColor:  DEFAULT_TEXT,
    linkUrl:    '',
    isActive:   true,
    sortOrder:  0,
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = () => {
    setLoading(true);
    fetch(`${API}/promo-bar`)
      .then(r => r.json())
      .then(data => { setRows(data); setLoading(false); })
      .catch(() => {
        showToast('Load Failed', 'Could not load promo bars.');
        setLoading(false);
      });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      message:    '',
      code:       '',
      codeLabel:  'USE CODE:',
      bgGradient: DEFAULT_GRADIENT,
      textColor:  DEFAULT_TEXT,
      linkUrl:    '',
      isActive:   true,
      sortOrder:  0,
    });
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setFormData({
      message:    row.message    || '',
      code:       row.code       || '',
      codeLabel:  row.codeLabel  || 'USE CODE:',
      bgGradient: row.bgGradient || DEFAULT_GRADIENT,
      textColor:  row.textColor  || DEFAULT_TEXT,
      linkUrl:    row.linkUrl    || '',
      isActive:   row.isActive   ?? true,
      sortOrder:  row.sortOrder  ?? 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateFields([
      { value: formData.message, fieldName: 'Promo Message', required: true, maxChars: 120, maxWords: 20 },
      { value: formData.codeLabel, fieldName: 'Code Label', maxChars: 30, maxWords: 4 },
      { value: formData.code, fieldName: 'Promo Code', maxChars: 30, maxWords: 3 },
      { value: formData.linkUrl, fieldName: 'Link URL', maxChars: 255 },
    ]);
    if (validationError) {
      showToast('Validation Error', validationError);
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url    = editingId
      ? `${API}/promo-bar/${editingId}`
      : `${API}/promo-bar`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast(
          editingId ? 'Updated!' : 'Created!',
          editingId ? 'Promo bar updated.' : 'Promo bar created.'
        );
        closeForm();
        fetchItems();
      } else {
        const err = await res.json();
        showToast('Failed', err.error || 'Operation could not be completed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const handleToggle = async (row) => {
    try {
      const res = await fetch(`${API}/promo-bar/${row.id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, isActive: updated.isActive } : r));
        showToast('Updated!', `Promo bar ${updated.isActive ? 'activated' : 'deactivated'}.`);
      }
    } catch {
      showToast('Server Error', 'Something went wrong.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo bar?')) return;
    try {
      const res = await fetch(`${API}/promo-bar/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows(prev => prev.filter(r => r.id !== id));
        showToast('Deleted!', 'Promo bar removed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong.');
    }
  };

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  // Live preview bar
  const preview = (
    <div style={{
      background:   formData.bgGradient,
      color:        formData.textColor,
      borderRadius: 8,
      padding:      '10px 20px',
      fontSize:     13,
      fontWeight:   500,
      display:      'flex',
      alignItems:   'center',
      gap:          10,
      flexWrap:     'wrap',
      marginBottom: 20,
      minHeight:    42,
    }}>
      <span>{formData.message || 'Your promo message will appear here…'}</span>
      {formData.code && (
        <span style={{
          background:   'rgba(255,255,255,0.15)',
          border:       '1px solid rgba(255,255,255,0.3)',
          borderRadius: 4,
          padding:      '2px 10px',
          fontWeight:   700,
          letterSpacing: 1,
          fontSize:     12,
        }}>
          {formData.codeLabel} {formData.code}
        </span>
      )}
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Promo Bar</div>
        <button
          className="action-btn btn-edit"
          onClick={() => showForm ? closeForm() : setShowForm(true)}
        >
          {showForm ? 'Close' : '+ Add Promo Bar'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? 'E' : 'P'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Promo Bar' : 'Add Promo Bar'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">

            {/* Live Preview */}
            <div style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                LIVE PREVIEW
              </p>
              {preview}
            </div>

            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Message */}
              <div className="km-field km-field-full">
                <label className="km-label">Promo Message <span style={{ color: 'red' }}>*</span></label>
                <input
                  className={`km-input ${isOverLimit(formData.message, { maxChars: 120, maxWords: 20 }) ? 'km-input-error' : ''}`}
                  type="text"
                  required
                  placeholder="e.g. Pay Online & GET 10% OFF on your Purchase"
                  value={formData.message}
                  onChange={e => set('message', e.target.value)}
                />
                <CharWordCounter
                  value={formData.message}
                  maxChars={120}
                  maxWords={20}
                  hint="Top banner announcement text"
                />
              </div>

              {/* Code Label */}
              <div className="km-field">
                <label className="km-label">Code Label</label>
                <input
                  className={`km-input ${isOverLimit(formData.codeLabel, { maxChars: 30, maxWords: 4 }) ? 'km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. USE CODE:"
                  value={formData.codeLabel}
                  onChange={e => set('codeLabel', e.target.value)}
                />
                <CharWordCounter
                  value={formData.codeLabel}
                  maxChars={30}
                  maxWords={4}
                />
              </div>

              {/* Promo Code */}
              <div className="km-field">
                <label className="km-label">Promo Code</label>
                <input
                  className={`km-input ${isOverLimit(formData.code, { maxChars: 30, maxWords: 3 }) ? 'km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. PREPAID10 (leave blank to hide)"
                  value={formData.code}
                  onChange={e => set('code', e.target.value)}
                />
                <CharWordCounter
                  value={formData.code}
                  maxChars={30}
                  maxWords={3}
                />
              </div>

              {/* BG Gradient */}
              <div className="km-field">
                <label className="km-label">Background Gradient (CSS)</label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="linear-gradient(45deg, #2C2F33 0%, #A2C579 100%)"
                  value={formData.bgGradient}
                  onChange={e => set('bgGradient', e.target.value)}
                />
              </div>

              {/* Text Color */}
              <div className="km-field">
                <label className="km-label">Text Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.textColor.startsWith('#') ? formData.textColor : '#F8F6F2'}
                    onChange={e => set('textColor', e.target.value)}
                    style={{ width: 40, height: 38, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    className="km-input"
                    type="text"
                    placeholder="#F8F6F2"
                    value={formData.textColor}
                    onChange={e => set('textColor', e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Link URL */}
              <div className="km-field">
                <label className="km-label">Link URL (optional)</label>
                <input
                  className={`km-input ${isOverLimit(formData.linkUrl, { maxChars: 255 }) ? 'km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. /shop or https://..."
                  value={formData.linkUrl}
                  onChange={e => set('linkUrl', e.target.value)}
                />
                <CharWordCounter
                  value={formData.linkUrl}
                  maxChars={255}
                  showWords={false}
                />
              </div>

              {/* Sort Order */}
              <div className="km-field">
                <label className="km-label">Sort Order</label>
                <input
                  className="km-input"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={e => set('sortOrder', e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="km-field">
                <label className="km-label">Status</label>
                <select
                  className="km-select"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={e => set('isActive', e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button type="submit" className="km-btn-submit">
                {editingId ? 'Update Promo Bar' : 'Save Promo Bar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading promo bars...</p>
      ) : (
        <DataTable
          columns={['ID', 'Preview', 'Message', 'Code', 'Sort', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="td-id">#{row.id}</td>

              {/* Mini preview */}
              <td>
                <div style={{
                  background:   row.bgGradient || DEFAULT_GRADIENT,
                  color:        row.textColor  || DEFAULT_TEXT,
                  borderRadius: 6,
                  padding:      '5px 12px',
                  fontSize:     11,
                  fontWeight:   600,
                  whiteSpace:   'nowrap',
                  maxWidth:     180,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.message}
                </div>
              </td>

              <td style={{ maxWidth: 260, wordBreak: 'break-word' }}>{row.message}</td>

              <td>
                {row.code ? (
                  <span style={{
                    background:    '#2C2F33',
                    color:         '#f8fafc',
                    padding:       '3px 10px',
                    borderRadius:  4,
                    fontSize:      12,
                    fontWeight:    700,
                    letterSpacing: 0.8,
                  }}>
                    {row.code}
                  </span>
                ) : (
                  <span style={{ color: '#ccc' }}>—</span>
                )}
              </td>

              <td>{row.sortOrder}</td>

              <td>
                <span className={`status-pill ${row.isActive ? 'pill-active' : 'pill-inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>

              <td>
                <button
                  className="action-btn"
                  style={{ background: row.isActive ? '#f59e0b' : '#10b981', color: '#fff', marginRight: 4 }}
                  onClick={() => handleToggle(row)}
                >
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                <button className="action-btn btn-del"  onClick={() => handleDelete(row.id)}>Delete</button>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
