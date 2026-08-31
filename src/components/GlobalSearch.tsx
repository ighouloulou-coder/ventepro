import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { productStorage, clientStorage, invoiceStorage, quoteStorage, orderStorage } from '../services/storage';
import { supplierStorage } from '../services/supplierStorage';

interface SearchResult {
  type: string;
  icon: string;
  label: string;
  sublabel: string;
  path: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Products
    productStorage.getAll().forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q)) {
        allResults.push({ type: 'Produit', icon: '📦', label: p.name, sublabel: `Réf: ${p.reference || '-'}`, path: '/products' });
      }
    });

    // Clients
    clientStorage.getAll().forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)) {
        allResults.push({ type: 'Client', icon: '👤', label: c.name, sublabel: c.email || c.phone || '', path: '/clients' });
      }
    });

    // Invoices
    invoiceStorage.getAll().forEach(i => {
      if (i.reference?.toLowerCase().includes(q) || i.clientName?.toLowerCase().includes(q)) {
        allResults.push({ type: 'Facture', icon: '🧾', label: i.reference || `Facture #${i.id}`, sublabel: `${i.clientName || ''} - ${i.total} MAD`, path: '/invoices' });
      }
    });

    // Quotes
    quoteStorage.getAll().forEach(q2 => {
      if (q2.reference?.toLowerCase().includes(q) || q2.clientName?.toLowerCase().includes(q)) {
        allResults.push({ type: 'Devis', icon: '📄', label: q2.reference || `Devis #${q2.id}`, sublabel: `${q2.clientName || ''} - ${q2.total} MAD`, path: '/quotes' });
      }
    });

    // Orders
    orderStorage.getAll().forEach(o => {
      if (o.reference?.toLowerCase().includes(q) || o.clientName?.toLowerCase().includes(q)) {
        allResults.push({ type: 'Commande', icon: '📋', label: o.reference || `Commande #${o.id}`, sublabel: `${o.clientName || ''} - ${o.total} MAD`, path: '/orders' });
      }
    });

    // Suppliers
    supplierStorage.getAll().forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.tradeName?.toLowerCase().includes(q)) {
        allResults.push({ type: 'Fournisseur', icon: '🏭', label: s.name, sublabel: s.tradeName || '', path: '/suppliers' });
      }
    });

    setResults(allResults.slice(0, 10));
  }, [query]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '15vh',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-primary)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 560,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            margin: '0 16px',
          }}
        >
          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            gap: 12,
          }}>
            <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit, client, facture..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '1rem',
                outline: 'none',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={onClose}
              style={{
                padding: '4px 10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {results.length > 0 ? (
              results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelect(result.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '1.3rem' }}>{result.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
                      {result.label}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {result.sublabel}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                  }}>
                    {result.type}
                  </span>
                </motion.div>
              ))
            ) : query.trim() ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</p>
                <p>Aucun résultat pour "{query}"</p>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>⌨️</p>
                <p>Commencez à taper pour rechercher</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalSearch;
