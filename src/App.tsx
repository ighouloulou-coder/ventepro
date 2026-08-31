import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
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
import FirebaseTest from './pages/FirebaseTest';
import Login from './pages/Login';
import Settings from './pages/Settings';
import SplashScreen from './components/SplashScreen';
import './index.css';

function isAuthenticated(): boolean {
  return localStorage.getItem('tradelink_access') === 'granted';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.995 },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ width: '100%', minHeight: '100vh' }}
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/sign" element={<SignaturePage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="clients" element={<Clients />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="orders" element={<Orders />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="overdue" element={<OverdueDashboard />} />
            <Route path="portal" element={<ClientPortal />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="supplier-orders" element={<SupplierOrders />} />
            <Route path="supplier-dashboard" element={<SupplierDashboard />} />
            <Route path="firebase-test" element={<FirebaseTest />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ErrorBoundary>
  );
};

export default App;