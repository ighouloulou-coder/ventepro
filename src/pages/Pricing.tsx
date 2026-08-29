import React, { useState, useEffect } from 'react';
import { priceTierStorage, clientStorage, productStorage } from '../services/storage';
import { PriceTier, Client, Product } from '../types';
import { formatCurrencyAmount } from '../services/storage';
import { sanitizeAmount, sanitizeQuantity } from '../services/sanitize';
import { v4 as uuidv4 } from 'uuid';

const Pricing: React.FC = () => {
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
  const [filterClient, setFilterClient] = useState<string>('all');
  const [formData, setFormData] = useState({
    clientId: '',
    productId: '',
    price: '',
    minQuantity: '1',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setTiers(priceTierStorage.getAll());
    setClients(clientStorage.getAll());
    setProducts(productStorage.getAll());
  };

  const openModal = (tier?: PriceTier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        clientId: tier.clientId,
        productId: tier.productId,
        price: tier.price.toString(),
        minQuantity: tier.minQuantity.toString(),
      });
    } else {
      setEditingTier(null);
      setFormData({ clientId: '', productId: '', price: '', minQuantity: '1' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTier(null);
    setFormData({ clientId: '', productId: '', price: '', minQuantity: '1' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.productId) {
      alert('Veuillez sélectionner un client et un produit');
      return;
    }

    const tierData: PriceTier = {
      id: editingTier?.id || uuidv4(),
      clientId: formData.clientId,
      productId: formData.productId,
      price: sanitizeAmount(formData.price),
      minQuantity: sanitizeQuantity(formData.minQuantity),
      createdAt: editingTier?.createdAt || new Date().toISOString(),
    };

    if (editingTier) {
      priceTierStorage.update(editingTier.id, tierData);
    } else {
      priceTierStorage.create(tierData);
    }

    loadData();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer ce tarif ?')) {
      priceTierStorage.delete(id);
      loadData();
    }
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Client inconnu';
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Produit inconnu';
  };

  const getProductBasePrice = (productId: string) => {
    return products.find(p => p.id === productId)?.price || 0;
  };

  const filteredTiers = filterClient === 'all' ? tiers : tiers.filter(t => t.clientId === filterClient);

  // Stats par client
  const clientStats = clients.map(client => {
    const clientTiers = tiers.filter(t => t.clientId === client.id);
    return {
      client,
      tierCount: clientTiers.length,
      avgDiscount: clientTiers.length > 0
        ? clientTiers.reduce((sum, t) => {
            const base = getProductBasePrice(t.productId);
            return sum + (base > 0 ? ((base - t.price) / base) * 100 : 0);
          }, 0) / clientTiers.length
        : 0,
    };
  });

  return (
    <div className="page">
      <div className="page-header">
        <h2>💲 Tarification par Client</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>+ Nouveau Tarif</button>
      </div>

      {/* Stats */}
      {clientStats.filter(s => s.tierCount > 0).length > 0 && (
        <div className="category-stats">
          {clientStats.filter(s => s.tierCount > 0).map(stat => (
            <div key={stat.client.id} className="category-stat-card">
              <h4>{stat.client.name}</h4>
              <p>{stat.tierCount} tarif{stat.tierCount > 1 ? 's' : ''}</p>
              <p className="stat-value" style={{ color: stat.avgDiscount > 0 ? '#16a34a' : '#6b7280' }}>
                {stat.avgDiscount > 0 ? `-${stat.avgDiscount.toFixed(1)}%` : 'Prix standard'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filtre par client */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${filterClient === 'all' ? 'active' : ''}`}
          onClick={() => setFilterClient('all')}
        >
          Tous les clients ({tiers.length})
        </button>
        {clients.map(client => (
          <button
            key={client.id}
            className={`filter-btn ${filterClient === client.id ? 'active' : ''}`}
            onClick={() => setFilterClient(client.id)}
          >
            {client.name} ({tiers.filter(t => t.clientId === client.id).length})
          </button>
        ))}
      </div>

      {tiers.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: 8 }}>💲 Aucun tarif configuré</p>
          <p style={{ color: 'var(--text-muted)' }}>Ajoutez des tarifs spéciaux pour vos clients industriels</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Produit</th>
              <th>Prix Standard</th>
              <th>Prix Spécial</th>
              <th>Remise</th>
              <th>Qté Min.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTiers.map(tier => {
              const basePrice = getProductBasePrice(tier.productId);
              const discount = basePrice > 0 ? ((basePrice - tier.price) / basePrice * 100) : 0;
              return (
                <tr key={tier.id}>
                  <td><strong>{getClientName(tier.clientId)}</strong></td>
                  <td>{getProductName(tier.productId)}</td>
                  <td>{formatCurrencyAmount(basePrice)}</td>
                  <td><strong style={{ color: 'var(--text-primary-brand)' }}>{formatCurrencyAmount(tier.price)}</strong></td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: discount > 0 ? '#dcfce7' : '#f3f4f6',
                      color: discount > 0 ? '#166534' : '#6b7280',
                    }}>
                      {discount > 0 ? `-${discount.toFixed(1)}%` : 'Standard'}
                    </span>
                  </td>
                  <td>{tier.minQuantity}</td>
                  <td className="actions">
                    <button className="btn btn-small" onClick={() => openModal(tier)} title="Modifier">✏️</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(tier.id)} title="Supprimer">🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingTier ? 'Modifier le Tarif' : 'Nouveau Tarif'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Client *</label>
                <select
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  required
                  disabled={!!editingTier}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Produit *</label>
                <select
                  value={formData.productId}
                  onChange={e => {
                    const productId = e.target.value;
                    setFormData({ ...formData, productId });
                    // Pré-remplir le prix standard
                    const product = products.find(p => p.id === productId);
                    if (product && !formData.price) {
                      setFormData(prev => ({ ...prev, productId, price: product.price.toString() }));
                    }
                  }}
                  required
                  disabled={!!editingTier}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatCurrencyAmount(p.price)}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prix spécial (MAD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                  {formData.productId && (
                    <p className="help-text">
                      Prix standard: {formatCurrencyAmount(getProductBasePrice(formData.productId))}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Quantité minimum</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={e => setFormData({ ...formData, minQuantity: e.target.value })}
                  />
                  <p className="help-text">Le prix s'applique à partir de cette quantité</p>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">
                  {editingTier ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
