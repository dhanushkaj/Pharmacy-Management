import React, { useState } from 'react';

const AlertReport = () => {
  const [search, setSearch] = useState('');
  // Example data
  const alerts = [
    { type: 'Low Stock', product: 'Amoxicillin', details: 'Stock below threshold' },
    { type: 'Expiry', product: 'Vitamin C', details: 'Expires soon' },
  ];
  const filtered = alerts.filter(a =>
    !search || a.product.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ padding: 24 }}>
      <h2>Alert Report</h2>
      <div style={{ marginBottom: 24 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product..." style={{ padding: 8 }} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>Type</th>
            <th>Product</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a, idx) => (
            <tr key={idx}>
              <td>{a.type}</td>
              <td>{a.product}</td>
              <td>{a.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertReport;
