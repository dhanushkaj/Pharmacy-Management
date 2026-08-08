import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const CustomerSpectrum = () => {
  const { hasRole } = useContext(AuthContext);
  const [viewType, setViewType] = useState('best'); // 'best' or 'worst'
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionThreshold: 1, // For best: minimum, for worst: maximum
    limit: 50
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate + 'T00:00:00');
      if (filters.endDate) params.append('endDate', filters.endDate + 'T23:59:59');
      params.append('limit', filters.limit || 50);

      const endpoint = viewType === 'best' 
        ? '/api/customers/best'
        : '/api/customers/minimum';

      if (viewType === 'best') {
        params.append('minimumTransactions', filters.transactionThreshold || 1);
        params.append('sortBy', sortBy);
      } else {
        params.append('maximumTransactions', filters.transactionThreshold || 5);
        // For worst customers, reverse the sort logic
        let worstSortBy = sortBy;
        if (sortBy === 'revenue') worstSortBy = 'revenue'; // API will sort ascending
        if (sortBy === 'frequency') worstSortBy = 'frequency'; // API will sort ascending
        if (sortBy === 'recent') worstSortBy = 'recent';
        params.append('sortBy', worstSortBy);
      }

      const response = await api(`${endpoint}?${params.toString()}`, {
        method: 'GET'
      });

      setCustomers(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [viewType]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      transactionThreshold: viewType === 'best' ? 1 : 5,
      limit: 50
    });
    setSortBy(viewType === 'best' ? 'revenue' : 'frequency');
  };

  const handleViewChange = (type) => {
    setViewType(type);
    setSortBy(type === 'best' ? 'revenue' : 'frequency');
    setFilters({
      startDate: '',
      endDate: '',
      transactionThreshold: type === 'best' ? 1 : 5,
      limit: 50
    });
  };

  const isBestView = viewType === 'best';
  const headerColor = isBestView ? '#4caf50' : '#ff9800';
  const buttonColor = isBestView ? '#43ea7a' : '#ffb74d';
  const tabActiveColor = isBestView ? '#4caf50' : '#ff9800';

  // Check permissions
  if (!hasRole(['ADMIN', 'MANAGER'])) {
    return <div style={{ padding: '20px', color: '#d32f2f' }}>❌ Access Denied. Admin/Manager only.</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: headerColor, margin: '0 0 20px 0' }}>
          {isBestView ? '🏆 Customer Spectrum - Best Customers' : '📉 Customer Spectrum - Worst Customers'}
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          {isBestView 
            ? 'High-activity customers with strong purchase history and revenue generation.'
            : 'Low-activity customers with limited purchase history. Identify dormant customers for follow-up campaigns.'}
        </p>
      </div>

      {/* View Toggle Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '2px solid #ddd',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => handleViewChange('best')}
          style={{
            padding: '12px 24px',
            backgroundColor: isBestView ? tabActiveColor : '#e0e0e0',
            color: isBestView ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: isBestView ? 'bold' : 'normal',
            transition: 'all 0.3s'
          }}
        >
          🏆 Best Customers
        </button>
        <button
          onClick={() => handleViewChange('worst')}
          style={{
            padding: '12px 24px',
            backgroundColor: !isBestView ? tabActiveColor : '#e0e0e0',
            color: !isBestView ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: !isBestView ? 'bold' : 'normal',
            transition: 'all 0.3s'
          }}
        >
          📉 Worst Customers
        </button>
      </div>

      {/* Filter Form */}
      <div style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: `1px solid ${headerColor}33`
      }}>
        <form onSubmit={handleApplyFilters}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            {/* Start Date */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                📅 Start Date (Optional)
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                📅 End Date (Optional)
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Transaction Threshold */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                {isBestView ? '🔝 Min Transactions' : '📉 Max Transactions'}
              </label>
              <input
                type="number"
                name="transactionThreshold"
                value={filters.transactionThreshold}
                onChange={handleFilterChange}
                min="1"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{ color: '#999' }}>
                {isBestView 
                  ? 'Only show customers with ≥ this many purchases'
                  : 'Only show customers with ≤ this many purchases'}
              </small>
            </div>

            {/* Sort By */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                📊 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                {isBestView ? (
                  <>
                    <option value="revenue">💰 Highest Revenue (First)</option>
                    <option value="frequency">🛒 Most Purchases (First)</option>
                    <option value="recent">⏱️ Most Recent (First)</option>
                  </>
                ) : (
                  <>
                    <option value="frequency">📊 Fewest Purchases (First)</option>
                    <option value="revenue">💰 Lowest Revenue</option>
                    <option value="recent">⏱️ Oldest Purchase (First)</option>
                  </>
                )}
              </select>
            </div>

            {/* Show Top */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                📋 Show Top
              </label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="10">10 customers</option>
                <option value="25">25 customers</option>
                <option value="50">50 customers</option>
                <option value="100">100 customers</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: buttonColor,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              ✓ Apply Filters
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#90caf9',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              ↻ Reset
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          ⏳ Loading {isBestView ? 'best' : 'worst'} customers...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          ⚠️ Error: {error}
        </div>
      )}

      {/* Results Table */}
      {!loading && customers.length > 0 && (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: headerColor, color: '#fff' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Rank</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Customer Name</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Phone</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Total Revenue</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Purchases</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Avg Order</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <td style={{ padding: '15px', color: headerColor, fontWeight: 'bold' }}>#{customer.rank}</td>
                  <td style={{ padding: '15px' }}>{customer.name}</td>
                  <td style={{ padding: '15px', fontSize: '13px' }}>{customer.phone || '-'}</td>
                  <td style={{ padding: '15px', fontSize: '13px' }}>{customer.email || '-'}</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#4caf50' }}>
                    Rs. {parseFloat(customer.totalRevenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right', color: '#1e88e5' }}>
                    {customer.purchaseFrequency}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right', color: '#ff9800' }}>
                    Rs. {parseFloat(customer.averageOrderValue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px' }}>
                    {customer.lastPurchaseDate 
                      ? new Date(customer.lastPurchaseDate).toLocaleDateString('en-PK')
                      : isBestView ? '-' : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && !error && (
        <div style={{
          backgroundColor: '#fff',
          padding: '60px 20px',
          textAlign: 'center',
          borderRadius: '8px',
          color: '#999'
        }}>
          {isBestView 
            ? '✅ No customers match your criteria for best customers.'
            : '✅ Great news! No customers with low activity.'}
        </div>
      )}
    </div>
  );
};

export default CustomerSpectrum;
