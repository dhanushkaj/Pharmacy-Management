import React, { useState } from 'react';
import InventoryReturn from './InventoryReturn';
import SupplierReturnHistory from './SupplierReturnHistory';

const InventoryReturnsHome = () => {
  const [activeTab, setActiveTab] = useState('create');

  const tabStyle = {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.3s ease',
    borderBottom: '3px solid transparent'
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: '#fff',
    color: '#1976d2',
    borderBottom: '3px solid #1976d2'
  };

  const inactiveTabStyle = {
    ...tabStyle,
    color: '#666'
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f9f9f9',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={() => setActiveTab('create')}
          style={activeTab === 'create' ? activeTabStyle : inactiveTabStyle}
        >
          📝 Create Supplier Return
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={activeTab === 'history' ? activeTabStyle : inactiveTabStyle}
        >
          📋 Supplier Return History
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '0 20px' }}>
        {activeTab === 'create' && <InventoryReturn hideTitle={true} />}
        {activeTab === 'history' && <SupplierReturnHistory />}
      </div>
    </div>
  );
};

export default InventoryReturnsHome;
