import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show message if redirected due to inactivity
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'inactivity') {
      setInfoMessage('You were logged out due to inactivity. Please login again.');
    }
  }, [searchParams]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',  // IMPORTANT: Accept cookies from server
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      // Parse roles as array if needed
      let roles = data.roles;
      if (typeof roles === 'string') {
        try { roles = JSON.parse(roles); } catch { roles = [roles]; }
      }
      // Note: Token is now in HTTP-only cookie, not returned in response
      login(roles, data.username);
      navigate('/');
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, background: '#f5f5f5', borderRadius: 8 }}>
      <h2>Login</h2>
      {infoMessage && (
        <div style={{ 
          background: '#fff3e0', 
          border: '1px solid #ff9800', 
          padding: 12, 
          borderRadius: 4, 
          marginBottom: 16,
          color: '#e65100'
        }}>
          ⏰ {infoMessage}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <button type="submit" style={{ background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', fontSize: 16 }}>Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Login;
