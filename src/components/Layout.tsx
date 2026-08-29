import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { initTheme, toggleTheme } from '../services/theme';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    initTheme();
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  // Fermer le sidebar quand on change de page (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Empêcher le scroll du body quand le sidebar est ouvert
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <h1>💰 TRADE LINK</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="theme-toggle"
            onClick={() => {
              toggleTheme();
              setIsDark(!isDark);
            }}
            title="Changer de thème"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>💰 TRADE LINK</h1>
            <p>Gestion des Ventes</p>
          </div>
          <button
            className="theme-toggle"
            onClick={() => {
              toggleTheme();
              setIsDark(!isDark);
            }}
            title="Changer de thème"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            📦 Produits
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            👥 Clients
          </NavLink>

          <div style={{ borderTop: '1px solid #374151', margin: '8px 12px' }} />

          <NavLink to="/quotes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            📄 Devis
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            📋 Commandes
          </NavLink>
          <NavLink to="/deliveries" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            🚚 Livraisons
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            💲 Tarifs
          </NavLink>

          <div style={{ borderTop: '1px solid #374151', margin: '8px 12px' }} />

          <NavLink to="/invoices" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            🧾 Factures
          </NavLink>
          <NavLink to="/overdue" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            🚨 Impayés
          </NavLink>
          <NavLink to="/portal" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            👤 Portail Client
          </NavLink>

          <div style={{ borderTop: '1px solid #374151', margin: '8px 12px' }} />

          <NavLink to="/supplier-dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            🏭 Dashboard Fournisseurs
          </NavLink>
          <NavLink to="/suppliers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            🏭 Fournisseurs
          </NavLink>
          <NavLink to="/supplier-orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            📋 Commandes Fournisseurs
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
