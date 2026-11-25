import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { requestNotificationPermission, isNotificationSupported } from '../services/notifications-push';

const NotificationSettings: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [supported] = useState(isNotificationSupported());

  useEffect(() => {
    setEnabled(Notification.permission === 'granted');
  }, []);

  const toggle = async () => {
    if (enabled) {
      setEnabled(false);
      return;
    }
    const granted = await requestNotificationPermission();
    setEnabled(granted);
  };

  if (!supported) return null;

  return (
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid var(--border-color)',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            Notifications
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {enabled ? 'Activées' : 'Désactivées'} — Nouvelles commandes, factures, livraisons
          </p>
        </div>
      </div>
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: enabled ? 'var(--success)' : 'var(--bg-tertiary)',
          color: enabled ? 'white' : 'var(--text-primary)',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        {enabled ? 'Activé' : 'Activer'}
      </motion.button>
    </div>
  );
};

export default NotificationSettings;
