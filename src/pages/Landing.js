import React from 'react';
import { Link } from 'react-router-dom';

const links = [
  {
    to: '/categories',
    label: 'Categories',
    color: '#388e3c', // dark green
    icon: 'category' // Suggest: FaBoxes or category SVG
  },
  {
    to: '/suppliers',
    label: 'Suppliers',
    color: '#66bb6a', // light green
    icon: 'local_shipping' // Suggest: FaUserMd or truck SVG
  },
  {
    to: '/products',
    label: 'Products',
    color: '#1976d2', // dark blue
    icon: 'medication' // Suggest: FaPills or medication SVG
  },
  {
    to: '/billing',
    label: 'Billing',
    color: '#0288d1', // light blue
    icon: 'receipt_long' // Suggest: FaFileInvoiceDollar or receipt SVG
  },
  {
    to: '/customers',
    label: 'Customers',
    color: '#c62828', // red
    icon: 'group' // Suggest: FaUsers or group SVG
  },
  {
    to: '/reports',
    label: 'Reports',
    color: '#8e24aa', // purple
    icon: 'bar_chart' // Suggest: FaChartBar or chart SVG
  },
  {
    to: '/bin',
    label: 'Product Bin',
    color: '#455a64', // dark gray
    icon: 'delete' // Suggest: FaTrashAlt or delete SVG
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
              boxShadow: '0 2px 12px #0002'
            }}>
              {/* Remove the icon text placeholder below */}
              {/* <span style={{ color: '#fff', fontSize: 38, fontWeight: 600 }}>
                {link.icon}
              </span> */}
            </div>
            <span style={{ fontSize: 18, fontWeight: 500 }}>{link.label}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default Landing;
