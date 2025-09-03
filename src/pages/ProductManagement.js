import React from 'react';


import { useState } from 'react';
import logo from '../assets/logo.png';

const categories = ['Pain Relief', 'Antibiotics', 'Allergy', 'Vitamins'];
const suppliers = ['HealthCorp', 'MediSupply'];

function generateUniqueCode() {
  return 'P' + Math.floor(Math.random() * 1000000);
}

function generateBarcode() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

const ProductManagement = () => {
  const [form, setForm] = useState({
    category: '',
    name: '',
    generic: '',
    supplier: '',
    stock: '',
    price: '',
    expire: '',
    code: '',
    barcode: '',
    image: '',
  });
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState({ category: '', code: '', name: '', generic: '' });
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? URL.createObjectURL(files[0]) : value }));
  };

  const handleAutoCode = () => setForm(f => ({ ...f, code: generateUniqueCode() }));
  const handleAutoBarcode = () => setForm(f => ({ ...f, barcode: generateBarcode() }));

  const handleAdd = e => {
    e.preventDefault();
    if (!form.category || !form.name || !form.generic || !form.supplier || !form.stock || !form.price || !form.expire) return;
    setProducts([
      ...products,
      { ...form, id: Date.now() }
    ]);
    setForm({ category: '', name: '', generic: '', supplier: '', stock: '', price: '', expire: '', code: '', barcode: '', image: '' });
  };

  const filtered = products.filter(p =>
    (!search.category || p.category === search.category) &&
    (!search.code || p.code.includes(search.code)) &&
    (!search.name || p.name.toLowerCase().includes(search.name.toLowerCase())) &&
    (!search.generic || p.generic.toLowerCase().includes(search.generic.toLowerCase()))
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div style={{ padding: 24 }}>
      <h2>Product Management</h2>
      {/* Add Product Form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange} required style={{ padding: 8 }}>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Product Name</label>
          <input name="name" value={form.name} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Generic Name</label>
          <input name="generic" value={form.generic} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Supplier</label>
          <select name="supplier" value={form.supplier} onChange={handleChange} required style={{ padding: 8 }}>
            <option value="">Select Supplier</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
          <label>Stock</label>
          <input name="stock" type="number" value={form.stock} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
          <label>Sell Price</label>
          <input name="price" type="number" value={form.price} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Expiry Date</label>
          <input name="expire" type="date" value={form.expire} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Product Code</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input name="code" value={form.code} onChange={handleChange} style={{ padding: 8, flex: 1 }} placeholder="Auto-generate if empty" />
            <button type="button" onClick={handleAutoCode}>Auto</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Barcode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input name="barcode" value={form.barcode} onChange={handleChange} style={{ padding: 8, flex: 1 }} placeholder="Auto-generate if empty" />
            <button type="button" onClick={handleAutoBarcode}>Auto</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Product Image</label>
          <input name="image" type="file" accept="image/*" onChange={handleChange} style={{ padding: 8 }} />
        </div>
  <button type="submit" style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Product</button>
      </form>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input placeholder="Search by Category" value={search.category} onChange={e => setSearch(s => ({ ...s, category: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
        <input placeholder="Search by Product Code" value={search.code} onChange={e => setSearch(s => ({ ...s, code: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
        <input placeholder="Search by Name" value={search.name} onChange={e => setSearch(s => ({ ...s, name: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
        <input placeholder="Search by Generic Name" value={search.generic} onChange={e => setSearch(s => ({ ...s, generic: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
      </div>

      {/* Product List with Pagination */}
      <div style={{ marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th>Image</th>
              <th>Product Name</th>
              <th>Generic Name</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Stock</th>
              <th>Sell Price</th>
              <th>Expiry Date</th>
              <th>Product Code</th>
              <th>Barcode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id}>
                <td><img src={p.image || logo} alt="Product" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /></td>
                <td>{p.name}</td>
                <td>{p.generic}</td>
                <td>{p.category}</td>
                <td>{p.supplier}</td>
                <td>{p.stock}</td>
                <td>{p.price}</td>
                <td>{p.expire}</td>
                <td>{p.code}</td>
                <td>{p.barcode}</td>
                <td>
                  <button style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
                  <button style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span>Page {page} of {totalPages || 1}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;