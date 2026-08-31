import React, { useState, useEffect, useRef } from 'react';
import { login as userLogin, loginAsDemo, initDefaultAdmin } from '../services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { db, getDocument, saveDocument, COLLECTIONS } from '../services/firebase';
import ParticleBackground from '../components/ParticleBackground';

const DEFAULT_CODE = 'tradelink2024';
const SETTINGS_DOC_ID = 'access_config';

async function getAccessCode(): Promise<string> {
  try {
    if (!db) return DEFAULT_CODE;
    const doc = await getDocument(COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
    if (doc && doc.code) return doc.code;
  } catch (e) {
    console.warn('⚠️ Impossible de lire le code depuis Firestore, utilise le défaut');
  }
  return DEFAULT_CODE;
}

async function initDefaultCodeIfNeeded(): Promise<void> {
  try {
    if (!db) return;
    const existing = await getDocument(COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
    if (!existing) {
      await saveDocument(COLLECTIONS.SETTINGS, {
        id: SETTINGS_DOC_ID,
        code: DEFAULT_CODE,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('⚠️ Init code par défaut échouée:', e);
  }
}

const Login: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState(DEFAULT_CODE);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      await initDefaultCodeIfNeeded();
      initDefaultAdmin();
      const codeFromCloud = await getAccessCode();
      setAccessCode(codeFromCloud);
      setLoading(false);
    })();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });
  const handleDemo = () => {
    loginAsDemo();
    localStorage.setItem('tradelink_demo', 'true');
    window.location.href = '/';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = userLogin(code, code);
    if (user || code === accessCode) {
      if (user) localStorage.setItem('tradelink_access', 'granted');
      localStorage.setItem('tradelink_access_time', new Date().toISOString());
      window.location.href = '/';
    } else {
      setError(true);
      setCode('');
      setTimeout(() => setError(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="login-loading">
        <ParticleBackground density={40} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="login-loading-content"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="login-spinner"
          />
          <p>Chargement...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <ParticleBackground density={50} />
      
      {/* Animated gradient orbs */}
      <div className="login-orbs">
        <motion.div
          className="login-orb login-orb-1"
          animate={{ x: [0, 100, -50, 0], y: [0, -80, 60, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="login-orb login-orb-2"
          animate={{ x: [0, -80, 60, 0], y: [0, 100, -40, 0], scale: [1, 0.8, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="login-orb login-orb-3"
          animate={{ x: [0, 60, -80, 0], y: [0, -60, 80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        ref={cardRef}
        className="login-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 40, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        style={{
          transform: `perspective(1000px) rotateY(${mousePos.x * 5}deg) rotateX(${-mousePos.y * 5}deg)`,
        }}
      >
        {/* Glare overlay */}
        <div
          className="login-glare"
          style={{
            background: `radial-gradient(circle at ${(mousePos.x + 0.5) * 100}% ${(mousePos.y + 0.5) * 100}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
          }}
        />

        <motion.div
          className="login-logo"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
        >
          <div className="login-logo-icon">💰</div>
        </motion.div>

        <motion.h1
          className="login-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          TRADE LINK
        </motion.h1>

        <motion.p
          className="login-subtitle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Gestion des Ventes & Prospection
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="login-input-group">
            <label className="login-label">🔑 Code d'accès</label>
            <motion.input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className={`login-input ${error ? 'login-input-error' : ''}`}
              whileFocus={{ scale: 1.02, boxShadow: '0 0 0 3px rgba(59,130,246,0.3)' }}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="login-error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                ❌ Code incorrect. Veuillez réessayer.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="login-button"
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(59,130,246,0.4)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <span>Entrer</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.form>


          <motion.button
            type="button"
            className="login-button login-button-demo"
            onClick={handleDemo}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            style={{ marginTop: 12, background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <span>👁️</span>
            <span>Mode Démo (Invité)</span>
          </motion.button>

        <motion.p
          className="login-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Demandez le code à l'administrateur
        </motion.p>

        {/* Decorative floating dots */}
        <div className="login-dots">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="login-dot"
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Version badge */}
      <motion.div
        className="login-version"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        v2.0 — Design 3D
      </motion.div>
    </div>
  );
};

export default Login;
