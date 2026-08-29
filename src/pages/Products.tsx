import React, { useState, useEffect } from 'react';
import { productStorage } from '../services/storage';
import { Product } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeInput, sanitizeAmount, sanitizeQuantity, isValidString } from '../services/sanitize';
import PhotoUpload from '../components/PhotoUpload';

const PRESET_CATEGORIES = [
  '📦 Produit',
  '🔧 Service',
  '💻 Numérique',
  '👕 Vêtement',
  '🏠 Maison',
  '🍔 Alimentation',
  '📱 Électronique',
  '📚 Livre',
  '🎮 Divertissement',
  '🚗 Auto/Moto',
  '💼 Bureautique',
  '🏋️ Sport',
];

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customCategory, setCustomCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    purchasePrice: '',
    stock: '',
    category: '',
    photo: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(productStorage.getAll());
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        purchasePrice: product.purchasePrice?.toString() || '',
        stock: product.stock.toString(),
        category: product.category,
        photo: product.photo || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', purchasePrice: '', stock: '', category: '', photo: '' });
    }
    setCustomCategory('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', purchasePrice: '', stock: '', category: '', photo: '' });
    setCustomCategory('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation et sanitization
    if (!isValidString(formData.name, 1)) {
      alert('Le nom du produit est requis');
      return;
    }

    const finalCategory = customCategory || formData.category;

    const purchasePrice = sanitizeAmount(formData.purchasePrice);
    const salePrice = sanitizeAmount(formData.price);
    const margin = purchasePrice > 0 ? Math.round(((salePrice - purchasePrice) / purchasePrice) * 100) : 0;

    const productData: Product = {
      id: editingProduct?.id || uuidv4(),
      name: sanitizeInput(formData.name),
      description: sanitizeInput(formData.description),
      price: salePrice,
      purchasePrice,
      margin,
      stock: sanitizeQuantity(formData.stock),
      category: sanitizeInput(finalCategory),
      unit: 'pièce',
      sku: '',
      photo: formData.photo,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    if (editingProduct) {
      productStorage.update(editingProduct.id, productData);
    } else {
      productStorage.create(productData);
    }

    loadProducts();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      productStorage.delete(id);
      loadProducts();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Catégories uniques existantes
  const existingCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtrer les produits
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Statistiques par catégorie
  const categoryStats = existingCategories.map(cat => ({
    category: cat,
    count: products.filter(p => p.category === cat).length,
    totalValue: products.filter(p => p.category === cat).reduce((sum, p) => sum + p.price * p.stock, 0),
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h2>📦 Gestion des Produits</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Ajouter un Produit
        </button>
      </div>

      {/* Filtres par catégorie */}
      <div className="category-filters">
        <button
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          Tous ({products.length})
        </button>
        {existingCategories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat} ({products.filter(p => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Statistiques par catégorie */}
      {categoryStats.length > 0 && (
        <div className="category-stats">
          {categoryStats.map(stat => (
            <div key={stat.category} className="category-stat-card">
              <h4>{stat.category}</h4>
              <p>{stat.count} produit{stat.count > 1 ? 's' : ''}</p>
              <p className="stat-value">{formatCurrency(stat.totalValue)}</p>
            </div>
          ))}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Description</th>
            <th>Prix Achat</th>
            <th>Prix Vente</th>
            <th>Marge</th>
            <th>Stock</th>
            <th>Catégorie</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-state">Aucun produit trouvé</td>
            </tr>
          ) : (
            filteredProducts.map(product => (
              <tr key={product.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {product.photo ? (
                      <img
                        src={product.photo}
                        alt={product.name}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem',
                      }}>📦</div>
                    )}
                    <strong>{product.name}</strong>
                  </div>
                </td>
                <td>{product.description}</td>
                <td style={{ color: 'var(--gray-500)' }}>{formatCurrency(product.purchasePrice || 0)}</td>
                <td><strong>{formatCurrency(product.price)}</strong></td>
                <td>
                  {product.purchasePrice > 0 ? (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: product.margin >= 20 ? '#dcfce7' : product.margin >= 10 ? '#fef3c7' : '#fee2e2',
                      color: product.margin >= 20 ? '#166534' : product.margin >= 10 ? '#92400e' : '#991b1b',
                    }}>
                      +{product.margin}%
                    </span>
                  ) : (
                    <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>-</span>
                  )}
                </td>
                <td>
                  <span className={product.stock < 5 ? 'stock-low' : ''}>
                    {product.stock}
                    {product.stock < 5 && ' ⚠️'}
                  </span>
                </td>
                <td>
                  <span className="category-tag">{product.category || 'Sans catégorie'}</span>
                </td>
                <td className="actions">
                  <button className="btn btn-small" onClick={() => openModal(product)}>
                    ✏️
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => handleDelete(product.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}</h3>
            <form onSubmit={handleSubmit}>
              {/* Photo */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <PhotoUpload
                  currentPhoto={formData.photo}
                  onPhotoChange={(photo) => setFormData({ ...formData, photo })}
                  size={140}
                />
              </div>

              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix d'achat (MAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Prix de vente (MAD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.purchasePrice && formData.price && (
                <div style={{
                  background: 'var(--bg-info)',
                  border: '1px solid var(--border-info)',
                  borderRadius: 8,
                  padding: '10px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-info)' }}>Marge calculée :</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: (parseFloat(formData.price) - parseFloat(formData.purchasePrice)) / parseFloat(formData.purchasePrice) * 100 >= 20 ? '#16a34a' : '#f59e0b',
                  }}>
                    +{((parseFloat(formData.price) - parseFloat(formData.purchasePrice)) / parseFloat(formData.purchasePrice) * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>

              {/* Sélection de catégorie */}
              <div className="form-group">
                <label>Catégorie *</label>
                <div className="category-selector">
                  <select
                    value={formData.category}
                    onChange={e => {
                      setFormData({ ...formData, category: e.target.value });
                      setCustomCategory('');
                    }}
                  >
                    <option value="">Choisir une catégorie</option>
                    {PRESET_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {existingCategories
                      .filter(cat => !PRESET_CATEGORIES.includes(cat))
                      .map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    <option value="custom">✏️ Autre (personnalisée)</option>
                  </select>

                  {formData.category === 'custom' && (
                    <input
                      type="text"
                      placeholder="Entrez la catégorie..."
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      className="custom-category-input"
                    />
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
