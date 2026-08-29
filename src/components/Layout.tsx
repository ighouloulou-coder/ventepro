import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>💰 VentePro</h1>
          <p>Gestion des Ventes</p>
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
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
