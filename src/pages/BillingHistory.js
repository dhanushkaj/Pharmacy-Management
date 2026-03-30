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
      (b.subtotal - (b.discountAmount || 0)).toFixed(2), // grand total
      b.paidAmount?.toFixed(2) || '0.00',
      b.changeAmount?.toFixed(2) || '0.00',
      (b.discountAmount !== undefined ? b.discountAmount.toFixed(2) : (b.discountPercentage?.toFixed(2) || '0.00')), // always use discountAmount if present
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
              <option value="ONLINE_TRANSFER">Online Transfer</option>
              <option value="CREDIT">Credit</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
              <option value="OLD_MANUAL">Old Manual</option>
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
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#e3f2fd' }}>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Billing #</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Date</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Total (Rs.)</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Received (Rs.)</th>
                <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Balance (Rs.)</th>
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
                    <strong>{(billing.grandTotal || (billing.subtotal - (billing.discountAmount || 0))).toFixed(2)}</strong>
                  </td>
                  <td style={{ padding: 10, border: '1px solid #ddd', textAlign: 'right' }}>
                    {billing.amountReceived ? billing.amountReceived.toFixed(2) : '-'}
                  </td>
                  <td style={{ padding: 10, border: '1px solid #ddd', textAlign: 'right', color: billing.balanceAmount >= 0 ? '#2e7d32' : '#c62828' }}>
                    {billing.amountReceived > 0 ? (
                      <span>{billing.balanceAmount >= 0 ? '+' : ''}{billing.balanceAmount?.toFixed(2) || '0.00'}</span>
                    ) : '-'}
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
          </div>

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
                width: 320,
                margin: '0 auto',
                padding: '24px 20px',
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: 1.5,
                background: '#fff',
              }}
            >
              {/* Store Header */}
              {storeSettings?.logo && (
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <img
                    src={storeSettings.logo}
                    alt="Logo"
                    style={{ maxWidth: 140, maxHeight: 70 }}
                  />
                </div>
              )}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
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

              <div style={{ borderTop: '2px solid #000', margin: '10px 0' }}></div>

              {/* Bill Details */}
              <div style={{ fontSize: 11, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Invoice #:</strong>
                  <span>{selectedBilling.billingNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Date:</strong>
                  <span>{new Date(selectedBilling.billingDate).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Customer:</strong>
                  <span>{selectedBilling.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Phone:</strong>
                  <span>{selectedBilling.customerPhone}</span>
                </div>
                {selectedBilling.paymentMethod && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Payment:</strong>
                    <span>{selectedBilling.paymentMethod}</span>
                  </div>
                )}
                <div style={{ textAlign: 'right', color: '#e53935', fontWeight: 'bold', fontSize: 12 }}>REPRINT</div>
              </div>

              <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>

              {/* Items Table */}
              <table style={{ width: '100%', fontSize: 10, marginBottom: 10, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 'bold' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: 'bold' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBilling.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '6px 0', fontSize: 10 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                        {item.productCode && (
                          <div style={{ fontSize: 8, color: '#666' }}>Code: {item.productCode}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '6px 0' }}>
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>
                        {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>

              {/* Totals */}
              <div style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Subtotal:</span>
                  <span>Rs. {selectedBilling.subtotal.toFixed(2)}</span>
                </div>
                {selectedBilling.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Discount Applied:</span>
                    <span>- Rs. {Number(selectedBilling.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '2px solid #000',
                    fontWeight: 'bold',
                    fontSize: 14,
                    marginTop: 6,
                  }}
                >
                  <span>GRAND TOTAL:</span>
                  <span>Rs. {(selectedBilling.grandTotal || (selectedBilling.subtotal - Number(selectedBilling.discountAmount || 0))).toFixed(2)}</span>
                </div>

                {/* Amount Received and Balance */}
                {selectedBilling.amountReceived > 0 && (
                  <>
                    <div style={{ borderTop: '1px dashed #333', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span>Amount Received:</span>
                      <span>Rs. {selectedBilling.amountReceived.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: 'bold',
                      fontSize: 13,
                      padding: '4px 0',
                      background: selectedBilling.balanceAmount >= 0 ? '#e8f5e9' : '#ffebee',
                      borderRadius: 4
                    }}>
                      <span>{selectedBilling.balanceAmount >= 0 ? 'Balance/Change:' : 'Amount Due:'}</span>
                      <span>Rs. {Math.abs(selectedBilling.balanceAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {selectedBilling.notes && (
                <>
                  <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>
                  <div style={{ fontSize: 9, fontStyle: 'italic', wordWrap: 'break-word' }}>
                    <strong>Notes:</strong> {selectedBilling.notes}
                  </div>
                </>
              )}

              <div style={{ borderTop: '2px solid #000', margin: '12px 0' }}></div>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: 10, marginTop: 12 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Thank You!</div>
                <div style={{ fontSize: 9 }}>Please keep this bill for warranty claims</div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 8, marginTop: 10, color: '#999' }}>
                Powered by Pharmacy Management System
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
