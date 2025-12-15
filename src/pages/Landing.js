import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBoxes, 
  FaTruck, 
  FaPills, 
  FaShoppingCart, 
  FaClipboardList, 
  FaFileInvoiceDollar, 
  FaHistory, 
  FaUsers, 
  FaTrashAlt, 
  FaChartBar, 
  FaListAlt, 
  FaUndo, 
  FaCog 
} from 'react-icons/fa';

const links = [
  {
    to: '/categories',
    label: 'Categories',
    color: '#388e3c',
    icon: <FaBoxes size={40} />
  },
  {
    to: '/suppliers',
    label: 'Suppliers',
    color: '#66bb6a',
    icon: <FaTruck size={40} />
  },
  {
    to: '/products',
    label: 'Products',
    color: '#1976d2',
    icon: <FaPills size={40} />
  },
  {
    to: '/purchase-order',
    label: 'Purchase Order',
    color: '#1565c0',
    icon: <FaShoppingCart size={40} />
  },
  {
    to: '/grn',
    label: 'GRN',
    color: '#2e7d32',
    icon: <FaClipboardList size={40} />
  },
  {
    to: '/billing',
    label: 'Billing',
    color: '#0288d1',
    icon: <FaFileInvoiceDollar size={40} />
  },
  {
    to: '/billing-history',
    label: 'Billing History',
    color: '#0277bd',
    icon: <FaHistory size={40} />
  },
  {
    to: '/customers',
    label: 'Customers',
    color: '#c62828',
    icon: <FaUsers size={40} />
  },
  {
    to: '/bin',
    label: 'Product Bin',
    color: '#455a64',
    icon: <FaTrashAlt size={40} />
  },
  {
    to: '/reports',
    label: 'Reports',
    color: '#8e24aa',
    icon: <FaChartBar size={40} />
  },
  {
    to: '/audit-trail',
    label: 'Audit Trail',
    color: '#5e35b1',
    icon: <FaListAlt size={40} />
  },
  {
    to: '/inventory-returns',
    label: 'Returns',
    color: '#d32f2f',
    icon: <FaUndo size={40} />
  },
  {
    to: '/settings',
    label: 'Settings',
    color: '#616161',
    icon: <FaCog size={40} />
  },
];

const Landing = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 48, width: '80%', maxWidth: 900, justifyItems: 'center' }}>
      {links.map(link => (
        <Link key={link.to} to={link.to} style={{ textDecoration: 'none', color: '#333' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: link.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 2px 12px #0002',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {link.icon}
              </span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 500 }}>{link.label}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default Landing;
