import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  autofocus?: boolean;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher...',
  onSearch,
  onClear,
  autofocus = false,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autofocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autofocus]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-primary)',
        border: '2px solid var(--border-color)',
        borderRadius: 12,
        padding: '0 16px',
        transition: 'border-color 0.2s',
      }}>
        <span style={{ fontSize: '1.1rem', marginRight: 10, opacity: 0.5 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '14px 0',
            border: 'none',
            background: 'transparent',
            fontSize: '0.95rem',
            outline: 'none',
            color: 'var(--text-primary)',
          }}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              style={{
                background: 'var(--bg-secondary)',
                border: 'none',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              ✕
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchBar;
