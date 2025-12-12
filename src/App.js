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
import ReportsAlerts from './pages/ReportsAlerts';
import SettingsSecurity from './pages/SettingsSecurity';
import BillingReport from './pages/reports/BillingReport';
import SalesReport from './pages/reports/SalesReport';
import AlertReport from './pages/reports/AlertReport';
import PurchaseOrder from './pages/PurchaseOrder';
import PurchaseOrderDetails from './pages/PurchaseOrderDetails';
import PurchaseOrderList from "./pages/PurchaseOrderList";
import Login from './pages/Login';
import Logout from './pages/Logout';
import Landing from './pages/Landing';
import AuditTrail from './pages/AuditTrail';
import InventoryReturn from './pages/InventoryReturn';
import './App.css';
import GRNListView from './pages/GRNListView';

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
            <Route path="/reports" element={<PrivateRoute><ReportsAlerts /></PrivateRoute>} />
            <Route path="/reports/billing" element={<PrivateRoute><BillingReport /></PrivateRoute>} />
            <Route path="/reports/sales" element={<PrivateRoute><SalesReport /></PrivateRoute>} />
            <Route path="/reports/alert" element={<PrivateRoute><AlertReport /></PrivateRoute>} />
            <Route path="/audit-trail" element={<PrivateRoute><AuditTrail /></PrivateRoute>} />
            <Route path="/inventory-returns" element={<PrivateRoute><InventoryReturn /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsSecurity /></PrivateRoute>} />
            <Route path="/purchase-order/:id" element={<PrivateRoute><PurchaseOrderDetails /></PrivateRoute>} />
            <Route path="/purchase-orders" element={<PurchaseOrderList />} />       {/* list */}
            <Route path="/grn-list" element={<GRNListView />} />
          </Routes>
        </div>
        {!isAuthPage && <Footer />}
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;