import { useEffect, useState } from 'react';
import { variantApi, getImageUrl } from '../../api';
import './VariantsPage.css';

const muted = '#6B7280';

export default function VariantsPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState('');

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

  useEffect(() => { load(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveImage = async (variant, remove = false) => {
    if (!variant.billingVariantId) {
      showToast('Cannot save', 'This variant is missing its Billing variant ID. Refresh and try again.');
      return;
    }
    const file = files[variant.billingVariantId];
    if (!file && !remove) {
      showToast('Choose an image', 'Select a variant image before saving.');
      return;
    }
    setSavingId(variant.billingVariantId);
    const body = new FormData();
    if (file) body.append('image', file);
    if (remove) body.append('removeImage', 'true');
    try {
      await variantApi.updateImage(variant.billingVariantId, body);
      setFiles(current => { const next = { ...current }; delete next[variant.billingVariantId]; return next; });
      showToast('Saved', 'The variant image is stored in this app.');
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
          <div className="variants-subtitle">Variant details and stock refresh from Billing. Price fields are managed in Billing.</div>
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
              <th>Billing ID</th><th>Product</th><th>Variant details</th><th>SKU / Barcode</th><th>Status</th><th>Stock</th><th>Price</th><th>Image</th><th>Manage image</th>
            </tr></thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={9} className="km-empty">{rows.length ? 'No variants match your search.' : 'No variants loaded. Refresh Billing data to try again.'}</td></tr>
              ) : filteredRows.map(variant => {
                const file = files[variant.billingVariantId];
                const image = variant.image;
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
                    <td><span className="variant-price-na">Managed in Billing</span></td>
                    <td>
                      {file ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            className="variant-image-preview"
                            src={URL.createObjectURL(file)}
                            alt="New variant preview"
                            style={{ border: '2px solid #10b981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' }}
                          />
                          <span style={{
                            position: 'absolute', top: -4, right: -4,
                            background: '#10b981', color: '#fff',
                            fontSize: 9, fontWeight: 700, padding: '1px 4px',
                            borderRadius: 3, letterSpacing: 0.5
                          }}>NEW</span>
                        </div>
                      ) : image ? (
                        <img className="variant-image-preview" src={getImageUrl(image)} alt={`${variant.billingProductName || 'Product'} variant`} />
                      ) : (
                        <span className="variant-no-image">No image</span>
                      )}
                    </td>
                    <td className="variant-image-actions">
                      <label className="variant-file-label">
                        {file ? 'Change image' : 'Choose image'}
                        <input type="file" accept="image/*" onChange={event => {
                          const selected = event.target.files?.[0];
                          if (selected && variant.billingVariantId) setFiles(current => ({ ...current, [variant.billingVariantId]: selected }));
                        }} />
                      </label>
                      <div className="variant-image-button-row">
                        <button className="action-btn btn-edit" disabled={saving || !file} onClick={() => saveImage(variant)}>{saving ? 'Saving…' : 'Save'}</button>
                        {file && (
                          <button
                            type="button"
                            className="action-btn variant-remove-button"
                            disabled={saving}
                            onClick={() => setFiles(current => {
                              const next = { ...current };
                              delete next[variant.billingVariantId];
                              return next;
                            })}
                          >
                            Cancel
                          </button>
                        )}
                        {!file && image && <button className="action-btn variant-remove-button" disabled={saving} onClick={() => saveImage(variant, true)}>Remove</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="variants-footnote" style={{ color: muted }}>Price and variant stock are supplied by Billing. Images uploaded here are stored in the storefront.</div>
    </div>
  );
}
