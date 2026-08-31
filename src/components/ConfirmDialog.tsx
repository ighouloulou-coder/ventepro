import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  const colors = {
    danger: { bg: '#fef2f2', border: '#fecaca', icon: '🗑️', btnColor: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '⚠️', btnColor: '#d97706' },
    info: { bg: '#f0f9ff', border: '#bae6fd', icon: 'ℹ️', btnColor: '#2563eb' },
  };

  const color = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 20,
              padding: 28,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: color.bg,
                  border: `2px solid ${color.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 16px',
                }}
              >
                {color.icon}
              </motion.div>
              
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: 8,
              }}>
                {title}
              </h3>
              
              <p style={{
                fontSize: '0.9rem',
                color: '#6b7280',
                lineHeight: 1.5,
              }}>
                {message}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cancelLabel}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: color.btnColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook pour utiliser le ConfirmDialog
export const useConfirm = () => {
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
  });

  const confirm = (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info' = 'danger'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const cancel = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  return { confirm, cancel, confirmState };
};

export default ConfirmDialog;
