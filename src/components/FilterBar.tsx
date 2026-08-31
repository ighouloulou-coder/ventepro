import React from 'react';
import { motion } from 'framer-motion';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterBarProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  label?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  activeFilter,
  onFilterChange,
  label,
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}>
          {label}
        </p>
      )}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {filters.map(filter => {
          const isActive = activeFilter === filter.value;
          return (
            <motion.button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: isActive ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                background: isActive ? 'var(--primary)' : 'var(--bg-secondary)',
                color: isActive ? 'white' : 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.3)' : 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                }}>
                  {filter.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
