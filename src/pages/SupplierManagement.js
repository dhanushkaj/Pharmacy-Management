import React from 'react';

const SupplierManagement = () => (
  <div style={{ padding: 24 }}>
    <h2>Supplier Management</h2>
    <form style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
        <label>Supplier Name</label>
        <input type="text" placeholder="Enter supplier name" style={{ padding: 8 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
        <label>Contact</label>
        <input type="text" placeholder="Enter contact number" style={{ padding: 8 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
        <label>Email</label>
        <input type="email" placeholder="Enter email" style={{ padding: 8 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 320 }}>
        <label>Address</label>
        <input type="text" placeholder="Enter address" style={{ padding: 8 }} />
      </div>
  <button type="submit" style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Supplier</button>
    </form>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
      <thead>
        <tr style={{ background: '#f0f0f0' }}>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>ID</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Supplier Name</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Contact</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Email</th>
           <th style={{ padding: 10, border: '1px solid #ccc' }}>Address</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>1</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>HealthCorp</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>0771234567</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>info@healthcorp.com</td>
           <td style={{ padding: 10, border: '1px solid #ccc' }}>123 Main St, Colombo</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>
            <button style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
            <button style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
          </td>
        </tr>
        <tr>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>2</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>MediSupply</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>0779876543</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>contact@medisupply.com</td>
           <td style={{ padding: 10, border: '1px solid #ccc' }}>456 Market Rd, Kandy</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>
            <button style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
            <button style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  <button style={{ marginTop: 20, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Supplier</button>
  </div>
);

export default SupplierManagement;