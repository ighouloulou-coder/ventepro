import React from 'react';
import { motion } from 'framer-motion';

const shapes = [
  { size: 80, x: '10%', y: '20%', delay: 0, duration: 20, color: 'rgba(59,130,246,0.08)' },
  { size: 120, x: '80%', y: '10%', delay: 2, duration: 25, color: 'rgba(139,92,246,0.06)' },
  { size: 60, x: '70%', y: '70%', delay: 4, duration: 18, color: 'rgba(6,182,212,0.07)' },
  { size: 100, x: '20%', y: '80%', delay: 1, duration: 22, color: 'rgba(236,72,153,0.06)' },
  { size: 50, x: '50%', y: '40%', delay: 3, duration: 15, color: 'rgba(245,158,11,0.05)' },
  { size: 90, x: '90%', y: '50%', delay: 5, duration: 28, color: 'rgba(16,185,129,0.06)' },
  { size: 70, x: '40%', y: '90%', delay: 2.5, duration: 20, color: 'rgba(59,130,246,0.05)' },
];

const FloatingShapes: React.FC = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
            borderRadius: i % 2 === 0 ? '30% 70% 70% 30% / 30% 30% 70% 70%' : '50%',
            background: shape.color,
            filter: 'blur(1px)',
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 15, -10, 0],
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Gradient mesh overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(6,182,212,0.03) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
};

export default FloatingShapes;
