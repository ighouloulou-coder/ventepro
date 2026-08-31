import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    const saved = localStorage.getItem('tradelink_current_user');
    if (saved) {
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

      // Save session
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
