import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSyncReload } from '../hooks/useSyncReload';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { getDashboardStats, invoiceStorage, productStorage } from '../services/storage';
import { db, COLLECTIONS } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { DashboardStats, Invoice, Product } from '../types';
import TiltCard from '../components/TiltCard';
import AnimatedPage, { AnimatedItem } from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const stableLoadData = useCallback(() => { loadData(); }, []);
  useSyncReload(stableLoadData);

  const loadData = () => {
    setStats(getDashboardStats());
    setInvoices(invoiceStorage.getAll());
    setProducts(productStorage.getAll());
  };

  const forceSync = async () => {
    setSyncing(true);
    try {
      const cols: [string, string][] = [
        [COLLECTIONS.PRODUCTS, 'tradelink_products'],
        [COLLECTIONS.CLIENTS, 'tradelink_clients'],
        [COLLECTIONS.INVOICES, 'tradelink_invoices'],
        [COLLECTIONS.QUOTES, 'tradelink_quotes'],
        [COLLECTIONS.ORDERS, 'tradelink_orders'],
        [COLLECTIONS.DELIVERIES, 'tradelink_deliveries'],
      ];
      for (const [col, key] of cols) {
        const snap = await getDocs(collection(db, col));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        localStorage.setItem(key, JSON.stringify(data));
      }
      loadData();
      setLastSync(new Date().toLocaleTimeString('fr-FR'));
    } catch (e) {
      alert('Erreur de synchronisation.');
    } finally {
      setSyncing(false);
    }
  };

  if (!stats) return <div className="loading">Chargement...</div>;

  const fmt = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');
  const statusColor = (s: string) => s === 'payée' ? 'status-paid' : s === 'envoyée' ? 'status-sent' : s === 'brouillon' ? 'status-draft' : s === 'annulée' ? 'status-cancelled' : '';

  const getMonthlyData = () => {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mi = invoices.filter(inv => {
        const id = new Date(inv.createdAt);
        return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear() && inv.status === 'payée';
      });
      return { mois: months[d.getMonth()], ventes: mi.reduce((s, inv) => s + inv.total, 0) };
    });
  };

  const getStatusData = () => {
    const c: Record<string, number> = {};
    invoices.forEach(inv => { c[inv.status] = (c[inv.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  };

  const getTopProducts = () => {
    const ps: Record<string, { name: string; total: number }> = {};
    invoices.filter(i => i.status === 'payée').forEach(inv => {
      inv.items.forEach(item => {
        if (!ps[item.productId]) ps[item.productId] = { name: item.productName, total: 0 };
        ps[item.productId].total += item.total;
      });
    });
    return Object.values(ps).sort((a, b) => b.total - a.total).slice(0, 5).map((p, i) => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
      ventes: p.total,
      couleur: COLORS[i % COLORS.length],
    }));
  };

  const getStockData = () => products.slice(0, 8).map(p => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name,
    stock: p.stock,
  }));

  const getClientRevenue = () => {
    const cr: Record<string, number> = {};
    invoices.filter(i => i.status === 'payée').forEach(inv => {
      cr[inv.clientName] = (cr[inv.clientName] || 0) + inv.total;
    });
    return Object.entries(cr).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, total]) => ({
      name: name.length > 12 ? name.slice(0, 12) + '...' : name,
      montant: total,
    }));
  };

  const monthlyData = getMonthlyData();
  const statusData = getStatusData();
  const topProducts = getTopProducts();
  const stockData = getStockData();
  const clientRevenue = getClientRevenue();
  const ventes = monthlyData[monthlyData.length - 1]?.ventes || 0;
  const prevVentes = monthlyData[monthlyData.length - 2]?.ventes || 0;
  const tendance = prevVentes > 0 ? ((ventes - prevVentes) / prevVentes * 100).toFixed(1) : '0';

  const StatCard = ({ icon, title, value, trend, navTo }: { icon: string; title: string; value: string | number; trend?: string; navTo?: string }) => (
    <TiltCard onClick={() => navTo && navigate(navTo)} style={{ cursor: navTo ? 'pointer' : 'default' }}>
      <div className="stat-card-3d">
        <div className="stat-icon-3d">{icon}</div>
        <div className="stat-info">
          <h3>{title}</h3>
          <p className="stat-value">{value}</p>
          {trend && <p className="stat-trend">{trend}</p>}
        </div>
      </div>
    </TiltCard>
  );

  return (
    <AnimatedPage>
      <FloatingShapes />
      <div className="page" style={{ position: 'relative', zIndex: 1 }}>
        <AnimatedItem>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.2rem' }}>📊 Tableau de Bord</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lastSync && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Dernière sync: {lastSync}
                </span>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <motion.button
                  className="btn btn-secondary btn-3d"
                  onClick={forceSync}
                  disabled={syncing}
                  style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', padding: '10px 12px' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {syncing ? '🔄 Sync...' : '🔄 Sync'}
                </motion.button>
                <motion.button
                  className="btn btn-small btn-danger btn-3d"
                  onClick={() => { localStorage.removeItem('tradelink_access'); window.location.href = '/login'; }}
                  style={{ fontSize: '0.8rem', padding: '10px 12px' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🚪
                </motion.button>
              </div>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="stats-grid">
            <StatCard icon="💰" title="Ventes Totales" value={fmt(stats.totalSales)} trend={`${parseFloat(tendance) >= 0 ? '📈' : '📉'} ${tendance}%`} navTo="/invoices" />
            <StatCard icon="📅" title="Ventes du Mois" value={fmt(stats.monthlySales)} navTo="/invoices" />
            <StatCard icon="👥" title="Clients" value={stats.totalClients} navTo="/clients" />
            <StatCard icon="📦" title="Produits" value={stats.totalProducts} navTo="/products" />
            <StatCard icon="⏳" title="Factures En Attente" value={stats.pendingInvoices} navTo="/invoices" />
            <StatCard icon="📄" title="Devis En Cours" value={stats.pendingQuotes} trend={fmt(stats.totalQuotesAmount)} navTo="/quotes" />
            <StatCard icon="📋" title="Commandes Actives" value={stats.pendingOrders} trend={fmt(stats.totalOrdersAmount)} navTo="/orders" />
            <StatCard icon="🚚" title="Livraisons En Cours" value={stats.pendingDeliveries} navTo="/deliveries" />
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="charts-grid">
            <TiltCard className="chart-card-3d" onClick={() => navigate("/invoices")} style={{ cursor: "pointer" }}>
              <h3>📈 Ventes (6 mois)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} width={60} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Ventes"]} />
                  <Area type="monotone" dataKey="ventes" stroke="#2563eb" fill="url(#colorVentes)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </TiltCard>

            <TiltCard className="chart-card-3d" onClick={() => navigate("/invoices")} style={{ cursor: "pointer" }}>
              <h3>🧾 Statut Factures</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }: any) => name + " " + (percent * 100).toFixed(0) + "%"} labelLine={false}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </TiltCard>

            <TiltCard className="chart-card-3d" onClick={() => navigate("/products")} style={{ cursor: "pointer" }}>
              <h3>🏆 Top Produits</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} width={80} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Ventes"]} />
                  <Bar dataKey="ventes" radius={[0, 6, 6, 0]}>
                    {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TiltCard>

            <TiltCard className="chart-card-3d" onClick={() => navigate("/clients")} style={{ cursor: "pointer" }}>
              <h3>👥 Top Clients</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={clientRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={11} width={60} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Revenu"]} />
                  <Bar dataKey="montant" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TiltCard>

            <TiltCard className="chart-card-3d chart-full" onClick={() => navigate("/products")} style={{ cursor: "pointer" }}>
              <h3>📦 Stocks</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TiltCard>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <TiltCard className="recent-section-3d" onClick={() => navigate("/invoices")} style={{ cursor: "pointer" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 10 }}>📋 Factures Récentes</h3>
            {stats.recentInvoices.length === 0 ? (
              <p className="empty-state">Aucune facture</p>
            ) : (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table className="data-table" style={{ minWidth: 450 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Client</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td><strong>#{inv.id.slice(0, 8)}</strong></td>
                        <td>{inv.clientName}</td>
                        <td><strong>{fmt(inv.total)}</strong></td>
                        <td><span className={"status-badge " + statusColor(inv.status)}>{inv.status}</span></td>
                        <td>{fmtDate(inv.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TiltCard>
        </AnimatedItem>
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;
