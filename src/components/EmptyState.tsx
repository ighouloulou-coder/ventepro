import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = '📭',
  title, 
  description, 
  action,
  secondaryAction 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        textAlign: 'center',
        background: 'var(--bg-primary)',
        borderRadius: 20,
        border: '2px dashed var(--border-color)',
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{
          fontSize: '4rem',
          marginBottom: 20,
        }}
      >
        {icon}
      </motion.div>
      
      <h3 style={{
        fontSize: '1.3rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        {title}
      </h3>
      
      {description && (
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-muted)',
          marginBottom: 24,
          maxWidth: 400,
        }}>
          {description}
        </p>
      )}
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {action && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            style={{
              padding: '12px 24px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {action.label}
          </motion.button>
        )}
        
        {secondaryAction && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={secondaryAction.onClick}
            style={{
              padding: '12px 24px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {secondaryAction.label}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Pré-définis pour les cas courants
export const EmptyClients: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="👥"
    title="Aucun client"
    description="Commencez par ajouter votre premier client pour gérer vos contacts et ventes."
    action={{ label: "+ Ajouter un client", onClick: onAdd }}
  />
);

export const EmptyProducts: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="📦"
    title="Aucun produit"
    description="Ajoutez vos produits pour pouvoir créer des devis et factures."
    action={{ label: "+ Ajouter un produit", onClick: onAdd }}
  />
);

export const EmptyInvoices: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="🧾"
    title="Aucune facture"
    description="Créez votre première facture pour suivre vos ventes."
    action={{ label: "+ Créer une facture", onClick: onAdd }}
  />
);

export const EmptyQuotes: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="📄"
    title="Aucun devis"
    description="Envoyez des devis à vos clients pour sécuriser vos ventes."
    action={{ label: "+ Créer un devis", onClick: onAdd }}
  />
);

export const EmptyOrders: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="📋"
    title="Aucune commande"
    description="Gérez vos commandes pour un suivi optimal."
    action={{ label: "+ Créer une commande", onClick: onAdd }}
  />
);

export const EmptySuppliers: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="🏭"
    title="Aucun fournisseur"
    description="Ajoutez vos fournisseurs pour gérer vos approvisionnements."
    action={{ label: "+ Ajouter un fournisseur", onClick: onAdd }}
  />
);

export const EmptySearch: React.FC<{ query: string }> = ({ query }) => (
  <EmptyState
    icon="🔍"
    title="Aucun résultat"
    description={`Aucun résultat trouvé pour "${query}". Essayez avec d'autres termes.`}
  />
);

export const EmptyActivity: React.FC = () => (
  <EmptyState
    icon="📝"
    title="Aucune activité"
    description="L'activité apparaîtra ici quand vous commencerez à utiliser l'application."
  />
);

export default EmptyState;
