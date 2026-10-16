import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/authService';
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

// 🔑 Comptes Firebase correspondants (créés une fois via scripts/create-firebase-users.mjs).
// Le mot de passe Firebase = mot de passe local + suffixe (Firebase exige ≥ 6 caractères).
const FIREBASE_EMAILS: Record<string, string> = {
  ismail: 'ismail@tradelink.app',
  houssam: 'houssam@tradelink.app',
};
const FIREBASE_PWD_SUFFIX = 'TL!26';

// 🔥 Ouvre une session Firebase Auth pour débloquer Firestore.
// Best effort : en cas d'échec (offline, Firebase KO), on continue en mode local.
async function connecterFirebase(username: string, password: string): Promise<void> {
  const email = FIREBASE_EMAILS[username.toLowerCase()];
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

function initDefaultAdmins(): void {
  const users = getUsers();
  if (users.length === 0) {
    const admins: StoredUser[] = [
      {
        id: 'admin_ismail',
        username: 'ISMAIL',
        displayName: 'Ismail',
        passwordHash: simpleHash('2024'),
        role: 'admin',
        permissions: ['all'],
      },
      {
        id: 'admin_houssam',
        username: 'HOUSSAM',
        displayName: 'Houssam',
        passwordHash: simpleHash('2026'),
        role: 'admin',
        permissions: ['all'],
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(admins));
  }
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    initDefaultAdmins();
    // Redirect if already logged in
    // ⚠️ Sauf juste après une déconnexion : on ne renvoie PAS vers l'app,
    // même si une session Firebase persiste encore dans le navigateur.
    const loggedOut = sessionStorage.getItem('tradelink_logged_out') === '1';
    const saved = localStorage.getItem('tradelink_current_user');
    if (saved && !loggedOut) {
      window.location.href = '/';
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
      await connecterFirebase(username, password);

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
      </motion.div>
    </div>
  );
};

export default Login;
