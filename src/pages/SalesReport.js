import React, { useState } from 'react';

const SalesReport = () => {
  const [search, setSearch] = useState({ date: '', month: '', year: '', product: '' });
  // Example data
  const sales = [
    { date: '2025-08-31', product: 'Paracetamol', qty: 10, total: 150 },
    { date: '2025-08-31', product: 'Amoxicillin', qty: 5, total: 300 },
  ];
  const filtered = sales.filter(s =>
    (!search.date || s.date === search.date) &&
    (!search.product || s.product.toLowerCase().includes(search.product.toLowerCase()))
  );
  return (
    <div style={{ padding: 24 }}>
      <h2>Sales Report</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input type="date" value={search.date} onChange={e => setSearch(s => ({ ...s, date: e.target.value }))} placeholder="Date" style={{ padding: 8 }} />
        <input type="text" value={search.product} onChange={e => setSearch(s => ({ ...s, product: e.target.value }))} placeholder="Product" style={{ padding: 8 }} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>Date</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total Sales</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s, idx) => (
            <tr key={idx}>
              <td>{s.date}</td>
              <td>{s.product}</td>
              <td>{s.qty}</td>
              <td>Rs. {s.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesReport;
