import React, { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';
import { deliveryStorage, orderStorage, clientStorage } from '../services/storage';
import { useSyncReload } from '../hooks/useSyncReload';
import { DeliveryNote, DeliveryItem, Order } from '../types';
import { sanitizeInput } from '../services/sanitize';
import { v4 as uuidv4 } from 'uuid';

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryNote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryNote | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    orderId: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    driverName: '',
    vehiclePlate: '',
    notes: '',
  });
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);

  useEffect(() => { loadData(); }, []);

  const stableLoadData = useCallback(() => {
    loadData();
  }, []);
  useSyncReload(stableLoadData, 'tradelink_deliveries');

  const loadData = () => {
    setDeliveries(deliveryStorage.getAll());
    setOrders(orderStorage.getAll().filter(o => o.status !== 'annulée'));
    setClients(clientStorage.getAll());
  };

  const openModal = () => {
    setFormData({
      orderId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      driverName: '',
      vehiclePlate: '',
      notes: '',
    });
    setDeliveryItems([]);
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setDeliveryItems([]); setSelectedOrder(null); };

  const handleOrderChange = (orderId: string) => {
    setFormData({ ...formData, orderId });
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setDeliveryItems(order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit || 'pièce',
        delivered: 0,
        returned: 0,
      })));
    }
  };

  const updateDeliveryItem = (index: number, field: 'delivered' | 'returned', value: number) => {
    const updated = [...deliveryItems];
    updated[index] = { ...updated[index], [field]: Math.max(0, value) };
    setDeliveryItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderId) { alert('Sélectionnez une commande'); return; }
    if (deliveryItems.length === 0) { alert('Ajoutez des produits'); return; }

    const order = orders.find(o => o.id === formData.orderId);
    const client = clients.find(c => c.id === order?.clientId);

    const delivery: DeliveryNote = {
      id: uuidv4(),
      orderId: formData.orderId,
      clientId: order?.clientId || '',
      clientName: client?.name || 'Client inconnu',
      items: deliveryItems,
      deliveryAddress: order?.deliveryAddress || '',
      deliveryDate: formData.deliveryDate,
      status: 'préparation',
      driverName: formData.driverName,
      vehiclePlate: formData.vehiclePlate,
      signatureReceived: false,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    deliveryStorage.create(delivery);
    loadData();
    closeModal();
  };

  const updateStatus = (id: string, status: DeliveryNote['status']) => {
    deliveryStorage.update(id, { status });
    loadData();
    if (selectedDelivery?.id === id) setSelectedDelivery({ ...selectedDelivery!, status });
  };

  const openDetail = (delivery: DeliveryNote) => { setSelectedDelivery(delivery); setIsDetailOpen(true); };
  const closeDetail = () => { setIsDetailOpen(false); setSelectedDelivery(null); };

  const filteredDeliveries = filterStatus === 'all' ? deliveries : deliveries.filter(d => d.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livré': return 'status-paid';
      case 'en_cours': return 'status-sent';
      case 'préparation': return 'status-draft';
      case 'retour_partiel': case 'retour_complet': return 'status-cancelled';
      default: return '';
    }
  };

  const getCompletionRate = (delivery: DeliveryNote) => {
    const totalExpected = delivery.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalDelivered = delivery.items.reduce((sum, item) => sum + item.delivered, 0);
    if (totalExpected === 0) return 0;
    return Math.round((totalDelivered / totalExpected) * 100);
  };

  return (
    <AnimatedPage>
    <div className="page" style={{ position: 'relative', zIndex: 1 }}>
      <FloatingShapes />
      <div className="page-header">
        <h2>🚚 Bons de Livraison</h2>
        <button className="btn btn-primary" onClick={openModal}>+ Nouveau Bon de Livraison</button>
      </div>

      <div className="filter-bar">
        {['all', 'préparation', 'en_cours', 'livré', 'retour_partiel', 'retour_complet'].map(status => (
          <button key={status} className={`filter-btn ${filterStatus === status ? 'active' : ''}`} onClick={() => setFilterStatus(status)}>
            {status === 'all' ? 'Tous' : status.replace('_', ' ')} ({status === 'all' ? deliveries.length : deliveries.filter(d => d.status === status).length})
          </button>
        ))}
      </div>

      <table className="data-table">
        <thead>
          <tr><th>Bon #</th><th>Client</th><th>Commande</th><th>Chauffeur</th><th>Plaque</th><th>Avancement</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filteredDeliveries.length === 0 ? (
            <tr><td colSpan={9} className="empty-state">Aucun bon de livraison</td></tr>
          ) : (
            filteredDeliveries.map(delivery => (
              <tr key={delivery.id}>
                <td><strong>#{delivery.id.slice(0, 8)}</strong></td>
                <td>{delivery.clientName}</td>
                <td>#{delivery.orderId.slice(0, 8)}</td>
                <td>{delivery.driverName || '-'}</td>
                <td>{delivery.vehiclePlate || '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 8 }}>
                      <div style={{ width: `${getCompletionRate(delivery)}%`, background: delivery.status === 'livré' ? '#16a34a' : '#2563eb', borderRadius: 4, height: 8 }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getCompletionRate(delivery)}%</span>
                  </div>
                </td>
                <td><span className={`status-badge ${getStatusColor(delivery.status)}`}>{delivery.status.replace('_', ' ')}</span></td>
                <td>{new Date(delivery.deliveryDate).toLocaleDateString('fr-FR')}</td>
                <td className="actions">
                  <button className="btn btn-small" onClick={() => openDetail(delivery)} title="Voir">👁️</button>
                  {delivery.status === 'préparation' && (
                    <button className="btn btn-small" onClick={() => updateStatus(delivery.id, 'en_cours')} title="En cours">🚚</button>
                  )}
                  {delivery.status === 'en_cours' && (
                    <button className="btn btn-small btn-success" onClick={() => updateStatus(delivery.id, 'livré')} title="Livrée">✅</button>
                  )}
                  <button className="btn btn-small btn-danger" onClick={() => {
                    if (window.confirm('Supprimer ce bon ?')) { deliveryStorage.delete(delivery.id); loadData(); }
                  }}>🗑️</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Nouveau Bon */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h3>Créer un Bon de Livraison</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Commande *</label>
                <select value={formData.orderId} onChange={e => handleOrderChange(e.target.value)} required>
                  <option value="">Sélectionner une commande</option>
                  {orders.filter(o => o.status !== 'annulée' && o.status !== 'livrée').map(o => (
                    <option key={o.id} value={o.id}>#{o.id.slice(0, 8)} - {o.clientName} ({o.items.length} produits)</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date de livraison</label>
                  <input type="date" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Chauffeur</label>
                  <input type="text" value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: sanitizeInput(e.target.value) })} placeholder="Nom du chauffeur..." />
                </div>
              </div>

              <div className="form-group">
                <label>Immatriculation véhicule</label>
                <input type="text" value={formData.vehiclePlate} onChange={e => setFormData({ ...formData, vehiclePlate: sanitizeInput(e.target.value) })} placeholder="AA-123-BB" />
              </div>

              {selectedOrder && (
                <div className="invoice-items">
                  <h4>Produits à livrer</h4>
                  <table className="detail-table" style={{ marginTop: 8 }}>
                    <thead><tr><th>Produit</th><th>Commandé</th><th>Livré</th><th>Retour</th></tr></thead>
                    <tbody>
                      {deliveryItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity} {item.unit}</td>
                          <td><input type="number" min="0" max={item.quantity} value={item.delivered} onChange={e => updateDeliveryItem(index, 'delivered', parseInt(e.target.value) || 0)} style={{ width: 80, padding: 4 }} /></td>
                          <td><input type="number" min="0" max={item.delivered} value={item.returned} onChange={e => updateDeliveryItem(index, 'returned', parseInt(e.target.value) || 0)} style={{ width: 80, padding: 4 }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: sanitizeInput(e.target.value) })} placeholder="Remarques sur la livraison..." />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer le Bon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {isDetailOpen && selectedDelivery && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h3>Bon de Livraison #{selectedDelivery.id.slice(0, 8)}</h3>
              <span className={`status-badge ${getStatusColor(selectedDelivery.status)}`}>{selectedDelivery.status.replace('_', ' ')}</span>
            </div>
            <div className="invoice-detail">
              <div className="detail-row"><span>Client:</span><strong>{selectedDelivery.clientName}</strong></div>
              <div className="detail-row"><span>Commande:</span><strong>#{selectedDelivery.orderId.slice(0, 8)}</strong></div>
              <div className="detail-row"><span>Chauffeur:</span><strong>{selectedDelivery.driverName || '-'}</strong></div>
              <div className="detail-row"><span>Véhicule:</span><strong>{selectedDelivery.vehiclePlate || '-'}</strong></div>
              <div className="detail-row"><span>Date livraison:</span><strong>{new Date(selectedDelivery.deliveryDate).toLocaleDateString('fr-FR')}</strong></div>
              <div className="detail-row"><span>Adresse:</span><strong>{selectedDelivery.deliveryAddress || '-'}</strong></div>
            </div>
            <table className="detail-table">
              <thead><tr><th>Produit</th><th>Commandé</th><th>Livré</th><th>Retour</th></tr></thead>
              <tbody>
                {selectedDelivery.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.productName}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td style={{ color: item.delivered === item.quantity ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{item.delivered}</td>
                    <td style={{ color: item.returned > 0 ? '#dc2626' : '#6b7280' }}>{item.returned > 0 ? item.returned : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedDelivery.notes && <p style={{ marginTop: 16, fontStyle: 'italic', color: 'var(--text-muted)' }}>📝 {selectedDelivery.notes}</p>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeDetail}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Deliveries;
