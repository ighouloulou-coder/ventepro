import React, { useState, useEffect } from 'react';
import { quoteStorage, clientStorage, productStorage, priceTierStorage } from '../services/storage';
import { Quote, QuoteItem, Client, Product, Currency } from '../types';
import { formatCurrencyAmount } from '../services/storage';
import { sanitizeAmount, sanitizeQuantity } from '../services/sanitize';
import { generateQuotePDF, generateAllQuotesPDF } from '../services/pdfQuoteExport';
import { sendQuoteByEmail, logEmail } from '../services/emailService';
import { generateSignatureLink } from '../services/eSignature';
import { v4 as uuidv4 } from 'uuid';

const Quotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    clientId: '',
    taxRate: '20',
    currency: 'MAD' as Currency,
    validUntil: '',
    notes: '',
  });
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setQuotes(quoteStorage.getAll());
    setClients(clientStorage.getAll());
    setProducts(productStorage.getAll());
  };

  const openModal = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setFormData({
      clientId: '',
      taxRate: '20',
      currency: 'MAD',
      validUntil: defaultDate.toISOString().split('T')[0],
      notes: '',
    });
    setQuoteItems([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setQuoteItems([]);
  };

  const openDetail = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedQuote(null);
  };

  const addItem = () => {
    setQuoteItems([...quoteItems, {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      unit: 'pièce',
    }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...quoteItems];
    const item = { ...updated[index] };

    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productId = product.id;
        item.productName = product.name;
        item.unit = product.unit;
        // Vérifier tarification spéciale client
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
    setQuoteItems(updated);
  };

  const removeItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteItems.length === 0) { alert('Ajoutez au moins un produit'); return; }

    const client = clients.find(c => c.id === formData.clientId);
    const { subtotal, tax, total } = calculateTotals();

    const quote: Quote = {
      id: uuidv4(),
      clientId: formData.clientId,
      clientName: client?.name || 'Client inconnu',
      items: quoteItems,
      subtotal, tax,
      taxRate: parseFloat(formData.taxRate),
      total,
      currency: formData.currency,
      status: 'brouillon',
      validUntil: formData.validUntil,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    quoteStorage.create(quote);
    loadData();
    closeModal();
  };

  const updateStatus = (id: string, status: Quote['status']) => {
    quoteStorage.update(id, { status });
    loadData();
    if (selectedQuote?.id === id) {
      setSelectedQuote({ ...selectedQuote!, status });
    }
  };

  const filteredQuotes = filterStatus === 'all' ? quotes : quotes.filter(q => q.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepté': return 'status-paid';
      case 'envoyé': return 'status-sent';
      case 'brouillon': return 'status-draft';
      case 'refusé': case 'expiré': return 'status-cancelled';
      default: return '';
    }
  };

  const convertToOrder = (quote: Quote) => {
    // Rediriger vers la page commandes avec les données pré-remplies
    localStorage.setItem('convertQuote', JSON.stringify(quote));
    window.location.href = '/orders';
  };

  const convertToInvoice = (quote: Quote) => {
    // Rediriger vers la page factures avec les données pré-remplies
    localStorage.setItem('convertQuoteInvoice', JSON.stringify(quote));
    window.location.href = '/invoices';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>📄 Gestion des Devis</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => generateAllQuotesPDF(filteredQuotes)}>
            📄 Export PDF
          </button>
          <button className="btn btn-primary" onClick={openModal}>+ Nouveau Devis</button>
        </div>
      </div>

      <div className="filter-bar">
        {['all', 'brouillon', 'envoyé', 'accepté', 'refusé', 'expiré'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'Tous' : status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? quotes.length : quotes.filter(q => q.status === status).length})
          </button>
        ))}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Devis</th>
            <th>Client</th>
            <th>Total</th>
            <th>Devise</th>
            <th>Statut</th>
            <th>Validité</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuotes.length === 0 ? (
            <tr><td colSpan={8} className="empty-state">Aucun devis</td></tr>
          ) : (
            filteredQuotes.map(quote => (
              <tr key={quote.id}>
                <td><strong>#{quote.id.slice(0, 8)}</strong></td>
                <td>{quote.clientName}</td>
                <td><strong>{formatCurrencyAmount(quote.total, quote.currency)}</strong></td>
                <td>{quote.currency}</td>
                <td><span className={`status-badge ${getStatusColor(quote.status)}`}>{quote.status}</span></td>
                <td>{new Date(quote.validUntil).toLocaleDateString('fr-FR')}</td>
                <td>{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="actions">
                  <button className="btn btn-small" onClick={() => openDetail(quote)} title="Voir">👁️</button>
                  <button className="btn btn-small" onClick={() => generateQuotePDF(quote, clients.find(c => c.id === quote.clientId))} title="Exporter PDF">📄</button>
                  <button className="btn btn-small" onClick={() => {
                    const client = clients.find(c => c.id === quote.clientId);
                    if (client?.email) {
                      sendQuoteByEmail(quote, client).then(result => {
                        logEmail({ to: client.email, subject: `Devis #${quote.id.slice(0, 8)}`, type: 'quote', quoteId: quote.id, status: result.success ? 'sent' : 'failed' });
                        alert(result.success ? 'Email envoyé !' : `Erreur: ${result.error}`);
                      });
                    } else alert('Pas d\'email pour ce client');
                  }} title="Envoyer par email">📧</button>
                  <button className="btn btn-small" onClick={() => {
                    const link = generateSignatureLink(quote.id);
                    navigator.clipboard.writeText(link);
                    alert('Lien de signature copié !\n' + link);
                  }} title="Copier lien signature">✍️</button>
                  {quote.status === 'brouillon' && (
                    <button className="btn btn-small" onClick={() => updateStatus(quote.id, 'envoyé')} title="Envoyer">📤</button>
                  )}
                  {quote.status === 'envoyé' && (
                    <button className="btn btn-small btn-success" onClick={() => updateStatus(quote.id, 'accepté')} title="Accepté">✅</button>
                  )}
                  {quote.status === 'accepté' && (
                    <>
                      <button className="btn btn-small btn-primary" onClick={() => convertToOrder(quote)} title="Convertir en commande">📋</button>
                      <button className="btn btn-small btn-success" onClick={() => convertToInvoice(quote)} title="Convertir en facture">🧾</button>
                    </>
                  )}
                  <button className="btn btn-small btn-danger" onClick={() => {
                    if (window.confirm('Supprimer ce devis ?')) { quoteStorage.delete(quote.id); loadData(); }
                  }} title="Supprimer">🗑️</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Nouveau Devis */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h3>Créer un Devis</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Client *</label>
                  <select value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} required>
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Devise</label>
                  <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}>
                    <option value="MAD">🇲🇦 MAD - Dirham Marocain</option>
                    <option value="EUR">🇪🇺 EUR - Euro</option>
                    <option value="USD">🇺🇸 USD - Dollar US</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>TVA (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={formData.taxRate} onChange={e => setFormData({ ...formData, taxRate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Valide jusqu'au</label>
                  <input type="date" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
                </div>
              </div>

              <div className="invoice-items">
                <div className="invoice-items-header">
                  <h4>Produits</h4>
                  <button type="button" className="btn btn-small" onClick={addItem}>+ Ajouter</button>
                </div>
                {quoteItems.length === 0 ? (
                  <p className="empty-state">Aucun produit ajouté</p>
                ) : (
                  <div className="invoice-items-list">
                    {quoteItems.map((item, index) => (
                      <div key={index} className="invoice-item">
                        <select value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)} required>
                          <option value="">Choisir un produit</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} - {formatCurrencyAmount(p.price)}</option>
                          ))}
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

              {quoteItems.length > 0 && (
                <div className="invoice-summary">
                  <div>Sous-total: <strong>{formatCurrencyAmount(calculateTotals().subtotal, formData.currency)}</strong></div>
                  <div>TVA ({formData.taxRate}%): <strong>{formatCurrencyAmount(calculateTotals().tax, formData.currency)}</strong></div>
                  <div className="invoice-total">Total: <strong>{formatCurrencyAmount(calculateTotals().total, formData.currency)}</strong></div>
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Conditions, remarques..." />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer le Devis</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail Devis */}
      {isDetailOpen && selectedQuote && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h3>Devis #{selectedQuote.id.slice(0, 8)}</h3>
              <span className={`status-badge ${getStatusColor(selectedQuote.status)}`}>{selectedQuote.status}</span>
            </div>
            <div className="invoice-detail">
              <div className="detail-row"><span>Client:</span><strong>{selectedQuote.clientName}</strong></div>
              <div className="detail-row"><span>Devise:</span><strong>{selectedQuote.currency}</strong></div>
              <div className="detail-row"><span>Créé le:</span><strong>{new Date(selectedQuote.createdAt).toLocaleDateString('fr-FR')}</strong></div>
              <div className="detail-row"><span>Valide jusqu'au:</span><strong>{new Date(selectedQuote.validUntil).toLocaleDateString('fr-FR')}</strong></div>
            </div>
            <table className="detail-table">
              <thead><tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead>
              <tbody>
                {selectedQuote.items.map((item, i) => (
                  <tr key={i}><td>{item.productName}</td><td>{item.quantity} {item.unit}</td><td>{formatCurrencyAmount(item.unitPrice, selectedQuote.currency)}</td><td>{formatCurrencyAmount(item.total, selectedQuote.currency)}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={3}>Sous-total</td><td>{formatCurrencyAmount(selectedQuote.subtotal, selectedQuote.currency)}</td></tr>
                <tr><td colSpan={3}>TVA ({selectedQuote.taxRate}%)</td><td>{formatCurrencyAmount(selectedQuote.tax, selectedQuote.currency)}</td></tr>
                <tr className="total-row"><td colSpan={3}><strong>Total</strong></td><td><strong>{formatCurrencyAmount(selectedQuote.total, selectedQuote.currency)}</strong></td></tr>
              </tfoot>
            </table>
            {selectedQuote.notes && <p style={{ marginTop: 16, fontStyle: 'italic', color: 'var(--text-muted)' }}>📝 {selectedQuote.notes}</p>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeDetail}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
