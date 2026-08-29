import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Quotes from './pages/Quotes';
import Orders from './pages/Orders';
import Deliveries from './pages/Deliveries';
import Pricing from './pages/Pricing';
import OverdueDashboard from './pages/OverdueDashboard';
import ClientPortal from './pages/ClientPortal';
import SignaturePage from './pages/SignaturePage';
import Invoices from './pages/Invoices';
import Suppliers from './pages/Suppliers';
import SupplierOrders from './pages/SupplierOrders';
import SupplierDashboard from './pages/SupplierDashboard';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="orders" element={<Orders />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="overdue" element={<OverdueDashboard />} />
          <Route path="portal" element={<ClientPortal />} />
          <Route path="/sign" element={<SignaturePage />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="supplier-orders" element={<SupplierOrders />} />
          <Route path="supplier-dashboard" element={<SupplierDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
