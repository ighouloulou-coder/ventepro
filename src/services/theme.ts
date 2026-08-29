/**
 * Service de gestion du thème (clair/sombre)
 */

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'traidelink_theme';

/**
 * Obtenir le thème sauvegardé
 */
export const getSavedTheme = (): Theme => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  return 'system';
};

/**
 * Sauvegarder le thème
 */
export const saveTheme = (theme: Theme): void => {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
};

/**
 * Appliquer le thème au document
 */
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

/**
 * Basculer entre clair et sombre
 */
export const toggleTheme = (): Theme => {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const newTheme: Theme = isDark ? 'light' : 'dark';
  saveTheme(newTheme);
  return newTheme;
};

/**
 * Initialiser le thème au démarrage
 */
export const initTheme = (): void => {
  const theme = getSavedTheme();
  applyTheme(theme);

  // Écouter les changements de préférence système
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getSavedTheme() === 'system') {
      applyTheme('system');
    }
  });
};

/**
 * Vérifier si le mode sombre est actif
 */
export const isDarkMode = (): boolean => {
  return document.documentElement.getAttribute('data-theme') === 'dark';
};
