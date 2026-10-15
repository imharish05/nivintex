import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from '../DataTable/DataTable';
import { categoryApi, productApi, productSpecificationApi, sizeChartApi, variantApi, getImageUrl } from '../../api';
import defaultLogo from '../../assets/logo.png';
import Swal from 'sweetalert2';

const KM = {
  orange: '#A2C579', orangeLight: '#FEF0EB',
  blue: '#2C2F33', blueLight: '#EEF2F9', green: '#39B54A', teal: '#00B4D8',
  border: '#E5E7EB', text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
  red: '#EF4444', redLight: '#FEF2F2',
};

function stockColor(quantity) {
  if (quantity > 10) return KM.green;
  if (quantity > 0) return '#F59E0B';
  return KM.red;
}

const formCard = { background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 };
const formHeader = { background: KM.blue, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 };
const headerIcon = { width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 600 };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5 };
const labelStyle = { fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };
const emptyShippingDetails = () => ({ weightKg: '', lengthCm: '', widthCm: '', heightCm: '' });
const DEFAULT_SHIPPING_STORAGE_KEY = 'nivintex_default_shipping_package';

const confirmSizeChartDelete = async title => {
  const result = await Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'warning',
    title: 'Delete size chart?',
    text: `Delete “${title}”? Assigned products will use their category chart or the default chart.`,
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Keep chart',
    confirmButtonColor: '#b91c1c',
    cancelButtonColor: '#0f5447',
    background: '#131f33',
    color: '#fff',
    reverseButtons: true,
  });
  return result.isConfirmed;
};

const readShippingDetails = product => ({
  weightKg: product.shipping_weight_kg ?? product.shippingWeightKg ?? '',
  lengthCm: product.shipping_length_cm ?? product.shippingLengthCm ?? '',
  widthCm: product.shipping_width_cm ?? product.shippingWidthCm ?? '',
  heightCm: product.shipping_height_cm ?? product.shippingHeightCm ?? '',
});

function variantImageList(variant) {
  let images = variant.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch (_) { images = []; }
  }
  if (!Array.isArray(images)) images = [];
  if (images.length === 0 && variant.image) images = [variant.image];
  return images.filter(image => typeof image === 'string' && image);
}

const blankChart = () => ({ title: 'New size chart', categoryBillingId: '', unit: 'IN', isDefault: false, description: '', columns: [{ key: 'bust', label: 'Bust' }, { key: 'waist', label: 'Waist' }], rows: [{ size: 'S', measurements: { bust: '', waist: '' } }, { size: 'M', measurements: { bust: '', waist: '' } }, { size: 'L', measurements: { bust: '', waist: '' } }] });
const parseChartList = value => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }
  return [];
};
const cloneChart = chart => {
  const columns = parseChartList(chart?.columns).filter(column => column && typeof column === 'object');
  const rows = parseChartList(chart?.rows).filter(row => row && typeof row === 'object');
  const safeColumns = columns.length ? columns.map(column => ({ ...column })) : blankChart().columns;
  return {
    ...chart,
    categoryBillingId: chart?.categoryBillingId || '',
    columns: safeColumns,
    rows: rows.length ? rows.map(row => ({ size: row.size || '', measurements: row.measurements && typeof row.measurements === 'object' && !Array.isArray(row.measurements) ? { ...row.measurements } : {} })) : blankChart().rows,
  };
};

