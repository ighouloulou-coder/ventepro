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
import Invoices from './pages/Invoices';
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
          <Route path="invoices" element={<Invoices />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
