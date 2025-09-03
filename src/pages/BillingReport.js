import React, { useState } from 'react';

const BillingReport = () => {
  const [search, setSearch] = useState({ date: '', customer: '', product: '' });
  // Example data
  const bills = [
    { billNo: '1001', customer: 'John Doe', date: '2025-08-31', product: 'Paracetamol', amount: 150 },
    { billNo: '1002', customer: 'Jane Smith', date: '2025-08-31', product: 'Amoxicillin', amount: 300 },
  ];
  const filtered = bills.filter(b =>
    (!search.date || b.date === search.date) &&
    (!search.customer || b.customer.toLowerCase().includes(search.customer.toLowerCase())) &&
    (!search.product || b.product.toLowerCase().includes(search.product.toLowerCase()))
  );
  return (
    <div style={{ padding: 24 }}>
      <h2>Billing Report</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input type="date" value={search.date} onChange={e => setSearch(s => ({ ...s, date: e.target.value }))} placeholder="Date" style={{ padding: 8 }} />
        <input type="text" value={search.customer} onChange={e => setSearch(s => ({ ...s, customer: e.target.value }))} placeholder="Customer" style={{ padding: 8 }} />
        <input type="text" value={search.product} onChange={e => setSearch(s => ({ ...s, product: e.target.value }))} placeholder="Product" style={{ padding: 8 }} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>Bill No</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Product</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(b => (
            <tr key={b.billNo}>
              <td>{b.billNo}</td>
              <td>{b.customer}</td>
              <td>{b.date}</td>
              <td>{b.product}</td>
              <td>Rs. {b.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BillingReport;
