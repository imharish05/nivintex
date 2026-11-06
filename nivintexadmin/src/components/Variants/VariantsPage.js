import { useEffect, useState } from 'react';
import { variantApi, getImageUrl } from '../../api';
import './VariantsPage.css';

const muted = '#6B7280';

function animateReorder(container, update) {
  const before = new Map(Array.from(container?.querySelectorAll('[data-sortable-image]') || [])
    .map(element => [element.dataset.sortableKey, element.getBoundingClientRect()]));
  update();
  requestAnimationFrame(() => {
    Array.from(container?.querySelectorAll('[data-sortable-image]') || []).forEach(element => {
      const previous = before.get(element.dataset.sortableKey);
      if (!previous) return;
      const current = element.getBoundingClientRect();
      const x = previous.left - current.left;
      const y = previous.top - current.top;
      if (!x && !y) return;
      element.style.transition = 'none';
      element.style.transform = `translate(${x}px, ${y}px)`;
      element.getBoundingClientRect();
      requestAnimationFrame(() => {
        element.style.transition = 'transform 180ms cubic-bezier(.2,.8,.2,1)';
        element.style.transform = '';
      });
    });
  });
}

function SelectedImagePreview({ file, alt }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <img className="variant-image-preview" src={src} alt={alt} />;
}

