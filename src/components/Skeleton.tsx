import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: { 
    backgroundPosition: '200% 0',
    transition: { duration: 1.5, repeat: Infinity, ease: 'linear' }
  },
};

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style = {},
  variant = 'rectangular'
}) => {
  const baseStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: variant === 'circular' ? '50%' : borderRadius,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    ...style,
  };

  return (
    <motion.div
      style={baseStyle}
      variants={shimmer}
      initial="initial"
      animate="animate"
    />
  );
};

// Skeleton pour une carte
export const SkeletonCard: React.FC<{ style?: React.CSSProperties }> = ({ style = {} }) => (
  <div style={{
    background: 'var(--bg-primary)',
    borderRadius: 16,
    padding: 20,
    border: '1px solid var(--border-color)',
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <Skeleton variant="circular" width={48} height={48} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
    <Skeleton width="80%" height={12} style={{ marginBottom: 8 }} />
    <Skeleton width="90%" height={12} />
  </div>
);

// Skeleton pour une liste
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
      }}>
        <Skeleton variant="circular" width={40} height={40} />
        <div style={{ flex: 1 }}>
          <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="50%" height={10} />
        </div>
        <Skeleton width={60} height={24} borderRadius={12} />
      </div>
    ))}
  </div>
);

// Skeleton pour un tableau de bord
export const SkeletonDashboard: React.FC = () => (
  <div style={{ padding: 20 }}>
    {/* Stats cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
      {[1, 2, 3, 4].map(i => (
        <SkeletonCard key={i} />
      ))}
    </div>
    
    {/* Chart area */}
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: 16,
      padding: 24,
      border: '1px solid var(--border-color)',
      marginBottom: 24,
    }}>
      <Skeleton width="30%" height={20} style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height={200} borderRadius={8} />
    </div>
    
    {/* Table */}
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: 16,
      padding: 24,
      border: '1px solid var(--border-color)',
    }}>
      <Skeleton width="25%" height={20} style={{ marginBottom: 20 }} />
      <SkeletonList count={5} />
    </div>
  </div>
);

// Skeleton pour une page entière
export const SkeletonPage: React.FC = () => (
  <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
    {/* Header */}
    <div style={{ marginBottom: 24 }}>
      <Skeleton width="40%" height={28} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} />
    </div>
    
    {/* Content */}
    <SkeletonCard />
  </div>
);

export default Skeleton;
