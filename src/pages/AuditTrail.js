import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { getAuditLogs, exportAuditLogs } from '../utill/auditApi';

const AuditTrail = () => {
  const { token } = useContext(AuthContext);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    entityType: '',
    entityId: '',
    performedBy: '',
    action: '',
    startDate: '',
    endDate: '',
    page: 0,
    size: 20
  });
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const entityTypes = ['Product', 'Customer', 'Category', 'Supplier', 'PurchaseOrder', 'Grn', 'InventoryItem', 'User'];
  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE'];

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Make actual API call to backend
      const response = await getAuditLogs(filters, token);
      
      setAuditLogs(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      
      // Fallback to sample data if API call fails
      const sampleData = {
        content: [
          {
            id: 1,
            timestamp: new Date().toISOString(),
            action: 'CREATE',
            entityType: 'Category',
            entityId: '1',
            performedBy: 'admin',
            ipAddress: '127.0.0.1',
            operationDescription: 'Created new category',
            oldValues: null,
            newValues: '{"name":"New Category"}'
          }
        ],
        totalElements: 1,
        totalPages: 1
      };
      
      setAuditLogs(sampleData.content || []);
      setTotalElements(sampleData.totalElements || 0);
      setTotalPages(sampleData.totalPages || 0);
      
      console.warn('Using sample data due to API error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 0 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize) => {
    setFilters(prev => ({
      ...prev,
      size: newSize,
      page: 0 // Reset to first page when changing page size
    }));
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // If total pages is less than max visible, show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages to show
      let start = Math.max(0, filters.page - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 1, start + maxVisible - 1);
      
      // Adjust start if we're near the end
      if (end - start + 1 < maxVisible) {
        start = Math.max(0, end - maxVisible + 1);
      }
      
      // Add ellipsis and first page if needed
      if (start > 0) {
        pages.push(0);
        if (start > 1) {
          pages.push('...');
        }
      }
      
      // Add visible page numbers
      for (let i = start; i <= end; i++) {
        if (i !== 0 || start === 0) { // Don't duplicate page 0
          pages.push(i);
        }
      }
      
      // Add ellipsis and last page if needed
      if (end < totalPages - 1) {
        if (end < totalPages - 2) {
          pages.push('...');
        }
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Import the export API function
      const { exportAuditLogs } = await import('../utill/auditApi');
      
      // Create filters object excluding pagination parameters
      const exportFilters = {
        entityType: filters.entityType,
        entityId: filters.entityId,
        action: filters.action,
        performedBy: filters.performedBy,
        startDate: filters.startDate,
        endDate: filters.endDate
      };
      
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(exportFilters).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      );
      
      // Call the export API
      const blob = await exportAuditLogs(cleanFilters, token);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date and applied filters
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filterSummary = Object.keys(cleanFilters).length > 0 
        ? '_filtered' 
        : '_all';
      link.download = `audit_logs${filterSummary}_${timestamp}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      const recordCount = totalElements || auditLogs.length;
      alert(`Successfully exported ${recordCount} audit log records to CSV file.`);
      
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      alert('Failed to export audit logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      entityType: '',
      entityId: '',
      performedBy: '',
      action: '',
      startDate: '',
      endDate: '',
      page: 0,
      size: 20
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatActionType = (action) => {
    const actionColors = {
      CREATE: '#4caf50',
      UPDATE: '#2196f3',
      DELETE: '#f44336',
      VIEW: '#9e9e9e',
      BULK_CREATE: '#8bc34a',
      BULK_UPDATE: '#03a9f4',
      BULK_DELETE: '#e91e63'
    };
    
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: actionColors[action] || '#9e9e9e'
      }}>
        {action}
      </span>
    );
  };

  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = (logId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const truncateJson = (jsonString, maxLength = 300, isExpanded = false) => {
    if (!jsonString) return '';
    if (isExpanded || jsonString.length <= maxLength) return jsonString;
    return jsonString.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, color: '#333' }}>Audit Trail</h2>
      
      {/* Filters */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14 }}>Entity Type</label>
          <select
            value={filters.entityType}
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          >
            <option value="">All Types</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14 }}>Entity ID</label>
          <input
            type="number"
            value={filters.entityId}
            onChange={(e) => handleFilterChange('entityId', e.target.value)}
            placeholder="Entity ID"
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14 }}>Action</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          >
            <option value="">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14 }}>User</label>
          <input
            type="text"
            value={filters.performedBy}
            onChange={(e) => handleFilterChange('performedBy', e.target.value)}
            placeholder="Username"
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14 }}>Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14 }}>End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={clearFilters}
          style={{
            padding: '8px 16px',
            background: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
        <button
          onClick={handleExport}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: loading ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {loading && (
            <div style={{
              width: 14,
              height: 14,
              border: '2px solid transparent',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}
          {loading ? 'Exporting...' : 'Export CSV'}
        </button>
        <span style={{ alignSelf: 'center', color: '#666', fontSize: 14 }}>
          Total: {totalElements} records
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          color: '#666',
          background: '#f9f9f9',
          borderRadius: 8,
          margin: '20px 0'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: 20,
            height: 20,
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #2196f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: 10,
            verticalAlign: 'middle'
          }}></div>
          Loading audit logs...
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Audit Logs Table */}
      {!loading && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ddd', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd', width: '160px' }}>Timestamp</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd', width: '100px' }}>Action</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd', width: '150px' }}>Entity</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd', width: '120px' }}>User</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd', width: '120px' }}>IP Address</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd', width: '300px' }}>Changes</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd', width: '250px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                    No audit logs found. Perform some operations (create/update products, customers, etc.) to generate audit data.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const isExpanded = expandedRows.has(log.id);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ padding: 12 }}>
                        {formatActionType(log.action)}
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        <div>
                          <strong>{log.entityType}</strong>
                          {log.entityId && <div style={{ color: '#666', fontSize: 12 }}>ID: {log.entityId}</div>}
                        </div>
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {log.performedBy || 'system'}
                      </td>
                      <td style={{ padding: 12, fontSize: 14, color: '#666' }}>
                        {log.ipAddress || '-'}
                      </td>
                      <td style={{ padding: 12, fontSize: 12, wordWrap: 'break-word', overflow: 'hidden' }}>
                        <div style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>
                          {log.oldValues && (
                            <div style={{ marginBottom: 6, padding: 4, backgroundColor: '#fff3cd', borderRadius: 3, border: '1px solid #ffeaa7' }}>
                              <strong style={{ color: '#856404' }}>Before:</strong>
                              <div style={{ marginTop: 2, fontSize: '11px', color: '#856404' }}>
                                {truncateJson(log.oldValues, 300, isExpanded)}
                              </div>
                            </div>
                          )}
                          {log.newValues && (
                            <div style={{ padding: 4, backgroundColor: '#d1ecf1', borderRadius: 3, border: '1px solid #b8daff' }}>
                              <strong style={{ color: '#0c5460' }}>After:</strong>
                              <div style={{ marginTop: 2, fontSize: '11px', color: '#0c5460' }}>
                                {truncateJson(log.newValues, 300, isExpanded)}
                              </div>
                            </div>
                          )}
                          {((log.oldValues && log.oldValues.length > 300) || (log.newValues && log.newValues.length > 300)) && (
                            <button
                              onClick={() => toggleRowExpansion(log.id)}
                              style={{
                                marginTop: 4,
                                padding: '2px 6px',
                                fontSize: '10px',
                                background: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: 3,
                                cursor: 'pointer',
                                color: '#6c757d'
                              }}
                            >
                              {isExpanded ? 'Show Less' : 'Show More'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: 12, fontSize: 13, wordWrap: 'break-word', overflow: 'hidden', lineHeight: '1.4' }}>
                        <div style={{ wordBreak: 'break-word' }}>
                          {log.operationDescription && log.operationDescription.length > 200 ? (
                            <>
                              {isExpanded ? log.operationDescription : log.operationDescription.substring(0, 200) + '...'}
                              <button
                                onClick={() => toggleRowExpansion(log.id)}
                                style={{
                                  marginLeft: 4,
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  background: '#f8f9fa',
                                  border: '1px solid #dee2e6',
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  color: '#6c757d'
                                }}
                              >
                                {isExpanded ? 'Less' : 'More'}
                              </button>
                            </>
                          ) : (
                            log.operationDescription || '-'
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalElements > 0 && (
        <div style={{ 
          marginTop: 24, 
          padding: '16px 0',
          borderTop: '1px solid #eee'
        }}>
          {/* Items Info and Page Size Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: totalPages > 1 ? 16 : 0
          }}>
            <span style={{ color: '#666', fontSize: 14 }}>
              Showing {Math.min(filters.page * filters.size + 1, totalElements)}-{Math.min((filters.page + 1) * filters.size, totalElements)} of {totalElements} items
            </span>
            
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#666', fontSize: 14 }}>Items per page:</span>
              <select
                value={filters.size}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8 
            }}>
              {/* Navigation Buttons Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* First Page Button */}
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={filters.page === 0}
                  title="First Page"
                  style={{
                    padding: '6px 10px',
                    background: filters.page === 0 ? '#f5f5f5' : 'white',
                    color: filters.page === 0 ? '#999' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: filters.page === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 14
                  }}
                >
                  ««
                </button>

                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 0}
                  title="Previous Page"
                  style={{
                    padding: '6px 10px',
                    background: filters.page === 0 ? '#f5f5f5' : 'white',
                    color: filters.page === 0 ? '#999' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: filters.page === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 14
                  }}
                >
                  ‹
                </button>
              </div>

              {/* Page Numbers Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {generatePageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={index} style={{ padding: '6px 4px', color: '#999', fontSize: 14 }}>...</span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        padding: '6px 10px',
                        background: filters.page === pageNum ? '#2196f3' : 'white',
                        color: filters.page === pageNum ? 'white' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 14,
                        minWidth: 32,
                        fontWeight: filters.page === pageNum ? 'bold' : 'normal'
                      }}
                    >
                      {pageNum + 1}
                    </button>
                  )
                ))}
              </div>

              {/* Navigation Buttons Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages - 1}
                  title="Next Page"
                  style={{
                    padding: '6px 10px',
                    background: filters.page >= totalPages - 1 ? '#f5f5f5' : 'white',
                    color: filters.page >= totalPages - 1 ? '#999' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: filters.page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    fontSize: 14
                  }}
                >
                  ›
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={filters.page >= totalPages - 1}
                  title="Last Page"
                  style={{
                    padding: '6px 10px',
                    background: filters.page >= totalPages - 1 ? '#f5f5f5' : 'white',
                    color: filters.page >= totalPages - 1 ? '#999' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: filters.page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    fontSize: 14
                  }}
                >
                  »»
                </button>
              </div>

              {/* Jump to Page Input */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4, 
                marginLeft: 12,
                padding: '0 8px',
                borderLeft: '1px solid #eee'
              }}>
                <span style={{ color: '#666', fontSize: 14, whiteSpace: 'nowrap' }}>Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  placeholder="Page"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const pageNum = parseInt(e.target.value) - 1;
                      if (pageNum >= 0 && pageNum < totalPages) {
                        handlePageChange(pageNum);
                        e.target.value = '';
                      }
                    }
                  }}
                  style={{
                    width: 60,
                    padding: '4px 6px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditTrail;