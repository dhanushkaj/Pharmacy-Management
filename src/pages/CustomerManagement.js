import React from 'react';

const mockCustomers = [
  { id: 1, name: "John Doe", phone: "0771234567", email: "john@example.com", history: 5 },
  { id: 2, name: "Jane Smith", phone: "0779876543", email: "jane@example.com", history: 2 },
];

const CustomerManagement = () => (
  <div style={{ padding: 24 }}>
    <h2>Customer Management</h2>
    <form style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
        <label>Name</label>
        <input type="text" placeholder="Enter customer name" style={{ padding: 8 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
        <label>Phone</label>
        <input type="text" placeholder="Enter phone number" style={{ padding: 8 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
        <label>Email</label>
        <input type="email" placeholder="Enter email" style={{ padding: 8 }} />
      </div>
  <button type="submit" style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Customer</button>
    </form>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
      <thead>
        <tr style={{ background: '#f0f0f0' }}>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>ID</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Name</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Phone</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Email</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Purchase History</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {mockCustomers.map(c => (
          <tr key={c.id}>
            <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.id}</td>
            <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.name}</td>
            <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.phone}</td>
            <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.email}</td>
            <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.history} orders</td>
            <td style={{ padding: 10, border: '1px solid #ccc' }}>
              <button style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
              <button style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  <button style={{ marginTop: 20, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Customer</button>
  </div>
);

export default CustomerManagement;