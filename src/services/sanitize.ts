/**
 * Utilitaire de sanitization pour prévenir les attaques XSS
 * Encode les caractères dangereux en entités HTML
 */

// Mapping des caractères dangereux vers leurs entités HTML
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
};

/**
 * Échappe les caractères HTML dangereux dans une chaîne
 */
export const escapeHtml = (str: string): string => {
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
};

/**
 * Nettoie une chaîne en supprimant les balises HTML potentiellement dangereuses
 */
export const stripHtmlTags = (str: string): string => {
  return str.replace(/<[^>]*>/g, '');
};

/**
 * Sanitise une entrée utilisateur : supprime les balises et échappe les caractères
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return escapeHtml(stripHtmlTags(input.trim()));
};

/**
 * Valide et nettoie un email
 */
export const sanitizeEmail = (email: string): string => {
  const cleaned = email.trim().toLowerCase();
  // Pattern RFC basique
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned)) return '';
  return cleaned;
};

/**
 * Valide et nettoie un numéro de téléphone
 */
export const sanitizePhone = (phone: string): string => {
  // Supprime tout sauf les chiffres, +, -, espaces et parenthèses
  return phone.replace(/[^0-9+\-\s()]/g, '').trim();
};

/**
 * Valide un montant financier (nombre positif avec max 2 décimales)
 */
export const sanitizeAmount = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num < 0) return 0;
  // Arrondir à 2 décimales max
  return Math.round(num * 100) / 100;
};

/**
 * Valide une quantité (entier positif)
 */
export const sanitizeQuantity = (value: string | number): number => {
  const num = typeof value === 'string' ? parseInt(value, 10) : Math.floor(value);
  if (isNaN(num) || num < 1) return 1;
  return num;
};

/**
 * Tronque une chaîne à une longueur maximale
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Valide qu'une chaîne n'est pas vide après nettoyage
 */
export const isValidString = (str: string, minLength: number = 1): boolean => {
  return typeof str === 'string' && str.trim().length >= minLength;
};
