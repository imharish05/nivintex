import { useEffect, useState } from 'react';
import DataTable from '../DataTable/DataTable';
import { stockApi } from '../../api';

const KM = { text: '#1A1A2E', muted: '#6B7280', border: '#E5E7EB', teal: '#00B4D8' };

const money = value => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—';
};

export default function Stock({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    stockApi.getAll()
      .then(data => { if (active) setRows(Array.isArray(data) ? data : []); })
      .catch(error => { if (active) showToast('Load Failed', error.message || 'Could not load stock data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="section-title">Product Stock</div>
      </div>
      <p style={{ margin: '0 0 18px', color: KM.muted, fontSize: 12 }}>Inventory is read from Billing for each product variant.</p>
      {loading ? <p className="km-loading">Loading...</p> : (
        <DataTable
          columns={['Stock ID', 'Product / Billing ID', 'Variant', 'Billing Variant ID', 'SKU', 'Barcode', 'Franchise price', 'Current stock', 'Status']}
          initialRows={rows}
          renderRow={row => {
            const product = row.product || row.Product || {};
            const details = row.billingData || row.billing_data || {};
            const quantity = Number(row.quantity ?? row.stock ?? 0);
            const billingVariantId = row.billingVariantId || row.billing_variant_id || details.id || '—';
            const barcode = row.barcode || details.barcode || '—';
            const sku = row.sku || details.sku || row.variant_code || '—';
            const status = row.status || (quantity > 0 ? 'Active' : 'Inactive');
            const variantLabel = [row.size, row.color, row.fabric].filter(Boolean).join(' / ')
              || details.variant_name || row.variant_code || 'Default variant';
            return (
              <tr key={row.id}>
                <td style={{ fontWeight: 600, color: KM.muted }}>#{row.id}</td>
                <td style={{ fontWeight: 600 }}>
                  {product.productName || product.name || row.productName || `Product #${row.product_id || row.productId || '—'}`}
                  <div style={{ marginTop: 3, fontSize: 11, color: KM.muted }}>Product #{row.product_id || row.productId || product.id || '—'} · Billing #{product.billingProductId || product.billing_product_id || '—'}</div>
                  <div style={{ marginTop: 3, fontSize: 11, color: KM.muted }}>Code {product.product_code || product.productCode || '—'} · HSN {product.hsn_code || product.hsnCode || '—'}</div>
                </td>
                <td><span style={{ fontSize: 12, fontWeight: 600, color: KM.teal }}>{variantLabel}</span></td>
                <td>{billingVariantId}</td>
                <td>{sku}</td>
                <td>{barcode}</td>
                <td>{money(row.franchise_price_final ?? row.prices?.franchise ?? details.franchise_price_final)}</td>
                <td><strong style={{ color: quantity === 0 ? '#dc2626' : KM.text }}>{quantity}</strong></td>
                <td><span className={`status-pill ${String(status).toLowerCase() === 'active' ? 'pill-active' : 'pill-inactive'}`}>{status}</span></td>
              </tr>
            );
          }}
        />
      )}
    </div>
  );
}
