import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPageProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.99 },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 25,
  mass: 0.8,
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 15, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
};

const AnimatedPage: React.FC<AnimatedPageProps> = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        {children}
      </motion.div>
    </motion.div>
  );
};

export const AnimatedItem: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => (
  <motion.div variants={staggerItem} className={className} style={style}>
    {children}
  </motion.div>
);

export default AnimatedPage;
