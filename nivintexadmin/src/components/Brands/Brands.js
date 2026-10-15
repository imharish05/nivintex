import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';

const API = process.env.REACT_APP_API_URL;
const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };

export default function Brands({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ brandName: '', status: 'Active' });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = () => {
    setLoading(true);
    fetch(`${API}/brands`)
      .then(r => r.json())
      .then(data => { setRows(data); setLoading(false); })
      .catch(() => { showToast('Load Failed', 'Could not load brands.'); setLoading(false); });
  };

  const closeForm = () => {
    setShowForm(false); setEditingId(null);
    setFormData({ brandName: '', status: 'Active' }); setLogoFile(null);
  };

  const handleEditClick = (brand) => {
    setEditingId(brand.id);
    setFormData({ brandName: brand.brandName, status: brand.status || 'Active' });
    setLogoFile(null); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('brandName', formData.brandName);
    data.append('status', formData.status);
    if (logoFile) data.append('logo', logoFile);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API}/brands/update/${editingId}` : `${API}/brands/add`;
    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        showToast(editingId ? 'Updated!' : 'Added!', editingId ? 'Brand updated successfully.' : 'New brand added.');
        closeForm(); fetchBrands();
      } else {
        const err = await res.json();
        showToast('Failed', err.error || 'Operation could not be completed.');
      }
    } catch { showToast('Server Error', 'Something went wrong. Try again.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      const res = await fetch(`${API}/brands/${id}`, { method: 'DELETE' });
      if (res.ok) { setRows(prev => prev.filter(r => r.id !== id)); showToast('Deleted!', 'Brand removed successfully.'); }
    } catch { showToast('Server Error', 'Something went wrong. Try again.'); }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Brands</div>
        <button className="action-btn btn-edit" onClick={() => showForm ? closeForm() : setShowForm(true)}>
          {showForm ? 'Close' : '+ Add Brand'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? 'E' : 'B'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Brand' : 'Add New Brand'}</div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              <div className="km-field">
                <label className="km-label">Brand Name</label>
                <input className="km-input" type="text" placeholder="e.g. Nestlé" required
                  value={formData.brandName}
                  onChange={e => setFormData({ ...formData, brandName: e.target.value })} />
              </div>

              <div className="km-field">
                <label className="km-label">Status</label>
                <select className="km-select" value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">Brand Logo (Optional)</label>
                <div className="km-file-zone">
                  <div className="km-file-icon">↑</div>
                  {logoFile
                    ? <p className="km-file-selected">✓ {logoFile.name}</p>
                    : <p className="km-file-label">Click to upload image</p>}
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
                </div>
              </div>

              <button type="submit" className="km-btn-submit">
                {editingId ? 'Update Brand' : 'Save Brand'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading brands...</p>
      ) : (
        <DataTable
          columns={['ID', 'Logo', 'Brand Name', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="td-id">#{row.id}</td>
              <td>
                <div className="img-thumb">
                  {row.logo
                    ? <img src={`${API}/${row.logo}`} alt={row.brandName} width="36" height="36" />
                    : '🏷️'}
                </div>
              </td>
              <td>{row.brandName}</td>
              <td><span className={`status-pill ${pillClass[row.status] || 'pill-active'}`}>{row.status}</span></td>
              <td>
                <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}