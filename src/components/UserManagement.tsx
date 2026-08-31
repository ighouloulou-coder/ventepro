import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllUsers, createUser, deleteUser, changePassword, resetPassword, getCurrentUser } from '../services/userService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPw, setShowPw] = useState<string | null>(null);
  const [showReset, setShowReset] = useState<string | null>(null);
  const [cur, setCur] = useState<any>(null);
  const [f, setF] = useState({ username: '', displayName: '', password: '', role: 'user' as any });
  const [pw, setPw] = useState({ old: '', nw: '', confirm: '' });
  const [rpw, setRpw] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    load();
    setCur(getCurrentUser());
  }, []);

  const load = () => setUsers(getAllUsers() as any[]);

  const doCreate = () => {
    setErr('');
    if (!f.username || !f.displayName || !f.password) {
      setErr('Tous les champs requis');
      return;
    }
    if (f.password.length < 4) {
      setErr('MDP min 4 car');
      return;
    }
    if (!createUser(f.username, f.displayName, f.password, f.role)) {
      setErr('Username deja utilise');
      return;
    }
    setOk('Cree!');
    setShowCreate(false);
    setF({ username: '', displayName: '', password: '', role: 'user' });
    load();
    setTimeout(() => setOk(''), 3000);
  };

  const doChangePw = (id: string) => {
    setErr('');
    if (!pw.old || !pw.nw) {
      setErr('Remplissez tous les champs');
      return;
    }
    if (pw.nw !== pw.confirm) {
      setErr('MDP ne correspondent pas');
      return;
    }
    if (pw.nw.length < 4) {
      setErr('MDP min 4 car');
      return;
    }
    if (!changePassword(id, pw.old, pw.nw)) {
      setErr('Ancien MDP incorrect');
      return;
    }
    setOk('MDP change!');
    setShowPw(null);
    setPw({ old: '', nw: '', confirm: '' });
    setTimeout(() => setOk(''), 3000);
  };

  const doReset = (id: string) => {
    if (!rpw || rpw.length < 4) {
      setErr('MDP min 4 car');
      return;
    }
    resetPassword(id, rpw);
    setOk('MDP reinitialise!');
    setShowReset(null);
    setRpw('');
    setTimeout(() => setOk(''), 3000);
  };

  const rl = (r: string) => r === 'admin' ? 'Admin' : r === 'user' ? 'User' : 'Lecteur';
  const rc = (r: string) => r === 'admin' ? '#8b5cf6' : r === 'user' ? '#3b82f6' : '#6b7280';

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 18, padding: 20, border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>👤 Gestion des Utilisateurs</h3>
        <motion.button
          className='btn btn-primary'
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          style={{ fontSize: '0.78rem', padding: '8px 14px' }}
        >
          + Ajouter
        </motion.button>
      </div>

      {err && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: 8 }}>{err}</p>}
      {ok && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: 8 }}>{ok}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 12,
            border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: rc(u.role),
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem'
              }}>
                {u.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.displayName}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{u.username} - {rl(u.role)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPw(u.id)}
                style={{ padding: '5px 10px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                Changer MDP
              </motion.button>
              {cur?.role === 'admin' && u.id !== cur?.id && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowReset(u.id)}
                    style={{ padding: '5px 10px', background: 'var(--warning)', border: 'none', borderRadius: 8, fontSize: '0.7rem', cursor: 'pointer', color: '#1f2937' }}
                  >
                    Reset
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { deleteUser(u.id); load(); }}
                    style={{ padding: '5px 10px', background: 'var(--danger)', border: 'none', borderRadius: 8, fontSize: '0.7rem', cursor: 'pointer', color: 'white' }}
                  >
                    Supprimer
                  </motion.button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            className='modal-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              className='modal'
              onClick={e => e.stopPropagation()}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3>👤 Nouvel Utilisateur</h3>
              <div className='form-group'>
                <label>Username</label>
                <input value={f.username} onChange={e => setF({...f, username: e.target.value})} />
              </div>
              <div className='form-group'>
                <label>Nom complet</label>
                <input value={f.displayName} onChange={e => setF({...f, displayName: e.target.value})} />
              </div>
              <div className='form-group'>
                <label>Mot de passe</label>
                <input type='password' value={f.password} onChange={e => setF({...f, password: e.target.value})} />
              </div>
              <div className='form-group'>
                <label>Role</label>
                <select value={f.role} onChange={e => setF({...f, role: e.target.value})}>
                  <option value='admin'>Admin</option>
                  <option value='user'>Utilisateur</option>
                  <option value='viewer'>Lecteur</option>
                </select>
              </div>
              <div className='modal-actions'>
                <button className='btn btn-secondary' onClick={() => setShowCreate(false)}>Annuler</button>
                <button className='btn btn-primary' onClick={doCreate}>Creer</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPw && (
          <motion.div
            className='modal-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPw(null)}
          >
            <motion.div
              className='modal'
              onClick={e => e.stopPropagation()}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3>🔑 Changer MDP</h3>
              <div className='form-group'>
                <label>Ancien MDP</label>
                <input type='password' value={pw.old} onChange={e => setPw({...pw, old: e.target.value})} />
              </div>
              <div className='form-group'>
                <label>Nouveau MDP</label>
                <input type='password' value={pw.nw} onChange={e => setPw({...pw, nw: e.target.value})} />
              </div>
              <div className='form-group'>
                <label>Confirmer</label>
                <input type='password' value={pw.confirm} onChange={e => setPw({...pw, confirm: e.target.value})} />
              </div>
              <div className='modal-actions'>
                <button className='btn btn-secondary' onClick={() => setShowPw(null)}>Annuler</button>
                <button className='btn btn-primary' onClick={() => doChangePw(showPw!)}>Changer</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReset && (
          <motion.div
            className='modal-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReset(null)}
          >
            <motion.div
              className='modal'
              onClick={e => e.stopPropagation()}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3>🔄 Reset MDP</h3>
              <div className='form-group'>
                <label>Nouveau MDP</label>
                <input type='password' value={rpw} onChange={e => setRpw(e.target.value)} />
              </div>
              <div className='modal-actions'>
                <button className='btn btn-secondary' onClick={() => setShowReset(null)}>Annuler</button>
                <button className='btn btn-primary' onClick={() => doReset(showReset!)}>Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
