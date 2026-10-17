import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import ImageUploadPreview from '../common/ImageUploadPreview';
import CharWordCounter from '../common/CharWordCounter';
import { validateFields, isOverLimit } from '../../utils/textValidation';
import { getImageUrl } from '../../api';

const API = process.env.REACT_APP_API_URL;
const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };


export default function Banners({ showToast }) {
  const [rows, setRows]           = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData]   = useState({
    title:     '',
    subtitle:  '',
    content:   '',
    link:      '',
    sortOrder: 1,
    status:    'Active',
    section:   'hero',
  });
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = () => {
    fetch(`${API}/banners`)
      .then(r => r.json())
      .then(data => setRows(data))
      .catch(() => showToast('Load Failed', 'Could not load banners.'));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '', subtitle: '', content: '', link: '',
      sortOrder: 1, status: 'Active', section: 'hero',
    });
    setImageFile(null);
    setExistingImage(null);
  };

  const handleEditClick = (banner) => {
    setEditingId(banner.id);
    setFormData({
      title:     banner.title     || '',
      subtitle:  banner.subtitle  || '',
      content:   banner.content   || '',
      link:      banner.link      || '',
      sortOrder: banner.sortOrder || 1,
      status:    banner.status    || 'Active',
      section:   banner.section   || 'hero',
    });
    setImageFile(null);
    setExistingImage(banner.image || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasExistingNewArrivals = rows.some(r => r.section === 'new_arrivals' && r.id !== editingId);
  const hasExistingBestSellers = rows.some(r => r.section === 'best_sellers' && r.id !== editingId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isRequired = formData.section === 'new_arrivals' || formData.section === 'best_sellers';

    // Character and word limit validations
    const validationError = validateFields([
      { value: formData.title, fieldName: 'Title', required: isRequired, maxChars: 60, maxWords: 10 },
      { value: formData.subtitle, fieldName: 'Subtitle', required: isRequired, maxChars: 80, maxWords: 15 },
      { value: formData.content, fieldName: 'Content / Description', maxChars: 250, maxWords: 40 },
      { value: formData.link, fieldName: 'Link/URL', required: isRequired, maxChars: 255 },
    ]);
    if (validationError) {
      showToast('Validation Error', validationError);
      return;
    }
    if (formData.section === 'new_arrivals' && hasExistingNewArrivals) {
      showToast('Validation Error', 'Only 1 banner is allowed for New Arrivals. A banner already exists. Please edit the existing one.');
      return;
    }
    if (formData.section === 'best_sellers' && hasExistingBestSellers) {
      showToast('Validation Error', 'Only 1 banner is allowed for Best Sellers. A banner already exists. Please edit the existing one.');
      return;
    }
    if (!editingId && !imageFile) {
      showToast('Validation Error', 'Please select a banner image to upload.');
      return;
    }
    const data = new FormData();
    data.append('title',     formData.title);
    data.append('subtitle',  formData.subtitle);
    data.append('content',   formData.content);
    data.append('link',      formData.link);
    data.append('sortOrder', formData.sortOrder);
    data.append('status',    formData.status);
    data.append('section',   formData.section);
    if (imageFile) data.append('image', imageFile);

    const method = editingId ? 'PUT' : 'POST';
    const url    = editingId ? `${API}/banners/update/${editingId}` : `${API}/banners/add`;

    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        showToast(editingId ? 'Updated!' : 'Added!',
                  editingId ? 'Banner updated successfully.' : 'New banner added.');
        closeForm();
        fetchBanners();
      } else {
        const err = await res.json();
        showToast('Failed', err.error || 'Operation could not be completed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      const res = await fetch(`${API}/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows(prev => prev.filter(r => r.id !== id));
        showToast('Deleted!', 'Banner removed successfully.');
      } else {
        const err = await res.json();
        showToast('Delete Failed', err.error || 'Could not delete banner.');
      }
    } catch (e) {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const isReq = formData.section === 'new_arrivals' || formData.section === 'best_sellers';

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Banners</div>
        <button
          className="action-btn btn-edit"
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
        >
          {showForm ? 'Close' : '+ Add Banner'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? 'E' : 'B'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Banner' : 'Add New Banner'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              <ImageUploadPreview
                label="Banner Image"
                required={!editingId}
                file={imageFile}
                existingUrl={existingImage ? getImageUrl(existingImage) : null}
                onChange={setImageFile}
                onRemove={() => setImageFile(null)}
                helpText={
                  formData.section === 'hero'
                    ? 'Recommended: 1920x600 widescreen banner'
                    : formData.section === 'new_arrivals'
                    ? 'Recommended: 600x800 (3:4 portrait)'
                    : 'Recommended: 600x1100 portrait banner'
                }
                previewMaxHeight={180}
              />

              <div className="km-field">
                <label className="km-label">Section</label>
                <select
                  className="km-select" required
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                >
                  <option value="hero">Hero Carousel (Multiple Banners)</option>
                  <option value="new_arrivals" disabled={hasExistingNewArrivals}>
                    New Arrivals Section {hasExistingNewArrivals ? '(Limit: 1 banner max - already exists)' : '(1 Banner Max)'}
                  </option>
                  <option value="best_sellers" disabled={hasExistingBestSellers}>
                    Best Sellers Section {hasExistingBestSellers ? '(Limit: 1 banner max - already exists)' : '(1 Banner Max)'}
                  </option>
                </select>
                {formData.section === 'new_arrivals' && hasExistingNewArrivals && (
                  <div style={{ color: '#d9534f', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ Only 1 banner is allowed for New Arrivals. Please edit the existing banner below.
                  </div>
                )}
                {formData.section === 'best_sellers' && hasExistingBestSellers && (
                  <div style={{ color: '#d9534f', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ Only 1 banner is allowed for Best Sellers. Please edit the existing banner below.
                  </div>
                )}
              </div>

              <div className="km-field">
                <label className="km-label">
                  Title {isReq && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  className={`km-input ${isOverLimit(formData.title, { maxChars: 60, maxWords: 10 }) ? 'km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. New Arrivals"
                  required={isReq}
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                <CharWordCounter
                  value={formData.title}
                  maxChars={60}
                  maxWords={10}
                  hint="Short, catchy headline"
                />
              </div>

              <div className="km-field">
                <label className="km-label">
                  Subtitle {isReq && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  className={`km-input ${isOverLimit(formData.subtitle, { maxChars: 80, maxWords: 15 }) ? 'km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. Fresh Styles"
                  required={isReq}
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                />
                <CharWordCounter
                  value={formData.subtitle}
                  maxChars={80}
                  maxWords={15}
                  hint="Supporting subheading"
                />
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">Content / Description</label>
                <textarea
                  className={`km-input ${isOverLimit(formData.content, { maxChars: 250, maxWords: 40 }) ? 'km-input-error' : ''}`}
                  style={{ minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="e.g. Discover your next favourite look"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
                <CharWordCounter
                  value={formData.content}
                  maxChars={250}
                  maxWords={40}
                  hint="Banner promotional copy or description"
                />
              </div>

              <div className="km-field">
                <label className="km-label">
                  Link/URL {isReq && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  className={`km-input ${isOverLimit(formData.link, { maxChars: 255 }) ? 'km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. #shop"
                  required={isReq}
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                />
                <CharWordCounter
                  value={formData.link}
                  maxChars={255}
                  showWords={false}
                />
              </div>

              <div className="km-field">
                <label className="km-label">Sort Order</label>
                <input
                  className="km-input" type="number" min="1" required
                  placeholder="e.g. 1"
                  value={formData.sortOrder}
                  onChange={e => setFormData({ ...formData, sortOrder: e.target.value })}
                />
              </div>

              <div className="km-field">
                <label className="km-label">Status</label>
                <select
                  className="km-select" required
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button type="submit" className="km-btn-submit">
                {editingId ? 'Update Banner' : 'Save Banner'}
              </button>
            </form>
          </div>
        </div>
      )}

      <DataTable
        columns={['S.No', 'Image', 'Section', 'Title', 'Sort Order', 'Status', 'Actions']}
        initialRows={rows}
        renderRow={(row, index) => {
          const sectionLabel = {
            hero: 'Hero Carousel',
            new_arrivals: 'New Arrivals',
            best_sellers: 'Best Sellers',
          }[row.section] || row.section;

          return (
            <tr key={row.id}>
              <td className="td-id">#{index + 1}</td>
              <td>
                <div className="img-thumb">
                  {row.image
                    ? <img src={getImageUrl(row.image)} alt={row.title || `Banner ${row.id}`}
                        width="60" height="36"
                        style={{ objectFit: 'cover', borderRadius: 4 }} />
                    : '🖼️'}
                </div>
              </td>
              <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {sectionLabel}
                {(row.section === 'new_arrivals' || row.section === 'best_sellers') && (
                  <span style={{
                    fontSize: '11px',
                    backgroundColor: 'rgba(27, 97, 83, 0.1)',
                    color: '#1B6153',
                    borderRadius: '4px',
                    padding: '2px 7px',
                    marginLeft: '8px',
                    fontWeight: 600,
                    display: 'inline-block'
                  }}>
                    Single Banner
                  </span>
                )}
              </td>
              <td>{row.title || '—'}</td>
              <td>{row.sortOrder ?? '—'}</td>
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
          );
        }}
      />
    </div>
  );
}