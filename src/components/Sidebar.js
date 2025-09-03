import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';
import { AuthContext } from './AuthContext';

const Sidebar = () => {
  const { role } = useContext(AuthContext);
  const [reportsOpen, setReportsOpen] = useState(false);
  return (
    <aside className="sidebar" style={{
      width: 220,
      background: '#263238',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 24
    }}>
      <img src={logo} alt="Logo" style={{ width: 80, marginBottom: 30 }} />
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><NavLink to="/" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Home</NavLink></li>
          <li><NavLink to="/categories" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Categories</NavLink></li>
          <li><NavLink to="/suppliers" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Suppliers</NavLink></li>
          <li><NavLink to="/products" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Products</NavLink></li>
          <li><NavLink to="/purchase-order" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Purchase Order</NavLink></li>
          {role === 'admin' && <li><NavLink to="/grn" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Approve GRN</NavLink></li>}
          <li><NavLink to="/billing" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Billing</NavLink></li>
          <li><NavLink to="/customers" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Customers</NavLink></li>
          <li><NavLink to="/bin" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Product Bin</NavLink></li>
          {(role === 'admin' || role === 'manager') && (
            <li>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px 0' }} onClick={() => setReportsOpen(o => !o)}>
                <span style={{ flex: 1 }}>
                  <NavLink to="/reports" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none' })}>Reports & Alerts</NavLink>
                </span>
                <span style={{ marginLeft: 8, fontSize: 14 }}>{reportsOpen ? '▼' : '▶'}</span>
              </div>
              {reportsOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: 16, marginTop: 4 }}>
                  <li><NavLink to="/reports/billing" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Billing Report</NavLink></li>
                  <li><NavLink to="/reports/alert" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Alert Report</NavLink></li>
                  <li><NavLink to="/reports/sales" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Sales Report</NavLink></li>
                </ul>
              )}
            </li>
          )}
          <li><NavLink to="/settings" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Settings & Security</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;