import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { invoiceStorage, clientStorage, formatCurrencyAmount } from '../services/storage';
import { Invoice, Client, Currency } from '../types';
import { sendInvoiceReminder, saveReminder, type Reminder } from '../services/notifications';
import { sendInvoiceReminderSMS, logSMS } from '../services/smsService';

const COLORS = ['#dc2626', '#f59e0b', '#2563eb', '#16a34a', '#8b5cf6'];

const OverdueDashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setInvoices(invoiceStorage.getAll());
    setClients(clientStorage.getAll());
  }, []);

  // Données filtrées
  const unpaidInvoices = invoices.filter(i => i.status !== 'payée' && i.status !== 'annulée');
  const overdueInvoices = unpaidInvoices.filter(i => new Date(i.dueDate) < new Date());
  const paidInvoices = invoices.filter(i => i.status === 'payée');

  // Montants
  const totalUnpaid = unpaidInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.total, 0);

  // Répartition par statut
  const statusData = [
    { name: 'Payées', value: paidInvoices.length, montant: totalPaid },
    { name: 'Envoyées', value: invoices.filter(i => i.status === 'envoyée').length, montant: invoices.filter(i => i.status === 'envoyée').reduce((s, i) => s + i.total, 0) },
    { name: 'En retard', value: overdueInvoices.length, montant: totalOverdue },
    { name: 'Brouillons', value: invoices.filter(i => i.status === 'brouillon').length, montant: invoices.filter(i => i.status === 'brouillon').reduce((s, i) => s + i.total, 0) },
    { name: 'Annulées', value: invoices.filter(i => i.status === 'annulée').length, montant: invoices.filter(i => i.status === 'annulée').reduce((s, i) => s + i.total, 0) },
  ];

  // Top clients endettés
  const clientDebt = overdueInvoices.reduce<Record<string, { name: string; total: number; count: number }>>((acc, inv) => {
    if (!acc[inv.clientId]) acc[inv.clientId] = { name: inv.clientName, total: 0, count: 0 };
    acc[inv.clientId].total += inv.total;
    acc[inv.clientId].count++;
    return acc;
  }, {});

  const topDebtClients = Object.values(clientDebt)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(c => ({ name: c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name, montant: parseFloat(c.total.toFixed(2)), factures: c.count }));

  // Évolution des impayés par mois
  const getMonthlyOverdue = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthOverdue = unpaidInvoices.filter(inv => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      data.push({
        mois: months[month],
        impayés: monthOverdue.reduce((sum, inv) => sum + inv.total, 0),
        count: monthOverdue.length,
      });
    }
    return data;
  };

  // Répartition par devise
  const currencyData = unpaidInvoices.reduce<Record<string, { count: number; total: number }>>((acc, inv) => {
    const cur = inv.currency || 'MAD';
    if (!acc[cur]) acc[cur] = { count: 0, total: 0 };
    acc[cur].count++;
    acc[cur].total += inv.total;
    return acc;
  }, {});

  // Taux de recouvrement
  const totalAll = totalPaid + totalUnpaid;
  const recoveryRate = totalAll > 0 ? ((totalPaid / totalAll) * 100).toFixed(1) : '0';



  const sendWhatsAppReminder = (invoice: Invoice, client: Client) => {
    sendInvoiceReminder(invoice, client);
    saveReminder({
      id: Date.now().toString(),
      invoiceId: invoice.id,
      clientId: client.id,
      type: 'overdue_1',
      sentAt: new Date().toISOString(),
      status: 'sent',
    } as Reminder);
  };

  const sendSMSReminder = async (invoice: Invoice, client: Client) => {
    const result = await sendInvoiceReminderSMS(invoice, client);
    logSMS({
      to: client.phone,
      message: `Relance facture #${invoice.id.slice(0, 8)}`,
      type: 'reminder',
      invoiceId: invoice.id,
      status: result.success ? 'sent' : 'failed',
    });
    if (result.success) {
      alert('SMS envoyé avec succès !');
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  return (
    <div className="page">
      <h2>📊 Tableau de Bord des Impayés</h2>

      {/* Stats principales */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Payé</h3>
            <p className="stat-value" style={{ color: 'var(--text-success)' }}>{formatCurrencyAmount(totalPaid)}</p>
            <p className="stat-trend">{paidInvoices.length} factures</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>En Attente</h3>
            <p className="stat-value" style={{ color: 'var(--text-warning)' }}>{formatCurrencyAmount(totalUnpaid)}</p>
            <p className="stat-trend">{unpaidInvoices.length} factures</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <h3>En Retard</h3>
            <p className="stat-value" style={{ color: 'var(--text-danger)' }}>{formatCurrencyAmount(totalOverdue)}</p>
            <p className="stat-trend">{overdueInvoices.length} factures</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>Taux Recouvrement</h3>
            <p className="stat-value" style={{ color: 'var(--text-primary-brand)' }}>{recoveryRate}%</p>
            <p className="stat-trend">du CA total</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        {/* Répartition par statut */}
        <div className="chart-card">
          <h3>📊 Répartition par Statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData.filter(d => d.value > 0)}
                cx="50%" cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} factures`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top clients endettés */}
        <div className="chart-card">
          <h3>👥 Top Clients Impayés</h3>
          {topDebtClients.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDebtClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={100} />
                <Tooltip
                  formatter={(value: number) => [formatCurrencyAmount(value), 'Impayé']}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="montant" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p>✅ Aucun impayé</p>
            </div>
          )}
        </div>

        {/* Évolution des impayés */}
        <div className="chart-card chart-full">
          <h3>📈 Évolution des Impayés (6 mois)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getMonthlyOverdue()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mois" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                formatter={(value: number) => [formatCurrencyAmount(value), 'Impayés']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="impayés" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par devise */}
        {Object.keys(currencyData).length > 0 && (
          <div className="chart-card">
            <h3>💱 Répartition par Devise</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
              {Object.entries(currencyData).map(([currency, data]) => (
                <div key={currency} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
                  <div>
                    <strong>{currency}</strong>
                    <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>{data.count} facture{data.count > 1 ? 's' : ''}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-danger)' }}>{formatCurrencyAmount(data.total, currency as Currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Liste des factures en retard avec actions */}
      {overdueInvoices.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 16 }}>🚨 Factures en Retard ({overdueInvoices.length})</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Facture</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Devise</th>
                <th>Échéance</th>
                <th>Jours retard</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {overdueInvoices
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map(invoice => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  const daysOverdue = Math.floor(
                    (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr key={invoice.id}>
                      <td><strong>#{invoice.id.slice(0, 8)}</strong></td>
                      <td>{invoice.clientName}</td>
                      <td><strong style={{ color: 'var(--text-danger)' }}>{formatCurrencyAmount(invoice.total, invoice.currency)}</strong></td>
                      <td>{invoice.currency}</td>
                      <td>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: daysOverdue > 30 ? '#fee2e2' : daysOverdue > 7 ? '#fef3c7' : '#dbeafe',
                          color: daysOverdue > 30 ? '#991b1b' : daysOverdue > 7 ? '#92400e' : '#1e40af',
                        }}>
                          {daysOverdue}j
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => client && sendWhatsAppReminder(invoice, client)}
                          title="Relance WhatsApp"
                        >
                          📱
                        </button>
                        <button
                          className="btn btn-small"
                          onClick={() => client && sendSMSReminder(invoice, client)}
                          title="Relance SMS"
                        >
                          💬
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {unpaidInvoices.length === 0 && (
        <div className="empty-state" style={{ padding: 60 }}>
          <p style={{ fontSize: '1.2rem' }}>🎉 Aucun impayé !</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Toutes vos factures sont payées.</p>
        </div>
      )}
    </div>
  );
};

export default OverdueDashboard;
