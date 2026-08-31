import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { getKPIs, getSalesForecast, getProductPerformance, getClientAnalytics, getCashFlowData, type KPI, type Forecast } from '../services/analyticsService';
import AnimatedPage from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';
import TiltCard from '../components/TiltCard';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#dc2626', '#6366f1'];

const Analytics: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);

  useEffect(() => {
    setKpis(getKPIs());
    setForecast(getSalesForecast());
    setProducts(getProductPerformance());
    setClients(getClientAnalytics());
    setCashFlow(getCashFlowData());
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(n);

  return (
    <AnimatedPage>
      <FloatingShapes />
      <div className="page" style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>📊 Analytics Avance</h2>

        {/* KPIs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {kpis.map((kpi, i) => (
            <TiltCard key={i}>
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.4rem' }}>{kpi.icon}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</span>
                </div>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{kpi.value}</p>
                {kpi.trend !== 0 && (
                  <p style={{ fontSize: '0.68rem', color: kpi.trend > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                    {kpi.trend > 0 ? '📈' : '📉'} {kpi.trend.toFixed(1)}% vs mois dernier
                  </p>
                )}
              </div>
            </TiltCard>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Sales Forecast */}
          <TiltCard>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>🔮 Previsions de Ventes (6 mois)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={forecast}>
                  <defs>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} width={60} />
                  <Tooltip formatter={(v: number) => [fmt(v), 'Montant']} />
                  <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="url(#colorPred)" strokeWidth={2} name="Prevu" />
                  {forecast[0]?.actual !== undefined && (
                    <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="transparent" strokeWidth={2} name="Reel" strokeDasharray="5 5" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TiltCard>

          {/* Cash Flow */}
          <TiltCard>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>💵 Flux de Tresorerie</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} width={60} />
                  <Tooltip formatter={(v: number) => [fmt(v), 'Montant']} />
                  <Legend />
                  <Bar dataKey="encaisse" fill="#10b981" name="Encaisse" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attente" fill="#f59e0b" name="En attente" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TiltCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Product Performance */}
          <TiltCard>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>🏆 Performance Produits</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={products.map(p => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name, ca: p.revenue, qte: p.quantity }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} width={100} />
                  <Tooltip formatter={(v: number, name: string) => name === 'ca' ? fmt(v) : v} />
                  <Bar dataKey="ca" radius={[0, 4, 4, 0]}>
                    {products.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TiltCard>

          {/* Top Clients */}
          <TiltCard>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>👑 Top Clients (CA)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={clients.slice(0, 6).map(c => ({ name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name, value: c.total }))} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({ name, percent }) => name + ' ' + (percent * 100).toFixed(0) + '%'} labelLine={false}>
                    {clients.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TiltCard>
        </div>

        {/* Client Details Table */}
        <TiltCard>
          <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>📋 Detail Clients</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 500 }}>
                <thead><tr><th>Client</th><th>CA Total</th><th>Commandes</th><th>Panier Moyen</th><th>Derniere Cmd</th></tr></thead>
                <tbody>
                  {clients.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.name}</strong></td>
                      <td>{fmt(c.total)}</td>
                      <td>{c.orders}</td>
                      <td>{fmt(c.total / c.orders)}</td>
                      <td>{new Date(c.lastOrder).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TiltCard>
      </div>
    </AnimatedPage>
  );
};

export default Analytics;
