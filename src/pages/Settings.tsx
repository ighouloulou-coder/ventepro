import React, { useState, useEffect } from 'react';
import NotificationSettings from '../components/NotificationSettings';
import { db, getDocument, saveDocument, COLLECTIONS } from '../services/firebase';

const SETTINGS_DOC_ID = 'access_config';

const Settings: React.FC = () => {
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (db) {
          const doc = await getDocument(COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
          if (doc && doc.code) {
            setCurrentCode(doc.code);
          } else {
            setCurrentCode('tradelink2024');
          }
        }
      } catch (e) {
        setCurrentCode('tradelink2024');
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newCode || newCode.length < 4) {
      setMessage({ type: 'error', text: '❌ Le code doit contenir au moins 4 caractères.' });
      return;
    }

    if (newCode !== confirmCode) {
      setMessage({ type: 'error', text: '❌ Les codes ne correspondent pas.' });
      return;
    }

    setSaving(true);
    try {
      if (!db) {
        throw new Error('Firebase non connecté');
      }
      await saveDocument(COLLECTIONS.SETTINGS, {
        id: SETTINGS_DOC_ID,
        code: newCode,
        updatedAt: new Date().toISOString(),
      });
      setCurrentCode(newCode);
      setNewCode('');
      setConfirmCode('');
      setMessage({ type: 'success', text: '✅ Code d\'accès mis à jour avec succès ! Tous les appareils utiliseront le nouveau code au prochain chargement.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: `❌ Erreur: ${e.message || e}` });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
        ⏳ Chargement des paramètres...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
        ⚙️ Paramètres
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 30, fontSize: '0.9rem' }}>
        Configurez les paramètres de sécurité de l'application
      </p>

      {/* Current Code Info */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600, marginBottom: 8 }}>
          🔑 Code actuel
        </div>
        <div style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#1e40af',
          letterSpacing: 3,
          fontFamily: 'monospace',
        }}>
          {currentCode}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
          Ce code est utilisé par tous les appareils pour se connecter
        </div>
      </div>

      {/* Change Code Form */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 20 }}>
          🔄 Changer le code d'accès
        </h2>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#374151',
            }}>
              Nouveau code
            </label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Entrez le nouveau code"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                fontSize: '1rem',
                letterSpacing: 2,
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#374151',
            }}>
              Confirmer le nouveau code
            </label>
            <input
              type="text"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Retapez le nouveau code"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                fontSize: '1rem',
                letterSpacing: 2,
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 10,
              marginBottom: 16,
              fontWeight: 500,
              fontSize: '0.9rem',
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: 14,
              background: saving ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: '1rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '⏳ Enregistrement...' : '💾 Enregistrer le nouveau code'}
          </button>
        </form>
      </div>

      {/* Info */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 12,
        padding: 16,
        fontSize: '0.85rem',
        color: '#92400e',
      }}>
        <strong>⚠️ Important :</strong> Quand vous changez le code, tous les appareils connectés devront utiliser le nouveau code au prochain rechargement de la page.
      </div>
    </div>
  );
};

export default Settings;
