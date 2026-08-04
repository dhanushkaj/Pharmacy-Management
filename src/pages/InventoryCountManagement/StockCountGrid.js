import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useFilters } from 'react-table';
import axios from 'axios';
import '../../css/StockCountGrid.css';

const StockCountGrid = ({ session, onSessionUpdate, category }) => {
  const [lines, setLines] = useState(session.lines || []);
  const [overallComment, setOverallComment] = useState(session.overallComment || '');
  const [saving, setSaving] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save on blur with debounce
  const updateLineDebounced = useCallback((lineId, updates) => {
    setSaving(true);
    const timer = setTimeout(() => {
      saveLineUpdates(lineId, updates);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const saveLineUpdates = async (lineId, updates) => {
    try {
      await axios.put(`/api/inventory-count/sessions/${session.id}/lines`, {
        lines: [
          {
            id: lineId,
            ...updates
          }
        ]
      });
      setSuccessMessage('Line saved');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error saving line:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to save line';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to save line');
    } finally {
      setSaving(false);
    }
  };

  const handlePhysicalQtyChange = (lineId, value) => {
    const newLines = lines.map(line => {
      if (line.id === lineId) {
        const physicalQty = value ? parseInt(value) : null;
        const variance = physicalQty !== null ? physicalQty - line.systemQtyAtCount : null;
        return {
          ...line,
          physicalQty,
          variance,
          counted: physicalQty !== null && physicalQty !== undefined
        };
      }
      return line;
    });
    setLines(newLines);
    setHasUnsavedChanges(true);
    updateLineDebounced(lineId, { physicalQty: value ? parseInt(value) : null });
  };

  const handleLineCommentChange = (lineId, comment) => {
    const newLines = lines.map(line =>
      line.id === lineId ? { ...line, lineComment: comment } : line
    );
    setLines(newLines);
    setHasUnsavedChanges(true);
    updateLineDebounced(lineId, { lineComment: comment });
  };

  const handleOverallCommentChange = (comment) => {
    setOverallComment(comment);
    setHasUnsavedChanges(true);
  };

  const handleManualSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Save all lines
      await axios.put(`/api/inventory-count/sessions/${session.id}/lines`, {
        lines: lines.map(line => ({
          id: line.id,
          physicalQty: line.physicalQty,
          lineComment: line.lineComment
        }))
      }, config);

      // Save session comment
      await axios.put(`/api/inventory-count/sessions/${session.id}/comment`, {
        overallComment: overallComment
      }, config);

      setHasUnsavedChanges(false);
      setSuccessMessage('✓ All changes saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving changes:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to save changes';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Allow submission even if not all items are counted - only items with variance need to be counted
    if (!window.confirm('Submit this inventory count for approval? You will not be able to edit it afterward.')) {
      return;
    }

    setSubmitLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.post(`/api/inventory-count/sessions/${session.id}/submit`, {}, config);
      onSessionUpdate(response.data);
      alert('✓ Count submitted for approval');
    } catch (err) {
      console.error('Error submitting count:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to submit count';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to submit count');
    } finally {
      setSubmitLoading(false);
    }
  };

  const countedItems = lines.filter(l => l.counted).length;
  const totalItems = lines.length;

  const handlePrint = () => {
    document.body.setAttribute('data-print-context', 'inventory');
    window.onafterprint = () => {
      document.body.removeAttribute('data-print-context');
      window.onafterprint = null;
    };
    window.print();
  };

  return (
    <div style={{ marginTop: 20 }} className="stock-count-grid-wrapper">
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div style={{ padding: '10px 16px', background: '#4caf50', color: '#fff', borderRadius: 4, marginBottom: 10 }}>{successMessage}</div>}

      <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }} className="progress-bar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: 14 }}>Progress: {countedItems}/{totalItems} items</span>
            <div style={{ marginTop: 6, background: '#ddd', borderRadius: 4, height: 8, width: 200, overflow: 'hidden' }}>
              <div style={{ background: '#4caf50', height: '100%', width: `${(countedItems / totalItems) * 100}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hasUnsavedChanges && <span style={{ color: '#ff9800', fontWeight: 'bold', fontSize: 12 }}>● Unsaved changes</span>}
            <button
              onClick={handleManualSave}
              disabled={!hasUnsavedChanges || saving}
              style={{
                padding: '8px 16px',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: hasUnsavedChanges && !saving ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                opacity: (!hasUnsavedChanges || saving) ? 0.6 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                background: '#9c27b0',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 12
              }}
            >
              🖨️ Print (A4)
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              style={{
                padding: '8px 16px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: !submitLoading ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                opacity: submitLoading ? 0.6 : 1
              }}
            >
              {submitLoading ? 'Submitting...' : '✓ Submit for Approval'}
            </button>
          </div>
        </div>
      </div>

      <div className="print-timestamp" style={{ textAlign: 'right', fontSize: 10, color: '#999', marginBottom: 12 }}>
        Printed: {new Date().toLocaleString()}
      </div>

      {/* Print Header - Only visible in print */}
      <div className="print-header" style={{ marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #333' }}>
        <h2 style={{ marginBottom: 5 }}>📦 Physical Inventory Count - {category?.name || session?.category?.name || session?.categoryName || 'Category'}</h2>
        <div className="print-info" style={{ fontSize: 12, color: '#333', marginBottom: 5 }}>
          <strong>Session ID:</strong> {session.id} | <strong>Version:</strong> {session.versionNumber} | <strong>Status:</strong> {session.status}
        </div>
        <div className="print-info" style={{ fontSize: 12, color: '#333' }}>
          <strong>Created by:</strong> {session.createdBy?.name || 'N/A'} | <strong>Date:</strong> {new Date(session.createdAt).toLocaleString()}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }} className="print-table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Product</th>
              <th style={{ padding: 12, textAlign: 'center' }}>System Qty</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Physical Qty</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Quantity Variance</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Selling Price</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Selling Price Variance</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Comment</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(line => {
              const sellingPrice = line.sellPrice || 0;
              const qtyVariance = line.variance !== null && line.variance !== undefined ? line.variance : 0;
              const priceVariance = qtyVariance * sellingPrice;
              return (
                <tr key={line.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 'bold' }}>{line.productName}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>SKU: {line.productSku}</div>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{line.systemQtyAtCount}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <input
                      type="number"
                      value={line.physicalQty !== null && line.physicalQty !== undefined ? line.physicalQty : ''}
                      onChange={(e) => handlePhysicalQtyChange(line.id, e.target.value)}
                      placeholder="0"
                      style={{ width: 60, padding: 6, border: '1px solid #ddd', borderRadius: 4 }}
                    />
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', color: qtyVariance !== 0 ? '#ff9800' : '#666' }}>
                    {line.variance !== null && line.variance !== undefined ? (qtyVariance > 0 ? '+' : '') + qtyVariance : '-'}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    Rs. {sellingPrice.toFixed(2)}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', color: priceVariance !== 0 ? '#ff9800' : '#666' }}>
                    {priceVariance !== 0 ? (priceVariance > 0 ? '+' : '') + 'Rs. ' + priceVariance.toFixed(2) : 'Rs. 0.00'}
                  </td>
                  <td style={{ padding: 12 }}>
                    <input
                      type="text"
                      value={line.lineComment || ''}
                      onChange={(e) => handleLineCommentChange(line.id, e.target.value)}
                      placeholder="Add note..."
                      style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 11 }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }} className="print-comment-section">
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 12 }}>Overall Comment:</label>
        <textarea
          value={overallComment}
          onChange={(e) => handleOverallCommentChange(e.target.value)}
          placeholder="Add overall comments for this count session..."
          rows={3}
          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 12, boxSizing: 'border-box' }}
        />
      </div>
    </div>
  );
};

export default StockCountGrid;
