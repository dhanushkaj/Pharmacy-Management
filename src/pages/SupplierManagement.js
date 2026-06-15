import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const SupplierManagement = () => {
  const { token } = useContext(AuthContext);

  const [list, setList] = useState([]);
  const [form, setForm] = useState({ supplierId: null, name: '', contact: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/suppliers', { token });
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // on mount

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => setForm({ supplierId: null, name: '', contact: '', email: '', address: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Supplier name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        address: form.address.trim()
      };

      const isEdit = !!form.supplierId;
      const method = isEdit ? 'PUT' : 'POST';
      const path = isEdit ? `/api/suppliers/${form.supplierId}` : '/api/suppliers';

      await api(path, { method, body: payload, token });
      await load();
      reset();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (s) => setForm({
    supplierId: s.supplierId,
    name: s.name || '',
    contact: s.contact || '',
    email: s.email || '',
    address: s.address || ''
  });

  const onDelete = async (id) => {
    if (!window.confirm(`Delete supplier #${id}?`)) return;
    setError('');
    try {
      await api(`/api/suppliers/${id}`, { method: 'DELETE', token });
      // Optimistic update
      setList(prev => prev.filter(s => s.supplierId !== id));
      if (form.supplierId === id) reset();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Supplier Management</h2>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Supplier Name</label>
          <input name="name" value={form.name} onChange={onChange} placeholder="Enter supplier name" style={{ padding: 8 }} disabled={saving} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Contact</label>
          <input name="contact" value={form.contact} onChange={onChange} placeholder="Enter contact number" style={{ padding: 8 }} disabled={saving} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} placeholder="Enter email" style={{ padding: 8 }} disabled={saving} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 320 }}>
          <label>Address</label>
          <input name="address" value={form.address} onChange={onChange} placeholder="Enter address" style={{ padding: 8 }} disabled={saving} />
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
          <button type="submit" disabled={saving}
            style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#000', border: '1px solid #0c0', borderRadius: 4 }}>
            {form.supplierId ? (saving ? 'Updating…' : 'Update Supplier') : (saving ? 'Adding…' : 'Add Supplier')}
          </button>
          {form.supplierId && (
            <button type="button" onClick={reset} disabled={saving}
              style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#eee', border: '1px solid #ccc', borderRadius: 4 }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {loading && <div>Loading…</div>}

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
          {(!loading && list.length === 0) && (
            <tr>
              <td colSpan={6} style={{ padding: 10, border: '1px solid #ccc', textAlign: 'center' }}>
                No suppliers yet
              </td>
            </tr>
          )}
          {list.map(s => (
            <tr key={s.supplierId}>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{s.supplierId}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{s.name}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{s.contact || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{s.email || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{s.address || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>
                <button onClick={() => onEdit(s)} style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
                <button onClick={() => onDelete(s.supplierId)} style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Optional bottom action mirrors the top submit */}
      <button onClick={(e) => { e.preventDefault(); const f = document.querySelector('form'); if (f) f.requestSubmit(); }}
        disabled={saving}
        style={{ marginTop: 20, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#000', border: '1px solid #0c0', borderRadius: 4 }}>
        {form.supplierId ? 'Update Supplier' : 'Add Supplier'}
      </button>
    </div>
  );
};

export default SupplierManagement;
