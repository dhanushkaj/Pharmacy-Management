import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../utill/api';
// If your AuthContext exports a hook, import it. Otherwise fallback to localStorage.
import { useContext } from 'react';
import { AuthContext } from '../components/AuthContext'; // adjust if your file exports useAuth()

const CategoryManagement = () => {
  const authCtx = useContext(AuthContext);
  const token = useMemo(() => {
    // prefer context token; fallback to localStorage "token
    return authCtx?.token || localStorage.getItem('token') || '';
  }, [authCtx]);

  const [list, setList] = useState([]);
  const [form, setForm] = useState({ categoryId: null, name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/categories', { token });
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* load on mount */ }, []); // eslint-disable-line

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => setForm({ categoryId: null, name: '', description: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() };
      if (form.categoryId) {
        await api(`/api/categories/${form.categoryId}`, { method: 'PUT', body: payload, token });
      } else {
        await api('/api/categories', { method: 'POST', body: payload, token });
      }
      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (c) => setForm({ categoryId: c.categoryId, name: c.name, description: c.description || '' });

  const onDelete = async (id) => {
    if (!window.confirm(`Delete category #${id}?`)) return;
    setError('');
    try {
      // Backend returns "Category Deleted <id>" (string)
      await api(`/api/categories/${id}`, { method: 'DELETE', token });
      // Optimistic update:
      setList(prev => prev.filter(x => x.categoryId !== id));
      if (form.categoryId === id) reset();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Category Management</h2>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 24, marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
          <label>Category Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Enter category name"
            style={{ padding: 8 }}
            disabled={saving}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 320 }}>
          <label>Description</label>
          <input
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Enter description"
            style={{ padding: 8 }}
            disabled={saving}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
          <button type="submit" disabled={saving}
            style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#000', border: '1px solid #0c0', borderRadius: 4 }}>
            {form.categoryId ? (saving ? 'Updating…' : 'Update Category') : (saving ? 'Adding…' : 'Add Category')}
          </button>
          {form.categoryId && (
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
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Category Name</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Description</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(!loading && list.length === 0) && (
            <tr><td colSpan={4} style={{ padding: 10, border: '1px solid #ccc', textAlign: 'center' }}>No categories yet</td></tr>
          )}
          {list.map(c => (
            <tr key={c.categoryId}>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.categoryId}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.name}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.description || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>
                <button onClick={() => onEdit(c)}
                  style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>
                  Edit
                </button>
                <button onClick={() => onDelete(c.categoryId)}
                  style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryManagement;
