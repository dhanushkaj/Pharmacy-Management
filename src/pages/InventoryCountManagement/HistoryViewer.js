import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../components/AuthContext';
import '../../css/InventoryCount.css';

const HistoryViewer = () => {
  const { roles, hasRole } = useContext(AuthContext);
  const fallbackRole = localStorage.getItem('role');
  const isAuthorized = hasRole('admin') || hasRole('manager') || fallbackRole?.toLowerCase() === 'admin' || fallbackRole?.toLowerCase() === 'manager';
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchCategory, setSearchCategory] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAllSessions();
  }, []);

  const fetchAllSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('/api/inventory-count/sessions/all', config);
      setSessions(response.data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to load history';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this DRAFT? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`/api/inventory-count/sessions/${sessionId}`, config);
      
      // Remove deleted session from list
      setSessions(sessions.filter(s => s.id !== sessionId));
      setSelectedSession(null);
      setError(null);
    } catch (err) {
      console.error('Error deleting draft:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to delete draft';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to delete draft');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading inventory count history...</div>;
  }

  if (!isAuthorized) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f44336' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page. Only Managers and Admins can view history.</p>
      </div>
    );
  }

  const filteredSessions = sessions.filter(s => {
    const statusMatch = filterStatus === 'ALL' || s.status === filterStatus;
    const categoryMatch = searchCategory === '' || s.categoryName.toLowerCase().includes(searchCategory.toLowerCase());
    return statusMatch && categoryMatch;
  });

  const statusCounts = {
    DRAFT: sessions.filter(s => s.status === 'DRAFT').length,
    SUBMITTED: sessions.filter(s => s.status === 'SUBMITTED').length,
    APPROVED: sessions.filter(s => s.status === 'APPROVED').length,
    REJECTED: sessions.filter(s => s.status === 'REJECTED').length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return '#2196f3';
      case 'SUBMITTED':
        return '#ff9800';
      case 'APPROVED':
        return '#4caf50';
      case 'REJECTED':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: { bg: '#e3f2fd', text: '#1976d2' },
      SUBMITTED: { bg: '#fff3e0', text: '#e65100' },
      APPROVED: { bg: '#e8f5e9', text: '#2e7d32' },
      REJECTED: { bg: '#ffebee', text: '#c62828' },
    };
    const color = colors[status] || { bg: '#f5f5f5', text: '#666' };
    return (
      <span style={{
        background: color.bg,
        color: color.text,
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold'
      }}>
        {status}
      </span>
    );
  };

  const handleDraftRowClick = (session) => {
    // Always show details panel for selection
    setSelectedSession(session);
  };

  const handleEditDraft = (session) => {
    // Navigate to Physical Count for editing
    navigate('/inventory-count', { state: { draftSession: session } });
  };

  return (
    <div className="inventory-count-container">
      <div className="inventory-count-header">
        <h1>📊 Count History & Audit Trail</h1>
        <p>Complete history of all physical count sessions</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: '#e3f2fd', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1976d2' }}>{statusCounts.DRAFT}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Draft</div>
        </div>
        <div style={{ padding: 16, background: '#fff3e0', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#e65100' }}>{statusCounts.SUBMITTED}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Submitted</div>
        </div>
        <div style={{ padding: 16, background: '#e8f5e9', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{statusCounts.APPROVED}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Approved</div>
        </div>
        <div style={{ padding: 16, background: '#ffebee', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#c62828' }}>{statusCounts.REJECTED}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Rejected</div>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search by category..."
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 4,
            border: '1px solid #ddd',
            fontSize: 12,
            flex: '1 1 200px',
            minWidth: 150
          }}
        />
        {searchCategory && (
          <button
            onClick={() => setSearchCategory('')}
            style={{
              padding: '8px 12px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#f5f5f5',
              color: '#666',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Clear Search
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: filterStatus === status ? getStatusColor(status) : '#e0e0e0',
              color: filterStatus === status ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 12
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredSessions.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
          No sessions found for this filter
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: '1 1 400px', minWidth: 350 }}>
            <h3>Sessions ({filteredSessions.length})</h3>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', maxHeight: '70vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>Category</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => (
                    <tr
                      key={session.id}
                      onClick={() => handleDraftRowClick(session)}
                      style={{
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        background: selectedSession?.id === session.id ? '#e3f2fd' : '#fff',
                        transition: 'background 0.15s'
                      }}
                      title="Click to view details"
                    >
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{session.categoryName}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>ID: {session.id}</div>
                      </td>
                      <td style={{ padding: 12 }}>
                        {getStatusBadge(session.status)}
                      </td>
                      <td style={{ padding: 12, fontSize: 11, color: '#666' }}>
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedSession && (
            <div style={{ flex: '1 1 450px', minWidth: 400, border: '1px solid #ddd', borderRadius: 8, padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>
              <h3>{selectedSession.categoryName} - Details</h3>
              
              <div style={{ marginBottom: 16 }}>
                {getStatusBadge(selectedSession.status)}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 12 }}>Timeline:</div>
                <div style={{ paddingLeft: 16, borderLeft: '2px solid #2196f3' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 'bold', color: '#1976d2' }}>Created</div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {new Date(selectedSession.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      By: {selectedSession.createdByName || 'Unknown'}
                    </div>
                  </div>

                  {selectedSession.submittedAt && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#ff9800' }}>Submitted</div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        {new Date(selectedSession.submittedAt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        By: {selectedSession.submittedByName || 'Unknown'}
                      </div>
                    </div>
                  )}

                  {selectedSession.approvedAt && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#4caf50' }}>Approved</div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        {new Date(selectedSession.approvedAt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        By: {selectedSession.approvedByName || 'Unknown'}
                      </div>
                    </div>
                  )}

                  {selectedSession.rejectedAt && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#f44336' }}>Rejected</div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        {new Date(selectedSession.rejectedAt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        By: {selectedSession.rejectedByName || 'Unknown'}
                      </div>
                      {selectedSession.rejectedReason && (
                        <div style={{ fontSize: 11, color: '#f44336', marginTop: 4, fontStyle: 'italic' }}>
                          Reason: {selectedSession.rejectedReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 }}>Statistics:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                  <div>
                    <div style={{ color: '#666' }}>Total Items</div>
                    <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{selectedSession.lines?.length || 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Items Counted</div>
                    <div style={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {selectedSession.lines?.filter(l => l.counted).length || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Qty Variance Items</div>
                    <div style={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {selectedSession.lines?.filter(l => l.variance !== 0 && l.variance !== null).length || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Completion</div>
                    <div style={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {Math.round(((selectedSession.lines?.filter(l => l.counted).length || 0) / (selectedSession.lines?.length || 1)) * 100)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Total Price Variance</div>
                    <div style={{ fontWeight: 'bold', color: '#ff5722' }}>
                      Rs. {(selectedSession.lines?.reduce((sum, l) => sum + ((l.variance || 0) * (l.sellPrice || 0)), 0) || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Avg Selling Price</div>
                    <div style={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      Rs. {selectedSession.lines?.length > 0 
                        ? (selectedSession.lines.reduce((sum, l) => sum + (l.sellPrice || 0), 0) / selectedSession.lines.length).toFixed(2)
                        : '0.00'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {selectedSession.overallComment && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 4 }}>Session Comment:</div>
                  <div style={{ padding: 8, background: '#f9f9f9', borderLeft: '3px solid #2196f3', borderRadius: 4, fontSize: 11 }}>
                    {selectedSession.overallComment}
                  </div>
                </div>
              )}

              {selectedSession.lines?.filter(l => l.variance !== 0 && l.variance !== null).length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ff9800', marginBottom: 8 }}>Items with Variance:</div>
                  <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4 }}>
                    {selectedSession.lines
                      ?.filter(l => l.variance !== 0 && l.variance !== null)
                      .map(line => {
                        const sellingPrice = line.sellPrice || 0;
                        const priceVariance = (line.variance || 0) * sellingPrice;
                        return (
                          <div key={line.id} style={{ padding: 8, borderBottom: '1px solid #f0f0f0', fontSize: 11 }}>
                            <div style={{ fontWeight: 'bold' }}>{line.productName}</div>
                            <div style={{ color: '#666', marginTop: 2 }}>
                              System: {line.systemQtyAtCount} → Physical: {line.physicalQty} (Qty Variance: {line.variance > 0 ? '+' : ''}{line.variance})
                            </div>
                            <div style={{ color: '#666', marginTop: 2 }}>
                              Selling Price: Rs. {sellingPrice.toFixed(2)} | Price Variance: {priceVariance !== 0 ? (priceVariance > 0 ? '+' : '') + 'Rs. ' + priceVariance.toFixed(2) : 'Rs. 0.00'}
                            </div>
                            {line.lineComment && (
                              <div style={{ color: '#2196f3', fontSize: 10, marginTop: 4 }}>
                                Note: {line.lineComment}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {selectedSession.status === 'DRAFT' && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ddd', display: 'flex', gap: 12, flexDirection: 'column' }}>
                  <button
                    onClick={() => handleEditDraft(selectedSession)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: '#2196f3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: 12,
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#1976d2'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#2196f3'}
                  >
                    ✏️ Edit This Draft
                  </button>

                  <button
                    onClick={() => handleDeleteDraft(selectedSession.id)}
                    disabled={deleting}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: deleting ? '#ccc' : '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: deleting ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: 12,
                      transition: 'background 0.2s',
                      opacity: deleting ? 0.7 : 1
                    }}
                    onMouseOver={(e) => !deleting && (e.target.style.backgroundColor = '#d32f2f')}
                    onMouseOut={(e) => !deleting && (e.target.style.backgroundColor = '#f44336')}
                  >
                    {deleting ? '⏳ Deleting...' : '🗑️ Delete This Draft'}
                  </button>

                  <div style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                    DRAFT sessions can be edited or deleted
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryViewer;
