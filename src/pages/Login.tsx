import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isAuthenticated, FIREBASE_EMAILS, FIREBASE_PWD_SUFFIX } from '../services/authService';
import './Login.css';

// ============================================
// 🔐 Login simplifié : username + mot de passe
// ============================================

interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'user';
  permissions: string[];
  firebaseEmail?: string; // e-mail du compte Firebase associé (optionnel)
}

const USERS_KEY = 'tradelink_users_v2';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function getUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch { return []; }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// 🔥 Ouvre une session Firebase Auth pour débloquer Firestore.
// Best effort : en cas d'échec (offline, Firebase KO), on continue en mode local.
async function connecterFirebase(user: StoredUser, password: string): Promise<void> {
  const email = user.firebaseEmail || FIREBASE_EMAILS[user.username.toLowerCase()];
  if (!email) return;
  try {
    await Promise.race([
      signInWithEmailAndPassword(auth, email, password + FIREBASE_PWD_SUFFIX),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
    ]);
    console.log('🔥 Session Firebase ouverte pour', email);
  } catch (e: any) {
    console.warn('⚠️ Session Firebase non ouverte (mode local) :', e?.code || e?.message || e);
  }
}

// 🛡️ Sécurité : aucun mot de passe en dur dans le code.
// Au premier démarrage (aucun utilisateur), l'écran de création
// du compte administrateur s'affiche au lieu du formulaire de login.

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  // Premier démarrage : aucun utilisateur → écran de création admin
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [setupName, setSetupName] = useState('Ismail');
  const [setupUsername, setSetupUsername] = useState('ISMAIL');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupEmail, setSetupEmail] = useState('ismail@tradelink.app');
  const cardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect if already logged in (vérification complète, pas juste la présence d'un user)
    // ⚠️ Sauf juste après une déconnexion : on ne renvoie PAS vers l'app,
    // même si une session Firebase persiste encore dans le navigateur.
    const loggedOut = sessionStorage.getItem('tradelink_logged_out') === '1';
    if (!loggedOut && isAuthenticated()) {
      window.location.href = '/';
      return;
    }
    // Aucun utilisateur enregistré → premier démarrage
    if (getUsers().length === 0) {
      setIsFirstRun(true);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const users = getUsers();
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === simpleHash(password)
      );

      if (!user) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      // Open the Firebase session (Firestore) BEFORE saving the local session
      await connecterFirebase(user, password);

      // Save session
      sessionStorage.removeItem('tradelink_logged_out');
      localStorage.setItem('tradelink_current_user', JSON.stringify({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions,
      }));
      localStorage.setItem('tradelink_access', 'granted');

      // Redirect
      window.location.href = '/';
    } catch (err: any) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    sessionStorage.removeItem('tradelink_logged_out');
    localStorage.setItem('tradelink_demo', 'true');
    localStorage.setItem('tradelink_access', 'granted');
    window.location.href = '/';
  };

  // 🛡️ Premier démarrage : création du compte administrateur.
  // Le mot de passe est choisi par l'utilisateur, jamais écrit dans le code.
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!setupUsername.trim() || !setupName.trim() || !setupPassword) {
      setError('Tous les champs sont requis');
      return;
    }
    if (setupPassword.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const admin: StoredUser = {
        id: 'admin_' + Date.now().toString(36),
        username: setupUsername.trim().toUpperCase(),
        displayName: setupName.trim(),
        passwordHash: simpleHash(setupPassword),
        role: 'admin',
        permissions: ['all'],
        firebaseEmail: setupEmail.trim() || undefined,
      };
      saveUsers([admin]);

      await connecterFirebase(admin, setupPassword);

      sessionStorage.removeItem('tradelink_logged_out');
      localStorage.setItem('tradelink_current_user', JSON.stringify({
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
        permissions: admin.permissions,
      }));
      localStorage.setItem('tradelink_access', 'granted');
      window.location.href = '/';
    } catch (err: any) {
      setError('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  // ---- Écran de premier démarrage ----
  const renderSetup = () => (
    <>
      <h1 className="login-title">TRADE LINK</h1>
      <p className="login-subtitle">🛡️ Premier démarrage : créez votre compte administrateur</p>
      {error && <div className="login-msg error">❌ {error}</div>}
      <form onSubmit={handleSetup}>
        <div className="login-field">
          <label className="login-label">Votre prénom</label>
          <input type="text" value={setupName} onChange={(e) => setSetupName(e.target.value)}
            placeholder="Ismail" required autoComplete="given-name" autoFocus />
        </div>
        <div className="login-field">
          <label className="login-label">Nom d'utilisateur</label>
          <input type="text" value={setupUsername} onChange={(e) => setSetupUsername(e.target.value)}
            placeholder="ISMAIL" required autoComplete="username" />
        </div>
        <div className="login-field">
          <label className="login-label">E-mail du compte Firebase (synchro en ligne)</label>
          <input type="email" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)}
            placeholder="ismail@tradelink.app" autoComplete="email" />
        </div>
        <div className="login-field">
          <label className="login-label">Mot de passe (min. 4 caractères)</label>
          <div className="login-password-wrapper">
            <input type={showPassword ? 'text' : 'password'} value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)} placeholder="••••••••"
              required autoComplete="new-password" style={{ paddingRight: 50 }} />
            <button type="button" className="login-password-toggle"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
        <div className="login-field" style={{ marginBottom: 24 }}>
          <label className="login-label">Confirmer le mot de passe</label>
          <input type={showPassword ? 'text' : 'password'} value={setupConfirm}
            onChange={(e) => setSetupConfirm(e.target.value)} placeholder="••••••••"
            required autoComplete="new-password" />
        </div>
        <motion.button type="submit" disabled={loading} className="login-submit primary"
          whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}>
          {loading ? '⏳ Création...' : '✅ Créer mon compte admin'}
        </motion.button>
      </form>
    </>
  );

  return (
    <div className="login-wrapper">
      {/* Particules de fond */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.3,
            ...(i === 1 ? { width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', top: '10%', left: '10%' } :
              i === 2 ? { width: 350, height: 350, background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', top: '60%', right: '10%' } :
              { width: 300, height: 300, background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)', bottom: '10%', left: '40%' })
          }} />
        ))}
      </div>

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          transform: `perspective(1000px) rotateX(${mousePos.y * 5}deg) rotateY(${mousePos.x * -5}deg)`,
        }}
      >
        {/* Logo */}
        <motion.div
          className="login-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          💰
        </motion.div>

        {/* Title */}
        {isFirstRun ? renderSetup() : (
        <>
        <h1 className="login-title">TRADE LINK</h1>
        <p className="login-subtitle">Connectez-vous à votre compte</p>

        {/* Error */}
        {error && (
          <div className="login-msg error">❌ {error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="login-field" style={{ marginBottom: 24 }}>
            <label className="login-label">Mot de passe</label>
            <div className="login-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: 50 }}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="login-submit primary"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? '⏳ Chargement...' : '🚀 Se connecter'}
          </motion.button>
        </form>

        {/* Demo Mode */}
        <motion.button
          className="login-demo-btn"
          onClick={handleDemo}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🎮 Mode démo (sans connexion)
        </motion.button>
        </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
