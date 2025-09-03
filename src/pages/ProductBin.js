import React, { useState } from 'react';

const mockProducts = [
  "Paracetamol 500mg",
  "Amoxicillin 250mg",
  "Vitamin C 100mg"
];

const mockAudit = [
  { id: 1, product: "Paracetamol 500mg", action: "Added stock", qty: 100, date: "2025-08-20", by: "Admin" },
  { id: 2, product: "Amoxicillin 250mg", action: "Removed expired", qty: -20, date: "2025-08-23", by: "Manager" },
];

const mockPurchaseOrders = [
  { id: 101, product: "Paracetamol 500mg", type: "Purchase Order", qty: 50, date: "2025-08-10", supplier: "HealthCorp" },
  { id: 102, product: "Amoxicillin 250mg", type: "Purchase Order", qty: 30, date: "2025-08-12", supplier: "MediSupply" },
];

const mockBills = [
  { id: 201, product: "Paracetamol 500mg", type: "Bill", qty: -10, date: "2025-08-15", customer: "John Doe" },
  { id: 202, product: "Vitamin C 100mg", type: "Bill", qty: -5, date: "2025-08-18", customer: "Jane Smith" },
];


const ProductBin = () => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [viewDoc, setViewDoc] = useState(null);

  // Combine all transactions for the selected product
  const transactions = [
    ...mockPurchaseOrders.filter(t => t.product === selectedProduct),
    ...mockBills.filter(t => t.product === selectedProduct),
    ...mockAudit.filter(t => t.product === selectedProduct)
  ];

  return (
    <div>
      <h2>Product Bin / Audit Trail</h2>
      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10 }}>Select Product:</label>
        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ padding: 8 }}>
          <option value="">-- Select --</option>
          {mockProducts.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      {selectedProduct ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>ID</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Type</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Action/Party</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Quantity</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Date</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Documents</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No transactions found for this product.</td></tr>
            ) : (
              transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.id}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.type || t.action}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.supplier || t.customer || t.by || '-'}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.qty}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.date}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>
                    <button onClick={() => setViewDoc(t)} style={{ padding: '4px 10px', background: '#90caf9', color: '#fff', border: 'none', borderRadius: 4 }}>View Documents</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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