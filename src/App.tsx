import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Products = React.lazy(() => import('./pages/Products'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Quotes = React.lazy(() => import('./pages/Quotes'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Deliveries = React.lazy(() => import('./pages/Deliveries'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const OverdueDashboard = React.lazy(() => import('./pages/OverdueDashboard'));
const ClientPortal = React.lazy(() => import('./pages/ClientPortal'));
const SignaturePage = React.lazy(() => import('./pages/SignaturePage'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const SupplierOrders = React.lazy(() => import('./pages/SupplierOrders'));
const SupplierDashboard = React.lazy(() => import('./pages/SupplierDashboard'));
const FirebaseTest = React.lazy(() => import('./pages/FirebaseTest'));
import Login from './pages/Login';
const Settings = React.lazy(() => import('./pages/Settings'));
import SplashScreen from './components/SplashScreen';
import './index.css';

function isAuthenticated(): boolean {
  return localStorage.getItem('tradelink_access') === 'granted' || localStorage.getItem('tradelink_demo') === 'true' || !!localStorage.getItem('tradelink_current_user');
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
        <Suspense fallback={<div className="loading">Chargement...</div>}>
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
        </Suspense>
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