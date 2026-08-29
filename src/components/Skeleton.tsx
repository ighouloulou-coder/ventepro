import React from 'react';

// ============================================
// 🎨 Skeleton Base
// ============================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = '6px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 50%, var(--bg-tertiary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
};

// ============================================
// 📊 Skeleton Card (Stats)
// ============================================

export const SkeletonStatCard: React.FC = () => (
  <div style={{
    background: 'var(--bg-primary)',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: 'var(--shadow)',
  }}>
    <Skeleton width={48} height={48} borderRadius="50%" />
    <div style={{ flex: 1 }}>
      <Skeleton width="60%" height={12} />
      <Skeleton width="80%" height={24} style={{ marginTop: 8 }} />
      <Skeleton width="40%" height={10} style={{ marginTop: 4 }} />
    </div>
  </div>
);

// ============================================
// 📋 Skeleton Table
// ============================================

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <div style={{
    background: 'var(--bg-primary)',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: 'var(--shadow)',
  }}>
    {/* Header */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16,
      padding: '14px 16px',
      background: 'var(--bg-tertiary)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} width="80%" height={12} />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 16,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            width={colIndex === 0 ? '90%' : '70%'}
            height={16}
          />
        ))}
      </div>
    ))}
  </div>
);

// ============================================
// 📊 Skeleton Chart
// ============================================

export const SkeletonChart: React.FC = () => (
  <div style={{
    background: 'var(--bg-primary)',
    borderRadius: 12,
    padding: 20,
    boxShadow: 'var(--shadow)',
  }}>
    <Skeleton width="50%" height={16} style={{ marginBottom: 16 }} />
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200 }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const heights = [50, 70, 40, 80, 60, 45];
        return (
          <Skeleton
            key={i}
            width="100%"
            height={`${heights[i]}%`}
            borderRadius="4px 4px 0 0"
          />
        );
      })}
    </div>
  </div>
);

// ============================================
// 👤 Skeleton Client Card
// ============================================

export const SkeletonClientCard: React.FC = () => (
  <div style={{
    background: 'var(--bg-primary)',
    borderRadius: 12,
    padding: 16,
    boxShadow: 'var(--shadow)',
  }}>
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <Skeleton width={44} height={44} borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
      </div>
    </div>
    <Skeleton width="100%" height={12} />
    <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
    <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
  </div>
);

// ============================================
// 📄 Skeleton Invoice Detail
// ============================================

export const SkeletonInvoiceDetail: React.FC = () => (
  <div style={{
    background: 'var(--bg-primary)',
    borderRadius: 12,
    padding: 20,
    boxShadow: 'var(--shadow)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
      <Skeleton width="40%" height={20} />
      <Skeleton width={80} height={24} borderRadius="20px" />
    </div>

    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="25%" height={14} />
      </div>
    ))}

    <div style={{ marginTop: 20 }}>
      <SkeletonTable rows={3} cols={4} />
    </div>
  </div>
);

// ============================================
// 🏠 Skeleton Dashboard
// ============================================

export const SkeletonDashboard: React.FC = () => (
  <div>
    <Skeleton width="30%" height={28} style={{ marginBottom: 24 }} />

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 32 }}>
      <SkeletonChart />
      <SkeletonChart />
    </div>

    <SkeletonTable rows={5} cols={5} />
  </div>
);

export default Skeleton;
