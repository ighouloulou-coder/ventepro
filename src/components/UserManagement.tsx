import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// 👥 Gestion Utilisateurs avec Permissions
// ============================================

interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'user';
  permissions: string[];
  createdAt: string;
}

const USERS_KEY = 'tradelink_users_v2';

const SECTIONS = [
  { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
  { id: 'products', label: '📦 Produits', icon: '📦' },
  { id: 'clients', label: '👥 Clients', icon: '👥' },
  { id: 'quotes', label: '📄 Devis', icon: '📄' },
  { id: 'orders', label: '📋 Commandes', icon: '📋' },
  { id: 'deliveries', label: '🚚 Livraisons', icon: '🚚' },
  { id: 'pricing', label: '💲 Tarifs', icon: '💲' },
  { id: 'invoices', label: '🧾 Factures', icon: '🧾' },
  { id: 'overdue', label: '🚨 Impayés', icon: '🚨' },
  { id: 'portal', label: '👤 Portail Client', icon: '👤' },
  { id: 'suppliers', label: '🏭 Fournisseurs', icon: '🏭' },
  { id: 'supplier-orders', label: '📋 Cmd Fournisseurs', icon: '📋' },
  { id: 'supplier-dashboard', label: '🏭 Dashboard Fourn.', icon: '🏭' },
  { id: 'analytics', label: '📊 Analytics', icon: '📊' },
  { id: 'monitoring', label: '📈 Monitoring', icon: '📈' },
  { id: 'settings', label: '⚙️ Paramètres', icon: '⚙️' },
];

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function getUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch { return []; }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser(): { id: string; username: string; role: string; permissions: string[] } | null {
  try {
    const data = localStorage.getItem('tradelink_current_user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState<string | null>(null);
  const [showChangeMyPassword, setShowChangeMyPassword] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // Form state
  const [newUser, setNewUser] = useState({
    username: '',
    displayName: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    permissions: [] as string[],
  });
  const [passwordForm, setPasswordForm] = useState({ old: '', nw: '', confirm: '' });
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    setUsers(getUsers());
    setCurrentUser(getCurrentUser());
  }, []);

  const reload = () => setUsers(getUsers());

  // ============================================
  // Create User
  // ============================================
  const handleCreate = () => {
    setErr('');
    if (!newUser.username || !newUser.displayName || !newUser.password) {
      setErr('Tous les champs sont requis');
      return;
    }
    if (newUser.password.length < 4) {
      setErr('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    const existing = users.find(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (existing) {
      setErr('Ce nom d\'utilisateur existe déjà');
      return;
    }

    const user: User = {
      id: 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      username: newUser.username,
      displayName: newUser.displayName,
      passwordHash: simpleHash(newUser.password),
      role: newUser.role,
      permissions: newUser.role === 'admin' ? ['all'] : newUser.permissions,
      createdAt: new Date().toISOString(),
    };

    const allUsers = [...users, user];
    saveUsers(allUsers);
    setUsers(allUsers);
    setShowCreate(false);
    setNewUser({ username: '', displayName: '', password: '', role: 'user', permissions: [] });
    setOk('Utilisateur créé !');
    setTimeout(() => setOk(''), 3000);
  };

  // ============================================
  // Change My Password
  // ============================================
  const handleChangeMyPassword = () => {
    setErr('');
    if (!passwordForm.old || !passwordForm.nw) {
      setErr('Remplissez tous les champs');
      return;
    }
    if (passwordForm.nw !== passwordForm.confirm) {
      setErr('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.nw.length < 4) {
      setErr('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    const allUsers = getUsers();
    const idx = allUsers.findIndex(u => u.id === currentUser?.id);
    if (idx === -1) {
      setErr('Utilisateur non trouvé');
      return;
    }
    if (allUsers[idx].passwordHash !== simpleHash(passwordForm.old)) {
      setErr('Ancien mot de passe incorrect');
      return;
    }

    allUsers[idx].passwordHash = simpleHash(passwordForm.nw);
    saveUsers(allUsers);
    setUsers(allUsers);
    setShowChangeMyPassword(false);
    setPasswordForm({ old: '', nw: '', confirm: '' });
    setOk('Mot de passe changé !');
    setTimeout(() => setOk(''), 3000);
  };

  // ============================================
  // Reset User Password (Admin)
  // ============================================
  const handleResetPassword = (userId: string) => {
    setErr('');
    if (!resetPassword || resetPassword.length < 4) {
      setErr('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    const allUsers = getUsers();
    const idx = allUsers.findIndex(u => u.id === userId);
    if (idx === -1) return;

    allUsers[idx].passwordHash = simpleHash(resetPassword);
    saveUsers(allUsers);
    setUsers(allUsers);
    setShowEditPassword(null);
    setResetPassword('');
    setOk('Mot de passe réinitialisé !');
    setTimeout(() => setOk(''), 3000);
  };

  // ============================================
  // Delete User
  // ============================================
  const handleDelete = (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const allUsers = users.filter(u => u.id !== userId);
    saveUsers(allUsers);
    setUsers(allUsers);
    setOk('Utilisateur supprimé');
    setTimeout(() => setOk(''), 3000);
  };

  // ============================================
  // Toggle Permission
  // ============================================
  const togglePermission = (sectionId: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(sectionId)
        ? prev.permissions.filter(p => p !== sectionId)
        : [...prev.permissions, sectionId],
    }));
  };

  // ============================================
  // Styles
  // ============================================
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#374151',
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '8px 16px',
    background: color,
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 18, padding: 20, border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>👤 Gestion des Utilisateurs</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {currentUser?.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowChangeMyPassword(true)}
              style={btnStyle('#6366f1')}
            >
              🔑 Changer mon MDP
            </motion.button>
          )}
          {currentUser?.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              style={btnStyle('#2563eb')}
            >
              + Ajouter
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages */}
      {err && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: '0.85rem' }}>❌ {err}</div>}
      {ok && <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: '0.85rem' }}>✅ {ok}</div>}

      {/* Users List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 12,
            border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: u.role === 'admin' ? '#8b5cf6' : '#3b82f6',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem',
              }}>
                {u.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{u.displayName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  @{u.username} • {u.role === 'admin' ? '🔑 Admin' : '👤 Utilisateur'}
                </p>
                {u.role === 'user' && u.permissions.length > 0 && u.permissions[0] !== 'all' && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {u.permissions.slice(0, 3).map(p => (
                      <span key={p} style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 6 }}>
                        {SECTIONS.find(s => s.id === p)?.icon} {p}
                      </span>
                    ))}
                    {u.permissions.length > 3 && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 6 }}>
                        +{u.permissions.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {currentUser?.role === 'admin' && currentUser?.id !== u.id && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditPassword(u.id)}
                    style={btnStyle('#f59e0b')}
                  >
                    Reset MDP
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(u.id)}
                    style={btnStyle('#dc2626')}
                  >
                    Supprimer
                  </motion.button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================ */}
      {/* MODAL: Create User */}
      {/* ============================================ */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={{ maxWidth: 500 }}>
              <h3 style={{ marginBottom: 20 }}>👤 Nouvel Utilisateur</h3>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom d'utilisateur</label>
                <input style={inputStyle} value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: jean" />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom complet</label>
                <input style={inputStyle} value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} placeholder="Ex: Jean Dupont" />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Mot de passe</label>
                <input style={inputStyle} type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Min. 4 caractères" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Rôle</label>
                <select
                  style={inputStyle}
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as 'admin' | 'user', permissions: e.target.value === 'admin' ? ['all'] : []})}
                >
                  <option value="user">👤 Utilisateur</option>
                  <option value="admin">🔑 Administrateur</option>
                </select>
              </div>

              {/* Permissions (only for users) */}
              {newUser.role === 'user' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>📋 Permissions (sections accessibles)</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 8,
                    marginTop: 8,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                  }}>
                    {SECTIONS.map(section => {
                      const hasPermission = newUser.permissions.includes(section.id);
                      return (
                        <motion.button
                          key={section.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePermission(section.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: `2px solid ${hasPermission ? '#2563eb' : '#e5e7eb'}`,
                            background: hasPermission ? '#eff6ff' : 'white',
                            color: hasPermission ? '#1d4ed8' : '#6b7280',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span>{hasPermission ? '✅' : '⬜'}</span>
                          {section.label}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>
                    Cochez les sections auxquelles l'utilisateur aura accès
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleCreate}>Créer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL: Change My Password */}
      {/* ============================================ */}
      <AnimatePresence>
        {showChangeMyPassword && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowChangeMyPassword(false)}>
            <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
              <h3>🔑 Changer mon mot de passe</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Ancien mot de passe</label>
                <input style={inputStyle} type="password" value={passwordForm.old} onChange={e => setPasswordForm({...passwordForm, old: e.target.value})} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <input style={inputStyle} type="password" value={passwordForm.nw} onChange={e => setPasswordForm({...passwordForm, nw: e.target.value})} placeholder="Min. 4 caractères" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Confirmer</label>
                <input style={inputStyle} type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowChangeMyPassword(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleChangeMyPassword}>Changer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL: Reset User Password */}
      {/* ============================================ */}
      <AnimatePresence>
        {showEditPassword && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditPassword(null)}>
            <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
              <h3>🔄 Réinitialiser le mot de passe</h3>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 16 }}>
                Utilisateur : <strong>{users.find(u => u.id === showEditPassword)?.displayName}</strong>
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <input style={inputStyle} type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Min. 4 caractères" />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowEditPassword(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={() => handleResetPassword(showEditPassword!)}>Réinitialiser</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
