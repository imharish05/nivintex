import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { SIZE_UNITS } from '../../SmartUnitSelector/SmartUnitSelector';
import { stockApi } from '../../api';

const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };

const KM = {
  orange: '#A2C579', orangeLight: '#FEF0EB',
  blue: '#2C2F33', green: '#39B54A',
  teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
};

// ── Stock Adjust Modal ─────────────────────────────────────────────────────
function StockModal({ stockItem, onClose, onDone, showToast }) {
  const [mode, setMode] = useState('add');
  const [qty, setQty]   = useState('');
  const [busy, setBusy] = useState(false);

  const currentStock = stockItem.stock ?? 0;
  const parsed       = parseInt(qty) || 0;
  const preview      = mode === 'add' ? currentStock + parsed : currentStock - parsed;
  const invalid      = mode === 'reduce' && parsed > currentStock;

// In the StockModal component, update the handleSave function
const handleSave = async () => {
  if (!parsed || parsed <= 0) { 
    showToast('Invalid Quantity', 'Please enter a valid quantity.'); 
    return; 
  }
  if (invalid) { 
    showToast('Stock Limit', 'Cannot reduce more than current stock.'); 
    return; 
  }
  setBusy(true);
  try {
    // Send the update - this will automatically create a stock record if needed
    await stockApi.update(stockItem.id, { stock: preview, quantity: preview });
    showToast(
      mode === 'add' ? 'Stock Added!' : 'Stock Reduced!', 
      mode === 'add' ? `Added ${parsed} units successfully.` : `Reduced ${parsed} units successfully.`
    );
    onDone(stockItem.id, preview);
    onClose();
  } catch (err) {
    showToast('Update Failed', err.message || 'Could not update stock. Try again.');
  } finally { 
    setBusy(false); 
  }
};

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 380, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background: KM.blue, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Adjust Stock</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {stockItem.Product?.productName || stockItem.productName || `Product #${stockItem.productId}`} —{' '}
              {SIZE_UNITS.includes(stockItem.unit) ? stockItem.unit : stockItem.unit || 'Unit'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, background: KM.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${KM.border}` }}>
              <div style={{ fontSize: 11, color: KM.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Current Stock</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: KM.text }}>{currentStock}</div>
            </div>
            <div style={{ flex: 1, background: invalid ? '#fff5f5' : '#f0fdf4', borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${invalid ? '#fecaca' : '#bbf7d0'}` }}>
              <div style={{ fontSize: 11, color: KM.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>After Update</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: invalid ? '#dc2626' : KM.green }}>{parsed ? preview : '—'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['add', 'reduce'].map(m => (
              <button key={m} onClick={() => { setMode(m); setQty(''); }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1.5px solid ${mode === m ? (m === 'add' ? KM.green : KM.orange) : KM.border}`, background: mode === m ? (m === 'add' ? '#f0fdf4' : KM.orangeLight) : '#fff', color: mode === m ? (m === 'add' ? KM.green : KM.orange) : KM.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}>
                {m === 'add' ? '＋ Add Stock' : '－ Reduce Stock'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quantity to {mode === 'add' ? 'Add' : 'Reduce'}
            </label>
            <input
              style={{ padding: '9px 12px', border: `1px solid ${invalid ? '#fca5a5' : KM.border}`, borderRadius: 8, fontSize: 16, fontWeight: 600, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none' }}
              type="number" min="1" placeholder="0"
              value={qty} onChange={e => setQty(e.target.value)}
            />
            {invalid && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Cannot reduce more than current stock ({currentStock})</span>}
          </div>

          <button onClick={handleSave} disabled={busy || !parsed || parsed <= 0 || invalid}
            style={{ width: '100%', marginTop: 16, padding: 12, background: mode === 'add' ? KM.green : KM.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (busy || !parsed || invalid) ? 0.6 : 1 }}>
            {busy ? 'Saving…' : mode === 'add' ? `Add ${parsed || 0} Units` : `Reduce ${parsed || 0} Units`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Stock({ showToast }) {
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [stockModal, setStockModal] = useState(null);

  useEffect(() => { fetchStocks(); }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const data = await stockApi.getAll();
      const stockRows = data.map(item => ({
        id:           item.id,
        productId:    item.product_id || item.productId,
        productName:  item.product?.name || item.productName || item.Product?.productName,
        unit:         (item.size || item.color) ? [item.size, item.color, item.fabric].filter(Boolean).join(' - ') : (item.unit || item.weight || 'Default'),
        stock:        Number(item.quantity ?? item.stock) || 0,
        status:       item.status || (Number(item.quantity ?? item.stock) > 0 ? 'Active' : 'Inactive'),
        Product:      item.product || item.Product,
      }));
      stockRows.sort((a, b) => a.id - b.id);
      setRows(stockRows);
    } catch (err) {
      showToast('Load Failed', err.message || 'Could not load stock data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdated = (itemId, newStock) => {
    setRows(prev => prev.map(r =>
      r.id === itemId
        ? { ...r, stock: newStock, status: newStock > 0 ? 'Active' : 'Inactive' }
        : r
    ));
  };

  return (
    <div>
      {stockModal && (
        <StockModal
          stockItem={stockModal}
          onClose={() => setStockModal(null)}
          onDone={handleStockUpdated}
          showToast={showToast}
        />
      )}

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">Stock Management</div>
      </div>

      {loading ? (
        <p className="km-loading">Loading...</p>
      ) : (
        <DataTable
          columns={['ID', 'Product', 'Unit', 'Stock', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => {
            const lowStock = row.stock <= 5;
            return (
              <tr key={row.id}>
                <td style={{ fontWeight: 600, color: KM.muted }}>#{row.id}</td>
                <td style={{ fontWeight: 600 }}>
                  {row.Product?.productName || row.productName || `ID: ${row.productId}`}
                </td>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 600, color: KM.teal }}>{row.unit || '—'}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: row.stock === 0 ? '#dc2626' : lowStock ? '#ea580c' : KM.text }}>
                      {row.stock}
                    </span>
                    {row.stock === 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                        Out of Stock
                      </span>
                    )}
                    {row.stock > 0 && lowStock && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#ea580c', padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                        Low
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${pillClass[row.status] || 'pill-inactive'}`}>{row.status}</span>
                </td>
                <td>
                  <button
                    onClick={() => setStockModal(row)}
                    style={{ padding: '5px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, color: KM.green, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ± Stock
                  </button>
                </td>
              </tr>
            );
          }}
        />
      )}
    </div>
  );
}