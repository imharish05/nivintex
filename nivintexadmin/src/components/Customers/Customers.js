// src/components/Customers/Customers.jsx
import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { API_BASE_URL } from '../../config/api';

const API = API_BASE_URL;

export default function Customers({ showToast }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

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
          columns={['# ID', 'Customer Name', 'Phone Number', 'Email Address', 'Joined']}
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
            </tr>
          )}
        />
      )}
    </div>
  );
}
