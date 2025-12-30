import React, { useContext, useState } from 'react';
import useAlertSummary from './useAlertSummary';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';
import { AuthContext } from './AuthContext';

const Sidebar = () => {
  const { roles, hasRole } = useContext(AuthContext);
  const fallbackRole = localStorage.getItem('role');
  const hasAdmin = hasRole('admin') || fallbackRole === 'admin';
  const hasManager = hasRole('manager') || fallbackRole === 'manager';
  const showReports = hasAdmin || hasManager;
  const [reportsOpen, setReportsOpen] = useState(false);
  console.log('User roles:', roles);
  const { totalActive, criticalCount } = useAlertSummary();
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
          {hasAdmin && <li><NavLink to="/grn" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Approve GRN</NavLink></li>} 
          <li><NavLink to="/inventory-returns" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Inventory Returns</NavLink></li>
          <li><NavLink to="/billing" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Billing</NavLink></li>
          <li><NavLink to="/customers" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Customers</NavLink></li>
          <li><NavLink to="/bin" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Product Bin</NavLink></li>
          {showReports && (
            <li>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px 0' }} onClick={() => setReportsOpen(o => !o)}>
                <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <NavLink to="/reports" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none' })}>Reports & Alerts</NavLink>
                  {(totalActive > 0) && (
                    <span style={{
                      background: criticalCount > 0 ? '#d32f2f' : '#ffb300',
                      color: '#fff',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 'bold',
                      marginLeft: 8,
                      padding: '2px 8px',
                      minWidth: 24,
                      textAlign: 'center',
                      display: 'inline-block',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                    }} title={criticalCount > 0 ? `${criticalCount} critical alerts` : `${totalActive} active alerts`}>
                      {criticalCount > 0 ? `! ${criticalCount}` : totalActive}
                    </span>
                  )}
                </span>
                <span style={{ marginLeft: 8, fontSize: 14 }}>{reportsOpen ? '▼' : '▶'}</span>
              </div>
              {reportsOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: 16, marginTop: 4 }}>
                  <li><NavLink to="/billing-history" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Billing Report</NavLink></li>
                  <li><NavLink to="/reports/inventory" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Inventory Report</NavLink></li>
                  <li><NavLink to="/reports/alerts" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Alert Report</NavLink></li>
                  <li><NavLink to="/reports/sales" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Sales Report</NavLink></li>
                  {hasAdmin && <li><NavLink to="/reports/alert-config" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Alert Config</NavLink></li>}
                  {hasAdmin && <li><NavLink to="/audit-trail" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '8px 0' })}>Audit Trail</NavLink></li>}
                </ul>
              )}
            </li>
          )}
          <li><NavLink to="/store-settings" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>🏪 Store Settings</NavLink></li>
          <li><NavLink to="/settings" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '12px 0' })}>Settings & Security</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;