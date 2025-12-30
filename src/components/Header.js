import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { AuthContext } from './AuthContext';
import { getAlertSummary } from '../utill/alertApi';

const Header = () => {
  const { username, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAlertSummary();
      // Refresh every 5 minutes
      const interval = setInterval(fetchAlertSummary, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchAlertSummary = async () => {
    try {
      const summary = await getAlertSummary(token);
      setAlertCount(summary.totalActive || 0);
      setCriticalCount(summary.criticalCount || 0);
    } catch (error) {
      console.error('Failed to fetch alert summary:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAlertClick = () => {
    navigate('/reports/alerts');
    setShowAlertDropdown(false);
  };

  return (
    <header style={{
      position: 'relative',
      background: 'linear-gradient(90deg, #183153 0%, #1976d2 30%, #64b5f6 100%)',
      color: '#fff',
      padding: '18px 32px 18px 0',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      letterSpacing: '1px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 70,
      borderLeft: 'none',
      boxShadow: '0 2px 8px 0 rgba(25,118,210,0.10)',
    }}>
      {/* Curved SVG transition at top-left */}
      <span style={{ letterSpacing: '2px', textShadow: '0 2px 8px #1565c0', marginLeft: 32 }}>Pharmacy Management System</span>
      <nav>
        {!token && <Link to="/login" style={{ color: '#fff', marginRight: 24, textDecoration: 'none', fontSize: '1rem' }}>Login</Link>}
        {token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Alert Bell Icon */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleAlertClick}>
              <FaBell size={24} style={{ color: criticalCount > 0 ? '#ff4444' : '#fff' }} />
              {alertCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#ff4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  border: '2px solid #1976d2'
                }}>
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </div>
            
            {username && <span style={{ color: '#fff', fontSize: '0.9rem' }}>Welcome, {username}</span>}
            <button onClick={handleLogout} style={{ color: '#1976d2', background: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Logout</button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;