import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'text' | 'loading' | 'exit'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 400);
    const t2 = setTimeout(() => setPhase('loading'), 1000);
    const t3 = setTimeout(() => setPhase('exit'), 2400);
    const t4 = setTimeout(() => onComplete(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  useEffect(() => {
    if (phase === 'loading') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100; }
          return p + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="splash-screen">
      <div className="splash-particles">
        {particles.map(i => (
          <motion.div
            key={i}
            className="splash-particle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0.5],
              x: [0, (Math.random() - 0.5) * 300],
              y: [0, (Math.random() - 0.5) * 300],
            }}
            transition={{ duration: 2.5, delay: i * 0.08, ease: 'easeOut' }}
            style={{ left: '50%', top: '50%', width: Math.random() * 6 + 2, height: Math.random() * 6 + 2 }}
          />
        ))}
      </div>

      <motion.div
        className="splash-orb"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key="logo"
          className="splash-logo"
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          💰
        </motion.div>

        {phase !== 'logo' && (
          <motion.div
            key="title"
            className="splash-title"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            TRADE LINK
          </motion.div>
        )}

        {phase !== 'logo' && (
          <motion.div
            key="subtitle"
            className="splash-subtitle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            INTERNATIONAL
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === 'loading' || phase === 'exit') && (
        <motion.div
          className="splash-progress-container"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 200 }}
          transition={{ duration: 0.3 }}
        >
          <div className="splash-progress-track">
            <motion.div className="splash-progress-bar" style={{ width: progress + '%' }} />
          </div>
          <motion.span className="splash-progress-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {progress < 100 ? 'Chargement...' : 'Pret !'}
          </motion.span>
        </motion.div>
      )}

      <motion.div className="splash-version" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 0.5 }}>
        v2.0
      </motion.div>
    </div>
  );
};

export default SplashScreen;