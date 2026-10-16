import React, { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';
import { deliveryStorage, orderStorage, clientStorage, productStorage, invoiceStorage } from '../services/storage';
import { useSyncReload } from '../hooks/useSyncReload';
import { DeliveryNote, DeliveryItem, Order, Invoice, InvoiceItem } from '../types';
import { sanitizeInput } from '../services/sanitize';
import { v4 as uuidv4 } from 'uuid';

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryNote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; price: number; unit: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryNote | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modeBL, setModeBL] = useState<'commande' | 'direct'>('direct');
  const [directClientId, setDirectClientId] = useState('');
  const [directItems, setDirectItems] = useState<DeliveryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
    setProducts(productStorage.getAll().map(p => ({ id: p.id, name: p.name, price: p.price, unit: p.unit })));
  };

  const openModal = () => {
    setModeBL('direct');
    setDirectClientId('');
    setDirectItems([]);
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

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      orderId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      driverName: '',
      vehiclePlate: '',
      notes: '',
    });
    setDeliveryItems([]);
    setDirectItems([]);
    setDirectClientId('');
    setSelectedOrder(null);
  };

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

  // ================== Mode direct : client + produits ==================
  const addDirectItem = () => {
    setDirectItems([
      ...directItems,
      { productId: '', productName: '', quantity: 1, unit: 'pièce', delivered: 1, returned: 0 },
    ]);
  };

  const updateDirectItem = (index: number, field: 'productId' | 'quantity' | 'delivered', value: number | string) => {
    const updated = [...directItems];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index] = { ...updated[index], productId: product.id, productName: product.name, unit: product.unit, delivered: 1, returned: 0 };
      }
    } else if (field === 'quantity') {
      const qty = Math.max(1, value as number);
      updated[index] = { ...updated[index], quantity: qty, delivered: qty };
    } else if (field === 'delivered') {
      updated[index] = { ...updated[index], delivered: Math.max(0, value as number) };
    }
    setDirectItems(updated);
  };

  const removeDirectItem = (index: number) => {
    setDirectItems(directItems.filter((_, i) => i !== index));
  };

  // ================== Transfert BL → Facture ==================
  const transferToInvoice = (ids: string[]) => {
    const list = deliveries.filter(d => ids.includes(d.id) && !d.transferredToInvoice);
    if (list.length === 0) { alert('Aucun BL à transférer (déjà facturé ?)'); return; }

    const clientIds = [...new Set(list.map(d => d.clientId))];
    if (clientIds.length !== 1) {
      alert('❌ La facture regroupe plusieurs BL du MÊME client. Vos BL sélectionnés concernent plusieurs clients — sélectionnez-les séparément.');
      return;
    }

    // Agréger les quantités livrées par produit
    const itemsMap = new Map<string, InvoiceItem>();
    let prixManquants = 0;
    for (const d of list) {
      for (const it of d.items) {
        const qty = it.delivered > 0 ? it.delivered : it.quantity;
        if (qty <= 0) continue;
        const product = productStorage.getById(it.productId);
        const unitPrice = product?.price ?? 0;
        if (unitPrice === 0) prixManquants++;
        const key = it.productId || it.productName;
        const existing = itemsMap.get(key);
        if (existing) {
          existing.quantity += qty;
          existing.total = existing.quantity * existing.unitPrice;
        } else {
          itemsMap.set(key, {
            productId: it.productId,
            productName: it.productName,
            quantity: qty,
            unitPrice,
            total: qty * unitPrice,
            unit: it.unit || 'pièce',
          });
        }
      }
    }

    const items = [...itemsMap.values()];
    if (items.length === 0) {
      alert('❌ Aucune quantité livrée à facturer sur ces BL.');
      return;
    }

    const client = clientStorage.getById(list[0].clientId);
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const taxRate = 20;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    const paymentTerms = client?.paymentTerms || 30;

    const confirmMsg = list.length === 1
      ? `Transférer le BL #${list[0].id.slice(0, 8)} vers une facture de ${total.toFixed(2)} MAD ?`
      : `Fusionner ${list.length} BL du client ${client?.name || 'inconnu'} en une facture de ${total.toFixed(2)} MAD ?`;
    if (!window.confirm(confirmMsg)) return;

    // Prix inconnus → on laisse la facture en brouillon pour vérification
    const notes = `Transféré depuis ${list.length === 1 ? 'le BL' : 'les BL'} ${list.map(d => '#' + d.id.slice(0, 8)).join(', ')}${prixManquants > 0 ? ` — ⚠️ ${prixManquants} ligne(s) sans prix de vente, à vérifier` : ''}`;

    // orderId : Firestore refuse la valeur undefined → n'assigner que si présent
    const linkedOrderId = list.find(d => d.orderId)?.orderId;
    const invoice: Invoice = {
      id: uuidv4(),
      ...(linkedOrderId ? { orderId: linkedOrderId } : {}),
      clientId: list[0].clientId,
      clientName: client?.name || list[0].clientName,
      items,
      subtotal,
      taxRate,
      tax,
      total,
      currency: 'MAD',
      status: 'brouillon',
      paymentTerms,
      paidAmount: 0,
      notes,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + paymentTerms * 24 * 60 * 60 * 1000).toISOString(),
    };

    invoiceStorage.create(invoice);
    for (const d of list) {
      deliveryStorage.update(d.id, { transferredToInvoice: invoice.id });
    }
    loadData();
    alert(`✅ Facture créée pour ${client?.name || ''} (${list.length} BL, ${total.toFixed(2)} MAD). Elle est dans la page Factures en brouillon.`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const transferables = filteredDeliveries.filter(d => !d.transferredToInvoice);
    if (selectedIds.length === transferables.length && transferables.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transferables.map(d => d.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (modeBL === 'commande') {
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
      return;
    }

    // Mode direct : client + produits
    if (!directClientId) { alert('Sélectionnez un client'); return; }
    const validItems = directItems.filter(it => it.productId && it.quantity > 0);
    if (validItems.length === 0) { alert('Ajoutez au moins un produit avec une quantité'); return; }

    const client = clientStorage.getById(directClientId);
    const delivery: DeliveryNote = {
      id: uuidv4(),
      orderId: '',
      clientId: directClientId,
      clientName: client?.name || 'Client inconnu',
      items: validItems,
      deliveryAddress: client?.address || '',
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
  const transferables = filteredDeliveries.filter(d => !d.transferredToInvoice);

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
        <div className="header-actions">
          {selectedIds.length > 0 && (
            <button className="btn btn-success" onClick={() => transferToInvoice(selectedIds)}>
              🧾 Transférer {selectedIds.length} BL → Facture
            </button>
          )}
          <button className="btn btn-primary" onClick={openModal}>+ Nouveau Bon de Livraison</button>
        </div>
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
          <tr>
            <th style={{ width: 34 }}><input type="checkbox" checked={transferables.length > 0 && selectedIds.length === transferables.length} onChange={toggleSelectAll} title="Tout sélectionner" /></th>
            <th>Bon #</th><th>Client</th><th>Commande</th><th>Chauffeur</th><th>Plaque</th><th>Avancement</th><th>Statut</th><th>Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDeliveries.length === 0 ? (
            <tr><td colSpan={10} className="empty-state">Aucun bon de livraison</td></tr>
          ) : (
            filteredDeliveries.map(delivery => (
              <tr key={delivery.id} style={selectedIds.includes(delivery.id) ? { background: 'rgba(59,130,246,0.08)' } : undefined}>
                <td>
                  {delivery.transferredToInvoice ? (
                    <span title={`Facturé → facture ${delivery.transferredToInvoice.slice(0, 8)}`}>✅</span>
                  ) : (
                    <input type="checkbox" checked={selectedIds.includes(delivery.id)} onChange={() => toggleSelect(delivery.id)} />
                  )}
                </td>
                <td><strong>#{delivery.id.slice(0, 8)}</strong>{delivery.transferredToInvoice && <span className="status-badge status-sent" style={{ marginLeft: 6 }}>Facturé</span>}</td>
                <td>{delivery.clientName}</td>
                <td>{delivery.orderId ? `#${delivery.orderId.slice(0, 8)}` : '—'}</td>
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
                  <button
                    className="btn btn-small"
                    onClick={() => transferToInvoice([delivery.id])}
                    title={delivery.transferredToInvoice ? 'Déjà transféré vers facture' : 'Transférer vers facture'}
                    disabled={!!delivery.transferredToInvoice}
                    style={delivery.transferredToInvoice ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                  >
                    🧾
                  </button>
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
              {/* Choix du mode */}
              <div className="form-group">
                <label>Mode de création</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" checked={modeBL === 'direct'} onChange={() => setModeBL('direct')} />
                    Direct (sélection client + produits)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" checked={modeBL === 'commande'} onChange={() => setModeBL('commande')} />
                    Depuis une commande
                  </label>
                </div>
              </div>

              {modeBL === 'commande' ? (
                <div className="form-group">
                  <label>Commande *</label>
                  <select value={formData.orderId} onChange={e => handleOrderChange(e.target.value)} required>
                    <option value="">Sélectionner une commande</option>
                    {orders.filter(o => o.status !== 'annulée' && o.status !== 'livrée').map(o => (
                      <option key={o.id} value={o.id}>#{o.id.slice(0, 8)} - {o.clientName} ({o.items.length} produits)</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Client *</label>
                    <select value={directClientId} onChange={e => setDirectClientId(e.target.value)} required>
                      <option value="">Sélectionner un client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ margin: 0 }}>Produits livrés *</label>
                      <button type="button" className="btn btn-small btn-secondary" onClick={addDirectItem}>+ Ajouter un produit</button>
                    </div>
                    {directItems.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aucun produit — cliquez sur « Ajouter un produit ».</p>
                    ) : (
                      <table className="detail-table" style={{ marginTop: 8 }}>
                        <thead><tr><th>Produit</th><th>Quantité</th><th>Unité</th><th></th></tr></thead>
                        <tbody>
                          {directItems.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <select
                                  value={item.productId}
                                  onChange={e => updateDirectItem(index, 'productId', e.target.value)}
                                  required
                                  style={{ width: '100%', padding: 4 }}
                                >
                                  <option value="">Choisir un produit</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e => updateDirectItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                  style={{ width: 80, padding: 4 }}
                                />
                              </td>
                              <td>{item.unit}</td>
                              <td>
                                <button type="button" className="btn btn-small btn-danger" onClick={() => removeDirectItem(index)}>🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

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

              {modeBL === 'commande' && selectedOrder && (
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
              <div className="detail-row"><span>Commande:</span><strong>{selectedDelivery.orderId ? `#${selectedDelivery.orderId.slice(0, 8)}` : 'Direct (sans commande)'}</strong></div>
              {selectedDelivery.transferredToInvoice && (
                <div className="detail-row"><span>Facture:</span><strong>#{selectedDelivery.transferredToInvoice.slice(0, 8)}</strong></div>
              )}
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
              {!selectedDelivery.transferredToInvoice && (
                <button
                  className="btn btn-success"
                  onClick={() => { closeDetail(); transferToInvoice([selectedDelivery.id]); }}
                >
                  🧾 Transférer vers facture
                </button>
              )}
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
