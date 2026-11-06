// src/components/Admincontactmanager.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DataTable from './DataTable/DataTable';

const API_URL = process.env.REACT_APP_API_URL;

const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const KM = {
    orange: '#0f5447',
    blue:   '#2C2F33',
    teal:   '#0f5447',
    text:   '#1A1A2E',
    muted:  '#6B7280',
    border: '#E5E7EB',
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

        // Close modal on Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedContact(null);
        };
        window.addEventListener('keydown', handleKeyDown);

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
            return () => {
                es.close();
                window.removeEventListener('keydown', handleKeyDown);
            };
        } catch (e) { 
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, []);

    async function deleteContact(id) {
        const result = await Swal.fire({
            title: 'Delete Enquiry?',
            text: 'Are you sure you want to permanently delete this contact request?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4444',
            cancelButtonColor: '#0f5447',
            confirmButtonText: 'Yes, Delete!',
            cancelButtonText: 'Cancel',
            background: '#131f33',
            color: '#fff',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

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
                            <td style={{ color: '#0f5447', fontWeight: 500 }}>{row.subject}</td>
                            <td style={{ color: KM.muted, fontStyle: 'italic', fontSize: '12px' }}>
                                {row.message && row.message.length > 40
                                    ? row.message.substring(0, 40) + '...'
                                    : row.message}
                            </td>
                            <td>{row.phone}</td>
                            <td>{fmtDate(row.createdAt)}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                        {/* Modal Header */}
                        <div style={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h3 style={styles.modalTitle}>
                                    Enquiry Details
                                </h3>
                                <span style={styles.idBadge}>#{selectedContact.id}</span>
                            </div>
                            <button 
                                style={styles.closeBtn} 
                                onClick={() => setSelectedContact(null)}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div style={styles.modalBody}>
                            <div style={styles.detailsList}>
                                <div style={styles.detailRow}>
                                    <span style={styles.label}>Customer:</span>
                                    <div style={styles.customerValue}>
                                        <div style={styles.avatar}>
                                            {(selectedContact.name || 'C').charAt(0).toUpperCase()}
                                        </div>
                                        <span style={styles.customerName}>{selectedContact.name || '—'}</span>
                                    </div>
                                </div>

                                <div style={styles.detailRow}>
                                    <span style={styles.label}>Email:</span>
                                    <span style={styles.value}>
                                        {selectedContact.email ? (
                                            <a 
                                                href={`mailto:${selectedContact.email}`} 
                                                style={styles.linkTeal}
                                            >
                                                {selectedContact.email}
                                            </a>
                                        ) : (
                                            <span style={{ color: KM.muted }}>Not provided</span>
                                        )}
                                    </span>
                                </div>

                                <div style={styles.detailRow}>
                                    <span style={styles.label}>Phone:</span>
                                    <span style={styles.value}>
                                        {selectedContact.phone ? (
                                            <a 
                                                href={`tel:${selectedContact.phone}`} 
                                                style={styles.linkDefault}
                                            >
                                                {selectedContact.phone}
                                            </a>
                                        ) : (
                                            <span style={{ color: KM.muted }}>Not provided</span>
                                        )}
                                    </span>
                                </div>

                                <div style={styles.detailRow}>
                                    <span style={styles.label}>Date Sent:</span>
                                    <span style={styles.value}>{fmtDate(selectedContact.createdAt)}</span>
                                </div>

                                <div style={styles.detailRow}>
                                    <span style={styles.label}>Subject:</span>
                                    <span style={styles.subjectBadge}>
                                        {selectedContact.subject || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Message Container */}
                            <div style={styles.messageSection}>
                                <div style={styles.messageLabel}>Message:</div>
                                <div style={styles.messageBox}>
                                    {selectedContact.message || (
                                        <span style={{ color: KM.muted, fontStyle: 'italic' }}>
                                            No message written.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={styles.modalFooter}>
                            {selectedContact.email && (
                                <a 
                                    href={`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject || 'Enquiry')}`}
                                    style={styles.replyButton}
                                >
                                    ✉ Reply via Email
                                </a>
                            )}
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
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
        padding: '16px'
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '540px',
        maxWidth: '100%',
        boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        fontFamily: 'inherit'
    },
    modalHeader: {
        padding: '16px 22px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFCFB'
    },
    modalTitle: {
        margin: 0,
        color: '#1E293B',
        fontSize: '17px',
        fontWeight: '600',
        letterSpacing: '-0.01em'
    },
    idBadge: {
        backgroundColor: '#e8f5f0',
        color: '#0f5447',
        fontSize: '12px',
        fontWeight: '600',
        padding: '2px 9px',
        borderRadius: '12px',
        border: '1px solid #cce8dd'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.6rem',
        cursor: 'pointer',
        color: '#94A3B8',
        lineHeight: '1',
        padding: '4px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalBody: {
        padding: '20px 22px',
        fontSize: '14px'
    },
    detailsList: {
        display: 'flex',
        flexDirection: 'column'
    },
    detailRow: {
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        padding: '11px 0',
        borderBottom: '1px solid #F1F5F9',
        alignItems: 'center',
        gap: '8px'
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#64748B'
    },
    customerValue: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    avatar: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#e8f5f0',
        color: '#0f5447',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '12px',
        flexShrink: 0
    },
    customerName: {
        fontWeight: '600',
        color: '#1E293B',
        fontSize: '14px'
    },
    value: {
        color: '#1E293B',
        fontSize: '14px',
        wordBreak: 'break-word'
    },
    linkTeal: {
        color: '#0f5447',
        textDecoration: 'none',
        fontWeight: '500'
    },
    linkDefault: {
        color: '#1E293B',
        textDecoration: 'none',
        fontWeight: '500'
    },
    subjectBadge: {
        color: '#0f5447',
        backgroundColor: '#e8f5f0',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        display: 'inline-block',
        width: 'fit-content'
    },
    messageSection: {
        marginTop: '18px'
    },
    messageLabel: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#64748B',
        marginBottom: '8px'
    },
    messageBox: {
        backgroundColor: '#F8FAFC',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '180px',
        overflowY: 'auto',
        color: '#334155',
        lineHeight: '1.6',
        fontSize: '14px'
    },
    modalFooter: {
        padding: '14px 22px',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FAFCFB'
    },
    replyButton: {
        backgroundColor: '#e8f5f0',
        color: '#0f5447',
        border: '1px solid #cce8dd',
        padding: '7px 15px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        textDecoration: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    },
    modalCloseButton: {
        backgroundColor: '#0f5447',
        color: '#ffffff',
        border: 'none',
        padding: '7px 20px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer'
    }
};

export default AdminContacts;
