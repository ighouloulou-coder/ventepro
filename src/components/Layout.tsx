import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { initTheme, toggleTheme } from '../services/theme';
import DemoBanner from './DemoBanner';
import Chat from './Chat';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    initTheme();
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Produits', icon: '📦' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { divider: true },
    { path: '/quotes', label: 'Devis', icon: '📄' },
    { path: '/orders', label: 'Commandes', icon: '📋' },
    { path: '/deliveries', label: 'Livraisons', icon: '🚚' },
    { path: '/pricing', label: 'Tarifs', icon: '💲' },
    { divider: true },
    { path: '/invoices', label: 'Factures', icon: '🧾' },
    { path: '/overdue', label: 'Impayés', icon: '🚨' },
    { path: '/portal', label: 'Portail Client', icon: '👤' },
    { divider: true },
    { path: '/supplier-dashboard', label: 'Dashboard Fourn.', icon: '🏭' },
    { path: '/suppliers', label: 'Fournisseurs', icon: '🏭' },
    { path: '/supplier-orders', label: 'Cmd Fournisseurs', icon: '📋' },
    { divider: true },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { divider: true },
    { path: '/settings', label: 'Paramètres', icon: '⚙️' },
  ];

  return (
    <div className="app-layout-3d">
      {/* Mobile Header */}
      <header className="mobile-header-3d">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          💰 TRADE LINK
        </motion.h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.button
            className="theme-toggle-3d"
            onClick={() => { toggleTheme(); setIsDark(!isDark); }}
            title="Changer de thème"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            {isDark ? '☀️' : '🌙'}
          </motion.button>
          <motion.button
            className="hamburger-3d"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {sidebarOpen ? '✕' : '☰'}
          </motion.button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay-3d active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`sidebar-3d ${sidebarOpen ? 'open' : ''}`}
        initial={false}
        animate={{ x: sidebarOpen || typeof window !== 'undefined' && window.innerWidth > 768 ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header-3d">
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              💰 TRADE LINK
            </motion.h1>
            <p>Gestion des Ventes</p>
          </div>
          <motion.button
            className="theme-toggle-3d"
            onClick={() => { toggleTheme(); setIsDark(!isDark); }}
            title="Changer de thème"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            {isDark ? '☀️' : '🌙'}
          </motion.button>
        </div>

        <nav className="sidebar-nav-3d">
          {navItems.map((item, i) => {
            if (item.divider) {
              return <div key={`div-${i}`} className="nav-divider-3d" />;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => `nav-link-3d ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon-3d">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer decoration */}
        <div className="sidebar-footer-3d">
          <div className="sidebar-glow-3d" />
        </div>
      </motion.aside>

      {/* Main Content */}
      <DemoBanner />
      <main className="main-content-3d">
        <Outlet />
        <Chat />
      </main>
    </div>
  );
};

export default Layout;
