import defaultLogo from '../../assets/logo.png';
import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { productApi, getImageUrl } from '../../api';

const KM = {
  orange: '#A2C579', orangeLight: '#FEF0EB',
  blue: '#2C2F33', green: '#39B54A',
  teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
};

const resolveImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('data:') || image.startsWith('http')) return image;
  return getImageUrl(image);
};



export default function SaleManager({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Load Failed', err.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (productId, field, currentValue) => {
    const newValue = !currentValue;
    
    // Optimistically update the UI row state
    setRows(prev => prev.map(r => r.id === productId ? { ...r, [field]: newValue } : r));

    try {
      await productApi.updateSaleStatus(productId, { [field]: newValue });
      showToast('Updated!', `Sale status updated successfully.`);
    } catch (err) {
      // Revert in case of API failure
      setRows(prev => prev.map(r => r.id === productId ? { ...r, [field]: currentValue } : r));
      showToast('Update Failed', err.message || 'Could not update sale status.');
    }
  };

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="section-title">Sales Management</div>
        </div>
      </div>

      {loading ? (
        <p style={{ padding: 20, color: KM.muted }}>Loading products…</p>
      ) : (
        <DataTable
          columns={['ID', 'Image', 'Product', 'Brand', 'Final price (₹)', 'Buy One Get One']}
          initialRows={rows}
          renderRow={(row) => {
            const finalPrice = Number(row.franchise_price_final ?? 0);

            return (
              <tr key={row.id}>
                <td style={{ color: KM.muted }}>#{row.id}</td>

                <td>
                  {row.image ? (
                    <img src={resolveImageSrc(row.image)} alt="" width="40" height="40"
                       onError={e => { e.target.src = defaultLogo; e.target.style.objectFit = 'contain'; e.target.style.background = '#126354'; e.target.style.padding = '4px'; }}
                       style={{ borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: KM.bg, border: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: KM.muted }}>📦</div>
                  )}
                </td>

                <td>
                  <div style={{ fontWeight: 600 }}>{row.productName}</div>
                  {row.shortDescription && (
                    <div style={{ fontSize: 11, color: KM.muted, marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.shortDescription}</div>
                  )}
                </td>

                <td style={{ fontSize: 12, color: KM.teal, fontWeight: 500 }}>{row.Brand?.brandName || '—'}</td>

                <td>₹{finalPrice.toFixed(2)}</td>

                {/* Buy One Get One toggle checkbox */}
                <td>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!row.isBuyOneGetOne}
                      onChange={() => handleToggle(row.id, 'isBuyOneGetOne', row.isBuyOneGetOne)}
                      style={{
                        width: 18,
                        height: 18,
                        accentColor: KM.orange,
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.isBuyOneGetOne ? KM.orange : KM.muted }}>
                      {row.isBuyOneGetOne ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </td>
              </tr>
            );
          }}
        />
      )}
    </div>
  );
}
