import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FaCog,
  FaExclamationTriangle
} from 'react-icons/fa';
import { AuthContext } from '../components/AuthContext';
import { getAlertSummary } from '../utill/alertApi';

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

const Landing = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [alertSummary, setAlertSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAlertSummary();
    }
  }, [token]);

  const fetchAlertSummary = async () => {
    try {
      const summary = await getAlertSummary(token);
      setAlertSummary(summary);
    } catch (error) {
      console.error('Failed to fetch alert summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClick = () => {
    navigate('/reports/alerts');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5', padding: '32px' }}>
      {/* Alert Widget */}
      {alertSummary && alertSummary.totalActive > 0 && (
        <div style={{
          maxWidth: 900,
          margin: '0 auto 32px',
          width: '80%'
        }}>
          <div
            onClick={handleAlertClick}
            style={{
              background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
              color: '#fff',
              padding: '20px 32px',
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(255, 68, 68, 0.3)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 68, 68, 0.3)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <FaExclamationTriangle size={32} />
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                    {alertSummary.totalActive} Active Alert{alertSummary.totalActive !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>
                    Products requiring attention
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 24 }}>
                {alertSummary.criticalCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{alertSummary.criticalCount}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>CRITICAL</div>
                  </div>
                )}
                {alertSummary.warningCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{alertSummary.warningCount}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>WARNING</div>
                  </div>
                )}
                {alertSummary.infoCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{alertSummary.infoCount}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>INFO</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
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
    </div>
  );
};

export default Landing;
