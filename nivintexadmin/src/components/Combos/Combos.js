import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import ImageUploadPreview from '../common/ImageUploadPreview';
import CharWordCounter from '../common/CharWordCounter';
import { validateFields, isOverLimit } from '../../utils/textValidation';

const API = process.env.REACT_APP_API_URL;
const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };

const resolveImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('data:') || image.startsWith('http')) return image;
  const base = (API || '').replace(/\/$/, '');
  return `${base}${image.startsWith('/') ? image : `/${image}`}`;
};

export default function Combos({ showToast }) {
  // Navigation / Drill-down state
  const [activeRoot, setActiveRoot] = useState(null); // holds the Root Combo object currently selected

  // Products list for Child Combo product selector
  const [allProducts, setAllProducts] = useState([]);

  // Root Combos states
  const [roots, setRoots] = useState([]);
  const [rootsLoading, setRootsLoading] = useState(true);
  const [showRootForm, setShowRootForm] = useState(false);
  const [editingRootId, setEditingRootId] = useState(null);
  const [rootFormData, setRootFormData] = useState({ name: '', status: 'Active' });
  const [rootImageFile, setRootImageFile] = useState(null);
  const [existingRootImage, setExistingRootImage] = useState(null);

  // Child Combos states
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChildId, setEditingChildId] = useState(null);
  const [childFormData, setChildFormData] = useState({
    name: '',
    type: 'Fixed',
    status: 'Active',
    shortDescription: '',
    fullDescription: '',
    originalPrice: '',
    comboPrice: '',
  });
  const [childImageFile, setChildImageFile] = useState(null);
  const [existingChildImage, setExistingChildImage] = useState(null);
  
  // Child Combo product selection state
  const [selectedProducts, setSelectedProducts] = useState([]); // array of { productId, quantity }
  const [productSearch, setProductSearch] = useState('');

  // Fetch Root Combos and Products on mount
  useEffect(() => {
    fetchRootCombos();
    fetchStoreProducts();
  }, []);

  // Fetch Child Combos when active root changes
  useEffect(() => {
    if (activeRoot) {
      fetchChildCombos(activeRoot.id);
    }
  }, [activeRoot]);

  // API - Fetch Root Combos
  const fetchRootCombos = () => {
    setRootsLoading(true);
    fetch(`${API}/combos`)
      .then(r => r.json())
      .then(data => {
        setRoots(Array.isArray(data) ? data : []);
        setRootsLoading(false);
      })
      .catch(() => {
        showToast('Error', 'Failed to load Root Combos.');
        setRootsLoading(false);
      });
  };

  // API - Fetch Child Combos
  const fetchChildCombos = (rootId) => {
    setChildrenLoading(true);
    fetch(`${API}/combos/${rootId}/children`)
      .then(r => r.json())
      .then(data => {
        setChildren(Array.isArray(data) ? data : []);
        setChildrenLoading(false);
      })
      .catch(() => {
        showToast('Error', 'Failed to load Child Combos.');
        setChildrenLoading(false);
      });
  };

  // API - Fetch All products for assignment
  const fetchStoreProducts = () => {
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(data => {
        setAllProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        console.error('Failed to load products list for selector.');
      });
  };

  // ── ROOT COMBO ACTIONS ──────────────────────────────────────────

  const closeRootForm = () => {
    setShowRootForm(false);
    setEditingRootId(null);
    setRootFormData({ name: '', status: 'Active' });
    setRootImageFile(null);
    setExistingRootImage(null);
  };

  const handleEditRootClick = (e, root) => {
    e.stopPropagation();
    setEditingRootId(root.id);
    setRootFormData({ name: root.name, status: root.status });
    setRootImageFile(null);
    setExistingRootImage(root.image || null);
    setShowRootForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRootSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateFields([
      { value: rootFormData.name, fieldName: 'Combo Name', required: true, maxChars: 60, maxWords: 8 },
    ]);
    if (validationError) {
      showToast('Validation Error', validationError);
      return;
    }

    const data = new FormData();
    data.append('name', rootFormData.name);
    data.append('status', rootFormData.status);
    if (rootImageFile) {
      data.append('image', rootImageFile);
    }

    const method = editingRootId ? 'PUT' : 'POST';
    const url = editingRootId 
      ? `${API}/combos/update/${editingRootId}`
      : `${API}/combos/add`;

    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        showToast(
          editingRootId ? 'Updated!' : 'Added!',
          editingRootId ? 'Root combo updated successfully.' : 'New root combo added.'
        );
        closeRootForm();
        fetchRootCombos();
      } else {
        const err = await res.json();
        showToast('Failed', err.error || 'Operation could not be completed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const handleDeleteRoot = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this Root Combo? This will also delete all its Child Combos.')) return;
    try {
      const res = await fetch(`${API}/combos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Deleted!', 'Root Combo deleted.');
        fetchRootCombos();
      } else {
        showToast('Failed', 'Could not delete Root Combo.');
      }
    } catch {
      showToast('Error', 'Something went wrong.');
    }
  };

  // ── CHILD COMBO ACTIONS ─────────────────────────────────────────

  const closeChildForm = () => {
    setShowChildForm(false);
    setEditingChildId(null);
    setChildFormData({
      name: '',
      type: 'Fixed',
      status: 'Active',
      shortDescription: '',
      fullDescription: '',
      originalPrice: '',
      comboPrice: '',
    });
    setChildImageFile(null);
    setExistingChildImage(null);
    setSelectedProducts([]);
    setProductSearch('');
  };

  const handleEditChildClick = (child) => {
    setEditingChildId(child.id);
    setChildFormData({
      name: child.name,
      type: child.type || 'Fixed',
      status: child.status || 'Active',
      shortDescription: child.shortDescription || '',
      fullDescription: child.fullDescription || '',
      originalPrice: child.originalPrice?.toString() || '',
      comboPrice: child.comboPrice?.toString() || '',
    });
    setChildImageFile(null);
    setExistingChildImage(child.image || null);
    
    // Set selected products
    const linked = (child.ComboProducts || []).map(cp => ({
      productId: cp.productId,
      quantity: cp.quantity || 1
    }));
    setSelectedProducts(linked);
    
    setShowChildForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChildSubmit = async (e) => {
    e.preventDefault();
    const { name, originalPrice, comboPrice, shortDescription, fullDescription } = childFormData;

    const validationError = validateFields([
      { value: name, fieldName: 'Combo Pack Name', required: true, maxChars: 80, maxWords: 12 },
      { value: shortDescription, fieldName: 'Short Description', maxChars: 160, maxWords: 30 },
      { value: fullDescription, fieldName: 'Detailed Description', maxChars: 1000, maxWords: 160 },
    ]);
    if (validationError) {
      showToast('Validation Error', validationError);
      return;
    }

    if (!originalPrice || !comboPrice) {
      showToast('Validation Error', 'Please fill in original and combo price.');
      return;
    }

    if (selectedProducts.length === 0) {
      showToast('Validation Error', 'Please select at least one product for this combo.');
      return;
    }

    const data = new FormData();
    data.append('rootComboId', activeRoot.id);
    data.append('name', name);
    data.append('type', childFormData.type);
    data.append('status', childFormData.status);
    data.append('shortDescription', childFormData.shortDescription);
    data.append('fullDescription', childFormData.fullDescription);
    data.append('originalPrice', originalPrice);
    data.append('comboPrice', comboPrice);
    data.append('products', JSON.stringify(selectedProducts));

    if (childImageFile) {
      data.append('image', childImageFile);
    }

    const method = editingChildId ? 'PUT' : 'POST';
    const url = editingChildId
      ? `${API}/combos/children/update/${editingChildId}`
      : `${API}/combos/children/add`;

    try {
      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        showToast(
          editingChildId ? 'Updated!' : 'Added!',
          editingChildId ? 'Child combo updated successfully.' : 'New child combo added.'
        );
        closeChildForm();
        fetchChildCombos(activeRoot.id);
      } else {
        const err = await res.json();
        showToast('Failed', err.error || 'Operation could not be completed.');
      }
    } catch {
      showToast('Server Error', 'Something went wrong. Try again.');
    }
  };

  const handleDeleteChild = async (id) => {
    if (!window.confirm('Delete this Child Combo?')) return;
    try {
      const res = await fetch(`${API}/combos/children/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Deleted!', 'Child Combo deleted.');
        fetchChildCombos(activeRoot.id);
      } else {
        showToast('Failed', 'Could not delete Child Combo.');
      }
    } catch {
      showToast('Error', 'Something went wrong.');
    }
  };

  // Product Selection Handlers
  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => {
      const idx = prev.findIndex(p => p.productId === productId);
      if (idx > -1) {
        return prev.filter(p => p.productId !== productId);
      } else {
        return [...prev, { productId, quantity: 1 }];
      }
    });
  };

  const handleProductQtyChange = (productId, qty) => {
    setSelectedProducts(prev => 
      prev.map(p => p.productId === productId ? { ...p, quantity: Math.max(1, parseInt(qty) || 1) } : p)
    );
  };

  // Filter products by search term
  const filteredProducts = allProducts.filter(p => 
    p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.Brand?.brandName || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    p.id.toString() === productSearch
  );

  return (
    <div>
      {/* ── ROOT COMBO MANAGER ────────────────────────────────────── */}
      {activeRoot === null ? (
        <div>
          <div className="section-header">
            <div className="section-title">Combos Group Manager</div>
            <button className="action-btn btn-edit" onClick={() => showRootForm ? closeRootForm() : setShowRootForm(true)}>
              {showRootForm ? 'Close' : '+ Add Combo Group'}
            </button>
          </div>

          {showRootForm && (
            <div className="km-form-card">
              <div className="km-form-header">
                <div className="km-form-header-icon">{editingRootId ? 'E' : 'C'}</div>
                <div>
                  <div className="km-form-header-title">{editingRootId ? 'Edit Combo Group' : 'Add New Combo Group'}</div>
                  <div className="km-form-header-sub">Creates a top-level combo group shown in the storefront sidebar</div>
                </div>
              </div>

              <div className="km-form-body">
                <form className="km-form-grid" onSubmit={handleRootSubmit}>
                  
                  <div className="km-field">
                    <label className="km-label">Combo Name *</label>
                    <input
                      className={`km-input ${isOverLimit(rootFormData.name, { maxChars: 60, maxWords: 8 }) ? 'km-input-error' : ''}`}
                      type="text" placeholder="e.g. Birthday Combos" required
                      value={rootFormData.name}
                      onChange={e => setRootFormData({ ...rootFormData, name: e.target.value })}
                    />
                    <CharWordCounter
                      value={rootFormData.name}
                      maxChars={60}
                      maxWords={8}
                      hint="Top-level category or theme name"
                    />
                  </div>

                  <div className="km-field">
                    <label className="km-label">Status</label>
                    <select className="km-select" value={rootFormData.status}
                      onChange={e => setRootFormData({ ...rootFormData, status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <ImageUploadPreview
                    label="Sidebar Image (Optional)"
                    file={rootImageFile}
                    existingUrl={existingRootImage ? resolveImageSrc(existingRootImage) : null}
                    onChange={setRootImageFile}
                    onRemove={() => setRootImageFile(null)}
                    helpText="Recommended: 5:6 aspect ratio image"
                    previewMaxHeight={140}
                  />

                  <button type="submit" className="km-btn-submit">
                    {editingRootId ? 'Update Combo Group' : 'Save Combo Group'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {rootsLoading ? (
            <p className="km-loading">Loading combos...</p>
          ) : (
            <DataTable
              columns={['ID', 'Image', 'Combo Name', 'Child Combos', 'Status', 'Actions']}
              initialRows={roots}
              renderRow={(row) => (
                <tr key={row.id} onClick={() => setActiveRoot(row)} style={{ cursor: 'pointer' }}>
                  <td className="td-id">#{row.id}</td>
                  <td>
                    <div className="img-thumb">
                      {row.image
                        ? <img src={resolveImageSrc(row.image)} alt={row.name} width="36" height="36" style={{ borderRadius: 6, objectFit: 'cover' }} />
                        : '🎁'}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td>
                    <span style={{
                      background: '#EEF2F9', color: '#2C2F33',
                      padding: '2px 8px', borderRadius: 12,
                      fontSize: 11, fontWeight: 700
                    }}>
                      {row.childCombosCount} item{row.childCombosCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td><span className={`status-pill ${pillClass[row.status] || 'pill-active'}`}>{row.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="action-btn btn-edit" onClick={() => setActiveRoot(row)}>Manage Children</button>
                      <button className="action-btn btn-edit" onClick={(e) => handleEditRootClick(e, row)}>Edit</button>
                      <button className="action-btn btn-del" onClick={(e) => handleDeleteRoot(e, row.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      ) : (
        /* ── CHILD COMBO MANAGER ─────────────────────────────────── */
        <div>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={() => { closeChildForm(); setActiveRoot(null); }}
                style={{
                  background: '#EEF2F9', border: 'none',
                  borderRadius: 6, padding: '6px 12px',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500
                }}
              >
                ← Back
              </button>
              <div className="section-title">
                {activeRoot.name} <span style={{ fontSize: 13, color: '#aaa', fontWeight: 400 }}>({children.length} child combos)</span>
              </div>
            </div>
            <button className="action-btn btn-edit" onClick={() => showChildForm ? closeChildForm() : setShowChildForm(true)}>
              {showChildForm ? 'Close' : '+ Add Child Combo'}
            </button>
          </div>

          {showChildForm && (
            <div className="km-form-card">
              <div className="km-form-header">
                <div className="km-form-header-icon">{editingChildId ? 'E' : 'C'}</div>
                <div>
                  <div className="km-form-header-title">{editingChildId ? 'Edit Combo Package' : 'Add Combo Package'}</div>
                  <div className="km-form-header-sub">Configure a combo set package with custom items and discounted pricing</div>
                </div>
              </div>

              <div className="km-form-body">
                <form className="km-form-grid" onSubmit={handleChildSubmit}>
                  
                  <div className="km-field">
                    <label className="km-label">Combo Pack Name *</label>
                    <input
                      className={`km-input ${isOverLimit(childFormData.name, { maxChars: 80, maxWords: 12 }) ? 'km-input-error' : ''}`}
                      type="text" placeholder="e.g. Kurti Combo Set of 2" required
                      value={childFormData.name}
                      onChange={e => setChildFormData({ ...childFormData, name: e.target.value })}
                    />
                    <CharWordCounter
                      value={childFormData.name}
                      maxChars={80}
                      maxWords={12}
                      hint="Display name for this combo deal"
                    />
                  </div>

                  <div className="km-field">
                    <label className="km-label">Type</label>
                    <select className="km-select" value={childFormData.type}
                      onChange={e => setChildFormData({ ...childFormData, type: e.target.value })}>
                      <option value="Fixed">Fixed Combo</option>
                      <option value="Mix & Match">Mix & Match</option>
                    </select>
                  </div>

                  <div className="km-field">
                    <label className="km-label">Original Price (₹) *</label>
                    <input className="km-input" type="number" min="0" step="0.01" placeholder="e.g. 1999" required
                      value={childFormData.originalPrice}
                      onChange={e => setChildFormData({ ...childFormData, originalPrice: e.target.value })} />
                  </div>

                  <div className="km-field">
                    <label className="km-label">Combo Deal Price (₹) *</label>
                    <input className="km-input" type="number" min="0" step="0.01" placeholder="e.g. 1499" required
                      value={childFormData.comboPrice}
                      onChange={e => setChildFormData({ ...childFormData, comboPrice: e.target.value })} />
                  </div>

                  <div className="km-field km-field-full">
                    <label className="km-label">Short Description</label>
                    <input
                      className={`km-input ${isOverLimit(childFormData.shortDescription, { maxChars: 160, maxWords: 30 }) ? 'km-input-error' : ''}`}
                      type="text" placeholder="e.g. Get two handloom Kurtis of your choice at a special deal price"
                      value={childFormData.shortDescription}
                      onChange={e => setChildFormData({ ...childFormData, shortDescription: e.target.value })}
                    />
                    <CharWordCounter
                      value={childFormData.shortDescription}
                      maxChars={160}
                      maxWords={30}
                      hint="Brief summary for combo cards"
                    />
                  </div>

                  <div className="km-field km-field-full">
                    <label className="km-label">Detailed Description / Inclusions</label>
                    <textarea
                      className={`km-input ${isOverLimit(childFormData.fullDescription, { maxChars: 1000, maxWords: 160 }) ? 'km-input-error' : ''}`}
                      rows="3" placeholder="Describe the fabrics, package content, customisation rules..."
                      style={{ resize: 'vertical' }}
                      value={childFormData.fullDescription}
                      onChange={e => setChildFormData({ ...childFormData, fullDescription: e.target.value })}
                    />
                    <CharWordCounter
                      value={childFormData.fullDescription}
                      maxChars={1000}
                      maxWords={160}
                      hint="Full specifications, inclusions, or fabric details"
                    />
                  </div>

                  <div className="km-field">
                    <label className="km-label">Status</label>
                    <select className="km-select" value={childFormData.status}
                      onChange={e => setChildFormData({ ...childFormData, status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <ImageUploadPreview
                    label="Combo Cover Image"
                    className="km-field"
                    file={childImageFile}
                    existingUrl={existingChildImage ? resolveImageSrc(existingChildImage) : null}
                    onChange={setChildImageFile}
                    onRemove={() => setChildImageFile(null)}
                    helpText="Product cover image for combo item"
                    previewMaxHeight={110}
                  />

                  {/* Product Association Selector */}
                  <div className="km-field km-field-full" style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16, marginTop: 8 }}>
                    <label className="km-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Select Products Included in Combo *</span>
                      <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 4, outline: 'none' }}
                      />
                    </label>
                    
                    <div style={{
                      maxHeight: 240, overflowY: 'auto',
                      border: '1px solid #E5E7EB', borderRadius: 8,
                      background: '#F9FAFB', padding: 8, marginTop: 8,
                      display: 'flex', flexDirection: 'column', gap: 6
                    }}>
                      {filteredProducts.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: 12 }}>No products found</p>
                      ) : (
                        filteredProducts.map(p => {
                          const isSelected = selectedProducts.some(sp => sp.productId === p.id);
                          const currentQty = selectedProducts.find(sp => sp.productId === p.id)?.quantity || 1;
                          
                          return (
                            <div key={p.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '6px 10px', background: isSelected ? '#EEF2F9' : '#fff',
                              border: '1px solid #E5E7EB', borderRadius: 6,
                            }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, flex: 1, margin: 0 }}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => handleProductToggle(p.id)}
                                />
                                {p.image && (
                                  <img src={resolveImageSrc(p.image)} alt="" width="26" height="26" style={{ objectFit: 'cover', borderRadius: 4 }} />
                                )}
                                <div>
                                  <span style={{ fontWeight: 600 }}>{p.productName}</span>
                                  {p.Brand?.brandName && <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>({p.Brand.brandName})</span>}
                                </div>
                              </label>

                              {isSelected && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 11, color: '#666' }}>Qty:</span>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={currentQty}
                                    onChange={e => handleProductQtyChange(p.id, e.target.value)}
                                    style={{ width: 48, padding: '2px 4px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      {selectedProducts.length} product(s) selected for this package
                    </p>
                  </div>

                  <button type="submit" className="km-btn-submit" style={{ gridColumn: 'span 2' }}>
                    {editingChildId ? 'Update Combo Package' : 'Save Combo Package'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {childrenLoading ? (
            <p className="km-loading">Loading combo packages...</p>
          ) : (
            <DataTable
              columns={['ID', 'Image', 'Name', 'Type', 'Original Price', 'Deal Price', 'Products List', 'Status', 'Actions']}
              initialRows={children}
              renderRow={(row) => {
                const prods = row.ComboProducts || [];
                return (
                  <tr key={row.id}>
                    <td className="td-id">#{row.id}</td>
                    <td>
                      <div className="img-thumb">
                        {row.image
                          ? <img src={resolveImageSrc(row.image)} alt={row.name} width="36" height="36" style={{ borderRadius: 6, objectFit: 'cover' }} />
                          : '🛍️'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.name}</div>
                      {row.shortDescription && (
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.shortDescription}</div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        background: row.type === 'Fixed' ? '#E0F2FE' : '#FEF3C7',
                        color: row.type === 'Fixed' ? '#0369A1' : '#B45309',
                        padding: '2px 8px', borderRadius: 4,
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ textDecoration: 'line-through', color: '#aaa' }}>₹{Number(row.originalPrice).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#0f5447' }}>₹{Number(row.comboPrice).toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                        {prods.map(cp => (
                          <span key={cp.id} style={{
                            fontSize: 10, background: '#EEF2F9',
                            padding: '2px 6px', borderRadius: 4,
                            whiteSpace: 'nowrap'
                          }}>
                            {cp.Product?.productName || `Prod #${cp.productId}`} (x{cp.quantity || 1})
                          </span>
                        ))}
                        {prods.length === 0 && <span style={{ color: '#aaa', fontSize: 11 }}>No products</span>}
                      </div>
                    </td>
                    <td><span className={`status-pill ${pillClass[row.status] || 'pill-active'}`}>{row.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="action-btn btn-edit" onClick={() => handleEditChildClick(row)}>Edit</button>
                        <button className="action-btn btn-del" onClick={() => handleDeleteChild(row.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
