/**
 * Utilitaire de couleurs adaptatives au thème
 * Retourne les bonnes couleurs selon le mode clair/sombre
 */

export const themeColors = {
  // Couleurs de texte
  muted: 'var(--text-muted)',
  success: 'var(--text-success)',
  warning: 'var(--text-warning)',
  danger: 'var(--text-danger)',
  primary: 'var(--text-primary-brand)',
  dark: 'var(--text-primary-dark)',
  info: 'var(--text-info)',

  // Couleurs de fond
  bgInfo: 'var(--bg-info)',
  borderInfo: 'var(--border-info)',

  // Couleurs de fond
  bgPrimary: 'var(--bg-primary)',
  bgSecondary: 'var(--bg-secondary)',
  bgTertiary: 'var(--bg-tertiary)',

  // Bordures
  border: 'var(--border-color)',

  // Ombres
  shadow: 'var(--shadow)',
  shadowLg: 'var(--shadow-lg)',

  // Couleurs de badge marge
  marginGood: 'var(--text-success)',
  marginMedium: 'var(--text-warning)',
  marginBad: 'var(--text-danger)',
} as const;

/**
 * Retourne la couleur de badge marge selon le pourcentage
 */
export const getMarginBadgeStyle = (margin: number): React.CSSProperties => {
  if (margin >= 20) {
    return {
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: 'var(--bg-success-light, #dcfce7)',
      color: 'var(--text-success)',
    };
  }
  if (margin >= 10) {
    return {
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: 'var(--bg-warning-light, #fef3c7)',
      color: 'var(--text-warning)',
    };
  }
  return {
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 600,
    background: 'var(--bg-danger-light, #fee2e2)',
    color: 'var(--text-danger)',
  };
};

/**
 * Retourne la couleur du statut
 */
export const getStatusStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'payée': case 'livré': case 'accepté':
      return { background: '#dcfce7', color: '#166534' };
    case 'envoyée': case 'confirmée': case 'en_cours': case 'envoyé':
      return { background: '#dbeafe', color: '#1e40af' };
    case 'brouillon': case 'en_attente': case 'préparation':
      return { background: '#f3f4f6', color: '#374151' };
    case 'annulée': case 'refusé': case 'expiré':
      return { background: '#fee2e2', color: '#991b1b' };
    default:
      return { background: '#f3f4f6', color: '#374151' };
  }
};
