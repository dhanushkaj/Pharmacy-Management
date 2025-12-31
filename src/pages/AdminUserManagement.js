import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const AdminUserManagement = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ username: '', email: '', address: '', phone: '', roles: [] });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api('/api/admin/users', { method: 'GET', token });
      setUsers(data);
    } catch (e) { /* ignore */ }
  };
  const fetchRoles = async () => {
    try {
      const data = await api('/api/admin/roles', { method: 'GET', token });
      setRoles(data);
    } catch (e) { /* ignore */ }
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };
  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role] }));
  };

  const handleCreate = async () => {
    setLoading(true); setError(''); setSuccess(''); setGeneratedPassword('');
    try {
      const result = await api('/api/admin/users', { method: 'POST', body: form, token });
      setSuccess('User created!');
      setGeneratedPassword(result && result.password ? result.password : '');
      setForm({ username: '', email: '', address: '', phone: '', roles: [] });
      fetchUsers();
    } catch (e) {
      setError(e.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 8 }}>
      <h2>Admin User Management</h2>
      <div style={{ marginBottom: 32, borderBottom: '1px solid #ccc', paddingBottom: 24 }}>
        <h3>Create New User</h3>
        <input placeholder="Username" value={form.username} onChange={e => handleChange('username', e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
        <input placeholder="Email" value={form.email} onChange={e => handleChange('email', e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
        <input placeholder="Address" value={form.address} onChange={e => handleChange('address', e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
        <input placeholder="Phone" value={form.phone} onChange={e => handleChange('phone', e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
        <div style={{ marginBottom: 8 }}>
          <label>Roles:</label><br />
          <select multiple value={form.roles} onChange={e => {
            const selected = Array.from(e.target.selectedOptions, o => o.value);
            setForm(f => ({ ...f, roles: selected }));
          }} style={{ width: '100%', padding: 8, minHeight: 40 }}>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <button onClick={handleCreate} disabled={loading} style={{ padding: '10px 32px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
          {loading ? 'Creating...' : 'Create User'}
        </button>
        {success && <div style={{ color: 'green', marginTop: 16 }}>{success}</div>}
        {generatedPassword && (
          <div style={{ color: '#1976d2', marginTop: 8, background: '#e3f2fd', padding: 8, borderRadius: 4 }}>
            <strong>Temporary Password:</strong> <span style={{ fontFamily: 'monospace' }}>{generatedPassword}</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#555' }}>(copy and share with the user)</span>
          </div>
        )}
        {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      </div>
      <h3>Existing Users</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Username</th><th>Email</th><th>Address</th><th>Phone</th><th>Roles</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.address}</td>
              <td>{u.phone}</td>
              <td>{(u.roles || []).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUserManagement;
