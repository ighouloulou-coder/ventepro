import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle,
  isAuthenticated 
} from '../services/authService';
import './Login.css';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      window.location.href = '/';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        setSuccess('Connexion réussie ! Redirection...');
        setTimeout(() => { window.location.href = '/'; }, 1000);
      } else {
        if (!displayName.trim()) {
          setError('Le nom est requis');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName);
        setSuccess('Compte créé ! Redirection...');
        setTimeout(() => { window.location.href = '/'; }, 1000);
      }
    } catch (err: any) {
      let msg = 'Une erreur est survenue';
      switch (err.code) {
        case 'auth/user-not-found': msg = 'Aucun compte trouvé avec cet email'; break;
        case 'auth/wrong-password': msg = 'Mot de passe incorrect'; break;
        case 'auth/invalid-email': msg = 'Email invalide'; break;
        case 'auth/email-already-in-use': msg = 'Cet email est déjà utilisé'; break;
        case 'auth/weak-password': msg = 'Le mot de passe doit contenir au moins 6 caractères'; break;
        case 'auth/invalid-credential': msg = 'Email ou mot de passe incorrect'; break;
        default: msg = err.message || 'Erreur de connexion';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      setSuccess('Connexion Google réussie !');
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erreur de connexion Google');
      }
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
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
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
        <p className="login-subtitle">
          {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
        </p>

        {/* Mode Toggle */}
        <div className="login-toggle">
          <button
            type="button"
            className={`login-toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`login-toggle-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          >
            Inscription
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="login-msg error">❌ {error}</div>
        )}
        {success && (
          <div className="login-msg success">✅ {success}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="login-field">
              <label className="login-label">Nom complet</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
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
                minLength={6}
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
            {mode === 'register' && (
              <p className="login-hint">Minimum 6 caractères</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className={`login-submit primary`}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? '⏳ Chargement...' : mode === 'login' ? '🚀 Se connecter' : '✨ Créer le compte'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider-line" />
          <span className="login-divider-text">ou</span>
          <div className="login-divider-line" />
        </div>

        {/* Google Login */}
        <motion.button
          className="login-google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          <span style={{ fontSize: '1.2rem' }}>🔵</span>
          Continuer avec Google
        </motion.button>

        {/* Demo Mode */}
        <motion.button
          className="login-demo-btn"
          onClick={handleDemo}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🎮 Mode démo (sans inscription)
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Login;
