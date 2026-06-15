  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await api(`/api/alerts/${alertId}`, { method: 'DELETE', token });
      alert('Alert deleted successfully');
      fetchAlerts();
    } catch (error) {
      alert('Failed to delete alert');
    }
  };
import React, { useState, useEffect, useContext } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { AuthContext } from '../../components/AuthContext';
import { getAlerts, acknowledgeAlert, acknowledgeMultipleAlerts, generateAlerts } from '../../utill/alertApi';

const AlertReport = () => {
  const { token, roles } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    severity: '',
    alertType: '',
    startDate: '',
    endDate: '',
    searchProduct: ''
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [processing, setProcessing] = useState(false);

  const isAdmin = Array.isArray(roles) && roles.some(r => r.toLowerCase() === 'admin');

  useEffect(() => {
    fetchAlerts();
  }, [filters, page]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await getAlerts(filters, token, page, 20);
      setAlerts(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      alert('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, token);
      alert('Alert acknowledged successfully');
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      alert('Failed to acknowledge alert');
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) {
      alert('Please select alerts to acknowledge');
      return;
    }
    
    setProcessing(true);
    try {
      await acknowledgeMultipleAlerts(selectedAlerts, token);
      alert(`${selectedAlerts.length} alerts acknowledged successfully`);
      setSelectedAlerts([]);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alerts:', error);
      alert('Failed to acknowledge alerts');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateAlerts = async () => {
    if (!isAdmin) return;
    
    setProcessing(true);
    try {
      await generateAlerts(token);
      alert('Alerts generated successfully');
      fetchAlerts();
    } catch (error) {
      console.error('Failed to generate alerts:', error);
      alert('Failed to generate alerts');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelectAlert = (alertId) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(a => a.alertLogId));
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <FaExclamationTriangle style={{ color: '#d32f2f' }} />;
      case 'WARNING':
        return <FaExclamationCircle style={{ color: '#ff9800' }} />;
      case 'INFO':
        return <FaInfoCircle style={{ color: '#2196f3' }} />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '#ffebee';
      case 'WARNING':
        return '#fff3e0';
      case 'INFO':
        return '#e3f2fd';
      default:
        return '#fff';
    }
  };

  const exportToCSV = () => {
    const headers = ['Severity', 'Type', 'Product Code', 'Product Name', 'Message', 'Expiry Date', 'Days Until Expiry', 'Status', 'Created At'];
    const rows = alerts.map(alert => [
      alert.severity,
      alert.alertType,
      alert.productCode,
      alert.productName,
      alert.message,
      alert.expiryDate || '',
      alert.daysUntilExpiry || '',
      alert.status,
      new Date(alert.createdAt).toLocaleString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredAlerts = filters.searchProduct
    ? alerts.filter(a => 
        a.productName?.toLowerCase().includes(filters.searchProduct.toLowerCase()) ||
        a.productCode?.toLowerCase().includes(filters.searchProduct.toLowerCase())
      )
    : alerts;

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Alert Report</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {selectedAlerts.length > 0 && (
              <button
                onClick={handleBulkAcknowledge}
                disabled={processing}
                style={{
                  padding: '10px 20px',
                  background: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Acknowledge Selected ({selectedAlerts.length})
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleGenerateAlerts}
                disabled={processing}
                style={{
                  padding: '10px 20px',
                  background: '#ff9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Generate Alerts
              </button>
            )}
            <button
              onClick={exportToCSV}
              disabled={alerts.length === 0}
              style={{
                padding: '10px 20px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: alerts.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Export to CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 8,
          marginBottom: 24,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>Search Product</label>
              <input
                type="text"
                value={filters.searchProduct}
                onChange={(e) => handleFilterChange('searchProduct', e.target.value)}
                placeholder="Search by product name or code..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
              >
                <option value="ACTIVE">Active</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
                <option value="">All</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>Alert Type</label>
              <select
                value={filters.alertType}
                onChange={(e) => handleFilterChange('alertType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
              >
                <option value="">All Types</option>
                <option value="EXPIRY_WARNING">Expiry Warning</option>
                <option value="EXPIRY_CRITICAL">Expiry Critical</option>
                <option value="LOW_STOCK">Low Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 14, color: '#666' }}>
            Showing {filteredAlerts.length} of {totalElements} alerts
          </div>
        </div>

        {/* Alerts Table */}
        <div style={{
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>Loading alerts...</div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#666' }}>
              <FaCheckCircle size={48} style={{ color: '#4caf50', marginBottom: 16 }} />
              <div style={{ fontSize: 18 }}>No alerts found</div>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>
                      <input
                        type="checkbox"
                        checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Severity</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Product</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Message</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Expiry Date</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Days Left</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert) => (
                    <tr
                      key={alert.alertLogId}
                      style={{
                        background: getSeverityColor(alert.severity),
                        borderBottom: '1px solid #ddd'
                      }}
                    >
                      <td style={{ padding: 12 }}>
                        <input
                          type="checkbox"
                          checked={selectedAlerts.includes(alert.alertLogId)}
                          onChange={() => toggleSelectAlert(alert.alertLogId)}
                          disabled={alert.status !== 'ACTIVE'}
                        />
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getSeverityIcon(alert.severity)}
                          <span style={{ fontWeight: '500' }}>{alert.severity}</span>
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: '500' }}>{alert.productName}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{alert.productCode}</div>
                      </td>
                      <td style={{ padding: 12 }}>{alert.message}</td>
                      <td style={{ padding: 12 }}>
                        {alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center', minWidth: 90 }}>
                        <span style={{
                          display: 'inline-block',
                          minWidth: 70,
                          padding: '4px 0',
                          borderRadius: 12,
                          background: alert.daysUntilExpiry <= 30 ? '#d32f2f' : alert.daysUntilExpiry <= 60 ? '#ff9800' : '#2196f3',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: 15,
                          letterSpacing: 1,
                          textAlign: 'center',
                        }}>
                          {alert.daysUntilExpiry !== null && alert.daysUntilExpiry !== undefined ? `${alert.daysUntilExpiry} days` : '-'}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: alert.status === 'ACTIVE' ? '#ff9800' : alert.status === 'ACKNOWLEDGED' ? '#2196f3' : '#4caf50',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: '500'
                        }}>
                          {alert.status}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        {alert.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleAcknowledge(alert.alertLogId)}
                            style={{
                              padding: '6px 12px',
                              background: '#2196f3',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              marginRight: 8
                            }}
                          >
                            Acknowledge
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAlert(alert.alertLogId)}
                            style={{
                              padding: '6px 12px',
                              background: '#d32f2f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: 16,
                  borderTop: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      padding: '8px 16px',
                      background: page === 0 ? '#ddd' : '#1976d2',
                      color: page === 0 ? '#999' : '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: page === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{
                      padding: '8px 16px',
                      background: page >= totalPages - 1 ? '#ddd' : '#1976d2',
                      color: page >= totalPages - 1 ? '#999' : '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertReport;
