import React, { useState, useEffect, useContext } from 'react';
import ProductSearchDropdown from '../components/ProductSearchDropdown';
import { api } from '../utill/api';
import { AuthContext } from '../components/AuthContext';

const mockAudit = [
  { id: 1, product: "Paracetamol 500mg", action: "Added stock", qty: 100, date: "2025-08-20", by: "Admin" },
  { id: 2, product: "Amoxicillin 250mg", action: "Removed expired", qty: -20, date: "2025-08-23", by: "Manager" },
];


const ProductBin = () => {
  const { token } = useContext(AuthContext);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [inventorySummary, setInventorySummary] = useState([]);

  useEffect(() => {
    // fetch categories
    (async () => {
      try {
        const list = await api('/api/categories', { token });
        setCategories(list || []);
      } catch (e) {
        console.error('Failed to load categories', e.message);
      }
    })();
  }, [token]);

  const onProductSelect = async (product) => {
    setSelectedProduct(product);

    // fetch bin movements and inventory summary
    try {
      const movementsPage = await api(`/api/products/${product.productId}/bin-movements`, { token });
      // movementsPage has content array
      setTransactions(movementsPage.content || []);
    } catch (e) {
      console.error('Failed to fetch movements', e.message);
      setTransactions([]);
    }

    try {
      const sum = await api(`/api/products/${product.productId}/inventory-summary`, { token });
      setInventorySummary(sum || []);
    } catch (e) {
      console.error('Failed to fetch inventory summary', e.message);
      setInventorySummary([]);
    }
  };

  return (
    <div>
      <h2>Product Bin / Audit Trail</h2>
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: 10, display: 'block' }}>Category:</label>
          <select value={selectedCategory || ''} onChange={e => setSelectedCategory(e.target.value || null)} style={{ padding: 8 }}>
            <option value="">All</option>
            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Product:</label>
          <ProductSearchDropdown categoryId={selectedCategory} onSelect={onProductSelect} />
        </div>
      </div>
      {selectedProduct ? (
        <>
          <div style={{ marginTop: 10 }}>
            <h3>Inventory Summary</h3>
            {inventorySummary.length === 0 ? (
              <div>No inventory buckets for this product.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Batch</th>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Stock</th>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Price</th>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {inventorySummary.map(b => (
                    <tr key={b.batchNo}>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.batchNo || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.stock}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.price || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.costPrice || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>Recent Movements</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: 10, border: '1px solid #ccc' }}>ID</th>
                  <th style={{ padding: 10, border: '1px solid #ccc' }}>From</th>
                  <th style={{ padding: 10, border: '1px solid #ccc' }}>To</th>
                  <th style={{ padding: 10, border: '1px solid #ccc' }}>Qty</th>
                  <th style={{ padding: 10, border: '1px solid #ccc' }}>Ref</th>
                  <th style={{ padding: 10, border: '1px solid #ccc' }}>By</th>
                  <th style={{ padding: 10, border: '1px solid #ccc' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No transactions found for this product.</td></tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.id}</td>
                      <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.fromBin}</td>
                      <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.toBin}</td>
                      <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.quantity}</td>
                      <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.referenceType} / {t.referenceId}</td>
                      <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.performedBy}</td>
                      <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 32, color: '#888' }}>Select a product to view its transactions.</div>
      )}
      {viewDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 12px #0002', position: 'relative' }}>
            <h3>Document Details</h3>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, fontSize: 15 }}>
              {JSON.stringify(viewDoc, null, 2)}
            </pre>
            <button onClick={() => setViewDoc(null)} style={{ marginTop: 16, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 18px' }}>Close</button>
          </div>
        </div>
      )}
      <button style={{ marginTop: 20 }}>Export Audit</button>
    </div>
  );
};

export default ProductBin;