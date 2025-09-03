import React from 'react';

const CategoryManagement = () => (
  <div style={{ padding: 24 }}>
    <h2>Category Management</h2>
    <form style={{ display: 'flex', gap: 24, marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
        <label>Category Name</label>
        <input type="text" placeholder="Enter category name" style={{ padding: 8 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 320 }}>
        <label>Description</label>
        <input type="text" placeholder="Enter description" style={{ padding: 8 }} />
      </div>
  <button type="submit" style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Category</button>
    </form>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
      <thead>
        <tr style={{ background: '#f0f0f0' }}>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>ID</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Category Name</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Description</th>
          <th style={{ padding: 10, border: '1px solid #ccc' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>1</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>Pain Relief</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>Medicines for pain and fever</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>
            <button style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
            <button style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
          </td>
        </tr>
        <tr>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>2</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>Antibiotics</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>Infection treatment</td>
          <td style={{ padding: 10, border: '1px solid #ccc' }}>
            <button style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
            <button style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  <button style={{ marginTop: 20, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Category</button>
  </div>
);

export default CategoryManagement;