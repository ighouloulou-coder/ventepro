import React, { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';
import { clientStorage } from '../services/storage';
import { useSyncReload } from '../hooks/useSyncReload';
import { Client } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeInput, sanitizeEmail, sanitizePhone, isValidString } from '../services/sanitize';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const stableLoadClients = useCallback(() => {
    setClients(clientStorage.getAll());
  }, []);
  useSyncReload(stableLoadClients, 'tradelink_clients');

  const loadClients = () => {
    setClients(clientStorage.getAll());
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        notes: client.notes,
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation et sanitization
    if (!isValidString(formData.name, 1)) {
      alert('Le nom du client est requis');
      return;
    }

    if (formData.email && !sanitizeEmail(formData.email)) {
      alert('Adresse email invalide');
      return;
    }

    const clientData: Client = {
      id: editingClient?.id || uuidv4(),
      name: sanitizeInput(formData.name),
      email: formData.email ? sanitizeEmail(formData.email) : '',
      phone: sanitizePhone(formData.phone),
      address: sanitizeInput(formData.address),
      notes: sanitizeInput(formData.notes),
      deliveryAddresses: editingClient?.deliveryAddresses || [],
      paymentTerms: editingClient?.paymentTerms || 30,
      currency: editingClient?.currency || 'MAD',
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };

    if (editingClient) {
      clientStorage.update(editingClient.id, clientData);
    } else {
      clientStorage.create(clientData);
    }

    loadClients();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      clientStorage.delete(id);
      loadClients();
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <AnimatedPage>
    <div className="page" style={{ position: 'relative', zIndex: 1 }}>
      <FloatingShapes />
      <div className="page-header">
        <h2>👥 Gestion des Clients</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Ajouter un Client
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Rechercher un client..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="clients-grid">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <p>Aucun client trouvé</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div key={client.id} className="client-card">
              <div className="client-avatar">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="client-info">
                <h3>{client.name}</h3>
                <p>📧 {client.email || 'Pas d\'email'}</p>
                <p>📞 {client.phone || 'Pas de téléphone'}</p>
                <p>📍 {client.address || 'Pas d\'adresse'}</p>
                {client.notes && <p className="client-notes">📝 {client.notes}</p>}
              </div>
              <div className="client-actions">
                <button className="btn btn-small" onClick={() => openModal(client)}>
                  ✏️
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(client.id)}>
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingClient ? 'Modifier le Client' : 'Ajouter un Client'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes sur le client..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Clients;
