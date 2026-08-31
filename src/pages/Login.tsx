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
    // Rediriger si déjà connecté
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
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        if (!displayName.trim()) {
          setError('Le nom est requis');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName);
        setSuccess('Compte créé ! Redirection...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Cet email est déjà utilisé';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        default:
          errorMessage = err.message || 'Erreur de connexion';
      }
      
      setError(errorMessage);
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
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erreur de connexion Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleBackground />
      
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: 40,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          zIndex: 10,
          transform: `perspective(1000px) rotateX(${mousePos.y * 5}deg) rotateY(${mousePos.x * -5}deg)`,
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 10px 30px -5px rgba(59, 130, 246, 0.5)',
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>💰</span>
        </motion.div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: 8,
          background: 'linear-gradient(135deg, #1f2937 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          TRADE LINK
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: 32,
          fontSize: '0.9rem',
        }}>
          {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
        </p>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          background: '#f3f4f6',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              background: mode === 'login' ? 'white' : 'transparent',
              color: mode === 'login' ? '#1f2937' : '#6b7280',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              background: mode === 'register' ? 'white' : 'transparent',
              color: mode === 'register' ? '#1f2937' : '#6b7280',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Inscription
          </button>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                color: '#991b1b',
                fontSize: '0.85rem',
              }}
            >
              ❌ {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                color: '#166534',
                fontSize: '0.85rem',
              }}
            >
              ✅ {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginBottom: 16 }}
            >
              <label style={{
                display: 'block',
                marginBottom: 6,
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#374151',
              }}>
                Nom complet
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </motion.div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#374151',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#374151',
            }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '14px 50px 14px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {mode === 'register' && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>
                Minimum 6 caractères
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: 16,
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
            }}
          >
            {loading ? '⏳ Chargement...' : mode === 'login' ? '🚀 Se connecter' : '✨ Créer le compte'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
          color: '#9ca3af',
          fontSize: '0.85rem',
        }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ padding: '0 16px' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* Google Login */}
        <motion.button
          onClick={handleGoogleLogin}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          style={{
            width: '100%',
            padding: 14,
            background: 'white',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: 12,
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🔵</span>
          Continuer avec Google
        </motion.button>

        {/* Demo Mode */}
        <motion.button
          onClick={() => {
            localStorage.setItem('tradelink_demo', 'true');
            localStorage.setItem('tradelink_access', 'granted');
            window.location.href = '/';
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: 14,
            background: 'transparent',
            color: '#6b7280',
            border: 'none',
            fontSize: '0.85rem',
            cursor: 'pointer',
            marginTop: 12,
          }}
        >
          🎮 Mode démo (sans inscription)
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Login;

