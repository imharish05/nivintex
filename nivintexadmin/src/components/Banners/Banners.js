import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';

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
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isRequired = formData.section === 'new_arrivals' || formData.section === 'best_sellers';
    if (isRequired && (!formData.title || !formData.subtitle || !formData.link)) {
      showToast('Validation Error', 'Title, Subtitle, and Link are required for this section.');
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

               <div className="km-field km-field-full">
                <label className="km-label">
                  Banner Image {!editingId && <span style={{ color: 'red' }}>*</span>}
                </label>
                <div className="km-file-zone">
                  <div className="km-file-icon">↑</div>
                  {imageFile
                    ? <p className="km-file-selected">✓ {imageFile.name}</p>
                    : <p className="km-file-label">Click to upload banner image</p>}
                  <input type="file" accept="image/*"
                    onChange={e => setImageFile(e.target.files[0])} />
                </div>
              </div>

              <div className="km-field">
                <label className="km-label">Section</label>
                <select
                  className="km-select" required
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                >
                  <option value="hero">Hero Carousel</option>
                  <option value="new_arrivals">New Arrivals Section</option>
                  <option value="best_sellers">Best Sellers Section</option>
                </select>
              </div>

              <div className="km-field">
                <label className="km-label">
                  Title {isReq && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  className="km-input" type="text"
                  placeholder="e.g. New Arrivals"
                  required={isReq}
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="km-field">
                <label className="km-label">
                  Subtitle {isReq && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  className="km-input" type="text"
                  placeholder="e.g. Fresh Styles"
                  required={isReq}
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div className="km-field">
                <label className="km-label">
                  Link/URL {isReq && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  className="km-input" type="text"
                  placeholder="e.g. #shop"
                  required={isReq}
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
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
                    ? <img src={`${API}/${row.image}`} alt={row.title || `Banner ${row.id}`}
                        width="60" height="36"
                        style={{ objectFit: 'cover', borderRadius: 4 }} />
                    : '🖼️'}
                </div>
              </td>
              <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{sectionLabel}</td>
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