export default function VariantsPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState('');
  const [draggingImage, setDraggingImage] = useState(null);

  const load = async (forceSync = false) => {
    setLoading(true);
    try {
      const data = await variantApi.getAll(forceSync);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setProducts([]);
      showToast('Could not load Billing variants', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveImages = async variant => {
    if (!variant.billingVariantId) {
      showToast('Cannot save', 'This variant is missing its Billing variant ID. Refresh and try again.');
      return;
    }
    const draft = drafts[variant.billingVariantId];
    if (!draft) {
      return;
    }
    setSavingId(variant.billingVariantId);
    const body = new FormData();
    const files = draft.items.filter(item => item.type === 'new').map(item => item.file);
    body.append('keepImages', JSON.stringify(draft.items.filter(item => item.type === 'saved').map(item => item.path)));
    body.append('imageOrder', JSON.stringify(draft.items.map(item => item.type === 'saved'
      ? { type: 'saved', path: item.path }
      : { type: 'new', index: files.indexOf(item.file) })));
    files.forEach(file => body.append('images', file));
    try {
      await variantApi.updateImage(variant.billingVariantId, body);
      setDrafts(current => { const next = { ...current }; delete next[variant.billingVariantId]; return next; });
      showToast('Images saved', 'The variant image gallery has been updated.');
      await load(false);
    } catch (error) {
      showToast('Image update failed', error.message);
    } finally {
      setSavingId(null);
    }
  };

  const rows = products.flatMap(product => (product.Variants || product.variants || []).map(variant => ({
    ...variant,
    billingProductId: product.billingProductId,
    billingProductName: product.productName || product.name,
  })));
  const imageList = variant => {
    let images = variant.images;
    if (typeof images === 'string') { try { images = JSON.parse(images); } catch (_) { images = []; } }
    if (!Array.isArray(images)) images = [];
    if (!images.length && variant.image) images = [variant.image];
    return [...new Set(images.filter(image => typeof image === 'string' && image))];
  };
  const galleryItems = variant => drafts[variant.billingVariantId]?.items
    || imageList(variant).map(path => ({ type: 'saved', path }));
  const updateDraft = (variant, items) => {
    const id = String(variant.billingVariantId || '');
    if (!id) return;
    const currentImages = imageList(variant).map(path => ({ type: 'saved', path }));
    const changed = items.length !== currentImages.length || items.some((item, index) => item.type !== 'saved' || item.path !== currentImages[index]?.path);
    setDrafts(current => {
      const result = { ...current };
      if (changed) result[id] = { items };
      else delete result[id];
      return result;
    });
  };
  const reorderImages = (variant, sourceIndex, targetIndex, container) => {
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const items = [...galleryItems(variant)];
    if (!items[sourceIndex] || !items[targetIndex]) return;
    const [moved] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, moved);
    animateReorder(container, () => updateDraft(variant, items));
  };
  const filteredRows = rows.filter(variant => [
    variant.billingVariantId, variant.id, variant.billingProductId, variant.billingProductName,
    variant.variant_code, variant.sku, variant.size, variant.color, variant.status,
    variant.billingData?.variant_name, variant.billingData?.barcode,
  ].some(value => String(value || '').toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="variants-page">
      <div className="section-header variants-heading">
        <div>
          <div className="section-title">Product Variants</div>
          {/* <div className="variants-subtitle">Variant details and stock refresh from Billing. Price fields are managed in Billing.</div> */}
        </div>
        <button className="action-btn btn-edit" onClick={() => load(true)} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh Billing Data'}</button>
      </div>

      <div className="variants-toolbar">
        <div className="variants-count">{loading ? 'Refreshing Billing variants…' : `${filteredRows.length} variant${filteredRows.length === 1 ? '' : 's'}`}</div>
        <input className="search-input variants-search" placeholder="Search product, SKU, barcode…" value={query} onChange={event => setQuery(event.target.value)} />
      </div>

      {loading ? <p className="variants-loading">Loading live variants from Billing…</p> : (
        <div className="km-table-wrap variants-table-wrap">
          <table className="data-table variants-table">
            <thead><tr>
              <th>Billing ID</th><th>Product</th><th>Variant details</th><th>SKU / Barcode</th><th>Status</th><th>Stock</th><th>Price</th><th>Image gallery</th>
            </tr></thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={8} className="km-empty">{rows.length ? 'No variants match your search.' : 'No variants loaded. Refresh Billing data to try again.'}</td></tr>
              ) : filteredRows.map(variant => {
                const items = galleryItems(variant);
                const draft = drafts[variant.billingVariantId];
                const savedCount = items.filter(item => item.type === 'saved').length;
                const newCount = items.filter(item => item.type === 'new').length;
                const details = variant.billingData || {};
                const stock = Number(variant.stock ?? variant.quantity ?? 0);
                const saving = savingId === variant.billingVariantId;
                return (
                  <tr key={variant.billingVariantId || variant.id}>
                    <td className="variant-id">{variant.billingVariantId || variant.id || '—'}</td>
                    <td className="variant-product">{variant.billingProductName || '—'}<small>Product ID {variant.billingProductId || '—'}</small></td>
                    <td className="variant-detail-cell"><strong>{details.variant_name || variant.variant_code || 'Unnamed variant'}</strong><span>{[variant.size, variant.color, details.width].filter(Boolean).join(' · ') || 'No size or color details'}</span></td>
                    <td className="variant-code-cell"><span>{variant.sku || 'No SKU'}</span><small>{details.barcode || 'No barcode'}</small></td>
                    <td><span className={`status-pill ${String(variant.status).toLowerCase() === 'active' ? 'pill-active' : 'pill-inactive'}`}>{variant.status || 'Unknown'}</span></td>
                    <td className="variant-stock">{stock}</td>
                    <td><strong>₹{Number(variant.franchise_price_final ?? variant.prices?.franchise ?? details.franchise_price_final ?? 0).toLocaleString('en-IN')}</strong></td>
                    <td className="variant-gallery-cell">
                      <div className="variant-gallery-panel">
                        <div className="variant-gallery-header">
                          <div><strong>Variant photos</strong><span>{items.length} total{newCount ? ` · ${newCount} selected` : ''}</span></div>
                          <label className="variant-file-label"><span aria-hidden="true">＋</span> Add photos
                            <input type="file" accept="image/*" multiple disabled={saving} onChange={event => {
                              const selected = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
                              if (selected.length) updateDraft(variant, [...items, ...selected.map(file => ({ type: 'new', file, id: `${Date.now()}-${Math.random()}` }))]);
                              event.target.value = '';
                            }} />
                          </label>
                        </div>
                        <div className="variant-gallery-grid">
                        {items.map((item, index) => {
                          const isSaved = item.type === 'saved';
                          const dragKey = isSaved ? `saved-${item.path}` : `new-${item.id}`;
                          return <div data-sortable-image data-sortable-key={dragKey} className={`variant-gallery-thumb ${!isSaved ? 'variant-gallery-new' : ''} ${draggingImage?.key === dragKey ? 'is-dragging' : ''}`} key={dragKey}
                            onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
                            onDragEnter={event => { event.preventDefault(); if (draggingImage && draggingImage.index !== index) { reorderImages(variant, draggingImage.index, index, event.currentTarget.parentElement); setDraggingImage(current => current ? { ...current, index } : current); } }}
                            onDrop={event => { event.preventDefault(); setDraggingImage(null); }}
                            title="Drag to change image order">
                          {isSaved ? <img className="variant-image-preview" src={getImageUrl(item.path)} alt={`Variant ${index + 1}`} /> : <SelectedImagePreview file={item.file} alt={`Selected variant ${index + 1}`} />}
                          <span className="variant-drag-handle" aria-label="Drag to reorder" title="Drag to reorder" draggable={!saving} onDragStart={event => { setDraggingImage({ key: dragKey, index }); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setDragImage(event.currentTarget.parentElement, 24, 27); }} onDragEnd={() => setDraggingImage(null)}>⠿</span>
                          {index === 0 && <span className="variant-main-label">Main</span>}
                          <button type="button" aria-label="Remove image" title="Remove image" disabled={saving} onClick={() => updateDraft(variant, items.filter((_, imageIndex) => imageIndex !== index))}>×</button>
                          {!isSaved && <span className="variant-new-label">NEW</span>}
                        </div>;
                        })}
                        {!items.length && <div className="variant-gallery-empty"><strong>No variant photos yet</strong><span>Add one or more photos to show this variant in the product gallery.</span></div>}
                        </div>
                        {draft && <div className="variant-gallery-footer">
                          <span>{savedCount} saved · {newCount} selected · drag to reorder</span>
                          <div>
                            <button type="button" className="variant-discard-button" disabled={saving} onClick={() => setDrafts(current => { const next = { ...current }; delete next[variant.billingVariantId]; return next; })}>Discard</button>
                            <button type="button" className="variant-save-button" disabled={saving} onClick={() => saveImages(variant)}>{saving ? 'Saving photos…' : 'Save photos'}</button>
                          </div>
                        </div>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="variants-footnote" style={{ color: muted }}>Price and variant stock are supplied by Billing. Add, remove, and save multiple images for each variant here.</div>
    </div>
  );
}
