import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import FloatingShapes from '../components/FloatingShapes';
import TiltCard from '../components/TiltCard';
import { getRecentLogs, getLogsStats, loadLogsFromFirebase, type ActivityLog } from '../services/activityService';
import { createBackup, getBackups, initAutoBackup, startAutoBackup, stopAutoBackup, getAutoBackupInterval } from '../services/backupService';
import { getAllUsers } from '../services/userService';

const Monitoring: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [autoBackup, setAutoBackup] = useState(0);
  const [filter, setFilter] = useState('all');
  const [backupMsg, setBackupMsg] = useState('');

  useEffect(() => {
    loadData();
    initAutoBackup();
    setAutoBackup(getAutoBackupInterval());
  }, []);

  const loadData = async () => {
    await loadLogsFromFirebase();
    setLogs(getRecentLogs(100));
    setStats(getLogsStats());
    setUsers(getAllUsers());
    setBackups(getBackups());
  };

  const handleBackup = async () => {
    setBackupMsg('Backup en cours...');
    await createBackup('Backup manuel');
    setBackupMsg('Backup cree avec succes !');
    setBackups(getBackups());
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const toggleAutoBackup = (minutes: number) => {
    if (autoBackup === minutes) {
      stopAutoBackup();
      setAutoBackup(0);
    } else {
      startAutoBackup(minutes);
      setAutoBackup(minutes);
    }
  };

  const actionIcon = (a: string) => {
    const icons: Record<string, string> = { create: '➕', update: '✏️', delete: '🗑️', login: '🔑', logout: '🚪', view: '👁️', export: '📤', approve: '✅', reject: '❌' };
    return icons[a] || '📋';
  };

  const actionColor = (a: string) => {
    const colors: Record<string, string> = { create: '#10b981', update: '#3b82f6', delete: '#dc2626', login: '#8b5cf6', logout: '#6b7280', view: '#06b6d4', export: '#f59e0b', approve: '#10b981', reject: '#dc2626' };
    return colors[a] || '#6b7280';
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.action === filter);

  return (
    <AnimatedPage>
      <FloatingShapes />
      <div className="page" style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>📈 Monitoring & Activite</h2>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <TiltCard><div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Actions</p><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</p></div></TiltCard>
            <TiltCard><div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aujourd'hui</p><p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats.today}</p></div></TiltCard>
            <TiltCard><div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cette Semaine</p><p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{stats.thisWeek}</p></div></TiltCard>
            <TiltCard><div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Utilisateurs</p><p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{users.length}</p></div></TiltCard>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Activity Feed */}
          <TiltCard>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: '0.95rem' }}>📋 Journal d'Activite</h3>
                <button className="btn btn-secondary btn-small" onClick={loadData}>🔄</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {['all', 'create', 'update', 'delete', 'login', 'approve'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: '0.68rem', border: '1px solid var(--border-color)',
                    background: filter === f ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: filter === f ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer', fontWeight: 600,
                  }}>{f === 'all' ? 'Tout' : f}</button>
                ))}
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {filteredLogs.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20, fontSize: '0.8rem' }}>Aucune activite</p>}
                {filteredLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-color)', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{actionIcon(log.action)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem' }}>
                        <strong style={{ color: actionColor(log.action) }}>{log.userName}</strong>
                        {' '}{log.action} <strong>{log.entity}</strong>
                        {log.entityId && <span style={{ color: 'var(--text-muted)' }}> #{log.entityId.slice(0, 6)}</span>}
                      </p>
                      {log.details && <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{log.details}</p>}
                      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>

          {/* Backup Management */}
          <TiltCard>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>💾 Gestion des Backups</h3>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <motion.button className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleBackup} style={{ fontSize: '0.78rem' }}>
                  💾 Backup Manuel
                </motion.button>
              </div>
              {backupMsg && <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginBottom: 8 }}>{backupMsg}</p>}

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Backup Automatique</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[0, 30, 60, 120, 360].map(m => (
                    <button key={m} onClick={() => toggleAutoBackup(m)} style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: '0.7rem', border: '1px solid var(--border-color)',
                      background: autoBackup === m ? 'var(--success)' : 'var(--bg-secondary)',
                      color: autoBackup === m ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer', fontWeight: 600,
                    }}>{m === 0 ? 'OFF' : m + ' min'}</button>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 8 }}>Backups Recents ({backups.length})</p>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {backups.slice(0, 10).map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 6 }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>{b.name}</p>
                      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{new Date(b.timestamp).toLocaleString('fr-FR')} - {b.size}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => {
                        const { restoreBackup } = require('../services/backupService');
                        if (confirm('Restaurer ce backup ?')) { restoreBackup(b.id); alert('Restaure !'); }
                      }} style={{ padding: '3px 8px', background: 'var(--warning)', border: 'none', borderRadius: 6, fontSize: '0.65rem', cursor: 'pointer', color: '#1f2937' }}>Restaurer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </div>

        {/* User Activity Summary */}
        {stats && Object.keys(stats.byUser).length > 0 && (
          <TiltCard>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>👥 Activite par Utilisateur</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {Object.entries(stats.byUser).sort(([,a], [,b]) => (b as number) - (a as number)).map(([name, count]) => (
                  <div key={name} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 10, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{name}</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{count as number} actions</p>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        )}
      </div>
    </AnimatedPage>
  );
};

export default Monitoring;
