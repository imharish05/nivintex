import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import ImageUploadPreview from '../common/ImageUploadPreview';
import CharWordCounter from '../common/CharWordCounter';
import { validateFields, isOverLimit } from '../../utils/textValidation';
import { getImageUrl } from '../../api';

const API = process.env.REACT_APP_API_URL;

const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };

const EMPTY_FORM = {
  title:      '',
  subtitle:   '',
  offerLabel: '',
  btnText:    '',
  btnLink:    '',
  status:     'Active',
};

export default function OfferBanners({ showToast }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => { fetchOfferBanners(); }, []);

  const fetchOfferBanners = () => {
    setLoading(true);
    fetch(`${API}/offer-banners`)
      .then(r => r.json())
      .then(data => { 
        const sorted = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : [];
        setRows(sorted); 
        setLoading(false); 
      })
      .catch(() => {
        showToast('Load Failed', 'Could not load offer banners.');
        setLoading(false);
      });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setExistingImage(null);
  };

  const handleEditClick = (offer) => {
    setEditingId(offer.id);
    setFormData({
      title:      offer.title      || '',
      subtitle:   offer.subtitle   || '',
      offerLabel: offer.offerLabel || '',
      btnText:    offer.btnText    || '',
      btnLink:    offer.btnLink    || '',
      status:     offer.status     || 'Active',
    });
    setImageFile(null);
    setExistingImage(offer.image || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const set = (key) => (e) => setFormData(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateFields([
      { value: formData.title, fieldName: 'Title', required: true, maxChars: 60, maxWords: 10 },
      { value: formData.subtitle, fieldName: 'Subtitle', required: true, maxChars: 80, maxWords: 15 },
      { value: formData.offerLabel, fieldName: 'Offer Label', required: true, maxChars: 40, maxWords: 6 },
      { value: formData.btnText, fieldName: 'Button Text', required: true, maxChars: 25, maxWords: 4 },
      { value: formData.btnLink, fieldName: 'Button Link', required: true, maxChars: 255 },
    ]);
    if (validationError) {
      showToast('Validation Error', validationError);
      return;
    }

    if (!imageFile && !editingId) {
      showToast('Validation Error', 'Banner Image is required.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    if (imageFile) data.append('image', imageFile);

    const method = editingId ? 'PUT' : 'POST';
    const url    = editingId
      ? `${API}/offer-banners/update/${editingId}`
      : `${API}/offer-banners/add`;

    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        showToast(
          editingId ? 'Updated!' : 'Added!',
          editingId ? 'Offer banner updated.' : 'New offer banner added.',
        );
        closeForm();
        fetchOfferBanners();
      } else {
        const err = await res.json();
        showToast('Failed', err.error || 'Operation could not be completed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer banner?')) return;
    try {
      const res = await fetch(`${API}/offer-banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows(prev => prev.filter(r => r.id !== id));
        showToast('Deleted!', 'Offer banner removed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Offer Banners</div>
        <button
          className="action-btn btn-edit"
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
        >
          {showForm ? 'Close' : '+ Add Offer Banner'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? 'E' : 'O'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Offer Banner' : 'Add New Offer Banner'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              <div className="km-field">
                <label className="km-label">Title <span style={{ color: 'red' }}>*</span></label>
                <input
                  className={`km-input ${isOverLimit(formData.title, { maxChars: 60, maxWords: 10 }) ? 'km-input-error' : ''}`}
                  type="text" required
                  placeholder="e.g. Summer Staples"
                  value={formData.title} onChange={set('title')}
                />
                <CharWordCounter
                  value={formData.title}
                  maxChars={60}
                  maxWords={10}
                  hint="Promotional main title"
                />
              </div>

              <div className="km-field">
                <label className="km-label">Subtitle <span style={{ color: 'red' }}>*</span></label>
                <input
                  className={`km-input ${isOverLimit(formData.subtitle, { maxChars: 80, maxWords: 15 }) ? 'km-input-error' : ''}`}
                  type="text" required
                  placeholder="e.g. Wardrobe essentials refreshed"
                  value={formData.subtitle} onChange={set('subtitle')}
                />
                <CharWordCounter
                  value={formData.subtitle}
                  maxChars={80}
                  maxWords={15}
                  hint="Catchy subtitle or tag"
                />
              </div>

              <div className="km-field">
                <label className="km-label">Offer Label <span style={{ color: 'red' }}>*</span></label>
                <input
                  className={`km-input ${isOverLimit(formData.offerLabel, { maxChars: 40, maxWords: 6 }) ? 'km-input-error' : ''}`}
                  type="text" required
                  placeholder="e.g. Buy 2, Get 1 Free"
                  value={formData.offerLabel} onChange={set('offerLabel')}
                />
                <CharWordCounter
                  value={formData.offerLabel}
                  maxChars={40}
                  maxWords={6}
                  hint="Offer badge (e.g. Flat 50% Off)"
                />
              </div>

              <div className="km-field">
                <label className="km-label">Button Text <span style={{ color: 'red' }}>*</span></label>
                <input
                  className={`km-input ${isOverLimit(formData.btnText, { maxChars: 25, maxWords: 4 }) ? 'km-input-error' : ''}`}
                  type="text" required
                  placeholder="e.g. Shop now"
                  value={formData.btnText} onChange={set('btnText')}
                />
                <CharWordCounter
                  value={formData.btnText}
                  maxChars={25}
                  maxWords={4}
                  hint="Call to action text"
                />
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">Button Link <span style={{ color: 'red' }}>*</span></label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className={`km-input ${isOverLimit(formData.btnLink, { maxChars: 255 }) ? 'km-input-error' : ''}`}
                    type="text" required
                    placeholder="e.g. /shop or https://..."
                    value={formData.btnLink} onChange={set('btnLink')}
                    style={{ flex: 1 }}
                  />
                  {formData.btnLink && (
                    <a href={formData.btnLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0d6efd', color: '#fff', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid #0a58ca' }}>
                      ↗ Open
                    </a>
                  )}
                </div>
                <CharWordCounter
                  value={formData.btnLink}
                  maxChars={255}
                  showWords={false}
                />
              </div>

              <div className="km-field">
                <label className="km-label">Status <span style={{ color: 'red' }}>*</span></label>
                <select className="km-select" value={formData.status} onChange={set('status')}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <ImageUploadPreview
                label="Banner Image"
                required={!editingId}
                file={imageFile}
                existingUrl={existingImage ? getImageUrl(existingImage) : null}
                onChange={setImageFile}
                onRemove={() => setImageFile(null)}
                helpText="Recommended: 1200x500 promotional banner"
                previewMaxHeight={160}
              />

              <button type="submit" className="km-btn-submit">
                {editingId ? 'Update Offer Banner' : 'Save Offer Banner'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading offer banners...</p>
      ) : (
        <DataTable
          columns={['ID', 'Image', 'Title', 'Subtitle', 'Offer Label', 'Button Text', 'Button Link', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="td-id">#{row.id}</td>

              <td>
                <div className="img-thumb">
                  {row.image ? (
                    <img
                      src={getImageUrl(row.image)}
                      alt={row.title}
                      width="60"
                      height="36"
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : '🏷️'}
                </div>
              </td>

              <td>{row.title}</td>
              <td>{row.subtitle || '—'}</td>

              <td>
                {row.offerLabel ? (
                  <span style={{ background: '#A2C579', color: '#2C2F33', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>
                    {row.offerLabel}
                  </span>
                ) : '—'}
              </td>

              <td>{row.btnText || '—'}</td>

              <td>
                {row.btnLink ? (
                  <a href={row.btnLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0d6efd', color: '#fff', padding: '3px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12, border: '1px solid #0a58ca', textDecoration: 'none' }}>
                    ↗ Open
                  </a>
                ) : '—'}
              </td>

              <td>
                <span className={`status-pill ${pillClass[row.status] || 'pill-active'}`}>
                  {row.status}
                </span>
              </td>

              <td>
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