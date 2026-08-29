import React, { useState, useEffect } from 'react';
import { invoiceStorage, clientStorage, productStorage } from '../services/storage';
import { Invoice, InvoiceItem, Client, Product } from '../types';
import { exportInvoiceToPDF, exportAllInvoicesToPDF } from '../services/pdfExport';
import { exportInvoicesToExcel, exportSalesReport } from '../services/excelExport';
import { sendInvoiceReminder, getInvoicesNeedingReminder, getReminderTypeLabel, saveReminder, type Reminder } from '../services/notifications';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeAmount, sanitizeQuantity } from '../services/sanitize';
import { sendWhatsAppMessage } from '../services/notifications';
import { sendInvoiceReminderEmail, logEmail } from '../services/emailService';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    taxRate: '20',
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(invoiceStorage.getAll());
    setClients(clientStorage.getAll());
    setProducts(productStorage.getAll());
  };

  const openModal = () => {
    setFormData({ clientId: '', taxRate: '20' });
    setInvoiceItems([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ clientId: '', taxRate: '20' });
    setInvoiceItems([]);
  };

  const openDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedInvoice(null);
  };

  const addItem = () => {
    setInvoiceItems([
      ...invoiceItems,
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...invoiceItems];
    const item = { ...updatedItems[index] };

    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productId = product.id;
        item.productName = product.name;
        item.unitPrice = product.price;
        item.total = item.unitPrice * item.quantity;
      }
    } else if (field === 'quantity') {
      item.quantity = sanitizeQuantity(value);
      item.total = item.unitPrice * item.quantity;
    } else if (field === 'unitPrice') {
      item.unitPrice = sanitizeAmount(value);
      item.total = item.unitPrice * item.quantity;
    }

    updatedItems[index] = item;
    setInvoiceItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (invoiceItems.length === 0) {
      alert('Veuillez ajouter au moins un produit');
      return;
    }

    const client = clients.find(c => c.id === formData.clientId);
    const { subtotal, tax, total } = calculateTotals();

    const invoice: Invoice = {
      id: uuidv4(),
      clientId: formData.clientId,
      clientName: client?.name || 'Client inconnu',
      items: invoiceItems,
      subtotal,
      taxRate: parseFloat(formData.taxRate),
      tax,
      total,
      currency: 'MAD',
      status: 'brouillon',
      paymentTerms: 30,
      notes: '',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    invoiceStorage.create(invoice);
    loadData();
    closeModal();
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    invoiceStorage.update(id, { status });
    loadData();
    if (selectedInvoice?.id === id) {
      setSelectedInvoice({ ...selectedInvoice!, status });
    }
  };

  const handleExportPDF = (invoice: Invoice) => {
    exportInvoiceToPDF(invoice);
  };

  const handleExportAllPDF = () => {
    const filteredInvoices = filterStatus === 'all'
      ? invoices
      : invoices.filter(i => i.status === filterStatus);
    exportAllInvoicesToPDF(filteredInvoices);
  };

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

  const filteredInvoices = filterStatus === 'all'
    ? invoices
    : invoices.filter(i => i.status === filterStatus);

  // Stats rapides
  const totalFiltered = filteredInvoices.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>🧾 Gestion des Factures</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => exportInvoicesToExcel(filteredInvoices)}>
            📊 Export Excel
          </button>
          <button className="btn btn-secondary" onClick={() => exportSalesReport(invoices)}>
            📈 Rapport CA
          </button>
          <button className="btn btn-secondary" onClick={handleExportAllPDF}>
            📄 Export PDF
          </button>
          <button className="btn btn-primary" onClick={openModal}>
            + Nouvelle Facture
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Toutes ({invoices.length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'brouillon' ? 'active' : ''}`}
          onClick={() => setFilterStatus('brouillon')}
        >
          Brouillons ({invoices.filter(i => i.status === 'brouillon').length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'envoyée' ? 'active' : ''}`}
          onClick={() => setFilterStatus('envoyée')}
        >
          Envoyées ({invoices.filter(i => i.status === 'envoyée').length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'payée' ? 'active' : ''}`}
          onClick={() => setFilterStatus('payée')}
        >
          Payées ({invoices.filter(i => i.status === 'payée').length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'annulée' ? 'active' : ''}`}
          onClick={() => setFilterStatus('annulée')}
        >
          Annulées ({invoices.filter(i => i.status === 'annulée').length})
        </button>
      </div>

      <div className="invoices-summary">
        <span>Total filtré: <strong>{formatCurrency(totalFiltered)}</strong></span>
        <span>{filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}</span>
      </div>

      {/* ⏰ Relances WhatsApp */}
      {(() => {
        const remindersNeeded = getInvoicesNeedingReminder(invoices, clients);
        if (remindersNeeded.length === 0) return null;
        return (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>📱 Relances WhatsApp à envoyer ({remindersNeeded.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {remindersNeeded.slice(0, 5).map(({ invoice, client, type }, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 16px', borderRadius: 8 }}>
                  <div>
                    <strong>{getReminderTypeLabel(type)}</strong>
                    <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Facture #{invoice.id.slice(0, 8)} - {client.name}</span>
                  </div>
                  <button className="btn btn-small btn-success" onClick={() => {
                    sendInvoiceReminder(invoice, client);
                    saveReminder({
                      id: Date.now().toString(),
                      invoiceId: invoice.id,
                      clientId: client.id,
                      type,
                      sentAt: new Date().toISOString(),
                      status: 'sent',
                    } as Reminder);
                    loadData();
                  }}>
                    📱 Envoyer
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <table className="data-table">
        <thead>
          <tr>
            <th>Facture</th>
            <th>Client</th>
            <th>Sous-total</th>
            <th>TVA</th>
            <th>Total</th>
            <th>Statut</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-state">Aucune facture</td>
            </tr>
          ) : (
            filteredInvoices.map(invoice => (
              <tr key={invoice.id}>
                <td><strong>#{invoice.id.slice(0, 8)}</strong></td>
                <td>{invoice.clientName}</td>
                <td>{formatCurrency(invoice.subtotal)}</td>
                <td>{invoice.taxRate}%</td>
                <td><strong>{formatCurrency(invoice.total)}</strong></td>
                <td>
                  <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>{formatDate(invoice.createdAt)}</td>
                <td className="actions">
                  <button className="btn btn-small" onClick={() => openDetail(invoice)} title="Voir">
                    👁️
                  </button>
                  <button className="btn btn-small" onClick={() => handleExportPDF(invoice)} title="Exporter PDF">
                    📄
                  </button>
                  <button className="btn btn-small" onClick={() => {
                    const client = clients.find(c => c.id === invoice.clientId);
                    if (client?.phone) {
                      sendWhatsAppMessage(client.phone, `Facture #${invoice.id.slice(0, 8)} - Montant: ${formatCurrency(invoice.total)} - Échéance: ${formatDate(invoice.dueDate)}`);
                    } else {
                      alert('Pas de téléphone pour ce client');
                    }
                  }} title="WhatsApp">
                    📱
                  </button>
                  <button className="btn btn-small" onClick={() => {
                    const client = clients.find(c => c.id === invoice.clientId);
                    if (client?.email) {
                      sendInvoiceReminderEmail(invoice, client).then(result => {
                        logEmail({ to: client.email, subject: `Relance #${invoice.id.slice(0, 8)}`, type: 'reminder', invoiceId: invoice.id, status: result.success ? 'sent' : 'failed' });
                        alert(result.success ? 'Email envoyé !' : `Erreur: ${result.error}`);
                      });
                    } else alert('Pas d\'email pour ce client');
                  }} title="Email">
                    📧
                  </button>
                  {invoice.status === 'brouillon' && (
                    <button
                      className="btn btn-small"
                      onClick={() => updateInvoiceStatus(invoice.id, 'envoyée')}
                      title="Marquer envoyée"
                    >
                      📤
                    </button>
                  )}
                  {invoice.status === 'envoyée' && (
                    <button
                      className="btn btn-small btn-success"
                      onClick={() => updateInvoiceStatus(invoice.id, 'payée')}
                      title="Marquer payée"
                    >
                      💰
                    </button>
                  )}
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => {
                      if (window.confirm('Supprimer cette facture ?')) {
                        invoiceStorage.delete(invoice.id);
                        loadData();
                      }
                    }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Nouvelle Facture */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h3>Créer une Facture</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Client *</label>
                <select
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="help-text">
                    <a href="/clients">Ajoutez d'abord un client</a>
                  </p>
                )}
              </div>

              <div className="invoice-items">
                <div className="invoice-items-header">
                  <h4>Produits</h4>
                  <button type="button" className="btn btn-small" onClick={addItem}>
                    + Ajouter
                  </button>
                </div>

                {invoiceItems.length === 0 ? (
                  <p className="empty-state">Aucun produit ajouté</p>
                ) : (
                  <div className="invoice-items-list">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="invoice-item">
                        <select
                          value={item.productId}
                          onChange={e => updateItem(index, 'productId', e.target.value)}
                          required
                        >
                          <option value="">Choisir un produit</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.price)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                        <span className="item-total">{formatCurrency(item.total)}</span>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => removeItem(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>TVA (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={e => setFormData({ ...formData, taxRate: e.target.value })}
                  />
                </div>
              </div>

              {invoiceItems.length > 0 && (
                <div className="invoice-summary">
                  <div>Sous-total: <strong>{formatCurrency(calculateTotals().subtotal)}</strong></div>
                  <div>TVA ({formData.taxRate}%): <strong>{formatCurrency(calculateTotals().tax)}</strong></div>
                  <div className="invoice-total">Total: <strong>{formatCurrency(calculateTotals().total)}</strong></div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer la Facture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail Facture */}
      {isDetailOpen && selectedInvoice && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h3>Facture #{selectedInvoice.id.slice(0, 8)}</h3>
              <button
                className="btn btn-small"
                onClick={() => handleExportPDF(selectedInvoice)}
                title="Exporter en PDF"
              >
                📄 PDF
              </button>
            </div>

            <div className="invoice-detail">
              <div className="detail-row">
                <span>Client:</span>
                <strong>{selectedInvoice.clientName}</strong>
              </div>
              <div className="detail-row">
                <span>Date:</span>
                <strong>{formatDate(selectedInvoice.createdAt)}</strong>
              </div>
              <div className="detail-row">
                <span>Échéance:</span>
                <strong>{formatDate(selectedInvoice.dueDate)}</strong>
              </div>
              <div className="detail-row">
                <span>Statut:</span>
                <span className={`status-badge ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <table className="detail-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qté</th>
                  <th>Prix</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Sous-total</td>
                  <td>{formatCurrency(selectedInvoice.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3}>TVA ({selectedInvoice.taxRate}%)</td>
                  <td>{formatCurrency(selectedInvoice.tax)}</td>
                </tr>
                <tr className="total-row">
                  <td colSpan={3}><strong>Total</strong></td>
                  <td><strong>{formatCurrency(selectedInvoice.total)}</strong></td>
                </tr>
              </tfoot>
            </table>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeDetail}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
