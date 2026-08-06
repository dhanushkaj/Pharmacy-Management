import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const UserProfile = () => {
  const { username, token } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', address: '', phone: '', password: '', confirmPassword: '' });
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    fetchSessionCode();
  }, []);

  const fetchSessionCode = async () => {
    try {
      const data = await api('/api/users/me/session-code', { method: 'GET', token });
      setSessionCode(data.sessionCode || '');
    } catch (e) {
      console.error('Failed to fetch session code:', e);
    }
  };

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

  const handleRegenerateCode = async () => {
    setError(''); setSuccess('');
    if (!window.confirm('Are you sure you want to generate a new session code? Your old code will no longer work.')) {
      return;
    }
    
    setLoading(true);
    try {
      const data = await api('/api/users/me/regenerate-session-code', { method: 'POST', token });
      setSessionCode(data.sessionCode);
      setSuccess('New session code generated successfully!');
      setCodeCopied(false);
    } catch (e) {
      setError(e.message || 'Failed to regenerate session code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 8 }}>
      <h2>My Profile</h2>
      <div><strong>Username:</strong> {username}</div>
      
      {/* Session Code Section */}
      <div style={{ marginTop: 24, padding: 16, background: '#e3f2fd', borderRadius: 8, border: '1px solid #90caf9' }}>
        <h3 style={{ marginTop: 0, color: '#1565c0' }}>🔐 Session Code</h3>
        <p style={{ color: '#666', marginBottom: 12 }}>
          Use this code to quickly switch to your account from another user's session. Share it securely with managers who need to access your account temporarily.
        </p>
        
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Your Current Code:</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1,
              padding: 10,
              background: '#fff',
              border: '2px solid #1976d2',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 18,
              fontWeight: 'bold',
              color: '#1976d2',
              textAlign: 'center',
              letterSpacing: '2px'
            }}>
              {sessionCode || 'Loading...'}
            </div>
            <button
              onClick={handleCopyCode}
              disabled={!sessionCode || loading}
              title="Copy code to clipboard"
              style={{
                padding: '10px 16px',
                background: codeCopied ? '#4caf50' : '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: sessionCode && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'background-color 0.3s'
              }}
            >
              {codeCopied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={handleRegenerateCode}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#ff9800',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}
        >
          {loading ? 'Generating...' : '🔄 Generate New Code'}
        </button>
      </div>

      <div style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 24 }}>
        <h3>Profile Information</h3>
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
      </div>

      {success && <div style={{ color: 'green', marginTop: 16, padding: 12, background: '#e8f5e9', borderRadius: 4 }}>✓ {success}</div>}
      {error && <div style={{ color: 'red', marginTop: 16, padding: 12, background: '#ffebee', borderRadius: 4 }}>⚠ {error}</div>}
    </div>
  );
};

export default UserProfile;
