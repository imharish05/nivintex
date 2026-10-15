import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { reviewApi } from '../../api';

const pillClass = { 
    Approved: 'pill-approved', 
    Pending: 'pill-pending', 
    Rejected: 'pill-rejected' 
};

function renderStars(rating) {
    const filled = Math.round(rating);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled) + ` (${rating})`;
}

export default function Reviews({ showToast }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await reviewApi.getAll(true);
            
            const reviews = Array.isArray(data) ? data : [];
            setRows(reviews);
            
            // Calculate stats
            setStats({
                total: reviews.length,
                pending: reviews.filter(r => r.status === 'Pending').length,
                approved: reviews.filter(r => r.status === 'Approved').length,
                rejected: reviews.filter(r => r.status === 'Rejected').length,
            });
        } catch (err) {
            console.error('Fetch reviews error:', err);
            setError(err.message);
            if (showToast) {
                showToast('Load Failed', `Could not load reviews: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const result = await reviewApi.update(id, { status: 'Approved' });
            if (result.success) {
                setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
                setStats(prev => ({
                    ...prev,
                    pending: prev.pending - 1,
                    approved: prev.approved + 1,
                }));
                showToast('Success', 'Review approved successfully.', 'success');
            }
        } catch (err) {
            console.error('Approve error:', err);
            showToast('Error', err.message || 'Failed to approve review', 'error');
        }
    };

    const handleReject = async (id) => {
        try {
            const result = await reviewApi.update(id, { status: 'Rejected' });
            if (result.success) {
                setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
                setStats(prev => ({
                    ...prev,
                    pending: prev.pending - 1,
                    rejected: prev.rejected + 1,
                }));
                showToast('Success', 'Review rejected successfully.', 'success');
            }
        } catch (err) {
            console.error('Reject error:', err);
            showToast('Error', err.message || 'Failed to reject review', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }
        
        try {
            const result = await reviewApi.remove(id);
            if (result.success) {
                const deletedReview = rows.find(r => r.id === id);
                setRows(prev => prev.filter(r => r.id !== id));
                setStats(prev => ({
                    ...prev,
                    total: prev.total - 1,
                    pending: prev.pending - (deletedReview?.status === 'Pending' ? 1 : 0),
                    approved: prev.approved - (deletedReview?.status === 'Approved' ? 1 : 0),
                    rejected: prev.rejected - (deletedReview?.status === 'Rejected' ? 1 : 0),
                }));
                showToast('Success', 'Review deleted successfully.', 'success');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Error', err.message || 'Failed to delete review', 'error');
        }
    };

    if (loading) {
        return (
            <div>
                <div className="section-header">
                    <div className="section-title">Customer Reviews</div>
                </div>
                <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
                    <div style={{ marginBottom: 10 }}>⏳</div>
                    <div>Loading reviews...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="section-header">
                    <div className="section-title">Customer Reviews</div>
                </div>
                <div style={{ 
                    padding: 20, 
                    background: '#FEF2F2', 
                    border: '1px solid #FEE2E2',
                    borderRadius: 8,
                    color: '#991B1B'
                }}>
                    <strong>Error:</strong> {error}
                    <button 
                        onClick={fetchReviews} 
                        style={{ 
                            marginLeft: 10, 
                            padding: '5px 10px', 
                            background: '#DC2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 24 
            }}>
                <div className="section-title">Customer Reviews</div>
               
            </div>

            {rows.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: 60, 
                    background: '#F9FAFB',
                    borderRadius: 8,
                    color: '#6B7280'
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No reviews yet</div>
                    <div style={{ fontSize: 13 }}>Customer reviews will appear here once submitted</div>
                </div>
            ) : (
                <DataTable
                    columns={['ID', 'Customer', 'Product', 'Feedback', 'Rating', 'Status', 'Actions']}
                    initialRows={rows}
                    renderRow={(row) => (
                        <tr key={row.id}>
                            <td style={{ fontWeight: 600, color: '#6B7280', verticalAlign: 'top' }}>#{row.id}</td>
                            <td style={{ verticalAlign: 'top' }}>
                                <div style={{ fontWeight: 600 }}>{row.name || row.Customer?.name || `Customer ${row.customerId}`}</div>
                                {row.email && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{row.email}</div>}
                                {row.customerId && <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 2 }}>ID: {row.customerId}</div>}
                            </td>
                            <td style={{ verticalAlign: 'top' }}>
                                <div style={{ fontSize: 13, color: '#374151' }}>
                                    {row.Product?.productName || `Product #${row.productId}`}
                                </div>
                                {row.productId && <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 2 }}>ID: {row.productId}</div>}
                            </td>
                            <td style={{ maxWidth: 300, verticalAlign: 'top' }}>
                                <div style={{ color: '#374151', fontSize: 13, lineHeight: 1.5 }}>
                                    {row.feedback?.substring(0, 150)}
                                    {row.feedback?.length > 150 ? '...' : ''}
                                </div>
                                {row.comment && row.comment !== row.feedback && (
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                                        <em>Comment: {row.comment}</em>
                                    </div>
                                )}
                             </td>
                            <td style={{ verticalAlign: 'top' }}>
                                <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                                    {renderStars(row.rating)}
                                </div>
                             </td>
                            <td style={{ verticalAlign: 'top' }}>
                                <span className={`status-pill ${pillClass[row.status] || 'pill-pending'}`}>
                                    {row.status || 'Pending'}
                                </span>
                                {row.verifiedPurchase && (
                                    <span style={{ 
                                        marginLeft: 8, 
                                        fontSize: 10, 
                                        background: '#10B981', 
                                        color: 'white', 
                                        padding: '2px 8px', 
                                        borderRadius: 12,
                                        display: 'inline-block',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        ✓ Verified
                                    </span>
                                )}
                             </td>
                            <td style={{ verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {row.status !== 'Approved' && (
                                        <button 
                                            onClick={() => handleApprove(row.id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#10B981',
                                                border: 'none',
                                                borderRadius: 6,
                                                color: 'white',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#059669'}
                                            onMouseLeave={(e) => e.target.style.background = '#10B981'}
                                        >
                                            ✓ Approve
                                        </button>
                                    )}
                                    {row.status !== 'Rejected' && (
                                        <button
                                            onClick={() => handleReject(row.id)}
                                            style={{ 
                                                padding: '6px 12px', 
                                                background: '#FEF3C7', 
                                                border: '1px solid #FDE68A', 
                                                borderRadius: 6, 
                                                color: '#D97706', 
                                                fontSize: 12, 
                                                fontWeight: 600, 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#FDE68A';
                                                e.target.style.borderColor = '#F59E0B';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#FEF3C7';
                                                e.target.style.borderColor = '#FDE68A';
                                            }}
                                        >
                                            ✗ Reject
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(row.id)}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#EF4444',
                                            border: 'none',
                                            borderRadius: 6,
                                            color: 'white',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#DC2626'}
                                        onMouseLeave={(e) => e.target.style.background = '#EF4444'}
                                    >
                                        🗑 Delete
                                    </button>
                                </div>
                             </td>
                         </tr>
                    )}
                />
            )}
        </div>
    );
}