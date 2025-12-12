import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import api from '../utill/api';

export default function BillingHistory() {
  const { token } = useContext(AuthContext);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load billings on mount and when filters/page change
  useEffect(() => {
    fetchBillings();
  }, [page, startDate, endDate, customerFilter]);

  const fetchBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/billings?page=${page}&size=20`;
      
      // Apply date range filter if both dates are set
      if (startDate && endDate) {
        url = `/api/billings/date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&size=20`;
      }

      const data = await api(url, { token });
      
      if (data.content) {
        // Filter by customer name/phone on client side if needed
        let results = data.content;
        if (customerFilter.trim()) {
          const lower = customerFilter.toLowerCase();
          results = results.filter(
            (b) =>
              b.customer?.name?.toLowerCase().includes(lower) ||
              b.customer?.phone?.toLowerCase().includes(lower)
          );
        }
        
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
    setPage(0);
  };

  const handleViewBill = (billing) => {
    // Open a modal or navigate to a detailed view
    // For now, show alert with billing details
    const itemsList = billing.items
      .map(
        (item) =>
          `${item.product.productName} (x${item.quantity}) @ Rs. ${item.unitPrice.toFixed(2)} = Rs. ${item.subtotal.toFixed(2)}`
      )
      .join('\n');
    
    alert(
      `Billing Number: ${billing.billingNumber}\n` +
        `Date: ${new Date(billing.billingDate).toLocaleString()}\n` +
        `Customer: ${billing.customer.name} (${billing.customer.phone})\n\n` +
        `Items:\n${itemsList}\n\n` +
        `Subtotal: Rs. ${billing.subtotal.toFixed(2)}\n` +
        `Discount: ${billing.discountPercentage}% (Rs. ${billing.discountAmount.toFixed(2)})\n` +
        `Grand Total: Rs. ${billing.grandTotal.toFixed(2)}\n` +
        `Payment Method: ${billing.paymentMethod}\n` +
        `${billing.notes ? `Notes: ${billing.notes}\n` : ''}` +
        `Printed: ${billing.isPrinted ? 'Yes' : 'No'}`
    );
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
                  <td style={{ padding: 10, border: '1px solid #ddd' }}>{billing.customer?.name || 'N/A'}</td>
                  <td style={{ padding: 10, border: '1px solid #ddd' }}>{billing.customer?.phone || 'N/A'}</td>
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
                        }}
                      >
                        Mark Printed
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
    </div>
  );
}
