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
import { api } from '../utill/api';

// Links kept for reference but hidden
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

// Simple Bar Chart Component
const ProgressBar = ({ label, value, max, color, showPercentage = true }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOverTarget = value > max && max > 0;
  
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 'bold' }}>
          Rs. {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {showPercentage && max > 0 && (
            <span style={{ 
              marginLeft: 8, 
              color: isOverTarget ? '#4caf50' : percentage >= 80 ? '#ff9800' : '#f44336',
              fontSize: 12
            }}>
              ({percentage.toFixed(1)}%)
            </span>
          )}
        </span>
      </div>
      <div style={{ 
        height: 20, 
        background: '#e0e0e0', 
        borderRadius: 10, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ 
          width: `${Math.min(percentage, 100)}%`, 
          height: '100%', 
          background: isOverTarget ? '#4caf50' : color,
          borderRadius: 10,
          transition: 'width 0.5s ease'
        }} />
        {max > 0 && (
          <div style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: percentage > 50 ? '#fff' : '#666',
            fontWeight: 'bold'
          }}>
            Target: Rs. {max.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

const Landing = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [alertSummary, setAlertSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    console.log('Landing component mounted, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping dashboard load');
      setDashboardLoading(false);
      return;
    }
    
    const loadDashboard = async () => {
      console.log('Loading dashboard data...');
      try {
        // Fetch alert summary
        console.log('Fetching alert summary...');
        const summary = await getAlertSummary();
        console.log('Alert summary received:', summary);
        setAlertSummary(summary);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch alert summary:', error);
        setLoading(false);
      }
      
      // Fetch dashboard data using api utility (handles HTTP-only cookie automatically)
      try {
        console.log('Fetching dashboard data...');
        const dashboardResponse = await api('/api/sales-targets/dashboard');
        console.log('Dashboard response:', JSON.stringify(dashboardResponse, null, 2));
        
        if (dashboardResponse) {
          setDashboardData(dashboardResponse);
          console.log('Dashboard data set successfully');
        } else {
          console.warn('No valid dashboard response');
          setDashboardData(null);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setDashboardData(null);
      } finally {
        setDashboardLoading(false);
      }
    };
    
    loadDashboard();
  }, [isAuthenticated]);

  const handleAlertClick = () => {
    navigate('/reports/alerts');
  };

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5', padding: '20px', boxSizing: 'border-box' }}>
      {/* Alert Widget */}
      {alertSummary && alertSummary.totalActive > 0 && (
        <div style={{
          maxWidth: 900,
          margin: '0 auto 24px',
          width: '100%'
        }}>
          <div
            onClick={handleAlertClick}
            style={{
              background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
              color: '#fff',
              padding: '16px 24px',
              borderRadius: 10,
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaExclamationTriangle size={28} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 2 }}>
                    {alertSummary.totalActive} Active Alert{alertSummary.totalActive !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Products requiring attention
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16 }}>
                {alertSummary.criticalCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 'bold' }}>{alertSummary.criticalCount}</div>
                    <div style={{ fontSize: 10, opacity: 0.9 }}>CRITICAL</div>
                  </div>
                )}
                {alertSummary.warningCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 'bold' }}>{alertSummary.warningCount}</div>
                    <div style={{ fontSize: 10, opacity: 0.9 }}>WARNING</div>
                  </div>
                )}
                {alertSummary.infoCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 'bold' }}>{alertSummary.infoCount}</div>
                    <div style={{ fontSize: 10, opacity: 0.9 }}>INFO</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Target Dashboard */}
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: 24,
          marginBottom: 24
        }}>
          {/* Today's Sales vs Target */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>📊</span>
                Today's Performance
              </h3>
              {dashboardData && (
                <span style={{ fontSize: 12, color: '#666' }}>
                  {new Date(dashboardData.todayDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              )}
            </div>

            {dashboardLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
            ) : dashboardData ? (
              <>
                <ProgressBar
                  label="Today's Sales"
                  value={parseFloat(dashboardData.todaySales) || 0}
                  max={parseFloat(dashboardData.todayTarget) || 0}
                  color="#2196f3"
                />
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  marginTop: 20,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 8
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>TARGET</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1976d2' }}>
                      Rs. {(parseFloat(dashboardData.todayTarget) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>ACTUAL</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4caf50' }}>
                      Rs. {(parseFloat(dashboardData.todaySales) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>PROGRESS</div>
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 'bold', 
                      color: parseFloat(dashboardData.todayProgress) >= 100 ? '#4caf50' : 
                             parseFloat(dashboardData.todayProgress) >= 80 ? '#ff9800' : '#f44336'
                    }}>
                      {(parseFloat(dashboardData.todayProgress) || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                <div>No targets set for today</div>
                <Link to="/sales-targets" style={{ 
                  display: 'inline-block',
                  marginTop: 12,
                  padding: '8px 16px',
                  background: '#1976d2',
                  color: '#fff',
                  borderRadius: 4,
                  textDecoration: 'none',
                  fontSize: 13
                }}>
                  Set Targets
                </Link>
              </div>
            )}
          </div>

          {/* Accumulated Sales vs Target (Month-to-Date) */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>📈</span>
                Month-to-Date
              </h3>
              {dashboardData && (
                <span style={{ fontSize: 12, color: '#666' }}>
                  {monthNames[(dashboardData.currentMonth || 1) - 1]} {dashboardData.currentYear}
                </span>
              )}
            </div>

            {dashboardLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
            ) : dashboardData ? (
              <>
                <ProgressBar
                  label={`Day 1 to Day ${dashboardData.todayDay}`}
                  value={parseFloat(dashboardData.accumulatedSales) || 0}
                  max={parseFloat(dashboardData.accumulatedTarget) || 0}
                  color="#9c27b0"
                />
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  marginTop: 20,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 8
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>TARGET</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#7b1fa2' }}>
                      Rs. {(parseFloat(dashboardData.accumulatedTarget) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>ACTUAL</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4caf50' }}>
                      Rs. {(parseFloat(dashboardData.accumulatedSales) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>PROGRESS</div>
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 'bold', 
                      color: parseFloat(dashboardData.accumulatedProgress) >= 100 ? '#4caf50' : 
                             parseFloat(dashboardData.accumulatedProgress) >= 80 ? '#ff9800' : '#f44336'
                    }}>
                      {(parseFloat(dashboardData.accumulatedProgress) || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ 
                  marginTop: 16, 
                  padding: 12, 
                  borderRadius: 8,
                  textAlign: 'center',
                  background: parseFloat(dashboardData.accumulatedProgress) >= 100 ? '#e8f5e9' : 
                             parseFloat(dashboardData.accumulatedProgress) >= 80 ? '#fff3e0' : '#ffebee',
                  color: parseFloat(dashboardData.accumulatedProgress) >= 100 ? '#2e7d32' : 
                         parseFloat(dashboardData.accumulatedProgress) >= 80 ? '#e65100' : '#c62828'
                }}>
                  <span style={{ fontSize: 18, marginRight: 8 }}>
                    {parseFloat(dashboardData.accumulatedProgress) >= 100 ? '🎉' : 
                     parseFloat(dashboardData.accumulatedProgress) >= 80 ? '💪' : '⚠️'}
                  </span>
                  {parseFloat(dashboardData.accumulatedProgress) >= 100 ? 'On Track! Target Achieved!' : 
                   parseFloat(dashboardData.accumulatedProgress) >= 80 ? 'Almost There! Keep Going!' : 'Behind Target - Push Harder!'}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                <div>No targets set for this month</div>
                <Link to="/sales-targets" style={{ 
                  display: 'inline-block',
                  marginTop: 12,
                  padding: '8px 16px',
                  background: '#7b1fa2',
                  color: '#fff',
                  borderRadius: 4,
                  textDecoration: 'none',
                  fontSize: 13
                }}>
                  Set Targets
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#333' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/billing" style={{ 
              padding: '10px 20px', 
              background: '#1976d2', 
              color: '#fff', 
              borderRadius: 6, 
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              💳 New Billing
            </Link>
            <Link to="/sales-targets" style={{ 
              padding: '10px 20px', 
              background: '#4caf50', 
              color: '#fff', 
              borderRadius: 6, 
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              🎯 Manage Targets
            </Link>
            <Link to="/billing-history" style={{ 
              padding: '10px 20px', 
              background: '#ff9800', 
              color: '#fff', 
              borderRadius: 6, 
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              📋 Billing History
            </Link>
            <Link to="/reports/day-end" style={{ 
              padding: '10px 20px', 
              background: '#9c27b0', 
              color: '#fff', 
              borderRadius: 6, 
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              📊 Day-End Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
