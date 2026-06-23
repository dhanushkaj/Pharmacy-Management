import AlertConfig from './pages/reports/AlertConfig';
import React from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import CategoryManagement from './pages/CategoryManagement';
import SupplierManagement from './pages/SupplierManagement';
import ProductManagement from './pages/ProductManagement';
import GRNManagement from './pages/GRNManagement';
import Billing from './pages/Billing';
import BillingHistory from './pages/BillingHistory';
import CustomerManagement from './pages/CustomerManagement';
import ProductBin from './pages/ProductBin';
import SettingsSecurity from './pages/SettingsSecurity';
import StoreSettings from './pages/StoreSettings';
import BillingReport from './pages/reports/BillingReport';
import DayEndReport from './pages/reports/DayEndReport';
import SalesReport from './pages/reports/SalesReport';
import AlertReport from './pages/reports/AlertReport';
import InventoryReport from './pages/reports/InventoryReport';
import PurchaseOrder from './pages/PurchaseOrder';
import PurchaseOrderDetails from './pages/PurchaseOrderDetails';
import PurchaseOrderList from "./pages/PurchaseOrderList";
import Login from './pages/Login';
import Logout from './pages/Logout';
import Landing from './pages/Landing';
import AuditTrail from './pages/AuditTrail';
import InventoryReturn from './pages/InventoryReturn';
import SalesTargetManagement from './pages/SalesTargetManagement';
import InventoryAudit from './pages/InventoryAudit';

// import PrintSetupGuide from './components/PrintSetupGuide';
import './App.css';
import GRNListView from './pages/GRNListView';
import UserProfile from './pages/UserProfile';
import AdminUserManagement from './pages/AdminUserManagement';

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/logout';


  return (
    <div className="app-shell">
      {!isAuthPage && <Sidebar />}
      <div className="main-content">
        {!isAuthPage && <Header />}
        <div className="content-area">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<PrivateRoute><Landing /></PrivateRoute>} />
            <Route path="/categories" element={<PrivateRoute><CategoryManagement /></PrivateRoute>} />
            <Route path="/suppliers" element={<PrivateRoute><SupplierManagement /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
            <Route path="/purchase-order" element={<PrivateRoute><PurchaseOrder /></PrivateRoute>} />
            <Route path="/grn" element={<PrivateRoute><GRNManagement /></PrivateRoute>} />
            <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
            <Route path="/billing-history" element={<PrivateRoute><BillingHistory /></PrivateRoute>} />
            <Route path="/customers" element={<PrivateRoute><CustomerManagement /></PrivateRoute>} />
            <Route path="/bin" element={<PrivateRoute><ProductBin /></PrivateRoute>} />
            {/* Removed /reports route to disable parent ReportsAlerts screen */}
            <Route path="/reports/billing" element={<PrivateRoute><BillingReport /></PrivateRoute>} />
            <Route path="/reports/day-end" element={<PrivateRoute><DayEndReport /></PrivateRoute>} />
            <Route path="/reports/sales" element={<PrivateRoute><SalesReport /></PrivateRoute>} />
            <Route path="/reports/alerts" element={<PrivateRoute><AlertReport /></PrivateRoute>} />
            <Route path="/reports/inventory" element={<PrivateRoute><InventoryReport /></PrivateRoute>} />
            <Route path="/reports/alert-config" element={<PrivateRoute><AlertConfig /></PrivateRoute>} />
            <Route path="/audit-trail" element={<PrivateRoute><AuditTrail /></PrivateRoute>} />
            <Route path="/inventory-returns" element={<PrivateRoute><InventoryReturn /></PrivateRoute>} />
            <Route path="/inventory-audit" element={<PrivateRoute><InventoryAudit /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsSecurity /></PrivateRoute>} />
            <Route path="/store-settings" element={<PrivateRoute><StoreSettings /></PrivateRoute>} />
            <Route path="/purchase-order/:id" element={<PrivateRoute><PurchaseOrderDetails /></PrivateRoute>} />
            <Route path="/purchase-orders" element={<PurchaseOrderList />} />       {/* list */}
            <Route path="/grn-list" element={<GRNListView />} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute><AdminUserManagement /></PrivateRoute>} />
            <Route path="/customer-credit-report" element={<PrivateRoute><CustomerCreditReport /></PrivateRoute>} />
            <Route path="/sales-targets" element={<PrivateRoute><SalesTargetManagement /></PrivateRoute>} />
          </Routes>
        </div>
        {!isAuthPage && <Footer />}
        {/* {!isAuthPage && <PrintSetupGuide />} */}
      </div>
    </div>
  );
};

import CustomerCreditReport from './pages/CustomerCreditReport';

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;