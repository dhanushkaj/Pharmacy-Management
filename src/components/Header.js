import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <header style={{
      background: '#1976d2',
      color: '#fff',
      padding: '18px 32px',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      letterSpacing: '1px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span>Pharmacy Management System</span>
      <nav>
        {!user && <Link to="/login" style={{ color: '#fff', marginRight: 24, textDecoration: 'none', fontSize: '1rem' }}>Login</Link>}
        {user && <button onClick={handleLogout} style={{ color: '#1976d2', background: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', fontSize: '1rem' }}>Logout</button>}
      </nav>
    </header>
  );
};

export default Header;