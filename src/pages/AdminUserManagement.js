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
  const [expandedUserCode, setExpandedUserCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

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

  const handleRegenerateUserCode = async (userId, username) => {
    if (!window.confirm(`Regenerate session code for ${username}? Their old code will no longer work.`)) {
      return;
    }

    setLoading(true);
    try {
      await api(`/api/admin/users/${userId}/regenerate-session-code`, { method: 'POST', token });
      setSuccess(`Session code regenerated for ${username}!`);
      fetchUsers();
    } catch (e) {
      setError(e.message || 'Failed to regenerate session code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 8 }}>
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
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Username</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Email</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Address</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Phone</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Roles</th>
            <th style={{ textAlign: 'center', padding: 8, borderBottom: '1px solid #ddd' }}>Session Code</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.userId} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{u.username}</td>
              <td style={{ padding: 8 }}>{u.email}</td>
              <td style={{ padding: 8 }}>{u.address}</td>
              <td style={{ padding: 8 }}>{u.phone}</td>
              <td style={{ padding: 8 }}>{(u.roles || []).join(', ')}</td>
              <td style={{ padding: 8, textAlign: 'center' }}>
                <button
                  onClick={() => setExpandedUserCode(expandedUserCode === u.userId ? null : u.userId)}
                  style={{
                    padding: '6px 12px',
                    background: expandedUserCode === u.userId ? '#1976d2' : '#e0e0e0',
                    color: expandedUserCode === u.userId ? '#fff' : '#333',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {expandedUserCode === u.userId ? '▼' : '▶'} {u.sessionCode ? '🔐' : '⚠'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Expanded Code View */}
      {expandedUserCode && (
        <div style={{ marginTop: 16, padding: 16, background: '#e3f2fd', borderRadius: 4 }}>
          {users.find(u => u.userId === expandedUserCode) && (
            <>
              <h4 style={{ marginTop: 0 }}>
                Session Code for: {users.find(u => u.userId === expandedUserCode)?.username}
              </h4>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  flex: 1,
                  padding: 12,
                  background: '#fff',
                  border: '2px solid #1976d2',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#1976d2',
                  textAlign: 'center'
                }}>
                  {users.find(u => u.userId === expandedUserCode)?.sessionCode || 'No code'}
                </div>
                {users.find(u => u.userId === expandedUserCode)?.sessionCode && (
                  <button
                    onClick={() => handleCopyCode(users.find(u => u.userId === expandedUserCode)?.sessionCode)}
                    style={{
                      padding: '8px 12px',
                      background: copiedCode === users.find(u => u.userId === expandedUserCode)?.sessionCode ? '#4caf50' : '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    {copiedCode === users.find(u => u.userId === expandedUserCode)?.sessionCode ? '✓ Copied' : '📋 Copy'}
                  </button>
                )}
              </div>
              <button
                onClick={() => handleRegenerateUserCode(expandedUserCode, users.find(u => u.userId === expandedUserCode)?.username)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#ff9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              >
                {loading ? 'Regenerating...' : '🔄 Regenerate Code'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