function VariantImageGallery({ variant, saving, onSave }) {
  const currentImages = variantImageList(variant);
  const imagesKey = currentImages.join('|');
  const [keptImages, setKeptImages] = useState(currentImages);
  const [uploads, setUploads] = useState([]);
  const uploadsRef = useRef([]);

  useEffect(() => {
    uploadsRef.current.forEach(item => URL.revokeObjectURL(item.preview));
    uploadsRef.current = [];
    setKeptImages(currentImages);
    setUploads([]);
    // Existing server images reset the editor after a successful save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.billingVariantId, imagesKey]);

  useEffect(() => () => {
    uploadsRef.current.forEach(item => URL.revokeObjectURL(item.preview));
  }, []);

  const addFiles = files => {
    const picked = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    const added = picked.map(file => ({ file, preview: URL.createObjectURL(file) }));
    uploadsRef.current = [...uploadsRef.current, ...added];
    setUploads(current => [...current, ...added]);
  };

  const removeUpload = index => {
    const item = uploads[index];
    if (item) URL.revokeObjectURL(item.preview);
    uploadsRef.current = uploadsRef.current.filter(upload => upload !== item);
    setUploads(current => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const changed = uploads.length > 0 || keptImages.length !== currentImages.length
    || keptImages.some((image, index) => image !== currentImages[index]);

  return (
    <div style={{ minWidth: 245, maxWidth: 330 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 9 }}>
        {keptImages.map((image, index) => (
          <div key={`${image}-${index}`} style={{ position: 'relative', width: 58, height: 58 }}>
            <img src={getImageUrl(image)} alt={`Variant ${index + 1}`} style={{ width: 58, height: 58, objectFit: 'cover', borderRadius: 7, border: `1px solid ${KM.border}` }} />
            <button type="button" aria-label="Remove image" title="Remove image" onClick={() => setKeptImages(current => current.filter((_, itemIndex) => itemIndex !== index))}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, border: 'none', borderRadius: '50%', background: KM.red, color: '#fff', fontSize: 12, lineHeight: '20px', padding: 0, cursor: 'pointer' }}>×</button>
          </div>
        ))}
        {uploads.map((item, index) => (
          <div key={item.preview} style={{ position: 'relative', width: 58, height: 58 }}>
            <img src={item.preview} alt={`New variant image ${index + 1}`} style={{ width: 58, height: 58, objectFit: 'cover', borderRadius: 7, border: `2px solid ${KM.teal}` }} />
            <button type="button" aria-label="Remove selected image" title="Remove selected image" onClick={() => removeUpload(index)}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, border: 'none', borderRadius: '50%', background: KM.blue, color: '#fff', fontSize: 12, lineHeight: '20px', padding: 0, cursor: 'pointer' }}>×</button>
            <span style={{ position: 'absolute', left: 3, bottom: 3, background: KM.teal, color: '#fff', borderRadius: 3, fontSize: 8, fontWeight: 700, padding: '2px 4px' }}>NEW</span>
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 10px', border: `1px dashed ${KM.teal}`, borderRadius: 7, background: '#F0FAFE', color: '#167F99', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
        Add multiple images
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
      </label>
      <div style={{ color: KM.muted, fontSize: 10, margin: '5px 0 7px' }}>
        {keptImages.length} saved · {uploads.length} selected · first image is the main variant image
      </div>
      <button type="button" className="action-btn btn-edit" disabled={!changed || saving || !variant.billingVariantId}
        onClick={() => onSave(variant, uploads.map(item => item.file), keptImages)}>
        {saving ? 'Saving...' : 'Save images'}
      </button>
    </div>
  );
}

export default function Products({ showToast }) {
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [flags, setFlags] = useState({ isNewArrival: false, isBestSeller: false });
  const [shippingDetails, setShippingDetails] = useState(emptyShippingDetails);
  const [defaultShippingDetails, setDefaultShippingDetails] = useState(emptyShippingDetails);
  const [variantSavingId, setVariantSavingId] = useState(null);
  const [specifications, setSpecifications] = useState([]);
  const [specificationsSaving, setSpecificationsSaving] = useState(false);
  const [sizeCharts, setSizeCharts] = useState([]);
  const [assignedChartId, setAssignedChartId] = useState('');
  const [chartDraft, setChartDraft] = useState(null);
  const [chartDraftId, setChartDraftId] = useState(null);
  const [chartSaving, setChartSaving] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    try {
      const savedDefault = JSON.parse(localStorage.getItem(DEFAULT_SHIPPING_STORAGE_KEY) || 'null');
      if (savedDefault && ['weightKg', 'lengthCm', 'widthCm', 'heightCm'].every(key => Number(savedDefault[key]) > 0)) setDefaultShippingDetails(savedDefault);
    } catch (_) {}
    sizeChartApi.getAll().then(setSizeCharts).catch(error => showToast('Size Charts Load Failed', error.message));
    // Re-run when the product screen's query changes, matching the prior page behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAll();
      const products = Array.isArray(data) ? data : [];
      setRows(products);
      return products;
    } catch (error) {
      setRows([]);
      showToast('Load Failed', error.message || 'Could not load products.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (_) {
      setCategories([]);
    }
  };

  const closeEditor = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
    setFlags({ isNewArrival: false, isBestSeller: false });
    setShippingDetails(emptyShippingDetails());
    setSpecifications([]);
    setAssignedChartId('');
    setChartDraft(null);
    setChartDraftId(null);
  };

  const handleEditClick = product => {
    setEditing(product);
    setImagePreview(product.image || null);
    setImageFile(null);
    setFlags({ isNewArrival: Boolean(product.isNewArrival), isBestSeller: Boolean(product.isBestSeller) });
    setShippingDetails(readShippingDetails(product));
    setSpecifications([]);
    productSpecificationApi.getByProduct(product.id)
      .then(setSpecifications)
      .catch(error => showToast('Specifications Load Failed', error.message));
    sizeChartApi.getAssignment(product.id)
      .then(setAssignedChartId)
      .catch(error => showToast('Size Chart Load Failed', error.message));
    sizeChartApi.getAll()
      .then(setSizeCharts)
      .catch(error => showToast('Size Charts Load Failed', error.message));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addSpecification = () => setSpecifications(current => [...current, { label: '', value: '' }]);
  const updateSpecification = (index, key, value) => setSpecifications(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const removeSpecification = index => setSpecifications(current => current.filter((_, itemIndex) => itemIndex !== index));
  const saveSpecifications = async () => {
    if (!editing?.id) return;
    const entries = specifications.filter(item => String(item.label || '').trim() || String(item.value || '').trim());
    if (entries.some(item => !String(item.label || '').trim() || !String(item.value || '').trim())) {
      showToast('Check Specifications', 'Complete both the name and value, or remove the empty row.');
      return;
    }
    setSpecificationsSaving(true);
    try {
      setSpecifications(await productSpecificationApi.save(editing.id, entries));
      showToast('Specifications Saved', 'Product specifications have been updated.');
    } catch (error) {
      showToast('Save Failed', error.message);
    } finally {
      setSpecificationsSaving(false);
    }
  };

  const beginChartEdit = id => {
    const chart = sizeCharts.find(item => String(item.id) === String(id));
    setChartDraftId(chart?.id || null);
    setChartDraft(chart ? cloneChart(chart) : blankChart());
  };
  const selectCategoryForChart = categoryBillingId => {
    const existingChart = sizeCharts.find(item => String(item.categoryBillingId || '') === String(categoryBillingId || ''));
    if (existingChart) {
      setChartDraftId(existingChart.id);
      setChartDraft(cloneChart(existingChart));
      return;
    }
    setChartDraft(current => current ? { ...current, categoryBillingId } : { ...blankChart(), categoryBillingId });
  };
  const editChartForProduct = () => {
    const billingCategoryId = editing?.Category?.billingCategoryId || editing?.billingCategoryId || editing?.billing_category_id;
    const chart = sizeCharts.find(item => String(item.id) === String(assignedChartId))
      || sizeCharts.find(item => billingCategoryId && String(item.categoryBillingId) === String(billingCategoryId))
      || sizeCharts.find(item => item.isDefault);
    beginChartEdit(chart?.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const productCategoryBillingId = editing?.Category?.billingCategoryId || editing?.billingCategoryId || editing?.billing_category_id || '';
  const categoryChart = sizeCharts.find(item => productCategoryBillingId && String(item.categoryBillingId) === String(productCategoryBillingId));
  const effectiveProductChart = sizeCharts.find(item => String(item.id) === String(assignedChartId)) || categoryChart || sizeCharts.find(item => item.isDefault);
  const updateChartColumn = (index, key, value) => setChartDraft(current => ({
    ...current,
    // Column keys are data identities. Keep them stable while the label is being typed,
    // otherwise React sees a new key on every keystroke and drops input focus.
    columns: current.columns.map((column, itemIndex) => itemIndex === index ? { ...column, [key]: value } : column),
  }));
  const addChartColumn = () => setChartDraft(current => {
    let index = current.columns.length + 1;
    while (current.columns.some(column => column.key === `measurement_${index}`)) index += 1;
    return { ...current, columns: [...current.columns, { key: `measurement_${index}`, label: '' }] };
  });
  const removeChartColumn = index => setChartDraft(current => ({ ...current, columns: current.columns.filter((_, itemIndex) => itemIndex !== index) }));
  const updateChartCell = (rowIndex, key, value) => setChartDraft(current => ({ ...current, rows: current.rows.map((row, itemIndex) => itemIndex === rowIndex ? { ...row, measurements: { ...row.measurements, [key]: value } } : row) }));
  const saveChartDraft = async () => {
    if (!chartDraft) return;
    setChartSaving(true);
    try {
      const saved = await sizeChartApi.save(chartDraft, chartDraftId);
      setSizeCharts(current => chartDraftId ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved]);
      setChartDraftId(saved.id);
      setChartDraft(cloneChart(saved));
      showToast('Size Chart Saved', 'Your size chart is ready to assign to products.');
    } catch (error) { showToast('Size Chart Save Failed', error.message); }
    finally { setChartSaving(false); }
  };
  const deleteChartDraft = async () => {
    if (!chartDraftId || chartDraft?.isDefault || !(await confirmSizeChartDelete(chartDraft.title))) return;
    try {
      await sizeChartApi.remove(chartDraftId);
      setSizeCharts(current => current.filter(item => item.id !== chartDraftId));
      if (editing && String(assignedChartId) === String(chartDraftId)) {
        setAssignedChartId('');
        await sizeChartApi.assign(editing.id, '');
      }
      setChartDraft(null);
      setChartDraftId(null);
      showToast('Size Chart Deleted', 'Products will use their category chart or the default chart.');
    } catch (error) { showToast('Delete Failed', error.message); }
  };
  const deleteChartFromOverview = async chart => {
    if (!chart || chart.isDefault || !(await confirmSizeChartDelete(chart.title))) return;
    try {
      await sizeChartApi.remove(chart.id);
      setSizeCharts(current => current.filter(item => String(item.id) !== String(chart.id)));
      if (String(chartDraftId) === String(chart.id)) { setChartDraft(null); setChartDraftId(null); }
      if (String(assignedChartId) === String(chart.id)) {
        setAssignedChartId('');
        if (editing?.id) await sizeChartApi.assign(editing.id, '');
      }
      showToast('Size Chart Deleted', 'Products will use their category chart or the default chart.');
    } catch (error) { showToast('Delete Failed', error.message); }
  };
  const saveDefaultShippingDetails = () => {
    const valid = ['weightKg', 'lengthCm', 'widthCm', 'heightCm'].every(key => Number(shippingDetails[key]) > 0);
    if (!valid) { showToast('Default shipping not saved', 'Enter a positive packed weight and all three dimensions first.'); return; }
    const saved = Object.fromEntries(['weightKg', 'lengthCm', 'widthCm', 'heightCm'].map(key => [key, String(shippingDetails[key])]));
    localStorage.setItem(DEFAULT_SHIPPING_STORAGE_KEY, JSON.stringify(saved));
    setDefaultShippingDetails(saved);
    showToast('Default shipping saved', 'You can apply this package profile to other products from Shipping details.');
  };
  const applyDefaultShippingDetails = () => {
    if (!['weightKg', 'lengthCm', 'widthCm', 'heightCm'].every(key => Number(defaultShippingDetails[key]) > 0)) {
      showToast('No default shipping saved', 'Enter package details and choose “Save as default” first.');
      return;
    }
    setShippingDetails(defaultShippingDetails);
    showToast('Default shipping applied', 'Review the package values before saving this product.');
  };
  const updateProductChart = async value => {
    setAssignedChartId(value);
    setAssignmentSaving(true);
    try { await sizeChartApi.assign(editing.id, value); showToast('Product Size Chart Updated', value ? 'The selected chart is assigned to this product.' : 'This product will use its category or default chart.'); }
    catch (error) { showToast('Assignment Failed', error.message); }
    finally { setAssignmentSaving(false); }
  };

  const saveVariantImages = async (variant, files, keepImages) => {
    const billingVariantId = variant.billingVariantId;
    if (!billingVariantId) {
      showToast('Cannot Save', 'This variant is missing its Billing ID. Refresh the product list.');
      return;
    }
    setVariantSavingId(billingVariantId);
    const body = new FormData();
    body.append('keepImages', JSON.stringify(keepImages));
    files.forEach(file => body.append('images', file));
    try {
      await variantApi.updateImage(billingVariantId, body);
      const products = await fetchProducts();
      const updatedProduct = products.find(product => String(product.billingProductId) === String(editing?.billingProductId));
      if (updatedProduct) setEditing(updatedProduct);
      showToast('Saved', 'Variant image gallery updated.');
    } catch (error) {
      showToast('Image Update Failed', error.message || 'Could not update the variant image.');
    } finally {
      setVariantSavingId(null);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!editing?.billingProductId) {
      showToast('Cannot Save', 'This product is missing its Billing ID. Refresh the product list.');
      return;
    }
    const shippingFields = [
      ['weightKg', 'Packed weight'],
      ['lengthCm', 'Parcel length'],
      ['widthCm', 'Parcel width'],
      ['heightCm', 'Parcel height'],
    ];
    const missingShippingField = shippingFields.find(([key]) => {
      const value = Number(shippingDetails[key]);
      return shippingDetails[key] === '' || !Number.isFinite(value) || value <= 0;
    });
    if (missingShippingField) {
      showToast('Shipping details required', `${missingShippingField[1]} must be greater than zero.`);
      return;
    }
    setSaving(true);
    const body = new FormData();
    body.append('isNewArrival', String(flags.isNewArrival));
    body.append('isBestSeller', String(flags.isBestSeller));
    body.append('shipping_weight_kg', shippingDetails.weightKg);
    body.append('shipping_length_cm', shippingDetails.lengthCm);
    body.append('shipping_width_cm', shippingDetails.widthCm);
    body.append('shipping_height_cm', shippingDetails.heightCm);
    if (imageFile) body.append('image', imageFile);

    try {
      await productApi.updateCustomization(editing.billingProductId, body);
      showToast('Updated!', 'Product image and storefront settings saved.');
      closeEditor();
      await fetchProducts();
    } catch (error) {
      showToast('Failed', error.message || 'Could not update product.');
    } finally {
      setSaving(false);
    }
  };

  const resolveCategory = product => product.Category?.name
    || product.categoryName
    || categories.find(category => String(category.id) === String(product.categoryId ?? product.category_id))?.name
    || 'N/A';

  const readOnlyInputStyle = {
    ...inputStyle,
    background: '#EEF1F4',
    color: '#667085',
    borderColor: '#D7DDE4',
    cursor: 'not-allowed',
  };

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">Products Management</div>
        <button className="action-btn btn-edit" onClick={fetchProducts} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <section style={{ ...formCard, padding: 14, overflow: 'visible' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: KM.text, fontSize: 15 }}>Size charts</h3>
            <p style={{ margin: '3px 0 0', color: KM.muted, fontSize: 11, lineHeight: 1.4 }}>Category charts apply automatically. Assign a saved chart to an individual product from its Edit form.</p>
          </div>
          <button type="button" onClick={() => beginChartEdit(null)} style={{ padding: '7px 10px', color: '#fff', background: KM.blue, border: 0, borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ New chart</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 6, marginTop: 10 }}>
          {sizeCharts.map(chart => {
            const category = categories.find(item => String(item.billingCategoryId || item.billing_category_id || '') === String(chart.categoryBillingId || ''));
            return <div key={chart.id} style={{ minWidth: 0, padding: '7px 9px', border: `1px solid ${KM.border}`, borderRadius: 7, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ minWidth: 0 }}><strong style={{ display: 'block', color: KM.text, fontSize: 12, overflowWrap: 'anywhere' }}>{chart.title}</strong><span style={{ display: 'block', marginTop: 2, color: KM.muted, fontSize: 10 }}>{chart.isDefault ? 'Default' : category ? category.name : 'Product assignment'} · {parseChartList(chart.rows).length} sizes · {chart.unit === 'CM' ? 'cm' : 'in'}</span></div>
              <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                <button type="button" onClick={() => beginChartEdit(chart.id)} style={{ padding: '5px 8px', border: `1px solid ${KM.border}`, borderRadius: 5, background: '#fff', color: KM.blue, cursor: 'pointer', fontSize: 11 }}>Edit</button>
                <button type="button" disabled={chart.isDefault} title={chart.isDefault ? 'Choose another chart as default before deleting this chart.' : 'Delete size chart'} onClick={() => deleteChartFromOverview(chart)} style={{ padding: '5px 8px', border: '1px solid #fecaca', borderRadius: 5, background: chart.isDefault ? '#f8fafc' : '#fff', color: chart.isDefault ? '#9ca3af' : '#b91c1c', cursor: chart.isDefault ? 'not-allowed' : 'pointer', fontSize: 11 }}>Delete</button>
              </div>
            </div>;
          })}
          {!sizeCharts.length && <p style={{ margin: 0, color: KM.muted, fontSize: 13 }}>No size charts yet. Create one to get started.</p>}
        </div>
        {chartDraft && <div style={{ marginTop: 16, padding: 14, border: `1px solid ${KM.border}`, background: '#F8FAFC', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}><strong style={{ color: KM.blue }}>{chartDraftId ? 'Edit size chart' : 'Create size chart'}</strong><button type="button" onClick={() => { setChartDraft(null); setChartDraftId(null); }} style={{ border: 0, background: 'transparent', color: KM.muted, cursor: 'pointer' }}>Close</button></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div style={fieldStyle}><label style={labelStyle}>Chart name</label><input style={inputStyle} maxLength={140} placeholder="e.g. Ready Salwar Fit Guide" value={chartDraft.title} onChange={event => setChartDraft(current => ({ ...current, title: event.target.value }))} /><span style={{ color: KM.muted, fontSize: 11 }}>Internal name to help you recognize this chart in Admin.</span></div>
            <div style={fieldStyle}><label style={labelStyle}>Measurements are in</label><select style={inputStyle} value={chartDraft.unit} onChange={event => setChartDraft(current => ({ ...current, unit: event.target.value }))}><option value="IN">Inches</option><option value="CM">Centimeters</option></select><span style={{ color: KM.muted, fontSize: 11 }}>The unit shoppers see beside each measurement.</span></div>
            <div style={fieldStyle}><label style={labelStyle}>Use as category chart</label><select style={inputStyle} value={chartDraft.categoryBillingId || ''} onChange={event => selectCategoryForChart(event.target.value)}><option value="">No category (manual assignment only)</option>{categories.map(category => { const categoryId = String(category.billingCategoryId || category.billing_category_id || ''); const existingChart = sizeCharts.find(item => String(item.categoryBillingId || '') === categoryId); const selectedChartIsOwner = String(chartDraft.categoryBillingId || '') === categoryId && String(chartDraftId || '') === String(existingChart?.id || ''); return <option key={category.id} value={categoryId} disabled={Boolean(existingChart && !selectedChartIsOwner)}>{category.name}{existingChart ? ' (chart exists; selecting opens it)' : ''}</option>; })}</select><span style={{ color: KM.muted, fontSize: 11 }}>One shared chart per category; selecting a category that already has a chart opens it for editing.</span></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '12px 0 4px', color: KM.text, fontSize: 13 }}><input type="checkbox" checked={Boolean(chartDraft.isDefault)} disabled={Boolean(chartDraftId && chartDraft.isDefault)} onChange={event => setChartDraft(current => ({ ...current, isDefault: event.target.checked }))} /><span><strong>Make this the default chart</strong><span style={{ display: 'block', marginTop: 3, color: KM.muted, fontSize: 11 }}>Fallback for products without a product-specific or category chart.</span></span></label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '14px 0 8px' }}><div><strong style={{ color: KM.blue, fontSize: 13 }}>Measurement columns</strong><div style={{ color: KM.muted, fontSize: 11, marginTop: 3 }}>Examples: Bust, Waist, Hip, Length, Sleeve.</div></div><button type="button" disabled={chartDraft.columns.length >= 12} onClick={addChartColumn} style={{ padding: '7px 10px', background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 7, cursor: 'pointer' }}>+ Add measurement</button></div>
          <div style={{ display: 'grid', gap: 7 }}>{chartDraft.columns.map((column, index) => <div key={`${index}-${column.key}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) auto', gap: 8 }}><input aria-label={`Measurement column ${index + 1} name`} style={inputStyle} placeholder="Measurement name (e.g. Bust)" value={column.label} onChange={event => updateChartColumn(index, 'label', event.target.value)} /><button type="button" disabled={chartDraft.columns.length <= 1} onClick={() => removeChartColumn(index)} style={{ border: '1px solid #fecaca', borderRadius: 7, color: '#b91c1c', background: '#fff', cursor: 'pointer' }}>Remove</button></div>)}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '16px 0 8px' }}><div><strong style={{ color: KM.blue, fontSize: 13 }}>Size measurements</strong><div style={{ color: KM.muted, fontSize: 11, marginTop: 3 }}>Create one row for each available size.</div></div><button type="button" disabled={chartDraft.rows.length >= 40} onClick={() => setChartDraft(current => ({ ...current, rows: [...current.rows, { size: '', measurements: {} }] }))} style={{ padding: '7px 10px', background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 7, cursor: 'pointer' }}>+ Add size</button></div>
          <div style={{ overflowX: 'auto', border: `1px solid ${KM.border}`, borderRadius: 8 }}><table style={{ width: '100%', minWidth: `${Math.max(430, (chartDraft.columns.length + 2) * 125)}px`, borderCollapse: 'collapse', background: '#fff' }}><thead><tr style={{ background: KM.bg }}><th style={{ padding: 8, textAlign: 'left', color: KM.muted }}>Size</th>{chartDraft.columns.map(column => <th key={column.key} style={{ padding: 8, color: KM.muted }}>{column.label || 'Measurement'} ({chartDraft.unit})</th>)}<th /></tr></thead><tbody>{chartDraft.rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`} style={{ borderTop: `1px solid ${KM.border}` }}><td style={{ padding: 6 }}><input aria-label={`Size label for row ${rowIndex + 1}`} style={inputStyle} placeholder="Size label (e.g. S, M, 32)" value={row.size} onChange={event => setChartDraft(current => ({ ...current, rows: current.rows.map((item, index) => index === rowIndex ? { ...item, size: event.target.value } : item) }))} /></td>{chartDraft.columns.map(column => <td key={column.key} style={{ padding: 6 }}><input aria-label={`${row.size || 'Size'} ${column.label} measurement`} style={inputStyle} inputMode="decimal" placeholder={`Enter ${column.label.toLowerCase()}`} value={row.measurements?.[column.key] ?? ''} onChange={event => updateChartCell(rowIndex, column.key, event.target.value)} /></td>)}<td style={{ padding: 6 }}><button type="button" disabled={chartDraft.rows.length <= 1} onClick={() => setChartDraft(current => ({ ...current, rows: current.rows.filter((_, index) => index !== rowIndex) }))} style={{ border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer' }}>Remove</button></td></tr>)}</tbody></table></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 13 }}><button type="button" disabled={chartSaving} onClick={saveChartDraft} style={{ padding: '9px 14px', background: KM.blue, color: '#fff', border: 0, borderRadius: 7, cursor: chartSaving ? 'wait' : 'pointer', fontWeight: 600 }}>{chartSaving ? 'Saving…' : chartDraftId ? 'Save chart changes' : 'Save new chart'}</button>{chartDraftId && !chartDraft.isDefault && <button type="button" onClick={deleteChartDraft} style={{ padding: '9px 14px', background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer' }}>Delete chart</button>}</div>
        </div>}
      </section>

      {editing && (
        <div style={formCard}>
          <div style={formHeader}>
            <div style={headerIcon}>P</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>Edit Product</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>{editing.productName || editing.name}</div>
            </div>
          </div>
          <div style={{ padding: '20px 24px 28px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Product Name</label>
                      <input style={readOnlyInputStyle} value={editing.productName || editing.name || ''} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Category</label>
                <input style={readOnlyInputStyle} value={resolveCategory(editing)} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Sub-Category</label>
                <input style={readOnlyInputStyle} value={editing.billingSubcategoryId || editing.billing_subcategory_id || editing.subCategoryId || editing.subcategory_id || ''} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>

              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Short Description</label>
                <input style={readOnlyInputStyle} value={editing.shortDescription || editing.description || ''} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>
              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Long Description</label>
                <textarea style={{ ...readOnlyInputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }} value={editing.longDescription || editing.description || ''} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Barcode</label>
                <input style={readOnlyInputStyle} value={editing.barcode || ''} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Status</label>
                <input style={readOnlyInputStyle} value={editing.status || 'Active'} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Stock</label>
                <input style={readOnlyInputStyle} value={Number(editing.stock || 0)} readOnly aria-readonly="true" title="Synced from Billing; editing is disabled" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Final price</label>
                <input style={readOnlyInputStyle} value={editing?.franchise_price_final ?? editing?.Variants?.[0]?.franchise_price_final ?? editing?.variants?.[0]?.franchise_price_final ?? ''} readOnly aria-readonly="true" aria-label="Final franchise price" title="Final price is managed in Billing" />
              </div>

              <div style={{ gridColumn: 'span 2', padding: '16px 20px', background: '#F8FAFC', border: `1px solid ${KM.border}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 13, color: KM.blue, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Shipping details</h4>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    <button type="button" onClick={applyDefaultShippingDetails} style={{ padding: '7px 10px', color: KM.blue, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Apply default</button>
                    <button type="button" onClick={saveDefaultShippingDetails} style={{ padding: '7px 10px', color: '#fff', background: KM.blue, border: 0, borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Save as default</button>
                  </div>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 12, color: KM.muted }}>Required for Shiprocket shipment booking. Enter packed weight in kilograms and parcel dimensions in centimeters.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                  {[
                    ['weightKg', 'Packed weight (kg)', '0.500'],
                    ['lengthCm', 'Length (cm)', '30'],
                    ['widthCm', 'Width (cm)', '20'],
                    ['heightCm', 'Height (cm)', '5'],
                  ].map(([key, label, placeholder]) => (
                    <div key={key} style={fieldStyle}>
                      <label style={labelStyle}>{label} <span style={{ color: KM.red }}>*</span></label>
                      <input
                        style={inputStyle}
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]+([.][0-9]+)?"
                        required
                        placeholder={placeholder}
                        value={shippingDetails[key]}
                        onChange={event => setShippingDetails(current => ({ ...current, [key]: event.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 11, color: KM.muted }}>Use the packed parcel measurements, not the garment measurements. Every value must be greater than zero.</p>
              </div>

              <section style={{ gridColumn: 'span 2', padding: '16px 20px', background: '#F8FAFC', border: `1px solid ${KM.border}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div><h4 style={{ margin: '0 0 4px', fontSize: 13, color: KM.blue, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Product specifications</h4><p style={{ margin: 0, color: KM.muted, fontSize: 12 }}>These appear in the product page Specifications section.</p></div>
                  <button type="button" onClick={addSpecification} style={{ padding: '8px 12px', color: KM.blue, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>+ Add row</button>
                </div>
                <div style={{ display: 'grid', gap: 9 }}>
                  {specifications.map((item, index) => <div key={item.id || `new-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 0.8fr) minmax(160px, 1.4fr) auto', gap: 9, alignItems: 'start' }}>
                    <input aria-label={`Specification ${index + 1} name`} style={inputStyle} maxLength={120} placeholder="Name (e.g. Material)" value={item.label || ''} onChange={event => updateSpecification(index, 'label', event.target.value)} />
                    <textarea aria-label={`Specification ${index + 1} value`} style={{ ...inputStyle, minHeight: 40, resize: 'vertical', lineHeight: 1.45 }} maxLength={4000} placeholder="Value" value={item.value || ''} onChange={event => updateSpecification(index, 'value', event.target.value)} />
                    <button type="button" onClick={() => removeSpecification(index)} aria-label={`Remove specification ${index + 1}`} style={{ height: 38, padding: '0 11px', border: '1px solid #fecaca', borderRadius: 7, color: '#b91c1c', background: '#fff', cursor: 'pointer' }}>Remove</button>
                  </div>)}
                  {specifications.length === 0 && <p style={{ margin: 0, color: KM.muted, fontSize: 13 }}>No custom specifications yet. Add a row to get started.</p>}
                </div>
                <button type="button" disabled={specificationsSaving} onClick={saveSpecifications} style={{ marginTop: 12, padding: '9px 15px', border: 0, borderRadius: 7, background: KM.blue, color: '#fff', fontWeight: 600, cursor: specificationsSaving ? 'wait' : 'pointer' }}>{specificationsSaving ? 'Saving…' : 'Save specifications'}</button>
              </section>

              <section style={{ gridColumn: 'span 2', padding: '16px 20px', background: '#F8FAFC', border: `1px solid ${KM.border}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div><h4 style={{ margin: '0 0 5px', fontSize: 13, color: KM.blue, textTransform: 'uppercase', letterSpacing: 1 }}>Size chart</h4><p style={{ margin: 0, color: KM.muted, fontSize: 12, lineHeight: 1.5 }}>Choose a chart for this item, or use the category/default chart. You can reuse charts across products.</p></div>
                </div>
          <div className="product-size-chart-assignment" style={{ display: 'grid', gridTemplateColumns: 'minmax(135px, auto) minmax(220px, 1fr) auto', gap: 10, alignItems: 'center', marginTop: 12 }}>
            <label htmlFor="product-size-chart-select" style={labelStyle}>Chart for this product</label>
            <select id="product-size-chart-select" value={assignedChartId} disabled={assignmentSaving} onChange={event => updateProductChart(event.target.value)} style={inputStyle}><option value="">Automatic: {categoryChart ? `${categoryChart.title} (category chart)` : effectiveProductChart?.isDefault ? `${effectiveProductChart.title} (default chart)` : 'no chart assigned'}</option>{sizeCharts.map(chart => <option key={chart.id} value={chart.id}>{chart.title}{chart.id === categoryChart?.id ? ' (category chart)' : chart.isDefault ? ' (default)' : chart.categoryBillingId ? ` (${categories.find(category => String(category.billingCategoryId || category.billing_category_id || '') === String(chart.categoryBillingId))?.name || 'Category'})` : ' (product chart)'}</option>)}</select>
            <button type="button" onClick={editChartForProduct} style={{ height: 38, padding: '0 12px', color: KM.blue, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>Edit chart</button>
            <span style={{ gridColumn: '2 / 4', marginTop: -5, color: KM.muted, fontSize: 11, lineHeight: 1.4 }}>{categoryChart ? `Automatic uses “${categoryChart.title}” for this category. Choose any saved chart to override it for this product.` : 'Automatic uses the default chart. All saved charts are available for a product-specific override.'}</span>
          </div>
          <style>{`@media (max-width: 640px) { .product-size-chart-assignment { grid-template-columns: 1fr auto !important; } .product-size-chart-assignment label { grid-column: 1 / -1; } .product-size-chart-assignment select { min-width: 0; } .product-size-chart-assignment span { grid-column: 1 / -1 !important; } }`}</style>
                {chartDraft && !editing && <div style={{ marginTop: 16, padding: 14, border: `1px solid ${KM.border}`, background: '#fff', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}><strong style={{ color: KM.blue }}>{chartDraftId ? 'Edit size chart' : 'Create size chart'}</strong><button type="button" onClick={() => { setChartDraft(null); setChartDraftId(null); }} style={{ border: 0, background: 'transparent', color: KM.muted, cursor: 'pointer' }}>Close</button></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>Chart name</label><input style={inputStyle} maxLength={140} placeholder="e.g. Ready Salwar Fit Guide" value={chartDraft.title} onChange={event => setChartDraft(current => ({ ...current, title: event.target.value }))} /><span style={{ color: KM.muted, fontSize: 11 }}>Internal name to help you recognize this chart in Admin.</span></div>
                    <div style={fieldStyle}><label style={labelStyle}>Measurements are in</label><select style={inputStyle} value={chartDraft.unit} onChange={event => setChartDraft(current => ({ ...current, unit: event.target.value }))}><option value="IN">Inches</option><option value="CM">Centimeters</option></select><span style={{ color: KM.muted, fontSize: 11 }}>The unit shoppers see beside each measurement. Inch charts can be switched to centimeters.</span></div>
                    <div style={fieldStyle}><label style={labelStyle}>Use as category chart</label><select style={inputStyle} value={chartDraft.categoryBillingId || ''} onChange={event => selectCategoryForChart(event.target.value)}><option value="">No category (manual assignment only)</option>{categories.map(category => { const categoryId = String(category.billingCategoryId || category.billing_category_id || ''); const existingChart = sizeCharts.find(item => String(item.categoryBillingId || '') === categoryId); const selectedChartIsOwner = String(chartDraft.categoryBillingId || '') === categoryId && String(chartDraftId || '') === String(existingChart?.id || ''); return <option key={category.id} value={categoryId} disabled={Boolean(existingChart && !selectedChartIsOwner)}>{category.name}{existingChart ? ' (chart exists; selecting opens it)' : ''}</option>; })}</select><span style={{ color: KM.muted, fontSize: 11 }}>Each category can have one chart. Selecting a category that already has a chart opens that chart for editing; categories with an existing chart are marked above.</span></div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '12px 0 4px', color: KM.text, fontSize: 13 }}><input type="checkbox" checked={Boolean(chartDraft.isDefault)} disabled={Boolean(chartDraftId && chartDraft.isDefault)} onChange={event => setChartDraft(current => ({ ...current, isDefault: event.target.checked }))} /><span><strong>Make this the default chart</strong><span style={{ display: 'block', marginTop: 3, color: KM.muted, fontSize: 11 }}>Fallback shoppers see when their product has no assigned chart and its category has no chart.</span></span></label>
                  {chartDraftId && chartDraft.isDefault && <p style={{ margin: '0 0 10px', color: KM.muted, fontSize: 11 }}>To change the default, select “Make default” on another chart and save it.</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '14px 0 8px' }}><div><strong style={{ color: KM.blue, fontSize: 13 }}>Measurement columns</strong><div style={{ color: KM.muted, fontSize: 11, marginTop: 3 }}>Each name becomes a column in the shopper’s chart. Examples: Bust, Waist, Hip, Length, Sleeve.</div></div><button type="button" disabled={chartDraft.columns.length >= 12} onClick={addChartColumn} style={{ padding: '7px 10px', background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 7, cursor: 'pointer' }}>+ Add measurement</button></div>
                  <div style={{ display: 'grid', gap: 7 }}>{chartDraft.columns.map((column, index) => <div key={`${index}-${column.key}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) auto', gap: 8 }}><input aria-label={`Measurement column ${index + 1} name`} style={inputStyle} placeholder="Measurement name (e.g. Bust)" value={column.label} onChange={event => updateChartColumn(index, 'label', event.target.value)} /><button type="button" disabled={chartDraft.columns.length <= 1} onClick={() => removeChartColumn(index)} style={{ border: '1px solid #fecaca', borderRadius: 7, color: '#b91c1c', background: '#fff', cursor: 'pointer' }}>Remove</button></div>)}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '16px 0 8px' }}><div><strong style={{ color: KM.blue, fontSize: 13 }}>Size measurements</strong><div style={{ color: KM.muted, fontSize: 11, marginTop: 3 }}>Create one row for each available size. Enter the matching body or garment measurement in each column.</div></div><button type="button" disabled={chartDraft.rows.length >= 40} onClick={() => setChartDraft(current => ({ ...current, rows: [...current.rows, { size: '', measurements: {} }] }))} style={{ padding: '7px 10px', background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 7, cursor: 'pointer' }}>+ Add size</button></div>
                  <div style={{ overflowX: 'auto', border: `1px solid ${KM.border}`, borderRadius: 8 }}><table style={{ width: '100%', minWidth: `${Math.max(430, (chartDraft.columns.length + 2) * 125)}px`, borderCollapse: 'collapse', background: '#fff' }}><thead><tr style={{ background: KM.bg }}><th style={{ padding: 8, textAlign: 'left', color: KM.muted }}>Size</th>{chartDraft.columns.map(column => <th key={column.key} style={{ padding: 8, color: KM.muted }}>{column.label || 'Measurement'} ({chartDraft.unit})</th>)}<th /></tr></thead><tbody>{chartDraft.rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`} style={{ borderTop: `1px solid ${KM.border}` }}><td style={{ padding: 6 }}><input aria-label={`Size label for row ${rowIndex + 1}`} style={inputStyle} placeholder="Size label (e.g. S, M, 32)" value={row.size} onChange={event => setChartDraft(current => ({ ...current, rows: current.rows.map((item, index) => index === rowIndex ? { ...item, size: event.target.value } : item) }))} /></td>{chartDraft.columns.map(column => <td key={column.key} style={{ padding: 6 }}><input aria-label={`${row.size || 'Size'} ${column.label} measurement`} style={inputStyle} inputMode="decimal" placeholder={`Enter ${column.label.toLowerCase()}`} value={row.measurements?.[column.key] ?? ''} onChange={event => updateChartCell(rowIndex, column.key, event.target.value)} /></td>)}<td style={{ padding: 6 }}><button type="button" disabled={chartDraft.rows.length <= 1} onClick={() => setChartDraft(current => ({ ...current, rows: current.rows.filter((_, index) => index !== rowIndex) }))} style={{ border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer' }}>Remove</button></td></tr>)}</tbody></table></div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 13 }}><button type="button" disabled={chartSaving} onClick={saveChartDraft} style={{ padding: '9px 14px', background: KM.blue, color: '#fff', border: 0, borderRadius: 7, cursor: chartSaving ? 'wait' : 'pointer', fontWeight: 600 }}>{chartSaving ? 'Saving…' : chartDraftId ? 'Save chart changes' : 'Save new chart'}</button>{chartDraftId && !chartDraft.isDefault && <button type="button" onClick={deleteChartDraft} style={{ padding: '9px 14px', background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer' }}>Delete chart</button>}</div>
                </div>}
              </section>

              <div style={{ gridColumn: 'span 2', padding: '16px 20px', background: '#F8FAFC', border: `1px solid ${KM.border}`, borderRadius: 10 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, color: KM.blue, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Variants</h4>
                {(editing.Variants || editing.variants || []).length > 0 ? (
                  <div style={{ overflowX: 'auto', border: `1px solid ${KM.border}`, borderRadius: 8, background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead style={{ background: KM.bg }}><tr>
                        {['Variant', 'Barcode / SKU', 'Stock', 'Final price', 'Image'].map(label => <th key={label} style={{ padding: '10px 12px', borderBottom: `1px solid ${KM.border}`, color: KM.muted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{label}</th>)}
                      </tr></thead>
                      <tbody>{(editing.Variants || editing.variants).map((variant, index) => (
                        <tr key={variant.billingVariantId || variant.id || index} style={{ borderBottom: `1px solid ${KM.border}` }}>
                          <td style={{ padding: '10px 12px' }}>{[variant.size, variant.color, variant.fabric].filter(Boolean).join(' / ') || variant.variant_name || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{variant.barcode || variant.sku || variant.variant_code || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{Number(variant.stock ?? variant.quantity ?? 0)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>₹{Number(variant.franchise_price_final ?? 0).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <VariantImageGallery
                              variant={variant}
                              saving={variantSavingId === variant.billingVariantId}
                              onSave={saveVariantImages}
                            />
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <span style={{ color: KM.muted, fontSize: 12 }}>No variants available.</span>}
              </div>

              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Main Product Image</label>
                <img src={imagePreview ? (imagePreview.startsWith('blob:') ? imagePreview : getImageUrl(imagePreview)) : defaultLogo} alt="Current product" width="72" height="72"
                    onError={event => { event.currentTarget.src = defaultLogo; }}
                    style={{ borderRadius: 8, objectFit: imagePreview ? 'cover' : 'contain', background: imagePreview ? '#fff' : '#126354', border: `1.5px solid ${KM.border}`, marginBottom: 8 }} />
                <div style={{ border: `1.5px dashed ${KM.teal}`, borderRadius: 8, padding: 18, textAlign: 'center', background: '#F0FAFE', position: 'relative', cursor: 'pointer' }}>
                  <input type="file" accept="image/*" onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                  <span style={{ color: imageFile ? KM.green : KM.muted, fontWeight: imageFile ? 600 : 400 }}>
                    {imageFile ? `✓ ${imageFile.name}` : imagePreview ? 'Click to replace main image' : 'Click to upload main product image'}
                  </span>
                </div>
              </div>

              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Storefront</label>
                <div style={{ display: 'flex', gap: 20, padding: '12px 14px', background: KM.orangeLight, borderRadius: 8 }}>
                  {[{ key: 'isNewArrival', label: 'New Arrival' }, { key: 'isBestSeller', label: 'Best Seller' }].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={flags[item.key]} onChange={event => setFlags(current => ({ ...current, [item.key]: event.target.checked }))} />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: 11, background: KM.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Saving...' : 'Update Product'}
                </button>
                <button type="button" className="action-btn" onClick={closeEditor}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ padding: 20, color: KM.muted }}>Loading products...</p>
      ) : (
        <DataTable
          columns={['ID', 'Image', 'Product Info', 'Status', 'Attributes', 'Stock', 'Category', 'Price', 'Actions']}
          initialRows={rows}
          renderRow={product => {
            const variants = product.Variants || product.variants || [];
            const stock = Number(product.stock || 0);
            const billingSubcategoryId = product.billingSubcategoryId || product.billing_subcategory_id;
            const sizes = [...new Set(variants.map(variant => variant.size).filter(Boolean))];
            const colors = [...new Set(variants.map(variant => variant.color).filter(Boolean))];

            return (
              <tr key={product.billingProductId || product.id}>
                <td style={{ color: KM.muted }}>#{product.billingProductId || product.id}</td>
                <td>
                  {product.image ? (
                    <img src={getImageUrl(product.image)} alt="" width="40" height="40"
                      onError={event => { event.currentTarget.src = defaultLogo; event.currentTarget.style.objectFit = 'contain'; event.currentTarget.style.background = '#126354'; event.currentTarget.style.padding = '4px'; }}
                      style={{ borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: '#126354', border: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={defaultLogo} alt="Default Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{product.productName || product.name}</div>
                  <div style={{ fontSize: 11, color: KM.muted, marginTop: 3, maxWidth: 250 }}>
                    {product.shortDescription || product.longDescription || product.description || 'No description'}
                  </div>
                  <div style={{ fontSize: 11, color: KM.muted, marginTop: 3 }}>Barcode: {product.barcode || '—'}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {product.isNewArrival && <span style={{ fontSize: 10, background: '#DCFCE7', color: '#16A34A', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>New</span>}
                    {product.isBestSeller && <span style={{ fontSize: 10, background: '#FEF9C3', color: '#CA8A04', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Best Seller</span>}
                  </div>
                </td>
                <td><span style={{ color: product.status === 'Inactive' ? '#E05252' : KM.green, fontWeight: 600 }}>{product.status || 'Active'}</span></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>{variants.length} variant{variants.length === 1 ? '' : 's'}</span>
                    {sizes.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{sizes.map(size => <span key={size} style={{ fontSize: 10, border: `1px solid ${KM.border}`, borderRadius: 3, padding: '2px 5px' }}>{size}</span>)}</div>}
                    {colors.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{colors.map(color => <span key={color} style={{ fontSize: 10, border: `1px solid ${KM.teal}`, background: '#E0F2FE', borderRadius: 3, padding: '2px 5px', color: '#0369A1' }}>{color}</span>)}</div>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor(stock) }} />
                    <span style={{ fontWeight: 700, color: stock === 0 ? KM.red : KM.text }}>{stock}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{resolveCategory(product)}</div>
                  {billingSubcategoryId && <div style={{ fontSize: 11, color: KM.muted, marginTop: 3 }}>Subcategory #{billingSubcategoryId}</div>}
                </td>
                <td className="td-price">₹{Number(product.franchise_price_final ?? variants.find(variant => variant.franchise_price_final != null)?.franchise_price_final ?? 0).toLocaleString('en-IN')}</td>
                <td><button className="action-btn btn-edit" onClick={() => handleEditClick(product)}>Edit</button></td>
              </tr>
            );
          }}
        />
      )}
    </div>
  );
}
