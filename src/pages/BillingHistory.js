import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #thermal-bill, #thermal-bill * {
      visibility: visible;
    }
    #thermal-bill {
      position: absolute;
      left: 0;
      top: 0;
      width: 80mm !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

export default function BillingHistory() {
  const { token, hasRole } = useContext(AuthContext);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Bill modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  // Load store settings and inject print styles
  useEffect(() => {
    loadStoreSettings();
    
    // Inject print styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = printStyles;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const loadStoreSettings = async () => {
    try {
      // Load from localStorage (primary storage)
      const savedSettings = localStorage.getItem('storeSettings');
      if (savedSettings) {
        setStoreSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.log('Error loading store settings:', err);
    }
  };

  // Load billings on mount and when filters/page change
  useEffect(() => {
    fetchBillings();
  }, [page, startDate, endDate, customerFilter, paymentMethodFilter]);

  const fetchBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/billings?page=${page}&size=20`;
      
      // Apply date range filter if both dates are set
      if (startDate && endDate) {
        // Convert date to datetime format (add T00:00:00 for start and T23:59:59 for end)
        const startDateTime = `${startDate}T00:00:00`;
        const endDateTime = `${endDate}T23:59:59`;
        url = `/api/billings/date-range?startDate=${startDateTime}&endDate=${endDateTime}&page=${page}&size=20`;
      }

      console.log('Fetching billings from:', url);
      const data = await api(url, { token });
      console.log('Received data:', data);
      
      if (data.content) {
        // Filter by customer name/phone and payment method on client side if needed
        let results = data.content;
        console.log('Initial results count:', results.length);
        
        if (customerFilter.trim()) {
          const lower = customerFilter.toLowerCase();
          results = results.filter(
            (b) =>
              b.customerName?.toLowerCase().includes(lower) ||
              b.customerPhone?.toLowerCase().includes(lower)
          );
          console.log('After customer filter:', results.length, 'Customer filter:', customerFilter);
        }
        
        // Filter by payment method if selected
        if (paymentMethodFilter) {
          results = results.filter((b) => b.paymentMethod === paymentMethodFilter);
          console.log('After payment method filter:', results.length, 'Payment method:', paymentMethodFilter);
        }
        
        console.log('Final results count:', results.length);
        setBillings(results);
        setTotalPages(data.totalPages || 1);
      } else {
        setBillings([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page
    fetchBillings();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setCustomerFilter('');
    setPaymentMethodFilter('');
    setPage(0);
  };

  const handleViewBill = (billing) => {
    setSelectedBilling(billing);
    setShowBillModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPrinted = async (billingId) => {
    try {
      await api(`/api/billings/${billingId}/mark-printed`, {
        method: 'PUT',
        token,
      });
      alert('Marked as printed successfully!');
      fetchBillings(); // Refresh list
    } catch (err) {
      alert('Failed to mark as printed: ' + (err.message || 'Error'));
    }
  };

  const exportToCSV = () => {
    if (!billings || billings.length === 0) {
      alert('No billing records to export');
      return;
    }

    // CSV header
    const headers = [
      'Billing #',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Total Amount (Rs.)',
      'Paid Amount (Rs.)',
      'Change (Rs.)',
      'Discount %',
      'Payment Method',
      'Items Count',
      'Printed'
    ];

    // CSV rows
    const rows = billings.map(b => [
      b.billingId || '',
      b.billingDate ? new Date(b.billingDate).toLocaleString() : '',
      b.customerName || 'Walk-in Customer',
      b.customerPhone || 'N/A',
      b.totalAmount?.toFixed(2) || '0.00',
      b.paidAmount?.toFixed(2) || '0.00',
      b.changeAmount?.toFixed(2) || '0.00',
      b.discountPercentage?.toFixed(2) || '0.00',
      b.paymentMethod || 'N/A',
      b.items?.length || 0,
      b.printed ? 'Yes' : 'No'
    ]);

    // Escape CSV values
    const escapeCSV = (value) => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete billing handler (admin only)
  const handleDelete = async (billingId) => {
    if (!hasRole || !hasRole('admin')) return;
    if (!window.confirm('Are you sure you want to delete this billing? This action cannot be undone.')) return;
    try {
      await api(`/api/billings/${billingId}`, { method: 'DELETE', token });
      setBillings(billings => billings.filter(b => b.billingId !== billingId));
      alert('Billing deleted successfully.');
    } catch (err) {
      alert('Failed to delete billing: ' + (err.message || 'Error'));
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Billing History</h2>

      {/* Filters */}
      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3>Filters</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: 8, fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: 8, fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Customer (Name/Phone):</label>
            <input
              type="text"
              placeholder="Search customer..."
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{ padding: 8, fontSize: 14, minWidth: 200 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Payment Method:</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              style={{ padding: 8, fontSize: 14, minWidth: 150 }}
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE_PAYMENT">Mobile Payment</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            style={{ padding: '8px 16px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Search
          </button>
          <button
            onClick={handleReset}
            style={{ padding: '8px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Reset
          </button>
          <button
            onClick={exportToCSV}
            style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: 'red', marginBottom: 12, padding: 10, background: '#fee', border: '1px solid red' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <div>Loading billing history...</div>}

      {/* Billings Table */}
      {!loading && billings.length === 0 && <div style={{ color: '#999' }}>No billings found</div>}

      {!loading && billings.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#e3f2fd' }}>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Billing #</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Date</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Total (Rs.)</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'center' }}>Payment</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'center' }}>Printed</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {billings.map((billing) => (
                <tr key={billing.billingId}>
                  <td style={{ padding: 10, border: '1px solid #ddd' }}>{billing.billingNumber}</td>
                  <td style={{ padding: 10, border: '1px solid #ddd' }}>
                    {new Date(billing.billingDate).toLocaleDateString()} {new Date(billing.billingDate).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: 10, border: '1px solid #ddd' }}>{billing.customerName || 'N/A'}</td>
                  <td style={{ padding: 10, border: '1px solid #ddd' }}>{billing.customerPhone || 'N/A'}</td>
                  <td style={{ padding: 10, border: '1px solid #ddd', textAlign: 'right' }}>
                    <strong>{billing.grandTotal?.toFixed(2)}</strong>
                  </td>
                  <td style={{ padding: 10, border: '1px solid #ddd', textAlign: 'center' }}>{billing.paymentMethod}</td>
                  <td style={{ padding: 10, border: '1px solid #ddd', textAlign: 'center' }}>
                    {billing.isPrinted ? '✅' : '❌'}
                  </td>
                  <td style={{ padding: 10, border: '1px solid #ddd', textAlign: 'center' }}>
                    <button
                      onClick={() => handleViewBill(billing)}
                      style={{
                        padding: '6px 12px',
                        background: '#2196f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        marginRight: 4,
                      }}
                    >
                      View
                    </button>
                    {!billing.isPrinted && (
                      <button
                        onClick={() => handleMarkPrinted(billing.billingId)}
                        style={{
                          padding: '6px 12px',
                          background: '#4caf50',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          marginRight: 4,
                        }}
                      >
                        Mark Printed
                      </button>
                    )}
                    {hasRole && hasRole('admin') && (
                      <button
                        onClick={() => handleDelete(billing.billingId)}
                        style={{
                          padding: '6px 12px',
                          background: '#f44336',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
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
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              style={{
                padding: '8px 16px',
                background: page === 0 ? '#ccc' : '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              style={{
                padding: '8px 16px',
                background: page >= totalPages - 1 ? '#ccc' : '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Thermal Print Bill Modal */}
      {showBillModal && selectedBilling && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowBillModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 8,
              maxWidth: 400,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Print Button Bar */}
            <div
              className="no-print"
              style={{
                padding: 12,
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f5f5f5',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Bill Preview</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handlePrint}
                  style={{
                    padding: '6px 16px',
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setShowBillModal(false)}
                  style={{
                    padding: '6px 16px',
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Thermal Bill Content */}
            <div
              id="thermal-bill"
              style={{
                width: 300,
                margin: '0 auto',
                padding: 20,
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: 1.5,
                background: '#fff',
              }}
            >
              {/* Store Header */}
              {storeSettings?.logo && (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <img
                    src={storeSettings.logo}
                    alt="Logo"
                    style={{ maxWidth: 120, maxHeight: 60 }}
                  />
                </div>
              )}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                {storeSettings?.storeName || 'PHARMACY'}
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                {storeSettings?.address || 'Store Address'}
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                Tel: {storeSettings?.phone || 'N/A'}
              </div>
              {storeSettings?.email && (
                <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                  {storeSettings.email}
                </div>
              )}
              {storeSettings?.taxId && (
                <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                  Tax ID: {storeSettings.taxId}
                </div>
              )}

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

              {/* Bill Details */}
              <div style={{ fontSize: 10, marginBottom: 8 }}>
                <div><strong>Bill #:</strong> {selectedBilling.billingNumber}</div>
                <div><strong>Date:</strong> {new Date(selectedBilling.billingDate).toLocaleString()}</div>
                <div><strong>Customer:</strong> {selectedBilling.customerName}</div>
                <div><strong>Phone:</strong> {selectedBilling.customerPhone}</div>
                {selectedBilling.paymentMethod && (
                  <div><strong>Payment:</strong> {selectedBilling.paymentMethod}</div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

              {/* Items */}
              <table style={{ width: '100%', fontSize: 9, marginBottom: 8 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBilling.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '4px 0', fontSize: 10 }}>
                        {item.productName}
                        {item.productCode && (
                          <div style={{ fontSize: 8, color: '#666' }}>({item.productCode})</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '4px 0' }}>
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 'bold' }}>
                        {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

              {/* Totals */}
              <div style={{ fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Subtotal:</span>
                  <span>Rs. {selectedBilling.subtotal.toFixed(2)}</span>
                </div>
                {selectedBilling.discountPercentage > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Discount ({selectedBilling.discountPercentage}%):</span>
                    <span>- Rs. {selectedBilling.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTop: '1px solid #000',
                    fontWeight: 'bold',
                    fontSize: 12,
                  }}
                >
                  <span>GRAND TOTAL:</span>
                  <span>Rs. {selectedBilling.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {selectedBilling.notes && (
                <>
                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
                  <div style={{ fontSize: 9, fontStyle: 'italic' }}>
                    <strong>Notes:</strong> {selectedBilling.notes}
                  </div>
                </>
              )}

              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }}></div>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: 9, marginTop: 12 }}>
                <div style={{ marginBottom: 4 }}>Thank you for your business!</div>
                <div>Please come again</div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 8, marginTop: 8, color: '#666' }}>
                Powered by Pharmacy Management System
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
