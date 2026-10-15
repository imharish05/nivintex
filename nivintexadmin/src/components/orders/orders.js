import { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../DataTable/DataTable';
import { getImageUrl } from '../../api';

const API = process.env.REACT_APP_API_URL;

const STATUS_OPTIONS = [
  'confirmed',
  'accepted',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const labelFor = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const parseAddr = (raw) => { try { return JSON.parse(raw); } catch { return null; } };

const AddressBlock = ({ addr, phone, phone2, email }) => {
  if (!addr) return <p className="td-muted">Not provided</p>;
  const fullName = addr.name || `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || '';
  const street1  = addr.address  || addr.address1  || '';
  const street2  = addr.address2 || '';
  const pincode  = addr.zip      || addr.postcode   || '';
  const tel      = addr.phone    || phone            || '';
  const tel2     = addr.phone2   || phone2           || '';
  const mail     = addr.email    || email            || '';

  return (
    <div className="km-billing-info">
      {fullName  && <div><strong>{fullName}</strong></div>}
      {addr.company && <div className="td-muted">{addr.company}</div>}
      {street1   && <div>{street1}</div>}
      {street2   && <div>{street2}</div>}
      <div>{addr.city}{addr.state ? `, ${addr.state}` : ''}</div>
      {pincode   && <div>PIN: {pincode}</div>}
      {tel       && <div>📞 {tel}</div>}
      {tel2      && (
        <div>
          📞 {tel2} <span style={{ fontSize: 10, fontWeight: 600, background: '#fff3e0', color: '#e65100', padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>Alt</span>
        </div>
      )}
      {mail      && <div>✉️ {mail}</div>}
    </div>
  );
};

function OrderDetailsModal({ order, onClose, onPreview, onEditBilling, onRetryShipment }) {
  if (!order) return null;
  const billing = parseAddr(order.billing_address);
  const shipping = parseAddr(order.shipping_address) || billing;
  const total = Number(order.total || 0);
  const bookingStatus = order.shiprocket_booking_status || (order.awb_code ? 'booked' : order.payment_status === 'paid' ? 'pending' : 'not_requested');

  return (
    <div className="km-order-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="km-order-modal" role="dialog" aria-modal="true" aria-labelledby="order-details-title" onClick={event => event.stopPropagation()}>
        <header className="km-order-modal-header">
          <div>
            <h2 id="order-details-title">Order #{order.id}</h2>
            <p>Placed {new Date(order.createdAt).toLocaleString('en-IN')} · {labelFor(order.payment_status || 'pending')}</p>
          </div>
          <button type="button" className="km-order-modal-close" onClick={onClose} aria-label="Close order details">×</button>
        </header>

        <div className="km-order-modal-body">
          <section className="km-order-modal-summary">
            <div><span>Customer</span><strong>{order.customer_name}</strong><small>{order.customer_email} · {order.customer_phone || 'No phone'}</small></div>
            <div><span>Payment status</span><strong>{labelFor(order.payment_status || 'pending')}</strong></div>
            <div><span>Payment ID</span><strong className="km-order-break">{order.payment_id || 'Not available'}</strong></div>
            <div><span>Total paid</span><strong>₹{total.toFixed(2)}</strong></div>
          </section>

          <section className="km-order-modal-section">
            <h3>Purchased items</h3>
            <div className="km-order-modal-items">
              {order.OrderItems?.map((item, index) => {
                const image = item.image || item.Product?.image || item.product?.image;
                return <div className="km-order-modal-item" key={`${item.id || item.product_id || index}-${index}`}>
                  {image ? <button type="button" className="km-order-modal-image" onClick={() => onPreview({ ...item, imageUrl: getImageUrl(image) })} aria-label={`Preview ${item.name || 'product image'}`}><img src={getImageUrl(image)} alt="" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /></button> : <div className="km-order-modal-image km-order-modal-image-empty">No image</div>}
                  <strong>{item.name || item.Product?.productName || 'Product'}</strong>
                  <span>Qty {item.quantity}</span>
                  <span>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
                </div>;
              })}
            </div>
          </section>

          <div className="km-order-modal-addresses">
            <section className="km-order-modal-section"><h3>Shipping address</h3><AddressBlock addr={shipping} phone={order.customer_phone} phone2={order.customer_phone2} email={null} /></section>
            <section className="km-order-modal-section"><h3>Billing address</h3><AddressBlock addr={billing} phone={order.customer_phone} phone2={order.customer_phone2} email={order.customer_email} /></section>
          </div>

          <div className="km-order-modal-addresses">
            <section className="km-order-modal-section">
              <h3>Payment &amp; Billing sync</h3>
              <div className="km-order-modal-lines">
                <div><span>Invoice sync</span><strong>{labelFor(order.billing_sync_status || 'not_configured')}</strong></div>
                <div><span>Stock sync</span><strong>{labelFor(order.billing_stock_sync_status || 'not_configured')}</strong></div>
                {order.billing_stock_synced_at && <div><span>Stock synced</span><strong>{new Date(order.billing_stock_synced_at).toLocaleString('en-IN')}</strong></div>}
              </div>
              {order.billing_stock_sync_error && <p className="km-order-modal-error">{order.billing_stock_sync_error}</p>}
              <button type="button" className="km-order-modal-secondary" onClick={() => onEditBilling(order)}>Edit billing details</button>
            </section>
            <section className="km-order-modal-section">
              <h3>Shipping &amp; Shiprocket</h3>
              <div className="km-order-modal-lines">
                <div><span>Customer chose</span><strong>{order.shiprocket_requested_courier_name || order.courier_name || 'Not recorded'}</strong></div>
                {order.shiprocket_requested_courier_id && <div><span>Courier ID</span><strong>{order.shiprocket_requested_courier_id}</strong></div>}
                <div><span>Quoted rate</span><strong>₹{Number(order.shiprocket_requested_rate ?? order.delivery_charge ?? 0).toFixed(2)}</strong></div>
                <div><span>Shipping paid</span><strong>₹{Number(order.delivery_charge || 0).toFixed(2)}</strong></div>
                {order.shiprocket_estimated_delivery_days && <div><span>Estimated delivery</span><strong>{order.shiprocket_estimated_delivery_days}</strong></div>}
                <div><span>Booking</span><strong>{labelFor(bookingStatus)}</strong></div>
                {order.awb_code && <div><span>Booked courier</span><strong>{order.courier_name || 'Courier assigned'}</strong></div>}
                {order.awb_code && <div><span>AWB</span><strong>{order.awb_code}</strong></div>}
                {order.shiprocket_shipment_id && <div><span>Shipment ID</span><strong>{order.shiprocket_shipment_id}</strong></div>}
              </div>
              {order.shiprocket_booking_error && <p className="km-order-modal-error">{order.shiprocket_booking_error}</p>}
              {!order.awb_code && <button type="button" className="km-order-modal-primary" onClick={() => onRetryShipment(order)}>Choose / retry courier</button>}
            </section>
          </div>
        </div>

        <footer className="km-order-modal-footer"><span>Order #{order.id}</span><button type="button" onClick={onClose}>Close</button></footer>
      </section>
    </div>
  );
}

export default function Orders({ showToast, status = null }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  
  const [previewItem, setPreviewItem] = useState(null);
  const [courierOrder, setCourierOrder] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [courierLoading, setCourierLoading] = useState(false);
  const [bookingCourierId, setBookingCourierId] = useState(null);
  const [billingEditOrder, setBillingEditOrder] = useState(null);
  const [billingDraft, setBillingDraft] = useState(null);
  const [billingEditSaving, setBillingEditSaving] = useState(false);

  const fetchOrders = useCallback((currentStatus) => {
    setLoading(true);
    fetch(`${API}/orders/all`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` } })
      .then(r => r.json())
      .then(data => {
        const all = Array.isArray(data.orders) ? data.orders : [];
        setRows(currentStatus ? all.filter(o => o.status === currentStatus) : all);
      })
      .catch(() => showToast('Load Failed', 'Could not load orders.'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    setExpanded(null);
    fetchOrders(status);
  }, [status, fetchOrders]);

  const updateStatus = async (id, newStatus, prevStatus) => {
    setRows(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setUpdatingIds(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`${API}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      if (status && newStatus !== status) setRows(prev => prev.filter(o => o.id !== id));
      showToast('Order Updated!', 'Order status changed successfully.');
    } catch {
      setRows(prev => prev.map(o => o.id === id ? { ...o, status: prevStatus } : o));
      showToast('Server Error', 'Something went wrong. Try again.');
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const openCourierModal = async order => {
    setCourierOrder(order);
    setCouriers([]);
    setCourierLoading(true);
    try {
      const response = await fetch(`${API}/shipping/orders/${order.id}/couriers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load couriers.');
      setCouriers(data.couriers || []);
    } catch (error) {
      showToast('Courier Lookup Failed', error.message);
      setCourierOrder(null);
    } finally {
      setCourierLoading(false);
    }
  };

  const bookWithCourier = async courier => {
    if (!courierOrder) return;
    setBookingCourierId(courier.courierId);
    try {
      const response = await fetch(`${API}/shipping/orders/${courierOrder.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        body: JSON.stringify({ courierId: courier.courierId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not book this courier.');
      showToast('Shipment Booked', `${data.courierName || courier.courierName}${data.awbCode ? ` · AWB ${data.awbCode}` : ''}`);
      setCourierOrder(null);
      fetchOrders(status);
    } catch (error) {
      showToast('Booking Failed', error.message);
    } finally {
      setBookingCourierId(null);
    }
  };

  const filteredRows = useMemo(() => [...rows].sort((a, b) => a.id - b.id), [rows]);

  const openBillingEditor = async order => {
    try {
      const response = await fetch(`${API}/orders/${order.id}/billing-payload`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` } });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not load billing details.');
      setBillingDraft(result.billingPayload || {});
      setBillingEditOrder({ ...order, billingSyncStatus: result.billingSyncStatus });
    } catch (error) { showToast('Billing details unavailable', error.message); }
  };

  const saveBillingEditor = async () => {
    if (!billingEditOrder || !billingDraft) return;
    setBillingEditSaving(true);
    try {
      const response = await fetch(`${API}/orders/${billingEditOrder.id}/billing-payload`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        body: JSON.stringify({ billingPayload: billingDraft }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not save billing details.');
      setBillingEditOrder(null);
      setBillingDraft(null);
      showToast('Billing details saved', 'Local billing details were updated. Paid amount and purchased items remain unchanged.');
      fetchOrders(status);
    } catch (error) { showToast('Billing details not saved', error.message); }
    finally { setBillingEditSaving(false); }
  };

  useEffect(() => {
    if (!previewItem) return undefined;
    const handleKeyDown = event => { if (event.key === 'Escape') setPreviewItem(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewItem]);

  useEffect(() => {
    if (expanded === null) return undefined;
    const handleKeyDown = event => { if (event.key === 'Escape') setExpanded(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="section-title">
          {status ? `${labelFor(status)} Orders` : 'All Orders'}
        </div>
        
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          {!loading && <span className="km-count-badge">{filteredRows.length}</span>}
        </div>
      </div>

      {loading ? (
        <p className="km-loading">Loading orders...</p>
      ) : filteredRows.length === 0 ? (
        <p className="km-empty">No orders found.</p>
      ) : (
        <DataTable
          columns={['#ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Details']}
          initialRows={filteredRows}
          renderRow={(order) => {
            const isSaving = updatingIds.has(order.id);
            const total = Number(order.total || 0);

            return (
              <>
                <tr key={order.id}>
                  <td className="td-id">#{order.id}</td>
                  <td>
                    <div className="td-name">{order.customer_name}</div>
                    <div className="td-sub">{order.customer_email}</div>
                    <div className="td-sub">📞 {order.customer_phone}</div>
                  </td>
                  <td>
                    <span className="km-count-badge">{order.OrderItems?.length || 0} items</span>
                  </td>
                  <td className="td-price">₹{total.toFixed(2)}</td>
                  
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select
                        className={`km-status-select km-status-${order.status}`}
                        value={order.status}
                        disabled={isSaving}
                        onChange={e => updateStatus(order.id, e.target.value, order.status)}
                        style={{ opacity: isSaving ? 0.6 : 1 }}
                      >
                        {STATUS_OPTIONS.map(st => (
                          <option key={st} value={st}>{labelFor(st)}</option>
                        ))}
                      </select>
                      {isSaving && <span style={{ position: 'absolute', right: -22, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, border: '2px solid #ddd', borderTop: '2px solid #2C2F33', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                    </div>
                  </td>
                  <td className="td-muted">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <button className="action-btn btn-edit" onClick={() => setExpanded(order.id)}>
                      Details
                    </button>
                  </td>
                </tr>

              </>
            );
          }}
        />
      )}

      <OrderDetailsModal
        order={expanded === null ? null : filteredRows.find(order => order.id === expanded)}
        onClose={() => setExpanded(null)}
        onPreview={setPreviewItem}
        onEditBilling={openBillingEditor}
        onRetryShipment={openCourierModal}
      />

      {previewItem && (
        <div role="presentation" onClick={() => setPreviewItem(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15, 23, 42, 0.72)' }}>
          <section role="dialog" aria-modal="true" aria-label={`Image preview: ${previewItem.name || 'ordered item'}`} onClick={event => event.stopPropagation()} style={{ position: 'relative', width: 'min(680px, 100%)', maxHeight: '90vh', overflow: 'auto', padding: 20, borderRadius: 14, background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,.3)' }}>
            <button type="button" onClick={() => setPreviewItem(null)} aria-label="Close image preview" style={{ position: 'absolute', top: 10, right: 12, width: 36, height: 36, border: 0, borderRadius: 18, background: 'rgba(15,23,42,.08)', color: '#1e293b', fontSize: 25, lineHeight: 1, cursor: 'pointer' }}>×</button>
            <img src={previewItem.imageUrl} alt={previewItem.name || 'Ordered item'} style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', margin: '0 auto', borderRadius: 8 }} />
            <div style={{ padding: '14px 4px 2px', color: '#1e293b' }}><strong>{previewItem.name || 'Ordered item'}</strong><div style={{ marginTop: 5, color: '#64748b', fontSize: 13 }}>Quantity: {previewItem.quantity}</div></div>
          </section>
        </div>
      )}

      {billingEditOrder && billingDraft && (
        <div role="presentation" onClick={() => !billingEditSaving && setBillingEditOrder(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,.64)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="order-billing-edit-title" onClick={event => event.stopPropagation()} style={{ width: 'min(720px, 100%)', maxHeight: '88vh', overflow: 'auto', borderRadius: 14, background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}>
            <header style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb' }}><h2 id="order-billing-edit-title" style={{ margin: 0, color: '#0f5447', fontSize: 18 }}>Edit billing details · Order #{billingEditOrder.id}</h2><p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12 }}>Changes save to the local billing snapshot. Paid amount and purchased items remain unchanged.</p></header>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, padding: 20 }}>
              <div style={{ gridColumn: '1 / -1', padding: 11, borderRadius: 8, background: '#fff7ed', color: '#9a5700', fontSize: 12 }}>Billing’s remote create/update endpoint is not configured. This editor saves the Billing-shaped data in the ecommerce database only.</div>
              <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 11, fontWeight: 600 }}>Bill number<input readOnly value={billingDraft.bill_number || 'Generated by Billing'} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#f8fafc' }} /></label>
              <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 11, fontWeight: 600 }}>Payment mode<input readOnly value={billingDraft.payment_mode || 'Online'} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#f8fafc' }} /></label>
              {[['customer_name', 'Customer name'], ['customer_phone', 'Phone'], ['customer_email', 'Email'], ['billing_address', 'Billing address'], ['shipping_address', 'Shipping address']].map(([key, label]) => (
                <label key={key} style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 11, fontWeight: 600 }}>{label}<textarea rows={key.includes('address') ? 3 : 1} value={billingDraft[key] || ''} onChange={event => setBillingDraft(current => ({ ...current, [key]: event.target.value }))} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 7, font: '13px inherit', resize: 'vertical' }} /></label>
              ))}
              <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 11, fontWeight: 600 }}>Price type<select value={billingDraft.price_type || 'MRP'} onChange={event => setBillingDraft(current => ({ ...current, price_type: event.target.value }))} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff' }}><option value="MRP">Website Price (MRP)</option><option value="Retail">Retail</option><option value="Wholesale">Wholesale</option></select></label>
              <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 11, fontWeight: 600 }}>Stock location<input readOnly value="Central Admin" style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#f8fafc' }} /></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 12 }}><input type="checkbox" checked={Boolean(Number(billingDraft.has_gst))} onChange={event => setBillingDraft(current => ({ ...current, has_gst: event.target.checked ? 1 : 0 }))} />With GST (5%)</label>
              <div style={{ gridColumn: '1 / -1', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}><strong style={{ display: 'block', marginBottom: 8, color: '#334155', fontSize: 12 }}>Purchased items and verified totals (read-only)</strong>{(billingDraft.items || []).map((item, index) => <div key={`${item.product_variant_id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', color: '#475569', fontSize: 12 }}><span>Variant {item.product_variant_id || 'Billing ID unavailable'} × {item.quantity}</span><span>GST {item.gst_percent}%</span></div>)}<div style={{ borderTop: '1px solid #e2e8f0', marginTop: 7, paddingTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 7, color: '#334155', fontSize: 11 }}><span>Subtotal ₹{Number(billingDraft.subtotal || 0).toFixed(2)}</span><span>Bill discount ₹{Number(billingDraft.bill_discount_amount || 0).toFixed(2)}</span><span>GST ₹{Number(billingDraft.gst_amount || 0).toFixed(2)}</span><span>Shipping ₹{Number(billingDraft.delivery_charge || 0).toFixed(2)}</span><span>Paid ₹{Number(billingDraft.paid_amount || 0).toFixed(2)}</span><span>Balance ₹{Number(billingDraft.balance || 0).toFixed(2)}</span></div></div>
            </div>
            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid #e5e7eb' }}><button type="button" disabled={billingEditSaving} onClick={() => setBillingEditOrder(null)} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', cursor: 'pointer' }}>Cancel</button><button type="button" disabled={billingEditSaving} onClick={saveBillingEditor} style={{ padding: '9px 14px', border: 0, borderRadius: 7, background: '#0f5447', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{billingEditSaving ? 'Saving…' : 'Save billing details'}</button></footer>
          </section>
        </div>
      )}

      {courierOrder && (
        <div role="presentation" onClick={() => !bookingCourierId && setCourierOrder(null)} style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, background: 'rgba(15,23,42,.64)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="shiprocket-courier-title" onClick={event => event.stopPropagation()} style={{ width: 'min(680px, 100%)', maxHeight: 'min(85vh, 760px)', overflow: 'auto', borderRadius: 16, background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}>
            <header style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '18px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
              <div><h2 id="shiprocket-courier-title" style={{ margin: 0, color: '#0f5447', fontSize: 19 }}>Available couriers</h2><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 13 }}>Order #{courierOrder.id} · Choose a service to book.</p></div>
              <button type="button" onClick={() => setCourierOrder(null)} disabled={Boolean(bookingCourierId)} aria-label="Close couriers" style={{ border: 0, borderRadius: 8, width: 36, height: 36, background: '#f1f5f9', fontSize: 23, cursor: 'pointer' }}>×</button>
            </header>
            <div style={{ padding: 20 }}>
              {courierLoading ? <p style={{ margin: 0, color: '#64748b' }}>Checking Shiprocket serviceability…</p> : couriers.length === 0 ? <p style={{ margin: 0, color: '#64748b' }}>No couriers are available for this delivery address.</p> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {couriers.map(courier => <article key={courier.courierId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 12, padding: 14, border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <div style={{ minWidth: 0 }}><strong style={{ display: 'block', color: '#1e293b', overflowWrap: 'anywhere' }}>{courier.courierName}</strong><span style={{ display: 'block', marginTop: 5, color: '#64748b', fontSize: 12 }}>{courier.estimatedDeliveryDays || courier.etd || 'Delivery estimate unavailable'}{courier.rating ? ` · ★ ${courier.rating}` : ''}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}><strong style={{ color: '#0f5447' }}>₹{Number(courier.rate).toFixed(2)}</strong><button type="button" disabled={Boolean(bookingCourierId)} onClick={() => bookWithCourier(courier)} style={{ padding: '8px 12px', border: 0, borderRadius: 7, background: bookingCourierId === courier.courierId ? '#94a3b8' : '#0f5447', color: '#fff', fontWeight: 600, cursor: bookingCourierId ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>{bookingCourierId === courier.courierId ? 'Booking…' : 'Book courier'}</button></div>
                  </article>)}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
