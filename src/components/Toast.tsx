import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ 
  toasts, 
  removeToast 
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 400,
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    info: { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  };

  const color = colors[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      <span style={{ fontSize: '1.2rem' }}>{icons[toast.type]}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: color.text, fontSize: '0.9rem', margin: 0 }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ color: color.text, fontSize: '0.8rem', margin: '4px 0 0', opacity: 0.8 }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          background: 'none',
          border: 'none',
          color: color.text,
          cursor: 'pointer',
          fontSize: '1rem',
          padding: 0,
          opacity: 0.5,
        }}
      >
        ✕
      </button>
    </motion.div>
  );
};

export default ToastProvider;
