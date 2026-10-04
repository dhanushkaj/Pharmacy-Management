import React, { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';

const ProductMovementReport = () => {
  const { token } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [months, setMonths] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      // No category selected yet - clear any previous results
      setMonths([]);
      setProducts([]);
      setError(null);
      return;
    }
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, token]);

  const fetchCategories = async () => {
    try {
      const data = await api('/api/categories', { method: 'GET', token });
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/reports/product-movement?categoryId=${categoryId}`;
      const data = await api(url, { method: 'GET', token });
      setMonths(data?.months || []);
      setProducts(data?.products || []);
    } catch (err) {
      console.error('Failed to fetch product movement report:', err);
      setError(err.message || 'Failed to load product movement report');
      setMonths([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuantity = (p) => (p.monthlyQuantities || []).reduce((sum, q) => sum + (q || 0), 0);

  const filteredProducts = products
    .filter(p => {
      if (!searchProduct) return true;
      const search = searchProduct.toLowerCase();
      return p.name?.toLowerCase().includes(search) || p.productCode?.toLowerCase().includes(search);
    })
    .sort((a, b) => getTotalQuantity(b) - getTotalQuantity(a));

  const columnTotals = months.map((_, idx) =>
    filteredProducts.reduce((sum, p) => sum + (p.monthlyQuantities?.[idx] || 0), 0)
  );

  const exportToCSV = () => {
    const headers = ['Product Code', 'Product Name', 'Category', ...months, 'Total'];
    const rows = filteredProducts.map(p => {
      const qtys = months.map((_, idx) => p.monthlyQuantities?.[idx] || 0);
      const total = qtys.reduce((sum, q) => sum + q, 0);
      return [p.productCode || '', p.name || '', p.categoryName || 'N/A', ...qtys, total];
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_movement_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    const categoryName = categories.find(c => String(c.categoryId) === String(categoryId))?.name || 'Category';

    const exportData = filteredProducts.map(p => {
      const qtys = months.map((_, idx) => p.monthlyQuantities?.[idx] || 0);
      const total = qtys.reduce((sum, q) => sum + q, 0);
      const row = {
        'Product Code': p.productCode || '',
        'Product Name': p.name || '',
        'Category': p.categoryName || 'N/A'
      };
      months.forEach((m, idx) => { row[m] = qtys[idx]; });
      row['Total'] = total;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 18 }, ...months.map(() => ({ wch: 16 })), { wch: 10 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Product Movement');

    const metaData = [
      ['Product Movement Report'],
      [''],
      ['Category', categoryName],
      ['Months Covered', months.join(', ')],
      ['Export Date', new Date().toLocaleString()]
    ];
    const wsMetadata = XLSX.utils.aoa_to_sheet(metaData);
    wsMetadata['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsMetadata, 'Summary');

    const filename = `Product_Movement_${categoryName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Product Movement Report</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={exportToExcel}
              disabled={filteredProducts.length === 0}
              style={{
                padding: '10px 20px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: filteredProducts.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Export to Excel
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredProducts.length === 0}
              style={{
                padding: '10px 20px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: filteredProducts.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Export to CSV
            </button>
          </div>
        </div>

        <p style={{ color: '#555', marginTop: -12, marginBottom: 20 }}>
          Total quantity sold per product for each of the last 3 completed months
          {months.length === 3 ? ` (${months[0]} – ${months[2]})` : ''}, excluding the current month.
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 220 }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Search Product</label>
            <input
              type="text"
              placeholder="Product name or code"
              value={searchProduct}
              onChange={e => setSearchProduct(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 220 }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: '#fdecea', color: '#b71c1c', padding: 12, borderRadius: 4, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Product Code</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Product Name</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Category</th>
                {months.map(m => (
                  <th key={m} style={{ padding: 12, textAlign: 'right' }}>{m}</th>
                ))}
                <th style={{ padding: 12, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={months.length + 4} style={{ padding: 20, textAlign: 'center' }}>Loading...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={months.length + 4} style={{ padding: 20, textAlign: 'center' }}>No products found</td></tr>
              ) : (
                filteredProducts.map(p => {
                  const qtys = months.map((_, idx) => p.monthlyQuantities?.[idx] || 0);
                  const total = qtys.reduce((sum, q) => sum + q, 0);
                  return (
                    <tr key={p.productId} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: 12 }}>{p.productCode}</td>
                      <td style={{ padding: 12 }}>{p.name}</td>
                      <td style={{ padding: 12 }}>{p.categoryName || 'N/A'}</td>
                      {qtys.map((q, idx) => (
                        <td key={idx} style={{ padding: 12, textAlign: 'right' }}>{q}</td>
                      ))}
                      <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>{total}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredProducts.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #ccc', background: '#fafafa' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }} colSpan={3}>Total</td>
                  {columnTotals.map((total, idx) => (
                    <td key={idx} style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>{total}</td>
                  ))}
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                    {columnTotals.reduce((sum, t) => sum + t, 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductMovementReport;
