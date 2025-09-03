import React from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import CategoryManagement from './pages/CategoryManagement';
import SupplierManagement from './pages/SupplierManagement';
import ProductManagement from './pages/ProductManagement';
import GRNManagement from './pages/GRNManagement';
import Billing from './pages/Billing';
import CustomerManagement from './pages/CustomerManagement';
import ProductBin from './pages/ProductBin';
import ReportsAlerts from './pages/ReportsAlerts';
import SettingsSecurity from './pages/SettingsSecurity';
import BillingReport from './pages/reports/BillingReport';
import SalesReport from './pages/reports/SalesReport';
import AlertReport from './pages/reports/AlertReport';
import PurchaseOrder from './pages/PurchaseOrder';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Landing from './pages/Landing';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/logout';

  // Import PrivateRoute
  // ...existing code...
  const PrivateRoute = require('./components/PrivateRoute').default;
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
            <Route path="/customers" element={<PrivateRoute><CustomerManagement /></PrivateRoute>} />
            <Route path="/bin" element={<PrivateRoute><ProductBin /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><ReportsAlerts /></PrivateRoute>} />
            <Route path="/reports/billing" element={<PrivateRoute><BillingReport /></PrivateRoute>} />
            <Route path="/reports/sales" element={<PrivateRoute><SalesReport /></PrivateRoute>} />
            <Route path="/reports/alert" element={<PrivateRoute><AlertReport /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsSecurity /></PrivateRoute>} />
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