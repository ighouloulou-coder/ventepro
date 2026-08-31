import React, { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';
import { orderStorage, clientStorage, productStorage, priceTierStorage } from '../services/storage';
import { useSyncReload } from '../hooks/useSyncReload';
import { Order, OrderItem, Client, Product, Currency } from '../types';
import { formatCurrencyAmount } from '../services/storage';
import { sanitizeAmount, sanitizeQuantity, sanitizeInput } from '../services/sanitize';
import { v4 as uuidv4 } from 'uuid';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClientAddresses, setSelectedClientAddresses] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    taxRate: '20',
    currency: 'MAD' as Currency,
    deliveryDate: '',
    deliveryAddress: '',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    loadData();
    // Vérifier si on convertit un devis
    const convertData = localStorage.getItem('convertQuote');
    if (convertData) {
      const quote = JSON.parse(convertData);
      prefillFromQuote(quote);
      localStorage.removeItem('convertQuote');
    }
  }, []);

  const stableLoadData = useCallback(() => {
    loadData();
  }, []);
  useSyncReload(stableLoadData, 'tradelink_orders');

  const loadData = () => {
    setOrders(orderStorage.getAll());
    setClients(clientStorage.getAll());
    setProducts(productStorage.getAll());
  };

  const prefillFromQuote = (quote: any) => {
    const client = clients.find(c => c.id === quote.clientId) || null;
    if (client) {
      setSelectedClientAddresses(client.deliveryAddresses?.map(a => a.address) || []);
    }
    setFormData({
      clientId: quote.clientId,
      taxRate: quote.taxRate.toString(),
      currency: quote.currency,
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryAddress: client?.deliveryAddresses?.[0]?.address || '',
      notes: `Converti depuis devis #${quote.id.slice(0, 8)}`,
    });
    setOrderItems(quote.items.map((item: any) => ({
      ...item,
      unit: item.unit || 'pièce',
    })));
    setIsModalOpen(true);
  };

  const openModal = () => {
    setFormData({
      clientId: '',
      taxRate: '20',
      currency: 'MAD',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryAddress: '',
      notes: '',
    });
    setOrderItems([]);
    setSelectedClientAddresses([]);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setOrderItems([]); };
  const openDetail = (order: Order) => { setSelectedOrder(order); setIsDetailOpen(true); };
  const closeDetail = () => { setIsDetailOpen(false); setSelectedOrder(null); };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, clientId });
    const client = clients.find(c => c.id === clientId);
    if (client?.deliveryAddresses) {
      setSelectedClientAddresses(client.deliveryAddresses.map(a => `${a.label}: ${a.address}, ${a.city}`));
      if (client.deliveryAddresses[0]) {
        setFormData(prev => ({ ...prev, clientId, deliveryAddress: client.deliveryAddresses[0].address }));
      }
    } else {
      setSelectedClientAddresses([]);
    }
  };

  const addItem = () => {
    setOrderItems([...orderItems, { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0, unit: 'pièce' }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    const item = { ...updated[index] };
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productId = product.id;
        item.productName = product.name;
        item.unit = product.unit;
        const specialPrice = priceTierStorage.getProductPrice(formData.clientId, product.id, item.quantity);
        item.unitPrice = specialPrice ?? product.price;
        item.total = item.unitPrice * item.quantity;
      }
    } else if (field === 'quantity') {
      item.quantity = sanitizeQuantity(value);
      item.total = item.unitPrice * item.quantity;
    } else if (field === 'unitPrice') {
      item.unitPrice = sanitizeAmount(value);
      item.total = item.unitPrice * item.quantity;
    }
    updated[index] = item;
    setOrderItems(updated);
  };

  const removeItem = (index: number) => setOrderItems(orderItems.filter((_, i) => i !== index));

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) { alert('Ajoutez au moins un produit'); return; }

    const client = clients.find(c => c.id === formData.clientId);
    const { subtotal, tax, total } = calculateTotals();

    const order: Order = {
      id: uuidv4(),
      clientId: formData.clientId,
      clientName: client?.name || 'Client inconnu',
      items: orderItems,
      subtotal, tax,
      taxRate: parseFloat(formData.taxRate),
      total,
      currency: formData.currency,
      status: 'en_attente',
      deliveryDate: formData.deliveryDate,
      deliveryAddress: formData.deliveryAddress,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    orderStorage.create(order);
    loadData();
    closeModal();
  };

  const updateStatus = (id: string, status: Order['status']) => {
    orderStorage.update(id, { status });
    loadData();
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder!, status });
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livrée': return 'status-paid';
      case 'confirmée': case 'en_cours': return 'status-sent';
      case 'expédiée': return 'status-sent';
      case 'en_attente': return 'status-draft';
      case 'annulée': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <AnimatedPage>
    <div className="page" style={{ position: 'relative', zIndex: 1 }}>
      <FloatingShapes />
      <div className="page-header">
        <h2>📋 Bons de Commande</h2>
        <button className="btn btn-primary" onClick={openModal}>+ Nouvelle Commande</button>
      </div>

      <div className="filter-bar">
        {['all', 'en_attente', 'confirmée', 'en_cours', 'expédiée', 'livrée', 'annulée'].map(status => (
          <button key={status} className={`filter-btn ${filterStatus === status ? 'active' : ''}`} onClick={() => setFilterStatus(status)}>
            {status === 'all' ? 'Toutes' : status.replace('_', ' ')} ({status === 'all' ? orders.length : orders.filter(o => o.status === status).length})
          </button>
        ))}
      </div>

      <table className="data-table">
        <thead>
          <tr><th>Commande</th><th>Client</th><th>Total</th><th>Devise</th><th>Statut</th><th>Livraison</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr><td colSpan={8} className="empty-state">Aucune commande</td></tr>
          ) : (
            filteredOrders.map(order => (
              <tr key={order.id}>
                <td><strong>#{order.id.slice(0, 8)}</strong></td>
                <td>{order.clientName}</td>
                <td><strong>{formatCurrencyAmount(order.total, order.currency)}</strong></td>
                <td>{order.currency}</td>
                <td><span className={`status-badge ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span></td>
                <td>{new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</td>
                <td className="actions">
                  <button className="btn btn-small" onClick={() => openDetail(order)} title="Voir">👁️</button>
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '0.8em', padding: '4px 8px' }}
                    value={order.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Order['status'];
                      if (newStatus === 'annulée') {
                        if (window.confirm('Annuler cette commande ?')) {
                          updateStatus(order.id, newStatus);
                        }
                      } else {
                        updateStatus(order.id, newStatus);
                      }
                    }}
                  >
                    <option value="en_attente">⏳ En attente</option>
                    <option value="confirmée">✅ Confirmée</option>
                    <option value="en_cours">🚚 En cours</option>
                    <option value="expédiée">📦 Expédiée</option>
                    <option value="livrée">✔️ Livrée</option>
                    <option value="annulée">❌ Annulée</option>
                  </select>
                  <button className="btn btn-small btn-danger" onClick={() => {
                    if (window.confirm('Supprimer cette commande ?')) { orderStorage.delete(order.id); loadData(); }
                  }} title="Supprimer">🗑️</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Nouvelle Commande */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h3>Créer une Commande</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Client *</label>
                  <select value={formData.clientId} onChange={e => handleClientChange(e.target.value)} required>
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Devise</label>
                  <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}>
                    <option value="MAD">🇲🇦 MAD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="USD">🇺🇸 USD</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date de livraison prévue</label>
                <input type="date" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Adresse de livraison</label>
                {selectedClientAddresses.length > 0 ? (
                  <select value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })}>
                    {selectedClientAddresses.map((addr, i) => (
                      <option key={i} value={addr}>{addr}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} placeholder="Adresse de livraison..." />
                )}
              </div>

              <div className="form-group">
                <label>TVA (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={formData.taxRate} onChange={e => setFormData({ ...formData, taxRate: e.target.value })} />
              </div>

              <div className="invoice-items">
                <div className="invoice-items-header">
                  <h4>Produits</h4>
                  <button type="button" className="btn btn-small" onClick={addItem}>+ Ajouter</button>
                </div>
                {orderItems.length === 0 ? (
                  <p className="empty-state">Aucun produit ajouté</p>
                ) : (
                  <div className="invoice-items-list">
                    {orderItems.map((item, index) => (
                      <div key={index} className="invoice-item">
                        <select value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)} required>
                          <option value="">Choisir un produit</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrencyAmount(p.price)}</option>)}
                        </select>
                        <input type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                        <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} />
                        <span className="item-total">{formatCurrencyAmount(item.total, formData.currency)}</span>
                        <button type="button" className="btn btn-small btn-danger" onClick={() => removeItem(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {orderItems.length > 0 && (
                <div className="invoice-summary">
                  <div>Sous-total: <strong>{formatCurrencyAmount(calculateTotals().subtotal, formData.currency)}</strong></div>
                  <div>TVA ({formData.taxRate}%): <strong>{formatCurrencyAmount(calculateTotals().tax, formData.currency)}</strong></div>
                  <div className="invoice-total">Total: <strong>{formatCurrencyAmount(calculateTotals().total, formData.currency)}</strong></div>
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: sanitizeInput(e.target.value) })} placeholder="Instructions spéciales..." />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer la Commande</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {isDetailOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h3>Commande #{selectedOrder.id.slice(0, 8)}</h3>
              <span className={`status-badge ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status.replace('_', ' ')}</span>
            </div>
            <div className="invoice-detail">
              <div className="detail-row"><span>Client:</span><strong>{selectedOrder.clientName}</strong></div>
              <div className="detail-row"><span>Adresse livraison:</span><strong>{selectedOrder.deliveryAddress || 'Non renseignée'}</strong></div>
              <div className="detail-row"><span>Date livraison prévue:</span><strong>{new Date(selectedOrder.deliveryDate).toLocaleDateString('fr-FR')}</strong></div>
              <div className="detail-row"><span>Devise:</span><strong>{selectedOrder.currency}</strong></div>
            </div>
            <table className="detail-table">
              <thead><tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead>
              <tbody>
                {selectedOrder.items.map((item, i) => (
                  <tr key={i}><td>{item.productName}</td><td>{item.quantity} {item.unit}</td><td>{formatCurrencyAmount(item.unitPrice, selectedOrder.currency)}</td><td>{formatCurrencyAmount(item.total, selectedOrder.currency)}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={3}>Sous-total</td><td>{formatCurrencyAmount(selectedOrder.subtotal, selectedOrder.currency)}</td></tr>
                <tr><td colSpan={3}>TVA ({selectedOrder.taxRate}%)</td><td>{formatCurrencyAmount(selectedOrder.tax, selectedOrder.currency)}</td></tr>
                <tr className="total-row"><td colSpan={3}><strong>Total</strong></td><td><strong>{formatCurrencyAmount(selectedOrder.total, selectedOrder.currency)}</strong></td></tr>
              </tfoot>
            </table>
            {selectedOrder.notes && <p style={{ marginTop: 16, fontStyle: 'italic', color: 'var(--text-muted)' }}>📝 {selectedOrder.notes}</p>}
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

export default Orders;
