import React, { useState } from 'react';
import { api } from '../../utill/api';
import './AIDashboard.css';

/**
 * AI Dashboard Component
 * Provides natural language query interface for pharmacy insights
 * Integrates with backend AI service powered by Ollama
 */
const AIDashboard = () => {
  const [query, setQuery] = useState('');
  const [insightType, setInsightType] = useState('general');
  const [timeRange, setTimeRange] = useState('month');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Submit query to AI service
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await api('/api/ai/insights', {
        method: 'POST',
        body: {
          query,
          insightType,
          timeRange,
        },
      });

      if (res.success) {
        setResponse(res);
      } else {
        setError(res.error || 'Failed to generate insight');
      }
    } catch (err) {
      setError(
        err.message || 
        'Error connecting to AI service'
      );
      console.error('AI Service Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick query buttons
   */
  const quickQueries = [
    {
      label: 'Sales Analysis',
      query: 'Show me sales trends for this month',
      type: 'sales',
    },
    {
      label: 'Low Inventory',
      query: 'Which products have low inventory?',
      type: 'inventory',
    },
    {
      label: 'Top Customers',
      query: 'Who are my top customers?',
      type: 'customers',
    },
    {
      label: 'Billing Insights',
      query: 'Analyze my billing patterns',
      type: 'billing',
    },
  ];

  /**
   * Handle quick query click
   */
  const handleQuickQuery = (q) => {
    setQuery(q.query);
    setInsightType(q.type);
  };

  /**
   * Extract and format data from response
   */
  const extractChartData = () => {
    if (!response?.data) return null;
    
    const data = response.data;
    
    // Handle salesData
    if (data.salesData?.records) {
      return {
        records: data.salesData.records,
        type: 'sales'
      };
    }
    
    // Handle other data types
    if (Array.isArray(data)) {
      return { records: data, type: 'array' };
    }
    
    return null;
  };

  /**
   * Render visualization based on data
   */
  const renderChart = () => {
    if (!response?.data) return null;

    const chartType = response.chartType;
    const data = response.data;
    const chartData = extractChartData();

    return (
      <div className="chart-container">
        <div className="chart-header">
          <span className="chart-type-badge">{chartType?.toUpperCase()}</span>
          <span className="chart-subtitle">Data Visualization</span>
        </div>

        {chartData?.records && chartData.records.length > 0 ? (
          <>
            {/* Simple Bar Chart Visualization */}
            <div className="chart-visualization">
              {chartData.records.slice(0, 8).map((item, idx) => {
                const name = item.product_name || item.name || `Item ${idx + 1}`;
                const amount = item.total_amount || item.amount || 0;
                const maxAmount = Math.max(...chartData.records.map(r => r.total_amount || r.amount || 0));
                const percentage = (amount / maxAmount) * 100;

                return (
                  <div key={idx} className="chart-bar-item">
                    <div className="bar-label">
                      <span className="bar-name">{name.substring(0, 40)}</span>
                      <span className="bar-value">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data Table */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th className="right-align">Quantity</th>
                    <th className="right-align">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.records.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'even' : 'odd'}>
                      <td>{idx + 1}</td>
                      <td className="product-name">{item.product_name || item.name}</td>
                      <td className="right-align">{item.total_quantity || item.quantity || 0}</td>
                      <td className="right-align amount">₹{(item.total_amount || item.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="chart-stats">
              <div className="stat-item">
                <span className="stat-label">Total Items</span>
                <span className="stat-value">{chartData.records.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Amount</span>
                <span className="stat-value">₹{chartData.records.reduce((sum, r) => sum + (r.total_amount || r.amount || 0), 0).toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Quantity</span>
                <span className="stat-value">{chartData.records.reduce((sum, r) => sum + (r.total_quantity || r.quantity || 0), 0)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="no-data">
            <p>No data available for visualization</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-dashboard">
      <div className="ai-header">
        <h1>🤖 AI Insights Dashboard</h1>
        <p>Ask natural language questions about your pharmacy data</p>
      </div>

      <div className="ai-container">
        {/* Query Section */}
        <div className="query-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="query">Your Question</label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'Show me Q2 sales by category' or 'Which drugs had declining sales?'"
                rows="4"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="insightType">Insight Type</label>
                <select
                  id="insightType"
                  value={insightType}
                  onChange={(e) => setInsightType(e.target.value)}
                  disabled={loading}
                >
                  <option value="general">General</option>
                  <option value="sales">Sales</option>
                  <option value="inventory">Inventory</option>
                  <option value="customers">Customers</option>
                  <option value="billing">Billing</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timeRange">Time Range</label>
                <select
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  disabled={loading}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Analyzing...' : '✨ Ask AI'}
            </button>
          </form>

          {/* Quick Queries */}
          <div className="quick-queries">
            <p className="quick-queries-label">Quick Queries:</p>
            <div className="quick-buttons">
              {quickQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuery(q)}
                  className="quick-btn"
                  disabled={loading}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Analyzing your data...</p>
          </div>
        )}

        {/* Response Display */}
        {response && response.success && (
          <div className="response-section">
            <div className="insight-box">
              <h3>📊 AI Insight</h3>
              <p className="insight-text">{response.insight}</p>
            </div>

            <div className="summary-box">
              <h3>📝 Summary</h3>
              <p className="summary-text">{response.summary}</p>
            </div>

            {response.data && Object.keys(response.data).length > 0 && (
              <div className="chart-box">
                <h3>📈 Data Visualization</h3>
                {renderChart()}
              </div>
            )}

            <div className="metadata">
              <small>Generated at: {new Date(response.timestamp).toLocaleString()}</small>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !response && !error && (
          <div className="empty-state">
            <p>💭 Ask your first question to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDashboard;
