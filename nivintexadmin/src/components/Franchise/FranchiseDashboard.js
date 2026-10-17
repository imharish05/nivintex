import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../DataTable/DataTable';
import Swal from 'sweetalert2';

const API = process.env.REACT_APP_API_URL;

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'shipped',
  'out_for_delivery',
  'delivered'
];
const labelFor = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const parseAddr = (raw) => { try { return JSON.parse(raw); } catch { return null; } };

export default function FranchiseDashboard({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const navigate = useNavigate();
  const franchiseUser = JSON.parse(localStorage.getItem('franchiseUser') || '{}');

  const fetchOrders = useCallback(() => {
    if (!franchiseUser.franchise_id) return;
    
    setLoading(true);
    fetch(`${API}/orders/all?franchise_id=${franchiseUser.franchise_id}`)
      .then(r => r.json())
      .then(data => {
        const all = Array.isArray(data.orders) ? data.orders : [];
        setRows(all.filter(order => String(order.status || '').toLowerCase() !== 'cancelled')
          .map(order => ({ ...order, status: ({ assigned: 'pending', accepted: 'confirmed', packed: 'shipped' }[String(order.status || '').toLowerCase()] || String(order.status || 'pending').toLowerCase()) })));
      })
      .catch(() => showToast('Load Failed', 'Could not load orders.'))
      .finally(() => setLoading(false));
  }, [franchiseUser.franchise_id, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id, newStatus, prevStatus) => {
    setRows(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setUpdatingIds(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`${API}/orders/${id}/franchise-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setRows(prev => prev.map(o => o.id === id ? { ...o, status: prevStatus } : o));
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: data.message || 'Could not update order status.'
        });
        return;
      }

      showToast('Order Updated!', 'Order status changed successfully.');
    } catch {
      setRows(prev => prev.map(o => o.id === id ? { ...o, status: prevStatus } : o));
      showToast('Server Error', 'Something went wrong. Try again.');
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('franchiseToken');
    localStorage.removeItem('franchiseUser');
    navigate('/franchise/login');
  };

  const filteredRows = useMemo(() => {
    let result = rows;
    if (filterDate) {
      result = result.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === filterDate);
    }
    if (filterStatus) {
      result = result.filter(o => o.status === filterStatus);
    }
    return result;
  }, [rows, filterDate, filterStatus]);

  // Allowed flow logic
  const getAvailableStatuses = (currentStatus) => {
    const statusLower = currentStatus?.toLowerCase();
    
    if (statusLower === 'pending') return ['pending', 'confirmed'];
    if (statusLower === 'confirmed') return ['confirmed', 'shipped'];
    if (statusLower === 'shipped') return ['shipped', 'out_for_delivery'];
    if (statusLower === 'out_for_delivery') return ['out_for_delivery', 'delivered'];
    if (statusLower === 'delivered') return ['delivered'];
    
    // If it's cancelled or something else, they can't change it
    return [statusLower];
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#fff', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f5447' }}>{franchiseUser.franchise_name} Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>Manage your assigned orders</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#374151' }}>Assigned Orders</h2>
        
        <div style={{ display: 'flex', gap: 15 }}>
          <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, outline: 'none' }}
          />
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, outline: 'none' }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(st => (
              <option key={st} value={st}>{labelFor(st)}</option>
            ))}
          </select>
          {!loading && <div style={{ background: '#0f5447', color: '#fff', padding: '8px 12px', borderRadius: 6, fontWeight: 'bold' }}>{filteredRows.length} Orders</div>}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading orders...</div>
      ) : filteredRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: '#fff', borderRadius: 8 }}>No assigned orders found.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <DataTable
            columns={['#ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Details']}
            initialRows={filteredRows}
            renderRow={(order) => {
              const isOpen = expanded === order.id;
              const isSaving = updatingIds.has(order.id);
              const total = Number(order.total || 0);
              
              const availableStatuses = getAvailableStatuses(order.status);
              const canChange = availableStatuses.length > 1;

              return (
                <>
                  <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px' }}>#{order.id}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{order.customer_name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>📞 {order.customer_phone}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>{order.OrderItems?.length || 0} items</span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#059669' }}>₹{total.toFixed(2)}</td>
                    
                    <td style={{ padding: '16px' }}>
                      <select
                        value={order.status}
                        disabled={isSaving || !canChange}
                        onChange={e => updateStatus(order.id, e.target.value, order.status)}
                        style={{ 
                          padding: '6px 10px', 
                          borderRadius: '4px', 
                          border: '1px solid #d1d5db',
                          background: canChange ? '#fff' : '#f3f4f6',
                          cursor: canChange ? 'pointer' : 'not-allowed',
                          opacity: isSaving ? 0.6 : 1,
                          fontWeight: '500',
                          color: '#374151'
                        }}
                      >
                        {availableStatuses.map(st => (
                          <option key={st} value={st}>{labelFor(st)}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={() => setExpanded(isOpen ? null : order.id)}
                        style={{ padding: '6px 12px', background: isOpen ? '#f3f4f6' : '#eff6ff', color: isOpen ? '#374151' : '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                      >
                        {isOpen ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={7} style={{ padding: '20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                          
                          {/* Items */}
                          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Items</h4>
                            {order.OrderItems?.map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb' }}>
                                <span>{item.name} <span style={{ color: '#6b7280' }}>x{item.quantity}</span></span>
                              </div>
                            ))}
                          </div>

                          {/* Shipping details */}
                          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Shipping Details</h4>
                            <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
                              {(() => {
                                const ship = parseAddr(order.shipping_address) || parseAddr(order.billing_address);
                                if (!ship) return "No address provided.";
                                return (
                                  <>
                                    <strong>{ship.name || order.customer_name}</strong><br />
                                    {ship.address}<br />
                                    {ship.address2 && <>{ship.address2}<br /></>}
                                    {ship.city}, {ship.state} {ship.zip}<br />
                                    📞 {order.customer_phone}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Notes */}
                          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Order Notes</h4>
                            <div style={{ fontSize: '14px', color: '#4b5563', fontStyle: order.order_notes ? 'normal' : 'italic' }}>
                              {order.order_notes || "No notes provided for this order."}
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
