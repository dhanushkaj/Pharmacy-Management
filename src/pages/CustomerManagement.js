// src/pages/CustomerManagement.js
import React, { useContext, useEffect, useState } from 'react';
import { api } from '../utill/api';
import { AuthContext } from '../components/AuthContext';

const emptyForm = { customerId: null, title: '', name: '', phone: '', email: '', address: '', discountPercentage: '0', birthday: '' };

const CustomerManagement = () => {
  const { isAuthenticated } = useContext(AuthContext);

  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;


  // ---- helpers --------------------------------------------------------------
  const tryParseError = (txt, fallback) => {
    try {
      const j = JSON.parse(txt);
      return j?.message || j?.error || fallback || 'Request failed';
    } catch {
      return txt || fallback || 'Request failed';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const reset = () => setForm(emptyForm);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/customers');
      // Handle paginated response (data.content) or direct array
      setList(Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- CRUD -----------------------------------------------------------------
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title?.trim() || null,
        name: form.name.trim(),
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
        discountPercentage: parseFloat(form.discountPercentage) || 0,
        birthday: form.birthday || null,
      };

      const isUpdate = !!form.customerId;
      const url = isUpdate
        ? `/api/customers/${form.customerId}`
        : `/api/customers`;
      const method = isUpdate ? 'PUT' : 'POST';

      await api(url, {
        method,
        body: payload,
      });

      await loadCustomers();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (c) => {
    setForm({
      customerId: c.customerId,
      title: c.title || '',
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      discountPercentage: c.discountPercentage || '0',
      birthday: c.birthday || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id) => {
    if (!window.confirm(`Delete customer #${id}?`)) return;
    setError('');
    try {
      await api(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      // server returns "Customer Deleted {id}"
      await loadCustomers();
      if (form.customerId === id) reset();
      alert(`Customer #${id} deleted successfully`);
    } catch (e) {
      setError(e.message);
    }
  };

  const filtered = list.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Customer Management</h2>

      {/* Form */}
      <form
        onSubmit={onSubmit}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 24,
          background: '#f5f5f5',
          padding: 20,
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 150 }}>
          <label>Title</label>
          <select
            name="title"
            value={form.title}
            onChange={handleChange}
            style={{ padding: 8 }}
          >
            <option value="">Select...</option>
            <option value="Mr.">Mr.</option>
            <option value="Mrs.">Mrs.</option>
            <option value="Ms.">Ms.</option>
            <option value="Dr.">Dr.</option>
            <option value="Prof.">Prof.</option>
            <option value="Rev.">Rev.</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 200 }}>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter customer name"
            required
            style={{ padding: 8 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            style={{ padding: 8 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
            style={{ padding: 8 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 320, flex: 1 }}>
          <label>Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter address"
            style={{ padding: 8 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Birthday</label>
          <input
            type="date"
            name="birthday"
            value={form.birthday}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 150 }}>
          <label>Discount %</label>
          <input
            type="number"
            name="discountPercentage"
            value={form.discountPercentage}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            max="100"
            step="0.01"
            style={{ padding: 8 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 24,
              padding: '7px 18px',
              fontSize: 15,
              background: '#43ea7a',
              color: '#000',
              border: '1px solid #0c0',
              borderRadius: 4,
            }}
          >
            {form.customerId ? (saving ? 'Updating…' : 'Update Customer') : (saving ? 'Adding…' : 'Add Customer')}
          </button>
          {form.customerId && (
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              style={{ marginTop: 24, padding: '7px 18px', background: '#eee', border: '1px solid #ccc', borderRadius: 4 }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Errors / Loading */}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {loading && <div>Loading…</div>}

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <input
          placeholder="Search name / phone / email / address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, minWidth: 260 }}
        />
        <div style={{ fontSize: 14, color: '#666' }}>
          Showing {currentCustomers.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filtered.length)} of {filtered.length} customers
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa', marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>ID</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Title</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Name</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Phone</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Email</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Address</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Birthday</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Discount %</th>
            <th style={{ padding: 10, border: '1px solid #ccc' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentCustomers.map((c) => (
            <tr key={c.customerId}>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.customerId}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.title || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.name}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.phone || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.email || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.address || '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.birthday ? c.birthday : '-'}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{c.discountPercentage || 0}%</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>
                <button
                  onClick={() => onEdit(c)}
                  style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(c.customerId)}
                  style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {currentCustomers.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 12, textAlign: 'center' }}>
                {filtered.length === 0 ? 'No customers' : 'No data on this page'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{ padding: '8px 12px', background: currentPage === 1 ? '#ddd' : '#1976d2', color: currentPage === 1 ? '#999' : '#fff', border: 'none', borderRadius: 4, cursor: currentPage === 1 ? 'default' : 'pointer' }}
          >
            ← Previous
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '6px 10px',
                  background: page === currentPage ? '#1976d2' : '#f0f0f0',
                  color: page === currentPage ? '#fff' : '#333',
                  border: page === currentPage ? '1px solid #1976d2' : '1px solid #ccc',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{ padding: '8px 12px', background: currentPage === totalPages ? '#ddd' : '#1976d2', color: currentPage === totalPages ? '#999' : '#fff', border: 'none', borderRadius: 4, cursor: currentPage === totalPages ? 'default' : 'pointer' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
