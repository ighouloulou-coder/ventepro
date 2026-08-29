import React, { useState, useEffect } from 'react';
import { SupplierDashboardStats } from '../types';
import { getSupplierDashboardStats, formatCurrencyAmount } from '../services/supplierStorage';

const SupplierDashboard: React.FC = () => {
  const [stats, setStats] = useState<SupplierDashboardStats | null>(null);

  useEffect(() => {
    setStats(getSupplierDashboardStats());
  }, []);

  if (!stats) {
    return <div className="page"><p>Chargement...</p></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>🏭 Tableau de Bord Fournisseurs</h2>
        <p style={{ color: 'var(--text-muted)' }}>Vue d'ensemble de la gestion fournisseurs</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Fournisseurs</div>
          <div className="stat-value">{stats.totalSuppliers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fournisseurs Actifs</div>
          <div className="stat-value" style={{ color: 'var(--text-success)' }}>{stats.activeSuppliers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Commandes En Cours</div>
          <div className="stat-value" style={{ color: 'var(--text-warning)' }}>{stats.pendingOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Factures En Attente</div>
          <div className="stat-value" style={{ color: 'var(--text-danger)' }}>{stats.pendingInvoices}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Livraisons En Cours</div>
          <div className="stat-value">{stats.pendingDeliveries}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Achats Totaux</div>
          <div className="stat-value">{formatCurrencyAmount(stats.totalPurchases)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Achats du Mois</div>
          <div className="stat-value" style={{ color: 'var(--text-primary-brand)' }}>{formatCurrencyAmount(stats.monthlyPurchases)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paiements En Retard</div>
          <div className="stat-value" style={{ color: 'var(--text-danger)' }}>{formatCurrencyAmount(stats.overduePayments)}</div>
        </div>
      </div>

      {/* Note Moyenne */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>⭐ Note Moyenne des Fournisseurs</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '2em', fontWeight: 700, color: 'var(--text-primary-brand)' }}>
            {stats.averageRating > 0 ? `${stats.averageRating}/5` : '—'}
          </span>
          <span style={{ fontSize: '1.5em' }}>
            {stats.averageRating > 0 ? '⭐'.repeat(Math.round(stats.averageRating)) : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Top Fournisseurs */}
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>🏆 Top Fournisseurs (par montant)</h3>
          {stats.topSuppliers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune donnée</p>
          ) : (
            <div>
              {stats.topSuppliers.map((supplier, index) => (
                <div key={index} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', marginBottom: 8, background: 'var(--bg-secondary)', borderRadius: 8,
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`} {supplier.name}
                    </div>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                      {supplier.rating > 0 ? `${'⭐'.repeat(Math.round(supplier.rating))} ${supplier.rating}/5` : 'Pas encore noté'}
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary-brand)' }}>
                    {formatCurrencyAmount(supplier.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commandes Récentes */}
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>📋 Commandes Récentes</h3>
          {stats.recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune commande</p>
          ) : (
            <div>
              {stats.recentOrders.map(order => (
                <div key={order.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', marginBottom: 8, background: 'var(--bg-secondary)', borderRadius: 8,
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{order.id}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{order.supplierName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{formatCurrencyAmount(order.total)}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workflow */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>🔄 Workflow Fournisseur</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🏭', label: 'Fournisseur', desc: 'Enregistrement' },
            { icon: '📋', label: 'Commande', desc: 'Bon de commande' },
            { icon: '✅', label: 'Confirmation', desc: 'Fournisseur confirme' },
            { icon: '🔧', label: 'Production', desc: 'Fabrication' },
            { icon: '🚚', label: 'Expédition', desc: 'En route' },
            { icon: '📦', label: 'Réception', desc: 'Contrôle qualité' },
            { icon: '💰', label: 'Paiement', desc: 'Règlement' },
          ].map((step, index) => (
            <div key={index} style={{
              textAlign: 'center', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, minWidth: 100,
            }}>
              <div style={{ fontSize: '1.5em' }}>{step.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.9em' }}>{step.label}</div>
              <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
