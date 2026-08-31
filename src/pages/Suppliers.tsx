import React, { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';
import {
  Supplier,
  SupplierContact,
  SupplierAddress,
  SupplierRating,
  SupplierStatus,
  SupplierCategory,
  Currency,
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_CATEGORY_LABELS,
} from '../types';
import { supplierStorage, formatCurrencyAmount } from '../services/supplierStorage';
import { useSyncReload } from '../hooks/useSyncReload';

const emptySupplier: Partial<Supplier> = {
  name: '',
  tradeName: '',
  registrationNumber: '',
  category: 'autre',
  status: 'actif',
  contacts: [],
  addresses: [],
  bankInfo: { bankName: '', iban: '', swift: '', currency: 'MAD' },
  currency: 'MAD',
  paymentTerms: 30,
  creditLimit: 0,
  products: [],
  documents: [],
  ratings: [],
  notes: '',
  website: '',
};

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>(emptySupplier);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SupplierStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<SupplierCategory | 'all'>('all');
  const [newContact, setNewContact] = useState<Partial<SupplierContact>>({});
  const [newAddress, setNewAddress] = useState<Partial<SupplierAddress>>({});
  const [ratingForm, setRatingForm] = useState<Partial<SupplierRating>>({
    quality: 3,
    delivery: 3,
    price: 3,
    service: 3,
    comment: '',
  });
  const [activeTab, setActiveTab] = useState<'contacts' | 'addresses' | 'bank' | 'documents'>('contacts');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const stableLoadData = useCallback(() => {
    loadSuppliers();
  }, []);
  useSyncReload(stableLoadData);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchQuery, filterStatus, filterCategory]);

  const loadSuppliers = () => {
    setSuppliers(supplierStorage.getAll());
  };

  const filterSuppliers = () => {
    let result = suppliers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tradeName.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      result = result.filter(s => s.category === filterCategory);
    }
    setFilteredSuppliers(result);
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ ...emptySupplier });
    setActiveTab('contacts');
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({ ...supplier });
    setActiveTab('contacts');
    setShowModal(true);
  };

  const openDetailModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const openRatingModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setRatingForm({ quality: 3, delivery: 3, price: 3, service: 3, comment: '' });
    setShowRatingModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.tradeName) {
      alert('Le nom et le nom commercial sont obligatoires');
      return;
    }

    const now = new Date().toISOString();

    if (editingSupplier) {
      supplierStorage.update(editingSupplier.id, { ...formData, updatedAt: now } as any);
    } else {
      const newSupplier: Supplier = {
        id: `SUP-${Date.now()}`,
        name: formData.name!,
        tradeName: formData.tradeName!,
        registrationNumber: formData.registrationNumber || '',
        category: formData.category || 'autre',
        status: formData.status || 'actif',
        contacts: formData.contacts || [],
        addresses: formData.addresses || [],
        bankInfo: formData.bankInfo || { bankName: '', iban: '', swift: '', currency: 'MAD' },
        currency: formData.currency || 'MAD',
        paymentTerms: formData.paymentTerms || 30,
        creditLimit: formData.creditLimit || 0,
        products: formData.products || [],
        documents: formData.documents || [],
        ratings: formData.ratings || [],
        notes: formData.notes || '',
        website: formData.website || '',
        createdAt: now,
      };
      supplierStorage.create(newSupplier);
    }

    loadSuppliers();
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      supplierStorage.delete(id);
      loadSuppliers();
    }
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.email) return;
    const contact: SupplierContact = {
      id: `CONTACT-${Date.now()}`,
      name: newContact.name,
      role: newContact.role || '',
      email: newContact.email,
      phone: newContact.phone || '',
      isPrimary: newContact.isPrimary || false,
    };
    setFormData({
      ...formData,
      contacts: [...(formData.contacts || []), contact],
    });
    setNewContact({});
  };

  const handleRemoveContact = (contactId: string) => {
    setFormData({
      ...formData,
      contacts: (formData.contacts || []).filter(c => c.id !== contactId),
    });
  };

  const handleAddAddress = () => {
    if (!newAddress.address || !newAddress.city) return;
    const address: SupplierAddress = {
      id: `ADDR-${Date.now()}`,
      label: newAddress.label || '',
      address: newAddress.address,
      city: newAddress.city,
      country: newAddress.country || 'Maroc',
      postalCode: newAddress.postalCode || '',
      isDefault: newAddress.isDefault || false,
    };
    setFormData({
      ...formData,
      addresses: [...(formData.addresses || []), address],
    });
    setNewAddress({});
  };

  const handleRemoveAddress = (addressId: string) => {
    setFormData({
      ...formData,
      addresses: (formData.addresses || []).filter(a => a.id !== addressId),
    });
  };

  const handleSaveRating = () => {
    if (!selectedSupplier) return;
    const rating: SupplierRating = {
      id: `RATE-${Date.now()}`,
      supplierId: selectedSupplier.id,
      quality: ratingForm.quality || 3,
      delivery: ratingForm.delivery || 3,
      price: ratingForm.price || 3,
      service: ratingForm.service || 3,
      comment: ratingForm.comment || '',
      ratedAt: new Date().toISOString(),
    };
    supplierStorage.addRating(selectedSupplier.id, rating);
    loadSuppliers();
    setShowRatingModal(false);
  };

  const getStatusColor = (status: SupplierStatus): string => {
    const colors: Record<SupplierStatus, string> = {
      actif: 'var(--text-success)',
      inactif: 'var(--text-muted)',
      en_evaluation: 'var(--text-warning)',
      blacklisté: 'var(--text-danger)',
    };
    return colors[status];
  };

  const getRatingStars = (rating: number): string => {
    return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  const getAverageRating = (supplier: Supplier): number => {
    if (supplier.ratings.length === 0) return 0;
    const total = supplier.ratings.reduce((sum, r) => {
      return sum + (r.quality + r.delivery + r.price + r.service) / 4;
    }, 0);
    return Math.round((total / supplier.ratings.length) * 10) / 10;
  };

  return (
    <AnimatedPage>
    <div className="page" style={{ position: 'relative', zIndex: 1 }}>
      <FloatingShapes />
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>🏭 Fournisseurs</h2>
          <p style={{ color: 'var(--text-muted)' }}>{filteredSuppliers.length} fournisseur(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Ajouter un fournisseur
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
            className="form-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(SUPPLIER_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="all">Toutes les catégories</option>
            {Object.entries(SUPPLIER_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Fournisseurs</div>
          <div className="stat-value">{suppliers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Actifs</div>
          <div className="stat-value" style={{ color: 'var(--text-success)' }}>
            {suppliers.filter(s => s.status === 'actif').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Évaluation</div>
          <div className="stat-value" style={{ color: 'var(--text-warning)' }}>
            {suppliers.filter(s => s.status === 'en_evaluation').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Note Moyenne</div>
          <div className="stat-value">
            {suppliers.filter(s => s.ratings.length > 0).length > 0
              ? (suppliers.filter(s => s.ratings.length > 0).reduce((sum, s) => sum + getAverageRating(s), 0) /
                  suppliers.filter(s => s.ratings.length > 0).length).toFixed(1)
              : '—'}
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Contact Principal</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th>Note</th>
              <th>Délai Paiement</th>
              <th>Crédit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                    ? '🔍 Aucun fournisseur ne correspond aux critères'
                    : '🏭 Aucun fournisseur enregistré. Cliquez sur "+ Ajouter" pour commencer.'}
                </td>
              </tr>
            ) : (
              filteredSuppliers.map(supplier => {
                const primaryContact = supplier.contacts.find(c => c.isPrimary) || supplier.contacts[0];
                const avgRating = getAverageRating(supplier);
                return (
                  <tr key={supplier.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                      <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{supplier.tradeName}</div>
                    </td>
                    <td>
                      <span className="badge">{SUPPLIER_CATEGORY_LABELS[supplier.category]}</span>
                    </td>
                    <td>
                      {primaryContact ? (
                        <>
                          <div>{primaryContact.name}</div>
                          <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{primaryContact.email}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>{primaryContact?.phone || '—'}</td>
                    <td>
                      <span style={{ color: getStatusColor(supplier.status), fontWeight: 600 }}>
                        {SUPPLIER_STATUS_LABELS[supplier.status]}
                      </span>
                    </td>
                    <td>
                      {avgRating > 0 ? (
                        <div>
                          <div>{getRatingStars(avgRating)}</div>
                          <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{avgRating}/5</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>{supplier.paymentTerms} jours</td>
                    <td>{formatCurrencyAmount(supplier.creditLimit, supplier.currency)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-small" onClick={() => openDetailModal(supplier)} title="Voir détails">
                          👁️
                        </button>
                        <button className="btn btn-small" onClick={() => openEditModal(supplier)} title="Modifier">
                          ✏️
                        </button>
                        <button className="btn btn-small" onClick={() => openRatingModal(supplier)} title="Évaluer">
                          ⭐
                        </button>
                        <button className="btn btn-small btn-danger" onClick={() => handleDelete(supplier.id)} title="Supprimer">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================ */}
      {/* MODAL: Add/Edit Supplier */}
      {/* ============================================ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>{editingSupplier ? '✏️ Modifier le fournisseur' : '🏭 Nouveau fournisseur'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {(['contacts', 'addresses', 'bank', 'documents'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'contacts' && '👤 Contacts'}
                    {tab === 'addresses' && '📍 Adresses'}
                    {tab === 'bank' && '🏦 Banque'}
                    {tab === 'documents' && '📄 Documents'}
                  </button>
                ))}
              </div>

              {/* General Info */}
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label>Raison Sociale *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom complet de l'entreprise"
                  />
                </div>
                <div className="form-group">
                  <label>Nom Commercial *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.tradeName || ''}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    placeholder="Nom d'usage"
                  />
                </div>
                <div className="form-group">
                  <label>N° Registre (RC/IF/ICE)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="Numéro d'identification"
                  />
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    className="form-input"
                    value={formData.category || 'autre'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as SupplierCategory })}
                  >
                    {Object.entries(SUPPLIER_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    className="form-input"
                    value={formData.status || 'actif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
                  >
                    {Object.entries(SUPPLIER_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
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
                    <option value="MAD">MAD (Dirham)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Délai de paiement (jours)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.paymentTerms || 30}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Limite de crédit</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.creditLimit || 0}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Site web</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'contacts' && (
                <div>
                  <h4 style={{ marginBottom: 12 }}>👤 Contacts</h4>
                  {(formData.contacts || []).map(contact => (
                    <div key={contact.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <span style={{ fontWeight: 600 }}>{contact.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{contact.role}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{contact.email}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{contact.phone}</span>
                      {contact.isPrimary && <span className="badge badge-success">Principal</span>}
                      <button className="btn btn-small btn-danger" onClick={() => handleRemoveContact(contact.id)}>🗑️</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nom"
                      value={newContact.name || ''}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Rôle"
                      value={newContact.role || ''}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Email"
                      value={newContact.email || ''}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Téléphone"
                      value={newContact.phone || ''}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={newContact.isPrimary || false}
                        onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                      />
                      Principal
                    </label>
                    <button className="btn btn-primary btn-small" onClick={handleAddContact}>+ Ajouter</button>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <h4 style={{ marginBottom: 12 }}>📍 Adresses</h4>
                  {(formData.addresses || []).map(address => (
                    <div key={address.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: 8, background: 'var(--bg-secondary)', borderRadius: 8, flexWrap: 'wrap' }}>
                      <span className="badge">{address.label}</span>
                      <span>{address.address}, {address.city}, {address.country}</span>
                      {address.isDefault && <span className="badge badge-success">Défaut</span>}
                      <button className="btn btn-small btn-danger" onClick={() => handleRemoveAddress(address.id)}>🗑️</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Label (Usine, Entrepôt...)"
                      value={newAddress.label || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Adresse"
                      value={newAddress.address || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ville"
                      value={newAddress.city || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Pays"
                      value={newAddress.country || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    />
                    <button className="btn btn-primary btn-small" onClick={handleAddAddress}>+ Ajouter</button>
                  </div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div>
                  <h4 style={{ marginBottom: 12 }}>🏦 Informations Bancaires</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Banque</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.bankInfo?.bankName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo!, bankName: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>IBAN</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.bankInfo?.iban || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo!, iban: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>SWIFT/BIC</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.bankInfo?.swift || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo!, swift: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  <h4 style={{ marginBottom: 12 }}>📄 Documents</h4>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                    Ajoutez les contrats, certifications et documents importants du fournisseur.
                  </p>
                  {(formData.documents || []).length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      Aucun document ajouté
                    </div>
                  ) : (
                    (formData.documents || []).map(doc => (
                      <div key={doc.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        <span>📄</span>
                        <span style={{ fontWeight: 600 }}>{doc.name}</span>
                        <span className="badge">{doc.type}</span>
                        {doc.expiresAt && <span style={{ color: 'var(--text-muted)' }}>Expire le {new Date(doc.expiresAt).toLocaleDateString()}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="form-group" style={{ marginTop: 20 }}>
                <label>Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes internes sur ce fournisseur..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingSupplier ? '💾 Enregistrer' : '➕ Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Supplier Detail */}
      {/* ============================================ */}
      {showDetailModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>🏭 {selectedSupplier.name}</h3>
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div>
                  <strong>Nom Commercial:</strong>
                  <div>{selectedSupplier.tradeName}</div>
                </div>
                <div>
                  <strong>RC/IF/ICE:</strong>
                  <div>{selectedSupplier.registrationNumber || '—'}</div>
                </div>
                <div>
                  <strong>Catégorie:</strong>
                  <div>{SUPPLIER_CATEGORY_LABELS[selectedSupplier.category]}</div>
                </div>
                <div>
                  <strong>Statut:</strong>
                  <div style={{ color: getStatusColor(selectedSupplier.status) }}>
                    {SUPPLIER_STATUS_LABELS[selectedSupplier.status]}
                  </div>
                </div>
                <div>
                  <strong>Note Moyenne:</strong>
                  <div>{getRatingStars(getAverageRating(selectedSupplier))} ({getAverageRating(selectedSupplier)}/5)</div>
                </div>
                <div>
                  <strong>Délai Paiement:</strong>
                  <div>{selectedSupplier.paymentTerms} jours</div>
                </div>
                <div>
                  <strong>Crédit:</strong>
                  <div>{formatCurrencyAmount(selectedSupplier.creditLimit, selectedSupplier.currency)}</div>
                </div>
              </div>

              {/* Contacts */}
              {selectedSupplier.contacts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4>👤 Contacts</h4>
                  {selectedSupplier.contacts.map(c => (
                    <div key={c.id} style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }}>
                      <strong>{c.name}</strong> {c.isPrimary && <span className="badge badge-success">Principal</span>}
                      <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>{c.role} — {c.email} — {c.phone}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Addresses */}
              {selectedSupplier.addresses.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4>📍 Adresses</h4>
                  {selectedSupplier.addresses.map(a => (
                    <div key={a.id} style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }}>
                      <span className="badge">{a.label}</span> {a.address}, {a.city}, {a.country}
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Ratings */}
              {selectedSupplier.ratings.length > 0 && (
                <div>
                  <h4>⭐ Évaluations récentes</h4>
                  {selectedSupplier.ratings.slice(-3).reverse().map(r => (
                    <div key={r.id} style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span>Qualité: {'⭐'.repeat(r.quality)}</span>
                        <span>Livraison: {'⭐'.repeat(r.delivery)}</span>
                        <span>Prix: {'⭐'.repeat(r.price)}</span>
                        <span>Service: {'⭐'.repeat(r.service)}</span>
                      </div>
                      {r.comment && <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>{r.comment}</div>}
                      <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{new Date(r.ratedAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSupplier.notes && (
                <div style={{ marginTop: 16 }}>
                  <h4>📝 Notes</h4>
                  <p style={{ color: 'var(--text-muted)' }}>{selectedSupplier.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Fermer</button>
              <button className="btn btn-primary" onClick={() => { setShowDetailModal(false); openEditModal(selectedSupplier); }}>
                ✏️ Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Rating */}
      {/* ============================================ */}
      {showRatingModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>⭐ Évaluer {selectedSupplier.name}</h3>
              <button className="btn-close" onClick={() => setShowRatingModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {[
                { key: 'quality', label: ' Qualité des produits' },
                { key: 'delivery', label: '🚚 Ponctualité de livraison' },
                { key: 'price', label: '💰 Compétitivité des prix' },
                { key: 'service', label: '🤝 Réactivité du service' },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600 }}>{label}</label>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className="btn btn-small"
                        onClick={() => setRatingForm({ ...ratingForm, [key]: star })}
                        style={{
                          fontSize: 20,
                          background: star <= (ratingForm as any)[key] ? 'var(--bg-warning)' : 'var(--bg-secondary)',
                        }}
                      >
                        {star <= (ratingForm as any)[key] ? '⭐' : '☆'}
                      </button>
                    ))}
                    <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>{(ratingForm as any)[key]}/5</span>
                  </div>
                </div>
              ))}
              <div className="form-group">
                <label>Commentaire</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={ratingForm.comment || ''}
                  onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                  placeholder="Votre commentaire..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRatingModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveRating}>💾 Enregistrer l'évaluation</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Suppliers;
