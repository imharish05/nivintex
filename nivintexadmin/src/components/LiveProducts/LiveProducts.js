import { useState, useEffect, useRef } from 'react';
import DataTable from '../DataTable/DataTable';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };

const mediaUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const clean = filePath.replace(/\\/g, '/');
  if (clean.startsWith('uploads/')) {
    return `${API}/uploads/${clean.slice('uploads/'.length)}`;
  }
  return `${API}/${clean}`;
};

export default function LiveProducts({ showToast }) {
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editingRow, setEditingRow] = useState(null);

  // ── All products for the dropdown ──────────────────────────────
  const [allProducts, setAllProducts]         = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch]     = useState('');

  const [formData, setFormData] = useState({
    title: '', price: '', originalPrice: '', discountPercent: '',
    productId: '', sortOrder: 1, status: 'Active', mediaType: 'image',
  });
  const [imageFile, setImageFile]     = useState(null);
  const [videoFile, setVideoFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const videoPreviewRef = useRef(null);

  // ── Fetch live products ─────────────────────────────────────────
  useEffect(() => { fetchItems(); }, []);

  // ── Fetch all products for dropdown (once, on mount) ───────────
  useEffect(() => {
    setProductsLoading(true);
    fetch(`${API}/products?limit=1000`)
      .then(r => r.json())
      .then(data => {
        // Handle both array and paginated { products: [] } shapes
        const list = Array.isArray(data) ? data : data.products || data.rows || [];
        setAllProducts(list);
        setProductsLoading(false);
      })
      .catch(() => {
        showToast('Warning', 'Could not load product list for dropdown.');
        setProductsLoading(false);
      });
  }, []);

  const fetchItems = () => {
    setLoading(true);
    fetch(`${API}/live-products`)
      .then(r => r.json())
      .then(data => { setRows(data); setLoading(false); })
      .catch(() => {
        showToast('Load Failed', 'Could not load live products.');
        setLoading(false);
      });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingRow(null);
    setFormData({
      title: '', price: '', originalPrice: '', discountPercent: '',
      productId: '', sortOrder: 1, status: 'Active', mediaType: 'image',
    });
    setImageFile(null);
    setVideoFile(null);
    setImagePreview(null);
    setVideoPreview(null);
    setProductSearch('');
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setEditingRow(row);
    setFormData({
      title:           row.title           || '',
      price:           row.price           || '',
      originalPrice:   row.originalPrice   || '',
      discountPercent: row.discountPercent  || '',
      productId:       row.productId       || '',
      sortOrder:       row.sortOrder       || 1,
      status:          row.status          || 'Active',
      mediaType:       row.mediaType       || 'image',
    });
    setImageFile(null);
    setVideoFile(null);
    setImagePreview(null);
    setVideoPreview(null);
    setProductSearch('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    if (imageFile) data.append('image', imageFile);
    if (videoFile) data.append('video', videoFile);

    const method = editingId ? 'PUT' : 'POST';
    const url    = editingId
      ? `${API}/live-products/update/${editingId}`
      : `${API}/live-products/add`;

    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        showToast(
          editingId ? 'Updated!' : 'Added!',
          editingId ? 'Live product updated.' : 'Live product added.'
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this live product?')) return;
    try {
      const res = await fetch(`${API}/live-products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows(prev => prev.filter(r => r.id !== id));
        showToast('Deleted!', 'Live product removed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong.');
    }
  };

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const currentImageSrc = imagePreview || (editingRow ? mediaUrl(editingRow.image) : null);
  const currentVideoSrc = videoPreview || (editingRow ? mediaUrl(editingRow.video) : null);

  // ── Filtered product list for dropdown search ───────────────────
  const filteredProducts = productSearch.trim()
    ? allProducts.filter(p =>
        (p.name || p.title || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        String(p.id).includes(productSearch)
      )
    : allProducts;

  // ── Label for currently selected product ───────────────────────
  const selectedProduct = allProducts.find(p => String(p.id) === String(formData.productId));
  const selectedLabel   = selectedProduct
    ? `#${selectedProduct.id} — ${selectedProduct.name || selectedProduct.title}`
    : '';

  return (
    <div>
      <div className="section-header">
        <div className="section-title">What More Live</div>
        <button
          className="action-btn btn-edit"
          onClick={() => showForm ? closeForm() : setShowForm(true)}
        >
          {showForm ? 'Close' : '+ Add Live Product'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? 'E' : 'L'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Live Product' : 'Add Live Product'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Title */}
              <div className="km-field">
                <label className="km-label">Product Title</label>
                <input className="km-input" type="text" required
                  placeholder="e.g. Rani Pink Banarasi Silk"
                  value={formData.title}
                  onChange={e => set('title', e.target.value)} />
              </div>

              {/* Media Type */}
              <div className="km-field">
                <label className="km-label">Media Type</label>
                <select className="km-select" value={formData.mediaType}
                  onChange={e => set('mediaType', e.target.value)}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Sale Price */}
              <div className="km-field">
                <label className="km-label">Sale Price (₹)</label>
                <input className="km-input" type="number" min="0" step="0.01" required
                  placeholder="e.g. 5200"
                  value={formData.price}
                  onChange={e => set('price', e.target.value)} />
              </div>

              {/* Original Price */}
              <div className="km-field">
                <label className="km-label">Original Price (₹)</label>
                <input className="km-input" type="number" min="0" step="0.01"
                  placeholder="e.g. 6500"
                  value={formData.originalPrice}
                  onChange={e => set('originalPrice', e.target.value)} />
              </div>

              {/* Discount % */}
              <div className="km-field">
                <label className="km-label">Discount %</label>
                <input className="km-input" type="number" min="0" max="100"
                  placeholder="e.g. 20"
                  value={formData.discountPercent}
                  onChange={e => set('discountPercent', e.target.value)} />
              </div>

              {/* Sort Order */}
              <div className="km-field">
                <label className="km-label">Sort Order</label>
                <input className="km-input" type="number" min="1"
                  value={formData.sortOrder}
                  onChange={e => set('sortOrder', e.target.value)} />
              </div>

              {/* Status */}
              <div className="km-field">
                <label className="km-label">Status</label>
                <select className="km-select" value={formData.status}
                  onChange={e => set('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* ── Product Link Dropdown ── */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Product Link
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#6366f1', fontWeight: 500 }}>
                    (links "View Product" button to the correct product page)
                  </span>
                </label>

                {/* Search box inside dropdown */}
                <div style={dropdownWrap}>
                  {/* Selected chip or placeholder */}
                  <div style={selectedChip(!!formData.productId)}>
                    {formData.productId ? (
                      <>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedLabel}
                        </span>
                        <button
                          type="button"
                          style={clearBtn}
                          title="Clear selection"
                          onClick={() => { set('productId', ''); setProductSearch(''); }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>
                        {productsLoading ? 'Loading products…' : '— No product linked —'}
                      </span>
                    )}
                  </div>

                  {/* Search input */}
                  <input
                    className="km-input"
                    type="text"
                    placeholder="🔍  Search by product name or ID…"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ marginTop: 6 }}
                  />

                  {/* Scrollable list */}
                  <div style={listBox}>
                    {/* None option */}
                    <div
                      style={{
                        ...listItem,
                        background: !formData.productId ? '#f0fdf4' : 'transparent',
                        color: '#6b7280',
                        fontStyle: 'italic',
                      }}
                      onClick={() => { set('productId', ''); setProductSearch(''); }}
                    >
                      — No link (unlinked) —
                    </div>

                    {filteredProducts.length === 0 && !productsLoading && (
                      <div style={{ padding: '10px 12px', color: '#9ca3af', fontSize: 13 }}>
                        No products found
                      </div>
                    )}

                    {filteredProducts.map(p => {
                      const pid    = String(p.id);
                      const name   = p.name || p.title || `Product #${p.id}`;
                      const isSelected = String(formData.productId) === pid;
                      return (
                        <div
                          key={pid}
                          style={{
                            ...listItem,
                            background: isSelected ? '#eef2ff' : 'transparent',
                            fontWeight:  isSelected ? 600 : 400,
                            color:       isSelected ? '#4f46e5' : '#111827',
                          }}
                          onClick={() => {
                            set('productId', p.id);
                            setProductSearch('');
                          }}
                        >
                          <span style={idTag}>#{p.id}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                          </span>
                          {isSelected && <span style={{ color: '#4f46e5', fontSize: 16 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Helper */}
                  {formData.productId && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#16a34a', fontWeight: 500 }}>
                      ✓ Linked to: <strong>{selectedLabel}</strong>
                      &nbsp;→ navigates to <code style={{ background: '#f0fdf4', padding: '1px 5px', borderRadius: 3 }}>/product/{formData.productId}</code>
                    </div>
                  )}
                  {!formData.productId && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b' }}>
                      ⚠ No product linked. "View Product" will show an error to the customer.
                    </div>
                  )}
                </div>
              </div>

              {/* ── Thumbnail Image ── */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Thumbnail Image
                  {editingRow?.image && !imageFile && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#888', fontWeight: 400 }}>
                      (current shown below — upload to replace)
                    </span>
                  )}
                </label>

                {currentImageSrc && (
                  <div style={previewStyle}>
                    <img
                      src={currentImageSrc}
                      alt="preview"
                      style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    {imageFile && <span style={newBadge}>NEW</span>}
                  </div>
                )}

                <div className="km-file-zone" style={{ marginTop: currentImageSrc ? 8 : 0 }}>
                  <div className="km-file-icon">🖼️</div>
                  {imageFile
                    ? <p className="km-file-selected">✓ {imageFile.name}</p>
                    : <p className="km-file-label">
                        {editingRow?.image ? 'Click to replace image' : 'Click to upload image'}
                      </p>}
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              {/* ── Video File ── */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Video File
                  {editingRow?.video && !videoFile && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#888', fontWeight: 400 }}>
                      (current shown below — upload to replace)
                    </span>
                  )}
                  {!editingRow?.video && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b', fontWeight: 400 }}>
                      ⚠ No video uploaded yet
                    </span>
                  )}
                </label>

                {currentVideoSrc && (
                  <div style={previewStyle}>
                    <video
                      ref={videoPreviewRef}
                      src={currentVideoSrc}
                      muted loop playsInline controls
                      style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 6 }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    {videoFile && <span style={newBadge}>NEW</span>}
                    {!videoFile && editingRow?.video && (
                      <span style={{ ...newBadge, background: '#6b7280' }}>SAVED</span>
                    )}
                  </div>
                )}

                <div className="km-file-zone" style={{ marginTop: currentVideoSrc ? 8 : 0 }}>
                  <div className="km-file-icon">🎬</div>
                  {videoFile
                    ? <p className="km-file-selected">✓ {videoFile.name}</p>
                    : <p className="km-file-label">
                        {editingRow?.video
                          ? 'Click to replace video (mp4, mov, webm)'
                          : 'Click to upload video (mp4, mov, webm)'}
                      </p>}
                  <input type="file" accept="video/mp4,video/mov,video/webm,video/avi"
                    onChange={handleVideoChange} />
                </div>
              </div>

              <button type="submit" className="km-btn-submit">
                {editingId ? 'Update Live Product' : 'Save Live Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading live products...</p>
      ) : (
        <DataTable
          columns={['ID', 'Image', 'Video', 'Title', 'Price', 'Original', 'Discount', 'Sort', 'Linked Product', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => {
            const linked = allProducts.find(p => String(p.id) === String(row.productId));
            return (
              <tr key={row.id}>
                <td className="td-id">#{row.id}</td>

                <td>
                  {row.image ? (
                    <img src={mediaUrl(row.image)} alt={row.title}
                      width="56" height="72"
                      style={{ objectFit: 'cover', borderRadius: 4, display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : <span style={{ color: '#ccc', fontSize: 20 }}>—</span>}
                </td>

                <td>
                  {row.video ? (
                    <video src={mediaUrl(row.video)} width="80" height="56"
                      style={{ objectFit: 'cover', borderRadius: 4, display: 'block', cursor: 'pointer' }}
                      muted playsInline
                      onMouseEnter={e => e.target.play()}
                      onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                      title="Hover to preview"
                    />
                  ) : (
                    <span style={{
                      background: '#fef3c7', color: '#92400e',
                      padding: '2px 7px', borderRadius: 4,
                      fontSize: 11, fontWeight: 600,
                    }}>No video</span>
                  )}
                </td>

                <td>{row.title}</td>
                <td>₹{parseFloat(row.price).toLocaleString()}</td>
                <td>{row.originalPrice ? `₹${parseFloat(row.originalPrice).toLocaleString()}` : '—'}</td>
                <td>
                  {row.discountPercent ? (
                    <span style={{
                      background: '#d4edda', color: '#155724',
                      padding: '2px 8px', borderRadius: 4,
                      fontWeight: 600, fontSize: 12,
                    }}>{row.discountPercent}% off</span>
                  ) : '—'}
                </td>
                <td>{row.sortOrder}</td>

                {/* Linked product column */}
                <td>
                  {linked ? (
                    <div>
                      <span style={{
                        background: '#eef2ff', color: '#4f46e5',
                        padding: '2px 7px', borderRadius: 4,
                        fontSize: 11, fontWeight: 700,
                        display: 'inline-block', marginBottom: 2,
                      }}>#{linked.id}</span>
                      <br />
                      <span style={{ fontSize: 11, color: '#374151' }}>
                        {(linked.name || linked.title || '').slice(0, 28)}
                        {(linked.name || linked.title || '').length > 28 ? '…' : ''}
                      </span>
                    </div>
                  ) : (
                    <span style={{
                      background: '#fef2f2', color: '#ef4444',
                      padding: '2px 7px', borderRadius: 4,
                      fontSize: 11, fontWeight: 600,
                    }}>⚠ Not linked</span>
                  )}
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
            );
          }}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const previewStyle = {
  position: 'relative', display: 'inline-block',
  background: '#f3f4f6', borderRadius: 8,
  padding: 8, border: '1px solid #e5e7eb',
};
const newBadge = {
  position: 'absolute', top: 6, right: 6,
  background: '#10b981', color: '#fff',
  fontSize: 10, fontWeight: 700,
  padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5,
};
const dropdownWrap = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '10px 12px',
  background: '#fafafa',
};
const selectedChip = (hasValue) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 10px', borderRadius: 6,
  background: hasValue ? '#eef2ff' : '#f3f4f6',
  border: `1px solid ${hasValue ? '#c7d2fe' : '#e5e7eb'}`,
  fontSize: 13, minHeight: 34,
  color: hasValue ? '#4f46e5' : '#9ca3af',
});
const clearBtn = {
  background: 'none', border: 'none',
  color: '#9ca3af', cursor: 'pointer',
  fontSize: 14, padding: '0 2px', lineHeight: 1,
  flexShrink: 0,
};
const listBox = {
  marginTop: 6,
  maxHeight: 220,
  overflowY: 'auto',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: '#fff',
};
const listItem = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 13,
  borderBottom: '1px solid #f3f4f6',
  transition: 'background 0.15s',
};
const idTag = {
  flexShrink: 0,
  background: '#f3f4f6',
  color: '#6b7280',
  fontSize: 11,
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: 4,
  fontFamily: 'monospace',
};