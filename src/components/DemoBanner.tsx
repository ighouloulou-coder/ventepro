import React from 'react';
import { motion } from 'framer-motion';

const DemoBanner: React.FC = () => {
  const isDemo = localStorage.getItem('tradelink_demo') === 'true';
  if (!isDemo) return null;

  return (
    <motion.div
      className="demo-banner"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <span>👁️</span>
      <span>Mode Démo — Les données ne sont pas sauvegardées</span>
      <button
        className="demo-exit"
        onClick={() => {
          localStorage.removeItem('tradelink_demo');
          localStorage.removeItem('tradelink_access');
          window.location.href = '/login';
        }}
      >
        ✕
      </button>
    </motion.div>
  );
};

export default DemoBanner;
