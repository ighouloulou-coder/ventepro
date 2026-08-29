import React, { useState, useEffect } from 'react';
import {
  SupplierOrder,
  SupplierOrderStatus,
  SupplierOrderItem,
  Currency,
  Incoterm,
  SUPPLIER_ORDER_STATUS_LABELS,
  INCOTERM_LABELS,
  Product,
} from '../types';
import { supplierOrderStorage, supplierStorage, formatCurrencyAmount } from '../services/supplierStorage';
import { productStorage } from '../services/storage';

const SupplierOrders: React.FC = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SupplierOrder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | null>(null);
  const [formData, setFormData] = useState<Partial<SupplierOrder>>({});
  const [orderItems, setOrderItems] = useState<SupplierOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SupplierOrderStatus | 'all'>('all');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadOrders();
    setProducts(productStorage.getAll());
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, filterStatus]);

  const loadOrders = () => {
    setOrders(supplierOrderStorage.getAll());
  };

  const filterOrders = () => {
    let result = orders;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.supplierName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }
    setFilteredOrders(result);
  };

  const openAddModal = () => {
    setEditingOrder(null);
    setFormData({});
    setOrderItems([]);
    setShowModal(true);
  };

  const openEditModal = (order: SupplierOrder) => {
    setEditingOrder(order);
    setFormData({ ...order });
    setOrderItems([...order.items]);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.supplierId || orderItems.length === 0) {
      alert('Sélectionnez un fournisseur et ajoutez au moins un article');
      return;
    }

    const now = new Date().toISOString();
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = formData.taxRate || 0;
    const tax = subtotal * (taxRate / 100);

    if (editingOrder) {
      supplierOrderStorage.update(editingOrder.id, {
        ...formData,
        items: orderItems,
        subtotal,
        tax,
        total: subtotal + tax,
      } as any);
    } else {
      const newOrder: SupplierOrder = {
        id: `PO-${Date.now()}`,
        supplierId: formData.supplierId!,
        supplierName: supplierStorage.getById(formData.supplierId!)?.name || '',
        items: orderItems,
        subtotal,
        taxRate,
        tax,
        total: subtotal + tax,
        currency: formData.currency || 'MAD',
        status: 'brouillon',
        expectedDeliveryDate: formData.expectedDeliveryDate || '',
        deliveryAddress: formData.deliveryAddress || '',
        incoterm: formData.incoterm || 'EXW',
        paymentStatus: 'non_payé',
        paidAmount: 0,
        notes: formData.notes || '',
        createdAt: now,
      };
      supplierOrderStorage.create(newOrder);
    }

    loadOrders();
    setShowModal(false);
  };

  const handleStatusChange = (orderId: string, newStatus: SupplierOrderStatus) => {
    supplierOrderStorage.update(orderId, { status: newStatus });
    loadOrders();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer cette commande fournisseur ?')) {
      supplierOrderStorage.delete(id);
      loadOrders();
    }
  };

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      {
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        unit: 'pièce',
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].total = updated[index].quantity * updated[index].unitPrice;
    }
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].productName = product.name;
        updated[index].unitPrice = product.purchasePrice || product.price;
        updated[index].unit = product.unit;
        updated[index].total = updated[index].quantity * updated[index].unitPrice;
      }
    }
    setOrderItems(updated);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: SupplierOrderStatus): string => {
    const colors: Record<SupplierOrderStatus, string> = {
      brouillon: 'var(--text-muted)',
      envoyée: 'var(--text-primary-brand)',
      confirmée: 'var(--text-warning)',
      en_production: 'var(--text-info)',
      expédiée: 'var(--text-success)',
      réceptionnée: 'var(--text-success)',
      annulée: 'var(--text-danger)',
    };
    return colors[status];
  };

  const getPaymentStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      non_payé: 'var(--text-danger)',
      acompte: 'var(--text-warning)',
      payé: 'var(--text-success)',
      en_retard: 'var(--text-danger)',
    };
    return colors[status] || 'var(--text-muted)';
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>📋 Commandes Fournisseurs</h2>
          <p style={{ color: 'var(--text-muted)' }}>{filteredOrders.length} commande(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Nouvelle commande
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(SUPPLIER_ORDER_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Commandes</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Cours</div>
          <div className="stat-value" style={{ color: 'var(--text-warning)' }}>
            {orders.filter(o => ['confirmée', 'en_production'].includes(o.status)).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Montant Total</div>
          <div className="stat-value">
            {formatCurrencyAmount(orders.filter(o => o.status !== 'annulée').reduce((sum, o) => sum + o.total, 0))}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Attente Paiement</div>
          <div className="stat-value" style={{ color: 'var(--text-danger)' }}>
            {orders.filter(o => o.paymentStatus === 'non_payé' || o.paymentStatus === 'en_retard').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Fournisseur</th>
              <th>Articles</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Paiement</th>
              <th>Livraison prévue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Aucune commande fournisseur
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{order.id}</td>
                  <td>{order.supplierName}</td>
                  <td>{order.items.length} article(s)</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrencyAmount(order.total, order.currency)}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as SupplierOrderStatus)}
                      className="form-input"
                      style={{ width: 'auto', borderColor: getStatusColor(order.status as SupplierOrderStatus), fontSize: '0.85em' }}
                    >
                      {Object.entries(SUPPLIER_ORDER_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span style={{ color: getPaymentStatusColor(order.paymentStatus), fontWeight: 600 }}>
                      {order.paymentStatus === 'payé' && '✅ Payé'}
                      {order.paymentStatus === 'acompte' && `💰 ${order.paidAmount}/${order.total}`}
                      {order.paymentStatus === 'non_payé' && '❌ Non payé'}
                      {order.paymentStatus === 'en_retard' && '🚨 En retard'}
                    </span>
                  </td>
                  <td>{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-small" onClick={() => openEditModal(order)} title="Modifier">✏️</button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(order.id)} title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>{editingOrder ? '✏️ Modifier la commande' : '📋 Nouvelle commande fournisseur'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Fournisseur *</label>
                  <select
                    className="form-input"
                    value={formData.supplierId || ''}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {supplierStorage.getAll().filter(s => s.status === 'actif').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Devise</label>
                  <select
                    className="form-input"
                    value={formData.currency || 'MAD'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                  >
                    <option value="MAD">MAD</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date de livraison prévue</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expectedDeliveryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Incoterm</label>
                  <select
                    className="form-input"
                    value={formData.incoterm || 'EXW'}
                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value as Incoterm })}
                  >
                    {Object.entries(INCOTERM_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Adresse de livraison</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.deliveryAddress || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    placeholder="Adresse de réception"
                  />
                </div>
                <div className="form-group">
                  <label>TVA (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.taxRate || 0}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4>📦 Articles</h4>
                  <button className="btn btn-primary btn-small" onClick={addItem}>+ Ajouter un article</button>
                </div>
                {orderItems.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    Aucun article ajouté
                  </div>
                ) : (
                  orderItems.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center', padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <select
                        className="form-input"
                        style={{ flex: 2 }}
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 80 }}
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 120 }}
                        placeholder="Prix unitaire"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      />
                      <span style={{ fontWeight: 600, minWidth: 100 }}>{formatCurrencyAmount(item.total)}</span>
                      <button className="btn btn-small btn-danger" onClick={() => removeItem(index)}>🗑️</button>
                    </div>
                  ))
                )}
                {orderItems.length > 0 && (
                  <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 600, fontSize: '1.1em' }}>
                    Total: {formatCurrencyAmount(orderItems.reduce((sum, item) => sum + item.total, 0))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label>Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingOrder ? '💾 Enregistrer' : '➕ Créer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOrders;
