import React, { useState, useEffect, useContext } from 'react';
import { FaSearch, FaBox } from 'react-icons/fa';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';

const InventoryReport = () => {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchProduct: '',
    categoryId: '',
    searchType: 'all', // all, category, product
    outOfStockOnly: false
  });


  useEffect(() => {
    fetchCategories();
    fetchInventoryReport();
  }, []);

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/inventory';
      if (filters.categoryId) {
        url += `?categoryId=${filters.categoryId}`;
      }
      const data = await api(url, { method: 'GET', token });
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
      alert('Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api('/api/categories', { method: 'GET', token });
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };



  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getInventoryStock = (product) => {
    // For new API, availableInventory is provided
    return product.availableInventory ?? 0;
  };

  const filteredProducts = products.filter(product => {
    // Out of stock filter
    if (filters.outOfStockOnly && getInventoryStock(product) !== 0) {
      return false;
    }
    // Filter by product search
    if (filters.searchProduct) {
      const searchLower = filters.searchProduct.toLowerCase();
      const matchesName = product.name?.toLowerCase().includes(searchLower);
      const matchesCode = product.productCode?.toLowerCase().includes(searchLower);
      return matchesName || matchesCode;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Product Code', 'Product Name', 'Category', 'Available Inventory', 'Min Stock', 'Max Stock', 'Status'];
    const rows = filteredProducts.map(product => [
      product.productCode || '',
      product.name || '',
      product.categoryName || 'N/A',
      getInventoryStock(product),
      product.minStock || 0,
      product.maxStock || 0,
      product.outOfStock ? 'OUT OF STOCK' : (getInventoryStock(product) < (product.minStock || 0) ? 'LOW STOCK' : 'IN STOCK')
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };


  const getLowStockCount = () => {
    return filteredProducts.filter(product => {
      const stock = getInventoryStock(product);
      return product.minStock && stock < product.minStock;
    }).length;
  };

  const getOutOfStockCount = () => {
    return filteredProducts.filter(product => getInventoryStock(product) === 0).length;
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Inventory Report</h2>
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

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Total Products</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1976d2' }}>
              {filteredProducts.length}
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Out of Stock</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#d32f2f' }}>
              {getOutOfStockCount()}
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Low Stock</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff9800' }}>
              {getLowStockCount()}
            </div>
          </div>

        </div>

        {/* Filters */}
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 8,
          marginBottom: 24,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>
                <FaSearch style={{ marginRight: 8 }} />
                Search Product
              </label>
              <input
                type="text"
                value={filters.searchProduct}
                onChange={(e) => handleFilterChange('searchProduct', e.target.value)}
                placeholder="Search by product name or code..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>
                <FaBox style={{ marginRight: 8 }} />
                Category
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
              <input
                type="checkbox"
                id="outOfStockOnly"
                checked={filters.outOfStockOnly}
                onChange={e => handleFilterChange('outOfStockOnly', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              <label htmlFor="outOfStockOnly" style={{ fontWeight: '500', cursor: 'pointer' }}>
                Show only Out of Stock
              </label>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div style={{
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>Loading inventory...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#666' }}>
              <FaBox size={48} style={{ color: '#ddd', marginBottom: 16 }} />
              <div style={{ fontSize: 18 }}>No products found</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Product Code</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Product Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Category</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Available Inventory</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Min Stock</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Max Stock</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = getInventoryStock(product);
                  const isOutOfStock = stock === 0;
                  const isLowStock = product.minStock && stock < product.minStock && stock > 0;

                  return (
                    <tr
                      key={product.productId}
                      style={{
                        borderBottom: '1px solid #ddd',
                        background: isOutOfStock ? '#ffebee' : isLowStock ? '#fff3e0' : '#fff'
                      }}
                    >
                      <td style={{ padding: 12 }}>{product.productCode}</td>
                      <td style={{ padding: 12, fontWeight: '500' }}>{product.name}</td>
                      <td style={{ padding: 12 }}>{product.categoryName || 'N/A'}</td>
                      <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                        {stock}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>{product.minStock || '-'}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>{product.maxStock || '-'}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {product.outOfStock ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: 12,
                            background: '#d32f2f',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}>
                            OUT OF STOCK
                          </span>
                        ) : getInventoryStock(product) < (product.minStock || 0)
                          ? (
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: 12,
                                background: '#ff9800',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                LOW STOCK
                              </span>
                            )
                          : (
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: 12,
                                background: '#4caf50',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                IN STOCK
                              </span>
                            )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
