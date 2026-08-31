import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle,
  isAuthenticated 
} from '../services/authService';
import ParticleBackground from '../components/ParticleBackground';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated()) {
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

  const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });

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

  // Styles 100% inline pour éviter les conflits CSS
  const s = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      padding: '20px',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '40px 32px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      position: 'relative' as const,
      zIndex: 10,
      transform: `perspective(1000px) rotateX(${mousePos.y * 5}deg) rotateY(${mousePos.x * -5}deg)`,
      boxSizing: 'border-box' as const,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: '18px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      display: 'flex',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      margin: '0 auto 20px',
      boxShadow: '0 10px 30px -5px rgba(59, 130, 246, 0.5)',
    },
    title: {
      fontSize: '1.7rem',
      fontWeight: 800,
      textAlign: 'center' as const,
      marginBottom: '6px',
      color: '#1f2937',
    },
    subtitle: {
      textAlign: 'center' as const,
      color: '#6b7280',
      marginBottom: '28px',
      fontSize: '0.9rem',
    },
    toggleRow: {
      display: 'flex',
      background: '#f3f4f6',
      borderRadius: '12px',
      padding: '4px',
      marginBottom: '24px',
    },
    toggleBtn: (active: boolean) => ({
      flex: 1,
      padding: '12px',
      border: 'none',
      borderRadius: '10px',
      background: active ? '#ffffff' : 'transparent',
      color: active ? '#1f2937' : '#6b7280',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      fontSize: '0.95rem',
    }),
    msg: (type: 'error' | 'success') => ({
      background: type === 'error' ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`,
      borderRadius: '12px',
      padding: '12px 16px',
      marginBottom: '16px',
      color: type === 'error' ? '#991b1b' : '#166534',
      fontSize: '0.85rem',
    }),
    label: {
      display: 'block',
      marginBottom: '6px',
      fontWeight: 600,
      fontSize: '0.85rem',
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s',
      fontFamily: 'inherit',
      textAlign: 'left' as const,
      letterSpacing: 'normal',
    },
    submitBtn: {
      width: '100%',
      padding: '16px',
      background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
      fontFamily: 'inherit',
    },
    googleBtn: {
      width: '100%',
      padding: '14px',
      background: 'white',
      color: '#374151',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: '10px',
      fontFamily: 'inherit',
    },
    demoBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#6b7280',
      border: 'none',
      fontSize: '0.85rem',
      cursor: 'pointer',
      marginTop: '12px',
      fontFamily: 'inherit',
    },
    divider: {
      display: 'flex',
      alignItems: 'center' as const,
      margin: '20px 0',
      color: '#9ca3af',
      fontSize: '0.85rem',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#e5e7eb',
    },
    dividerText: {
      padding: '0 16px',
    },
  };

  return (
    <div style={s.page}>
      <ParticleBackground />
      
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={s.card}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={s.logo}
        >
          <span style={{ fontSize: '2.5rem' }}>💰</span>
        </motion.div>

        {/* Title */}
        <h1 style={s.title}>TRADE LINK</h1>
        <p style={s.subtitle}>
          {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
        </p>

        {/* Mode Toggle */}
        <div style={s.toggleRow}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            style={s.toggleBtn(mode === 'login')}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            style={s.toggleBtn(mode === 'register')}
          >
            Inscription
          </button>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={s.msg('error')}>
              ❌ {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={s.msg('success')}>
              ✅ {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={s.label}>Nom complet</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
                style={s.input}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={s.input}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={s.label}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{ ...s.input, paddingRight: '50px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: 0,
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {mode === 'register' && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '6px' }}>
                Minimum 6 caractères
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={s.submitBtn}
          >
            {loading ? '⏳ Chargement...' : mode === 'login' ? '🚀 Se connecter' : '✨ Créer le compte'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>ou</span>
          <div style={s.dividerLine} />
        </div>

        {/* Google Login */}
        <motion.button
          onClick={handleGoogleLogin}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          style={s.googleBtn}
        >
          <span style={{ fontSize: '1.2rem' }}>🔵</span>
          Continuer avec Google
        </motion.button>

        {/* Demo Mode */}
        <motion.button
          onClick={handleDemo}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={s.demoBtn}
        >
          🎮 Mode démo (sans inscription)
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Login;
