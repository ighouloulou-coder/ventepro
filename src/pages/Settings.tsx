import React from 'react';
import UserManagement from '../components/UserManagement';
import NotificationSettings from '../components/NotificationSettings';

const Settings: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
        ⚙️ Paramètres
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 30, fontSize: '0.9rem' }}>
        Configurez les paramètres de l'application
      </p>

      {/* Auth Info */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, marginBottom: 8 }}>
          🔐 Authentification Firebase
        </div>
        <div style={{ fontSize: '0.9rem', color: '#166534', lineHeight: 1.6 }}>
          L'authentification est gérée par <strong>Firebase Authentication</strong>.<br />
          Les utilisateurs se connectent avec leur email et mot de passe.
        </div>
      </div>

      {/* User Management */}
      <div style={{ marginBottom: 30 }}>
        <UserManagement />
      </div>

      {/* Notification Settings */}
      <div style={{ marginBottom: 30 }}>
        <NotificationSettings />
      </div>

      {/* Info */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 12,
        padding: 16,
        fontSize: '0.85rem',
        color: '#0369a1',
      }}>
        <strong>💡 Astuce :</strong> Les paramètres sont synchronisés automatiquement sur Firebase.
      </div>
    </div>
  );
};

export default Settings;
