import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../components/AuthContext';
import '../../css/InventoryCount.css';

const ApprovalCenter = () => {
  const { roles, hasRole } = useContext(AuthContext);
  const fallbackRole = localStorage.getItem('role');
  const isAuthorized = hasRole('manager') || hasRole('admin') || fallbackRole === 'manager' || fallbackRole === 'admin';
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [editableLines, setEditableLines] = useState({});

  // Fetch submitted sessions on mount
  useEffect(() => {
    fetchSubmittedSessions();
  }, []);

  const fetchSubmittedSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('/api/inventory-count/sessions/submitted', config);
      setSessions(response.data || []);
    } catch (err) {
      console.error('Error fetching submitted sessions:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to load submitted sessions';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to load submitted sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sessionId) => {
    if (!window.confirm('Approve this inventory count session? This will update the inventory.')) {
      return;
    }

    setApproving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(`/api/inventory-count/sessions/${sessionId}/approve`, {}, config);
      setSessions(sessions.filter(s => s.id !== sessionId));
      setSelectedSession(null);
      alert('✓ Session approved successfully');
    } catch (err) {
      console.error('Error approving session:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to approve session';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to approve session');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (sessionId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Reject this inventory count session? It will be returned to DRAFT status for revision.')) {
      return;
    }

    setApproving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(`/api/inventory-count/sessions/${sessionId}/reject`, {
        reason: rejectReason
      }, config);
      setSessions(sessions.filter(s => s.id !== sessionId));
      setSelectedSession(null);
      setRejectReason('');
      alert('✓ Session rejected and sent back for revision');
    } catch (err) {
      console.error('Error rejecting session:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to reject session';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to reject session');
    } finally {
      setApproving(false);
    }
  };

  const handleVarianceLineChange = (lineId, field, value) => {
    setEditableLines(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field]: value
      }
    }));
  };

  const getLineValue = (line, field) => {
    if (editableLines[line.id]) {
      return editableLines[line.id][field] !== undefined ? editableLines[line.id][field] : line[field];
    }
    return line[field];
  };

  // Format variance with +/- sign
  const formatVariance = (variance) => {
    if (variance === 0) return '0';
    return variance > 0 ? `+${variance}` : String(variance);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading submitted sessions...</div>;
  }

  if (!isAuthorized) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f44336' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page. Only Managers and Admins can approve inventory counts.</p>
      </div>
    );
  }

  return (
    <div className="inventory-count-container">
      <div className="inventory-count-header">
        <h1>✅ Count Approval Center</h1>
        <p>Review and approve submitted inventory count sessions</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {sessions.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
          No submitted sessions awaiting approval
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Sessions List */}
          <div style={{ flex: '1 1 350px', minWidth: 300 }}>
            <h3>Submitted Sessions</h3>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  style={{
                    padding: 12,
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: selectedSession?.id === session.id ? '#e3f2fd' : '#fff',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {session.categoryName}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Submitted: {new Date(session.submittedAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    By: {session.submittedByName || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {session.lines?.filter(l => l.counted).length || 0} / {session.lines?.length || 0} items counted
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Details */}
          {selectedSession && (
            <div style={{ flex: '1 1 400px', minWidth: 350, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3>Session Details - {selectedSession.categoryName}</h3>

              {/* Print Header - Only visible in print */}
              <div className="print-header" style={{ display: 'none', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #333' }}>
                <h2 style={{ marginBottom: 5 }}>✅ Count Approval Summary - {selectedSession.categoryName}</h2>
                <div className="print-info" style={{ fontSize: 12, color: '#333', marginBottom: 5 }}>
                  <strong>Session ID:</strong> {selectedSession.id} | <strong>Version:</strong> {selectedSession.versionNumber} | <strong>Status:</strong> {selectedSession.status}
                </div>
                <div className="print-info" style={{ fontSize: 12, color: '#333', marginBottom: 5 }}>
                  <strong>Items with Variance:</strong> {selectedSession.lines?.filter(l => l.variance !== 0 && l.variance !== null).length || 0} / {selectedSession.lines?.length || 0}
                </div>
                <div className="print-info" style={{ fontSize: 12, color: '#333' }}>
                  <strong>Submitted:</strong> {new Date(selectedSession.submittedAt).toLocaleString()}
                </div>
              </div>
              
              {/* Stats */}
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Total Items</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1976d2' }}>
                      {selectedSession.lines?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Items Counted</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4caf50' }}>
                      {selectedSession.lines?.filter(l => l.counted).length || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>With Variance</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff9800' }}>
                      {selectedSession.lines?.filter(l => l.variance !== 0 && l.variance !== null).length || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Submitted By</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {selectedSession.submittedByName || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Comment */}
              {selectedSession.overallComment && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 4 }}>Session Comment:</div>
                  <div style={{ padding: 8, background: '#f9f9f9', borderLeft: '3px solid #2196f3', borderRadius: 4 }}>
                    {selectedSession.overallComment}
                  </div>
                </div>
              )}

              {/* Print Information */}
              <div className="print-info" style={{ fontSize: 10, color: '#999', marginBottom: 16, paddingBottom: 12, borderBottom: '1px dashed #ddd' }}>
                <div>Submitted: {new Date(selectedSession.submittedAt).toLocaleString()}</div>
                <div>Printed: {new Date().toLocaleString()}</div>
              </div>

              {/* Items with Variance - EDITABLE TABLE */}
              {selectedSession.lines?.filter(l => l.variance !== 0 && l.variance !== null).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ff9800', marginBottom: 8 }}>
                    Items with Variance (Editable):
                  </div>
                  <div style={{ border: '1px solid #eee', borderRadius: 4, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                          <th style={{ padding: 8, textAlign: 'left' }}>Product</th>
                          <th style={{ padding: 8, textAlign: 'center' }}>System Qty</th>
                          <th style={{ padding: 8, textAlign: 'center' }}>Physical Qty</th>
                          <th style={{ padding: 8, textAlign: 'center' }}>Variance</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSession.lines
                          ?.filter(l => l.variance !== 0 && l.variance !== null)
                          .map(line => (
                            <tr key={line.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: 8 }}>
                                <div style={{ fontWeight: 'bold' }}>{line.productName}</div>
                                <div style={{ fontSize: 10, color: '#666' }}>{line.productCode}</div>
                              </td>
                              <td style={{ padding: 8, textAlign: 'center' }}>
                                {line.systemQtyAtCount}
                              </td>
                              <td style={{ padding: 8, textAlign: 'center' }}>
                                <input
                                  type="number"
                                  value={getLineValue(line, 'physicalQty')}
                                  onChange={(e) => handleVarianceLineChange(line.id, 'physicalQty', parseInt(e.target.value))}
                                  style={{ width: 50, padding: 4, border: '1px solid #ddd', borderRadius: 2 }}
                                />
                              </td>
                              <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold', color: '#ff9800' }}>
                                {formatVariance((getLineValue(line, 'physicalQty') || 0) - line.systemQtyAtCount)}
                              </td>
                              <td style={{ padding: 8 }}>
                                <input
                                  type="text"
                                  value={getLineValue(line, 'lineComment') || ''}
                                  onChange={(e) => handleVarianceLineChange(line.id, 'lineComment', e.target.value)}
                                  placeholder="Add note..."
                                  style={{ width: '90%', padding: 4, border: '1px solid #ddd', borderRadius: 2, fontSize: 10 }}
                                />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 4 }}>
                  Rejection Reason (if rejecting):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide reason for rejection..."
                  rows={3}
                  style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box', fontSize: 12 }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleApprove(selectedSession.id)}
                  disabled={approving}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: approving ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: approving ? 0.6 : 1
                  }}
                >
                  {approving ? 'Processing...' : '✓ Approve'}
                </button>
                <button
                  onClick={() => handleReject(selectedSession.id)}
                  disabled={approving}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: approving ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: approving ? 0.6 : 1
                  }}
                >
                  {approving ? 'Processing...' : '✗ Reject'}
                </button>
                <button
                  onClick={handlePrint}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#9c27b0',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🖨️ Print (A4)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalCenter;
