import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

import './App.css';

const App = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-content">
      <Header />
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Navigate to="/categories" />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/suppliers" element={<SupplierManagement />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/purchase-order" element={<PurchaseOrder />} />
          <Route path="/grn" element={<GRNManagement />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/bin" element={<ProductBin />} />
          <Route path="/reports" element={<ReportsAlerts />} />
          <Route path="/reports/billing" element={<BillingReport />} />
          <Route path="/reports/sales" element={<SalesReport />} />
          <Route path="/reports/alert" element={<AlertReport />} />
          <Route path="/settings" element={<SettingsSecurity />} />
        </Routes>
      </div>
      <Footer />
    </div>
  </div>
);

export default App;