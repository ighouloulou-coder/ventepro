import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { initTheme, toggleTheme } from '../services/theme';
import { getCurrentUser, logout } from '../services/authService';
import DemoBanner from './DemoBanner';
import Chat from './Chat';
import GlobalSearch from './GlobalSearch';
import AIChatbot from './AIChatbot';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initTheme();
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    setUser(getCurrentUser());
    
    // Keyboard shortcut: Ctrl+K for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    // Toujours nettoyer le localStorage d'abord
    localStorage.removeItem('tradelink_current_user');
    localStorage.removeItem('tradelink_access');
    localStorage.removeItem('tradelink_demo');
    localStorage.removeItem('tradelink_access_time');
    // Rediriger vers login
    window.location.href = '/login';
  };

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
    { path: '/monitoring', label: 'Monitoring', icon: '📈' },
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

        {/* User Info & Logout */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto',
        }}>
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
              }}>
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.displayName || 'Utilisateur'}
                </p>
                <p style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.email || 'Demo'}
                </p>
              </div>
            </div>
          )}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            🚪 Déconnexion
          </motion.button>
        </div>

        {/* Sidebar footer decoration */}
        <div className="sidebar-footer-3d">
          <div className="sidebar-glow-3d" />
        </div>
      </motion.aside>

      {/* Main Content */}
      <DemoBanner />
      <main className="main-content-3d">
        {/* Search Button (Desktop) */}
        <motion.button
          onClick={() => setSearchOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            fontSize: '1.3rem',
            cursor: 'pointer',
            boxShadow: '0 10px 30px -5px rgba(59, 130, 246, 0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Recherche (Ctrl+K)"
        >
          🔍
        </motion.button>
        <Outlet />
        <Chat />
      </main>

      {/* Global Search */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
};

export default Layout;
