import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';

const API = process.env.REACT_APP_API_URL;
const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };

// Accepted file types for the upload input
const ACCEPT = 'image/*,video/*';

// Derive a display label for media type
const mediaLabel = (type) => (type === 'video' ? '🎬 Video' : '🖼️ Image');

export default function InstagramPosts({ showToast }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    label:     '',
    tag:       '',
    postUrl:   '',
    sortOrder: 1,
    status:    'Active',
  });

  const [mediaFile, setMediaFile]   = useState(null);   // File object
  const [previewUrl, setPreviewUrl] = useState(null);   // object URL or existing URL
  const [previewType, setPreviewType] = useState('image'); // 'image' | 'video'

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = () => {
    setLoading(true);
    fetch(`${API}/instagram-posts/admin`)
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { showToast('Load Failed', 'Could not load Instagram posts.'); setLoading(false); });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ label: '', tag: '', postUrl: '', sortOrder: 1, status: 'Active' });
    setMediaFile(null);
    setPreviewUrl(null);
    setPreviewType('image');
  };

  const handleEditClick = (post) => {
    setEditingId(post.id);
    setFormData({
      label:     post.label     || '',
      tag:       post.tag       || '',
      postUrl:   post.postUrl   || '',
      sortOrder: post.sortOrder || 1,
      status:    post.status    || 'Active',
    });
    setMediaFile(null);

    if (post.image) {
      setPreviewUrl(`${API}/${post.image}`);
      setPreviewType(post.mediaType || 'image');
    } else {
      setPreviewUrl(null);
      setPreviewType('image');
    }

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewType(file.type.startsWith('video/') ? 'video' : 'image');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mediaFile && !previewUrl) {
      showToast('Validation Error', 'Image or Video is required.');
      return;
    }

    const data = new FormData();
    data.append('label',     formData.label);
    data.append('tag',       formData.tag);
    data.append('postUrl',   formData.postUrl);
    data.append('sortOrder', formData.sortOrder);
    data.append('status',    formData.status);
    if (mediaFile) data.append('image', mediaFile); // key stays 'image' — backend handles both

    const method = editingId ? 'PUT' : 'POST';
    const url    = editingId
      ? `${API}/instagram-posts/update/${editingId}`
      : `${API}/instagram-posts/add`;

    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        showToast(
          editingId ? 'Updated!' : 'Added!',
          editingId ? 'Post updated successfully.' : 'New post added.'
        );
        closeForm();
        fetchPosts();
      } else {
        const err = await res.json();
        showToast('Failed', err.error || 'Operation could not be completed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this Instagram post?')) return;
    try {
      const res = await fetch(`${API}/instagram-posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows(prev => prev.filter(r => r.id !== id));
        showToast('Deleted!', 'Post removed successfully.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Instagram Posts</div>
        <button
          className="action-btn btn-edit"
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
        >
          {showForm ? 'Close' : '+ Add Post'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? 'E' : 'IG'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Instagram Post' : 'Add New Instagram Post'}
              </div>
              <div className="km-form-header-sub">All fields are required</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>



              {/* Sort Order */}
              <div className="km-field">
                <label className="km-label">Sort Order <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="km-input"
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={formData.sortOrder}
                  onChange={set('sortOrder')}
                  required
                />
              </div>

              {/* Status */}
              <div className="km-field">
                <label className="km-label">Status <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="km-select"
                  value={formData.status}
                  onChange={set('status')}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Instagram URL */}
              <div className="km-field km-field-full">
                <label className="km-label">Instagram Post URL <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. https://instagram.com/p/..."
                  value={formData.postUrl}
                  onChange={set('postUrl')}
                  required
                />
              </div>

              {/* Media upload — image OR video */}
              <div className="km-field km-field-full">
                <label className="km-label">Image or Video <span style={{ color: 'red' }}>*</span></label>
                <div className="km-file-zone">
                  <div className="km-file-icon">↑</div>
                  {mediaFile
                    ? <p className="km-file-selected">✓ {mediaFile.name}</p>
                    : <p className="km-file-label">Click to upload image or video</p>}
                  <input
                    type="file"
                    accept={ACCEPT}
                    onChange={handleMediaChange}
                  />
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div style={{ marginTop: 10 }}>
                    {previewType === 'video' ? (
                      <video
                        src={previewUrl}
                        controls
                        muted
                        style={{
                          width: 180,
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid #e0e0e0',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid #e0e0e0',
                        }}
                      />
                    )}
                    <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      {previewType === 'video' ? '🎬 Video preview' : '🖼️ Image preview'}
                    </p>
                  </div>
                )}
              </div>

              <button type="submit" className="km-btn-submit">
                {editingId ? 'Update Post' : 'Save Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading Instagram posts...</p>
      ) : (
        <DataTable
          columns={['ID', 'Preview', 'Type', 'Sort', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="td-id">#{row.id}</td>

              {/* Thumbnail / video badge */}
              <td>
                <div className="img-thumb">
                  {row.image ? (
                    row.mediaType === 'video' ? (
                      <video
                        src={`${API}/${row.image}`}
                        muted
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <img
                        src={`${API}/${row.image}`}
                        alt={row.label}
                        width="48"
                        height="48"
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    )
                  ) : '📷'}
                </div>
              </td>



              {/* Media type badge */}
              <td>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: row.mediaType === 'video' ? '#fff3e0' : '#e8f5e9',
                  color:      row.mediaType === 'video' ? '#e65100' : '#2e7d32',
                }}>
                  {mediaLabel(row.mediaType)}
                </span>
              </td>

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
          )}
        />
      )}
    </div>
  );
}