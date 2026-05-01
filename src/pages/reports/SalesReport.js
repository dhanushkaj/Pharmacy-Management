import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';
import Modal from '../../components/Modal';

const SalesReport = () => {
  const { token } = useContext(AuthContext);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productFilter, setProductFilter] = useState('');
  
  // Grouped by transaction (billing)
  const [groupedSales, setGroupedSales] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  
  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/billings?page=0&size=10000';
      if (startDate && endDate) {
        const startDateTime = `${startDate}T00:00:00`;
        const endDateTime = `${endDate}T23:59:59`;
        url = `/api/billings/date-range?startDate=${startDateTime}&endDate=${endDateTime}&page=0&size=10000`;
      }
      const data = await api(url, { token });
      if (data.content) {
        setBillings(data.content);
        // Group by billing (transaction)
        const grouped = data.content.map(bill => {
          const totalQuantity = bill.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          const totalSales = bill.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;
          return {
            billingId: bill.billingId,
            billingNumber: bill.billingNumber,
            billingDate: bill.billingDate,
            customerName: bill.customerName,
            totalQuantity,
            totalSales,
            items: bill.items || [],
          };
        });
        setGroupedSales(grouped);
      } else {
        setBillings([]);
        setGroupedSales([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load billing data');
      setBillings([]);
      setGroupedSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchBillings();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setProductFilter('');
  };

  // Filter by product name in items
  const filteredSales = groupedSales.filter(s => {
    if (!productFilter) return true;
    const filter = productFilter.toLowerCase();
    // Match if any item in the bill matches the product name
    return s.items && s.items.some(item => item.productName && item.productName.toLowerCase().includes(filter));
  });

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalQuantity = filteredSales.reduce((sum, s) => sum + s.totalQuantity, 0);
  const totalTransactions = filteredSales.length;

  const handleExportCSV = () => {
    const headers = [
      'Billing No',
      'Customer',
      'Date',
      'Quantity Sold',
      'Total Sales (Rs.)',
      'Details'
    ];
    const rows = groupedSales.map(group => [
      group.billingNumber,
      group.customerName,
      group.billingDate,
      group.totalQuantity,
      group.totalSales.toFixed(2),
      group.items && group.items.length > 0
        ? group.items.map(item => `${item.productName} x${item.quantity}`).join('; ')
        : ''
    ]);
    let csvContent = [headers, ...rows].map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h2>Sales Report <span style={{ fontSize: 18, color: '#1976d2', marginLeft: 16 }}>(Total: Rs. {totalSales.toFixed(2)})</span></h2>

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
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Product Name:</label>
            <input
              type="text"
              placeholder="Filter by product..."
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
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
          <button
            onClick={handleExportCSV}
            style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, background: '#e3f2fd', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Total Sales</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>
            Rs. {totalSales.toFixed(2)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: '#f3e5f5', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Total Quantity Sold</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#7b1fa2' }}>
            {totalQuantity}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: '#e8f5e9', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Total Transactions</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#388e3c' }}>
            {totalTransactions}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: 'red', marginBottom: 12, padding: 10, background: '#fee', border: '1px solid red' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <div>Loading sales data...</div>}

      {/* Sales Table */}
      {!loading && filteredSales.length === 0 && <div style={{ color: '#999' }}>No sales data found</div>}

      {!loading && filteredSales.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#e3f2fd' }}>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Billing No</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'center' }}>Date</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Quantity Sold</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Total Sales (Rs.)</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((s, idx) => (
              <tr key={s.billingId} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>{s.billingNumber}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>{s.customerName || '-'}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center' }}>{s.billingDate ? new Date(s.billingDate).toLocaleDateString() : '-'}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>{s.totalQuantity}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>{s.totalSales.toFixed(2)}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                  <button onClick={() => setSelectedBilling(s)} style={{ padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
              <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>TOTAL</td>
              <td></td>
              <td></td>
              <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>{totalQuantity}</td>
              <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>{totalSales.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
          {/* Modal for transaction breakdown */}
          <Modal open={!!selectedBilling} title={selectedBilling ? `Billing Details - ${selectedBilling.billingNumber}` : ''} onClose={() => setSelectedBilling(null)}>
            {selectedBilling && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <strong>Date:</strong> {selectedBilling.billingDate ? new Date(selectedBilling.billingDate).toLocaleString() : '-'}<br />
                  <strong>Customer:</strong> {selectedBilling.customerName || '-'}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Product</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Quantity</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Unit Price</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Subtotal</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Batch No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBilling.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: 8, border: '1px solid #eee' }}>{item.productName}</td>
                        <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'right' }}>{item.unitPrice?.toFixed(2)}</td>
                        <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'right' }}>{item.subtotal?.toFixed(2)}</td>
                        <td style={{ padding: 8, border: '1px solid #eee' }}>{item.batchNo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Modal>
    </div>
  );
};

export default SalesReport;
