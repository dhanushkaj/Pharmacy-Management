import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';

const SalesReport = () => {
  const { token } = useContext(AuthContext);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productFilter, setProductFilter] = useState('');
  
  // Aggregated sales data
  const [salesData, setSalesData] = useState([]);
  
  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/billings?page=0&size=10000'; // Get all billings
      
      if (startDate && endDate) {
        const startDateTime = `${startDate}T00:00:00`;
        const endDateTime = `${endDate}T23:59:59`;
        url = `/api/billings/date-range?startDate=${startDateTime}&endDate=${endDateTime}&page=0&size=10000`;
      }

      const data = await api(url, { token });
      
      if (data.content) {
        setBillings(data.content);
        aggregateSalesData(data.content);
      } else {
        setBillings([]);
        setSalesData([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load billing data');
      setBillings([]);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const aggregateSalesData = (billingList) => {
    const productMap = {};

    billingList.forEach(billing => {
      if (billing.items && Array.isArray(billing.items)) {
        billing.items.forEach(item => {
          const productName = item.productName || 'Unknown Product';
          
          if (!productMap[productName]) {
            productMap[productName] = {
              product: productName,
              totalQuantity: 0,
              totalSales: 0,
              transactionCount: 0
            };
          }
          
          productMap[productName].totalQuantity += item.quantity || 0;
          productMap[productName].totalSales += (item.quantity || 0) * (item.price || 0);
          productMap[productName].transactionCount += 1;
        });
      }
    });

    const aggregated = Object.values(productMap);
    setSalesData(aggregated);
  };

  const handleSearch = () => {
    fetchBillings();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setProductFilter('');
  };

  const filteredSales = salesData.filter(s => 
    !productFilter || s.product.toLowerCase().includes(productFilter.toLowerCase())
  );

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalQuantity = filteredSales.reduce((sum, s) => sum + s.totalQuantity, 0);
  const totalTransactions = billings.length;

  const exportToCSV = () => {
    if (!filteredSales || filteredSales.length === 0) {
      alert('No sales data to export');
      return;
    }

    const headers = ['Product Name', 'Quantity Sold', 'Total Sales (Rs.)', 'Transactions'];
    
    const rows = filteredSales.map(s => [
      s.product,
      s.totalQuantity,
      s.totalSales.toFixed(2),
      s.transactionCount
    ]);

    const escapeCSV = (value) => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h2>Sales Report</h2>

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
            onClick={exportToCSV}
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
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'left' }}>Product Name</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Quantity Sold</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Total Sales (Rs.)</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'right' }}>Avg Price (Rs.)</th>
              <th style={{ padding: 10, border: '1px solid #90caf9', textAlign: 'center' }}>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((s, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>{s.product}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>{s.totalQuantity}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                  {s.totalSales.toFixed(2)}
                </td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                  {(s.totalSales / s.totalQuantity).toFixed(2)}
                </td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center' }}>{s.transactionCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
              <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>TOTAL</td>
              <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>{totalQuantity}</td>
              <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                {totalSales.toFixed(2)}
              </td>
              <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'right' }}>
                {totalQuantity > 0 ? (totalSales / totalQuantity).toFixed(2) : '0.00'}
              </td>
              <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center' }}>{totalTransactions}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
};

export default SalesReport;
