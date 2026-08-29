import React, { useState, useEffect } from 'react';
import { invoiceStorage, quoteStorage, orderStorage, deliveryStorage, clientStorage, formatCurrencyAmount } from '../services/storage';
import { Invoice, Quote, Order, DeliveryNote, Client } from '../types';
import { generateQuotePDF } from '../services/pdfQuoteExport';
import { exportSingleInvoice } from '../services/excelExport';

const ClientPortal: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'orders' | 'deliveries'>('invoices');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryNote[]>([]);

  useEffect(() => {
    setClients(clientStorage.getAll());
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      setInvoices(invoiceStorage.getAll().filter(i => i.clientId === selectedClientId));
      setQuotes(quoteStorage.getAll().filter(q => q.clientId === selectedClientId));
      setOrders(orderStorage.getAll().filter(o => o.clientId === selectedClientId));
      setDeliveries(deliveryStorage.getAll().filter(d => d.clientId === selectedClientId));
    }
  }, [selectedClientId]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Stats du client
  const totalInvoiced = invoices.filter(i => i.status === 'payée').reduce((sum, i) => sum + i.total, 0);
  const totalPending = invoices.filter(i => i.status !== 'payée' && i.status !== 'annulée').reduce((sum, i) => sum + i.total, 0);
  const totalOrders = orders.filter(o => o.status !== 'annulée').reduce((sum, o) => sum + o.total, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payée': case 'livré': case 'accepté': return 'status-paid';
      case 'envoyée': case 'confirmée': case 'en_cours': case 'envoyé': return 'status-sent';
      case 'brouillon': case 'en_attente': case 'préparation': return 'status-draft';
      case 'annulée': case 'refusé': case 'expiré': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>👤 Portail Client</h2>
      </div>

      {/* Sélection du client */}
      <div className="form-group" style={{ maxWidth: 400, marginBottom: 32 }}>
        <label>Sélectionner un client</label>
        <select
          value={selectedClientId}
          onChange={e => setSelectedClientId(e.target.value)}
        >
          <option value="">Choisir un client...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {selectedClient ? (
        <>
          {/* En-tête du client */}
          <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                {selectedClient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{selectedClient.name}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {selectedClient.email} | {selectedClient.phone}
                </p>
              </div>
            </div>

            {/* Stats client */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Total facturé payé</p>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-success)', margin: '4px 0 0 0' }}>{formatCurrencyAmount(totalInvoiced, selectedClient.currency || 'MAD')}</p>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: '#fef3c7', borderRadius: 8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>En attente</p>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-warning)', margin: '4px 0 0 0' }}>{formatCurrencyAmount(totalPending, selectedClient.currency || 'MAD')}</p>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-info)', borderRadius: 8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Commandes totales</p>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary-brand)', margin: '4px 0 0 0' }}>{formatCurrencyAmount(totalOrders, selectedClient.currency || 'MAD')}</p>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {[
              { key: 'invoices', label: '🧾 Factures', count: invoices.length },
              { key: 'quotes', label: '📄 Devis', count: quotes.length },
              { key: 'orders', label: '📋 Commandes', count: orders.length },
              { key: 'deliveries', label: '🚚 Livraisons', count: deliveries.length },
            ].map(tab => (
              <button
                key={tab.key}
                className={`filter-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 20, marginTop: -1 }}>
            {/* Factures */}
            {activeTab === 'invoices' && (
              invoices.length === 0 ? (
                <p className="empty-state">Aucune facture</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Facture</th><th>Montant</th><th>Statut</th><th>Échéance</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td><strong>#{inv.id.slice(0, 8)}</strong></td>
                        <td><strong>{formatCurrencyAmount(inv.total, inv.currency)}</strong></td>
                        <td><span className={`status-badge ${getStatusColor(inv.status)}`}>{inv.status}</span></td>
                        <td>{new Date(inv.dueDate).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <button className="btn btn-small" onClick={() => exportSingleInvoice(inv)} title="Télécharger">📥</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Devis */}
            {activeTab === 'quotes' && (
              quotes.length === 0 ? (
                <p className="empty-state">Aucun devis</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Devis</th><th>Montant</th><th>Statut</th><th>Valide jusqu'au</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {quotes.map(q => (
                      <tr key={q.id}>
                        <td><strong>#{q.id.slice(0, 8)}</strong></td>
                        <td><strong>{formatCurrencyAmount(q.total, q.currency)}</strong></td>
                        <td><span className={`status-badge ${getStatusColor(q.status)}`}>{q.status}</span></td>
                        <td>{new Date(q.validUntil).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <button className="btn btn-small" onClick={() => generateQuotePDF(q, selectedClient)} title="Télécharger PDF">📥</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Commandes */}
            {activeTab === 'orders' && (
              orders.length === 0 ? (
                <p className="empty-state">Aucune commande</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Commande</th><th>Montant</th><th>Statut</th><th>Livraison prévue</th></tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td><strong>#{o.id.slice(0, 8)}</strong></td>
                        <td><strong>{formatCurrencyAmount(o.total, o.currency)}</strong></td>
                        <td><span className={`status-badge ${getStatusColor(o.status)}`}>{o.status.replace('_', ' ')}</span></td>
                        <td>{new Date(o.deliveryDate).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Livraisons */}
            {activeTab === 'deliveries' && (
              deliveries.length === 0 ? (
                <p className="empty-state">Aucune livraison</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Livraison</th><th>Statut</th><th>Date</th><th>Avancement</th></tr>
                  </thead>
                  <tbody>
                    {deliveries.map(d => {
                      const totalExpected = d.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalDelivered = d.items.reduce((sum, item) => sum + item.delivered, 0);
                      const progress = totalExpected > 0 ? Math.round((totalDelivered / totalExpected) * 100) : 0;

                      return (
                        <tr key={d.id}>
                          <td><strong>#{d.id.slice(0, 8)}</strong></td>
                          <td><span className={`status-badge ${getStatusColor(d.status)}`}>{d.status.replace('_', ' ')}</span></td>
                          <td>{new Date(d.deliveryDate).toLocaleDateString('fr-FR')}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 8 }}>
                                <div style={{ width: `${progress}%`, background: progress === 100 ? '#16a34a' : '#2563eb', borderRadius: 4, height: 8 }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{progress}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ padding: 60 }}>
          <p style={{ fontSize: '1.2rem' }}>👤 Sélectionnez un client</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Choisissez un client pour voir ses données</p>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
