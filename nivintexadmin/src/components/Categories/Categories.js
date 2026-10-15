import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { categoryApi, getImageUrl } from '../../api';
import defaultLogo from '../../assets/logo.png';

const categoriesFromBilling = Boolean(process.env.REACT_APP_API_FROM_BILLING_URL);

export default function Categories({ showToast }) {
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const [status, setStatus]         = useState('Active');
  const [imageFile, setImageFile]   = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = () => {
    setLoading(true);
    categoryApi.getAll()
      .then((data) => {
        setRows(Array.isArray(data) ? data : [])
  })
      .catch(() => showToast('Load Failed', 'Could not load categories.'))
      .finally(() => setLoading(false));
  };

  const handleEditClick = (cat) => {
    setEditingId(cat.id); setCategoryName(cat.name);
    setStatus(cat.status || 'Active');
    setImageFile(null);   setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) { showToast('Missing Name', 'Please enter a category name.'); return; }

    const formData = new FormData();
    formData.append('name', categoryName);

    formData.append('status', status);
    if (imageFile) formData.append('image', imageFile);

    try {
      if (editingId) {
        await categoryApi.update(editingId, formData);
        showToast('Updated!', 'Category updated successfully.');
      } else {
        await categoryApi.add(formData);
        showToast('Added!', 'New category added.');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      showToast('Failed', err.message || 'Operation could not be completed.');
    }
  };

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setCategoryName(''); setStatus('Active'); setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await categoryApi.remove(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      showToast('Deleted!', 'Category removed successfully.');
    } catch (err) {
      showToast('Delete Failed', err.message || 'Could not delete category.');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Categories</div>
        {!categoriesFromBilling && <button
          className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
        >
          {showForm ? 'Close' : '+ Add Category'}
        </button>}
      </div>

      {showForm && !categoriesFromBilling && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">C</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Category' : 'Add New Category'}</div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>
              <div className="km-field km-field-half">
                <label className="km-label">Category Name</label>
                <input
                  className="km-input" type="text" placeholder="e.g. Kurthis" required
                  value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>

              <div className="km-field km-field-half">
                <label className="km-label">Status</label>
                <select
                  className="km-input"
                  value={status} onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">
                  Category Image {editingId && '(Leave blank to keep current)'}
                </label>
                <div className="km-file-zone">
                  <div className="km-file-icon">↑</div>
                  {imageFile
                    ? <p className="km-file-selected">✓ {imageFile.name}</p>
                    : <p className="km-file-label">Click to upload image</p>}
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                </div>
              </div>

              <button type="submit" className="km-btn-submit">
                {editingId ? 'Update Category' : 'Save Category'}
              </button>
              <button type="button" className="km-btn-cancel" onClick={resetForm}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading categories...</p>
      ) : (
        <DataTable
          columns={categoriesFromBilling ? ['ID', 'Image', 'Category Name', 'Status'] : ['ID', 'Image', 'Category Name', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="td-id">#{row.id}</td>
              <td>
                <div className="img-thumb">
                  {row.image
                    ? <img
                        src={getImageUrl(row.image)} alt={row.name}
                        width="40" height="40"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.src = defaultLogo; e.target.style.objectFit = 'contain'; e.target.style.background = '#126354'; e.target.style.padding = '4px'; }}
                      />
                    : <div style={{ width: 40, height: 40, background: '#126354', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={defaultLogo} alt="Default Logo"
                          style={{ width: '80%', height: 'auto', objectFit: 'contain' }}
                        />
                      </div>
                  }
                </div>
              </td>
              <td className="td-strong">{row.name}</td>

              <td>
                <span className={`status-badge ${row.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                  {row.status}
                </span>
              </td>
              {!categoriesFromBilling && <td>
                <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                <button className="action-btn btn-del"  onClick={() => handleDelete(row.id)}>Delete</button>
              </td>}
            </tr>
          )}
        />
      )}
    </div>
  );
}
