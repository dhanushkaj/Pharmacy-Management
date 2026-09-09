import React, { useContext, useState } from 'react';
import useAlertSummary from './useAlertSummary';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';
import { AuthContext } from './AuthContext';

const Sidebar = () => {
  const { roles, hasRole } = useContext(AuthContext);
  const fallbackRole = localStorage.getItem('role');
  const hasAdmin = hasRole('admin') || fallbackRole?.toLowerCase() === 'admin';
  // Admin can see everything, so treat admin as also having manager role
  const hasManager = hasAdmin || hasRole('manager') || fallbackRole?.toLowerCase() === 'manager';
  const showReports = hasAdmin || hasManager;
  const [reportsOpen, setReportsOpen] = useState(false);
  const [inventoryCountOpen, setInventoryCountOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  console.log('User roles:', roles, 'Fallback role:', fallbackRole, 'hasAdmin:', hasAdmin, 'hasManager:', hasManager);
  const { totalActive, criticalCount } = useAlertSummary();
  return (
    <aside className="sidebar" style={{
      width: 180,
      minWidth: 180,
      maxWidth: 180,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #183153 0%, #1b5e20 100%)', // dark blue to dark green
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      boxShadow: '2px 0 8px rgba(24,49,83,0.08)',
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <div style={{
        width: 70,
        height: 70,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 40%, #e8f5e9 0%, #388e3c 60%, #b71c1c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
        border: '3px solid #fff',
        flexShrink: 0
      }}>
        <img src={logo} alt="Logo" style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', objectFit: 'contain', boxShadow: '0 0 0 2px #b2dfdb' }} />
      </div>
      <nav style={{ width: '100%', padding: '0 8px', boxSizing: 'border-box' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', minHeight: '65vh' }}>
                    {/* ...existing menu items... */}
          <li><NavLink to="/" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Home</NavLink></li>
          <li><NavLink to="/categories" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Categories</NavLink></li>
          <li><NavLink to="/suppliers" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Suppliers</NavLink></li>
          <li><NavLink to="/products" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Products</NavLink></li>
          <li><NavLink to="/purchase-order" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Purchase Order</NavLink></li>
          {hasAdmin && <li><NavLink to="/grn" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Approve GRN</NavLink></li>}
          <li><NavLink to="/supplier-payment" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>💳 Supplier Payment</NavLink></li>
          <li><NavLink to="/inventory-returns" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Inventory Returns</NavLink></li>
          
          {/* Inventory Count Management Group */}
          <li>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 0' }} onClick={() => setInventoryCountOpen(o => !o)}>
              <span style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '14px', color: '#fff' }}>
                📦 Count Management
              </span>
              <span style={{ marginLeft: 4, fontSize: 12, color: '#fff' }}>{inventoryCountOpen ? '▼' : '▶'}</span>
            </div>
            {inventoryCountOpen && (
              <ul style={{ listStyle: 'none', paddingLeft: 12, marginTop: 2 }}>
                <li><NavLink to="/inventory-count" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>📦 Physical Count</NavLink></li>
                {hasManager && <li><NavLink to="/inventory-count-approval" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>✅ Approval</NavLink></li>}
                {hasManager && <li><NavLink to="/inventory-count-history" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>📊 All Counts Report</NavLink></li>}
              </ul>
            )}
          </li>
          
          <li><NavLink to="/billing" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Billing</NavLink></li>
          
          {/* Customers Management Group */}
          <li>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 0' }} onClick={() => setCustomersOpen(o => !o)}>
              <span style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '14px', color: '#fff' }}>
                👥 Customers
              </span>
              <span style={{ marginLeft: 4, fontSize: 12, color: '#fff' }}>{customersOpen ? '▼' : '▶'}</span>
            </div>
            {customersOpen && (
              <ul style={{ listStyle: 'none', paddingLeft: 12, marginTop: 2 }}>
                <li><NavLink to="/customers" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>👥 Customer Management</NavLink></li>
                {showReports && <li><NavLink to="/customer-spectrum" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>📊 Customer Spectrum</NavLink></li>}
              </ul>
            )}
          </li>
          
          <li><NavLink to="/sales-targets" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>🎯 Sales Targets</NavLink></li>
          <li><NavLink to="/bin" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>Product Bin</NavLink></li>
          {showReports && (
            <li>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 0' }} onClick={() => setReportsOpen(o => !o)}>
                <span style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <NavLink to="/reports" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', fontSize: '14px' })}>Reports & Alerts</NavLink>
                  {(totalActive > 0) && (
                    <span style={{
                      background: criticalCount > 0 ? '#d32f2f' : '#ffb300',
                      color: '#fff',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 'bold',
                      marginLeft: 6,
                      padding: '2px 6px',
                      minWidth: 18,
                      textAlign: 'center',
                      display: 'inline-block',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                    }} title={criticalCount > 0 ? `${criticalCount} critical alerts` : `${totalActive} active alerts`}>
                      {criticalCount > 0 ? `! ${criticalCount}` : totalActive}
                    </span>
                  )}
                </span>
                <span style={{ marginLeft: 4, fontSize: 12 }}>{reportsOpen ? '▼' : '▶'}</span>
              </div>
              {reportsOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: 12, marginTop: 2 }}>
                  <li><NavLink to="/billing-history" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Billing Report</NavLink></li>
                  <li><NavLink to="/reports/day-end" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Day-End Report</NavLink></li>
                  <li><NavLink to="/reports/inventory" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Inventory Report</NavLink></li>
                  <li><NavLink to="/reports/alerts" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Alert Report</NavLink></li>
                  <li><NavLink to="/reports/sales" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Sales Report</NavLink></li>
                  <li><NavLink to="/customer-credit-report" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Credit Report</NavLink></li>
                  {hasAdmin && <li><NavLink to="/reports/alert-config" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Alert Config</NavLink></li>}
                  {hasAdmin && <li><NavLink to="/audit-trail" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '6px 0', fontSize: '13px' })}>Audit Trail</NavLink></li>}
                </ul>
              )}
            </li>
          )}
          {hasAdmin && <li><NavLink to="/ai" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px', fontWeight: isActive ? '600' : '400' })}>🤖 Ask AI</NavLink></li>}
          <li><NavLink to="/store-settings" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>🏪 Store Settings</NavLink></li>
          <div style={{ flex: 1 }} />
          <li><NavLink to="/profile" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>My Profile</NavLink></li>
          {hasAdmin && <li><NavLink to="/admin/users" style={({ isActive }) => ({ color: isActive ? '#90caf9' : '#fff', textDecoration: 'none', display: 'block', padding: '10px 0', fontSize: '14px' })}>User Management</NavLink></li>}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;