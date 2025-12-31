import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const UserProfile = () => {
  const { username, token } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', address: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Optionally fetch current user info if needed
  }, []);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    setError(''); setSuccess('');
    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api('/api/users/me', { method: 'PUT', body: form, token });
      setSuccess('Profile updated successfully!');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch (e) {
      if (e.status === 403) {
        setError('You are not authorized to update your profile (403 Forbidden).');
      } else {
        setError(e.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 8 }}>
      <h2>My Profile</h2>
      <div><strong>Username:</strong> {username}</div>
      <div style={{ marginTop: 16 }}>
        <label>Email</label><br />
        <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Address</label><br />
        <input type="text" value={form.address} onChange={e => handleChange('address', e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Phone</label><br />
        <input type="text" value={form.phone} onChange={e => handleChange('phone', e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <label>New Password</label><br />
        <input type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Confirm Password</label><br />
        <input type="password" value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <button onClick={handleSave} disabled={loading} style={{ marginTop: 24, padding: '10px 32px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
      {success && <div style={{ color: 'green', marginTop: 16 }}>{success}</div>}
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
};

export default UserProfile;
