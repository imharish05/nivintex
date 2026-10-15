// src/components/Admincontactmanager.js
import React, { useState, useEffect } from 'react';
import DataTable from './DataTable/DataTable';

const API_URL = process.env.REACT_APP_API_URL;

const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const KM = {
    orange: '#A2C579',
    blue:   '#2C2F33',
    teal:   '#0f5447',
    text:   '#1A1A2E',
    muted:  '#6B7280',
    border: '#E5E7EB',
    // Added colors matching your dashboard images
    btnBlue: '#e8f5f0',
    btnBlueText: '#0f5447'
};

const AdminContacts = function ({ showToast }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [selectedContact, setSelectedContact] = useState(null);

    function fetchContacts() {
        setLoading(true);
        setError('');
        fetch(API_URL + '/contact/all', {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
            }
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (json.success) setContacts(json.data);
                else setError('Failed to load contacts.');
                setLoading(false);
            })
            .catch((err) => {
                console.error('Fetch error:', err);
                setError('Network error. Is your backend running?');
                setLoading(false);
            });
    }

    useEffect(() => { 
        fetchContacts();

        // SSE: listen for new contact events so admin sees submissions instantly
        try {
            const es = new EventSource(API_URL + '/contact/stream');
            es.addEventListener('contact', (ev) => {
                try {
                    const payload = JSON.parse(ev.data);
                    setContacts((prev) => [payload, ...prev]);
                    showToast('New Enquiry', `#${payload.id} from ${payload.name}`);
                } catch (e) { /* ignore invalid payload */ }
            });
            es.addEventListener('error', (e) => {
                // silently ignore; connection may retry automatically
            });
            return () => es.close();
        } catch (e) { /* EventSource not supported or fails */ }
    }, []);

    function deleteContact(id) {
        if (!window.confirm('Delete this contact request permanently?')) return;
        fetch(API_URL + '/contact/' + id, {
            method: 'DELETE',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        })
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setContacts(prev => prev.filter(c => c.id !== id));
                    showToast('Deleted!', 'Contact request removed successfully.');
                    if (selectedContact && selectedContact.id === id) {
                        setSelectedContact(null);
                    }
                } else {
                    showToast('Delete Failed', 'Could not delete this contact.');
                }
            })
            .catch(() => showToast('Delete Failed', 'Something went wrong. Try again.'));
    }

    return (
        <div>
            <div className="section-header">
                <div className="section-title">Contact Requests</div>
            </div>

            {loading ? (
                <p className="km-loading">Loading...</p>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}>{error}</div>
            ) : contacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: KM.muted }}>
                    No contact requests found.
                </div>
            ) : (
                <DataTable
                    key={contacts.length} 
                    columns={['#ID', 'Name', 'Email', 'Subject', 'Message', 'Phone', 'Date', 'Actions']}
                    initialRows={contacts}
                    renderRow={(row) => (
                        <tr key={row.id}>
                            <td style={{ fontWeight: 600, color: KM.muted }}>#{row.id}</td>
                            <td style={{ fontWeight: 600, color: KM.text }}>{row.name}</td>
                            <td style={{ color: KM.teal }}>{row.email}</td>
                            <td style={{ color: KM.orange, fontWeight: 500 }}>{row.subject}</td>
                            <td style={{ color: KM.muted, fontStyle: 'italic', fontSize: '12px' }}>
                                {row.message && row.message.length > 40
                                    ? row.message.substring(0, 40) + '...'
                                    : row.message}
                            </td>
                            <td>{row.phone}</td>
                            <td>{fmtDate(row.createdAt)}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    {/* Styled exactly like your design reference image */}
                                    <button
                                        className="action-btn btn-view"
                                        style={{
                                            backgroundColor: KM.btnBlue,
                                            color: KM.btnBlueText,
                                            border: 'none',
                                            padding: '6px 14px',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        onClick={() => setSelectedContact(row)}
                                    >
                                        <span>▼</span> View
                                    </button>
                                    <button
                                        className="action-btn btn-del"
                                        onClick={() => deleteContact(row.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
            )}

            {/* Modal Window overlay view block */}
            {selectedContact && (
                <div style={styles.modalOverlay} onClick={() => setSelectedContact(null)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0, color: KM.blue, fontSize: '18px', fontWeight: '600' }}>
                                Enquiry Details — #{selectedContact.id}
                            </h3>
                            <button style={styles.closeBtn} onClick={() => setSelectedContact(null)}>
                                &times;
                            </button>
                        </div>
                        
                        <div style={styles.modalBody}>
                            <div style={styles.infoRow}>
                                <span style={styles.label}>Customer:</span>
                                <div>
                                    <div style={{ fontWeight: '600', color: KM.text }}>{selectedContact.name}</div>
                                    <div style={{ fontSize: '12px', color: KM.muted }}>{selectedContact.email}</div>
                                    <div style={{ fontSize: '12px', color: KM.muted }}>{selectedContact.phone || 'No phone number'}</div>
                                </div>
                            </div>

                            <div style={styles.infoRow}>
                                <span style={styles.label}>Date Sent:</span>
                                <span style={{ color: KM.text }}>{fmtDate(selectedContact.createdAt)}</span>
                            </div>

                            <div style={styles.infoRow}>
                                <span style={styles.label}>Subject:</span>
                                <span style={{ color: KM.orange, fontWeight: '500' }}>{selectedContact.subject}</span>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ ...styles.label, marginBottom: '0.5rem' }}>Message:</div>
                                <div style={styles.messageBox}>
                                    {selectedContact.message || <span style={{ color: KM.muted }}>No message written.</span>}
                                </div>
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button 
                                style={styles.modalCloseButton} 
                                onClick={() => setSelectedContact(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// CSS styles mimicking the dashboard layout cleanly
const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(26, 26, 46, 0.35)', // matches your dashboard's primary color overlay spectrum
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(1px)'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        width: '520px',
        maxWidth: '92%',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'inherit'
    },
    modalHeader: {
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.75rem',
        cursor: 'pointer',
        color: '#9CA3AF',
        lineHeight: '1',
    },
    modalBody: {
        padding: '1.5rem',
        fontSize: '14px',
    },
    infoRow: {
        display: 'flex',
        borderBottom: '1px solid #F9FAFB',
        padding: '0.75rem 0',
        alignItems: 'flex-start'
    },
    label: {
        width: '100px',
        fontWeight: '600',
        color: '#6B7280',
        flexShrink: 0
    },
    messageBox: {
        backgroundColor: '#F9FAFB',
        padding: '1rem',
        borderRadius: '6px',
        border: '1px solid #E5E7EB',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '180px',
        overflowY: 'auto',
        color: '#374151',
        lineHeight: '1.5'
    },
    modalFooter: {
        padding: '1rem 1.5rem',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    modalCloseButton: {
        backgroundColor: '#6B7280',
        color: '#fff',
        border: 'none',
        padding: '6px 16px',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
    }
};

export default AdminContacts;