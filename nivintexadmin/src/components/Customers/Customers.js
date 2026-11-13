// src/components/Customers/Customers.jsx
import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { API_BASE_URL } from '../../config/api';

const API = API_BASE_URL;

export default function Customers({ showToast }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const openCustomerDetails = async (customer) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/orders/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      const allOrders = Array.isArray(data.orders) ? data.orders : [];
      const custEmail = String(customer.email || '').trim().toLowerCase();
      const custPhone = String(customer.phone || '').trim();
      const matched = allOrders.filter(o =>
        (customer.id && String(o.customer_id) === String(customer.id)) ||
        (custEmail && String(o.customer_email || '').trim().toLowerCase() === custEmail) ||
        (custPhone && String(o.customer_phone || '').trim() === custPhone)
      );
      setCustomerOrders(matched);
    } catch {
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ FIXED: now fetching from the users/userlogin table
      const token = localStorage.getItem('adminToken');
const response = await fetch(`${API}/user`, {
  headers: { Authorization: `Bearer ${token}` },
});
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();

      let customers = [];
      if (Array.isArray(data))                         customers = data;
      else if (data.users     && Array.isArray(data.users))     customers = data.users;
      else if (data.customers && Array.isArray(data.customers)) customers = data.customers;

      setRows(customers);
    } catch (err) {
      setError(err.message);
      showToast?.('Load Failed', `Could not load customers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div>
      <div className="section-header">
        <div className="section-title">Customer Directory</div>
      </div>
      <p className="km-loading">Loading customers...</p>
    </div>
  );

  if (error) return (
    <div>
      <div className="section-header">
        <div className="section-title">Customer Directory</div>
      </div>
      <div style={{ color: 'red', padding: '20px' }}>
        Error: {error}
        <button onClick={fetchCustomers} style={{ marginLeft: '10px' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Customer Directory</div>
        <div className="section-count">{rows.length} total customers</div>
      </div>

      {rows.length === 0 ? (
        <p className="km-empty">No customers found.</p>
      ) : (
        <DataTable
          columns={['# ID', 'Customer Name', 'Phone Number', 'Email Address', 'Joined', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="td-id" style={{ width: '80px' }}>#{row.id}</td>
              <td style={{ fontWeight: '600' }}>{row.username || row.name || '—'}</td>
              <td>{row.phone || '—'}</td>
              <td className="td-muted">{row.email || '—'}</td>
              <td className="td-muted">
                {row.createdAt
                  ? new Date(row.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : '—'}
              </td>
              <td>
                <button className="action-btn btn-edit" onClick={() => openCustomerDetails(row)}>
                  View Details
                </button>
              </td>
            </tr>
          )}
        />
      )}
          {selectedCustomer && (
        <div
          id="customer-detail-modal"
          role="presentation"
          onClick={() => setSelectedCustomer(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Customer profile and order history"
            onClick={e => e.stopPropagation()}
            style={{ width: 'min(640px, 100%)', maxHeight: '85vh', overflow: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f5447', fontSize: 18 }}>
                  {selectedCustomer.username || selectedCustomer.name || `Customer #${selectedCustomer.id}`}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  {selectedCustomer.email || '—'} · {selectedCustomer.phone || 'No phone'}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} style={{ border: 0, background: '#f1f5f9', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#475569' }}>
              Order History ({customerOrders.length})
            </h4>
            {ordersLoading ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>Loading orders…</p>
            ) : customerOrders.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>No orders placed by this customer yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {customerOrders.map(ord => (
                  <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                    <div>
                      <strong>Order #{ord.id}</strong>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN') : ''} · {ord.OrderItems?.length || 0} item(s)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#0f5447' }}>₹{Number(ord.total || 0).toFixed(2)}</strong>
                      <div style={{ fontSize: 11, textTransform: 'capitalize', color: '#475569' }}>{ord.status || 'pending'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}