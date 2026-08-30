import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { getDashboardStats, invoiceStorage, productStorage } from '../services/storage';
import { DashboardStats, Invoice, Product } from '../types';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStats(getDashboardStats());
    setInvoices(invoiceStorage.getAll());
    setProducts(productStorage.getAll());
  };

  if (!stats) return <div className="loading">Chargement...</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payée': return 'status-paid';
      case 'envoyée': return 'status-sent';
      case 'brouillon': return 'status-draft';
      case 'annulée': return 'status-cancelled';
      default: return '';
    }
  };

  // Données pour le graphique des ventes mensuelles (6 derniers mois)
  const getMonthlySalesData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.getMonth() === month && invDate.getFullYear() === year && inv.status === 'payée';
      });

      const ventes = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const nbFactures = monthInvoices.length;

      data.push({
        mois: months[month],
        ventes: parseFloat(ventes.toFixed(2)),
        factures: nbFactures,
      });
    }
    return data;
  };

  // Données pour le graphique en camembert des statuts
  const getStatusDistribution = () => {
    const statusCount: Record<string, number> = {};
    invoices.forEach(inv => {
      statusCount[inv.status] = (statusCount[inv.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  // Données pour les top produits
  const getTopProducts = () => {
    const productSales: Record<string, { name: string; total: number; count: number }> = {};

    invoices.filter(i => i.status === 'payée').forEach(inv => {
      inv.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, total: 0, count: 0 };
        }
        productSales[item.productId].total += item.total;
        productSales[item.productId].count += item.quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((p, i) => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
        ventes: parseFloat(p.total.toFixed(2)),
        couleur: COLORS[i % COLORS.length],
      }));
  };

  // Données pour l'évolution des stocks
  const getStockData = () => {
    return products.slice(0, 8).map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
      stock: p.stock,
    }));
  };

  // Calcul du chiffre d'affaires par client
  const getRevenueByClient = () => {
    const clientRevenue: Record<string, number> = {};
    invoices.filter(i => i.status === 'payée').forEach(inv => {
      clientRevenue[inv.clientName] = (clientRevenue[inv.clientName] || 0) + inv.total;
    });

    return Object.entries(clientRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({
        name: name.length > 15 ? name.slice(0, 15) + '...' : name,
        montant: parseFloat(total.toFixed(2)),
      }));
  };

  const monthlyData = getMonthlySalesData();
  const statusData = getStatusDistribution();
  const topProducts = getTopProducts();
  const stockData = getStockData();
  const clientRevenue = getRevenueByClient();

  // Tendance
  const ventesActuelles = monthlyData[monthlyData.length - 1]?.ventes || 0;
  const ventesPrecedentes = monthlyData[monthlyData.length - 2]?.ventes || 0;
  const tendance = ventesPrecedentes > 0
    ? ((ventesActuelles - ventesPrecedentes) / ventesPrecedentes * 100).toFixed(1)
    : '0';

  return (
    <div className="dashboard">
      <h2>📊 Tableau de Bord</h2>

      {/* Stats principales */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Ventes Totales</h3>
            <p className="stat-value">{formatCurrency(stats.totalSales)}</p>
            <p className="stat-trend">
              {parseFloat(tendance) >= 0 ? '📈' : '📉'} {tendance}% vs mois dernier
            </p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Ventes du Mois</h3>
            <p className="stat-value">{formatCurrency(stats.monthlySales)}</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/clients')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Clients</h3>
            <p className="stat-value">{stats.totalClients}</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Produits</h3>
            <p className="stat-value">{stats.totalProducts}</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Factures En Attente</h3>
            <p className="stat-value">{stats.pendingInvoices}</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/quotes')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>Devis En Cours</h3>
            <p className="stat-value">{stats.pendingQuotes}</p>
            <p className="stat-trend">{formatCurrency(stats.totalQuotesAmount)} acceptés</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Commandes Actives</h3>
            <p className="stat-value">{stats.pendingOrders}</p>
            <p className="stat-trend">{formatCurrency(stats.totalOrdersAmount)} total</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/deliveries')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">🚚</div>
          <div className="stat-info">
            <h3>Livraisons En Cours</h3>
            <p className="stat-value">{stats.pendingDeliveries}</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        {/* Graphique ventes mensuelles */}
        <div className="chart-card" onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
          <h3>📈 Ventes des 6 derniers mois</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mois" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'Ventes']}
              />
              <Area type="monotone" dataKey="ventes" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique statuts factures */}
        <div className="chart-card" onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
          <h3>🧾 Statut des factures</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top produits */}
        <div className="chart-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <h3>🏆 Top 5 Produits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={100} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'Ventes']}
              />
              <Bar dataKey="ventes" radius={[0, 4, 4, 0]}>
                {topProducts.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top clients par revenu */}
        <div className="chart-card" onClick={() => navigate('/clients')} style={{ cursor: 'pointer' }}>
          <h3>👥 Top Clients par Revenu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'Revenu']}
              />
              <Bar dataKey="montant" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stocks produits */}
        <div className="chart-card chart-full" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <h3>📦 État des Stocks</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="stock" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factures récentes */}
      <div className="recent-section" onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
        <h3>📋 Factures Récentes</h3>
        {stats.recentInvoices.length === 0 ? (
          <p className="empty-state">Aucune facture pour le moment</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Facture</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>#{invoice.id.slice(0, 8)}</td>
                  <td>{invoice.clientName}</td>
                  <td>{formatCurrency(invoice.total)}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>{formatDate(invoice.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
