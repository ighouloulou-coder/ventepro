// ============================================
// 🌍 Internationalization Service
// ============================================

export type Locale = 'fr' | 'en';

interface Translations {
  [key: string]: { fr: string; en: string };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': { fr: 'Tableau de bord', en: 'Dashboard' },
  'nav.products': { fr: 'Produits', en: 'Products' },
  'nav.clients': { fr: 'Clients', en: 'Clients' },
  'nav.quotes': { fr: 'Devis', en: 'Quotes' },
  'nav.orders': { fr: 'Commandes', en: 'Orders' },
  'nav.deliveries': { fr: 'Livraisons', en: 'Deliveries' },
  'nav.pricing': { fr: 'Tarifs', en: 'Pricing' },
  'nav.invoices': { fr: 'Factures', en: 'Invoices' },
  'nav.overdue': { fr: 'Impayés', en: 'Overdue' },
  'nav.portal': { fr: 'Portail Client', en: 'Client Portal' },
  'nav.suppliers': { fr: 'Fournisseurs', en: 'Suppliers' },
  'nav.supplierOrders': { fr: 'Cmd Fournisseurs', en: 'Supplier Orders' },
  'nav.supplierDashboard': { fr: 'Dashboard Fourn.', en: 'Supplier Dashboard' },
  'nav.analytics': { fr: 'Analytics', en: 'Analytics' },
  'nav.monitoring': { fr: 'Monitoring', en: 'Monitoring' },
  'nav.settings': { fr: 'Paramètres', en: 'Settings' },

  // Common
  'common.save': { fr: 'Enregistrer', en: 'Save' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel' },
  'common.delete': { fr: 'Supprimer', en: 'Delete' },
  'common.edit': { fr: 'Modifier', en: 'Edit' },
  'common.add': { fr: 'Ajouter', en: 'Add' },
  'common.search': { fr: 'Rechercher', en: 'Search' },
  'common.loading': { fr: 'Chargement...', en: 'Loading...' },
  'common.noData': { fr: 'Aucune donnée', en: 'No data' },
  'common.confirm': { fr: 'Confirmer', en: 'Confirm' },
  'common.export': { fr: 'Exporter', en: 'Export' },
  'common.print': { fr: 'Imprimer', en: 'Print' },
  'common.back': { fr: 'Retour', en: 'Back' },
  'common.next': { fr: 'Suivant', en: 'Next' },
  'common.previous': { fr: 'Précédent', en: 'Previous' },
  'common.total': { fr: 'Total', en: 'Total' },
  'common.subtotal': { fr: 'Sous-total', en: 'Subtotal' },
  'common.tax': { fr: 'Taxe', en: 'Tax' },
  'common.discount': { fr: 'Remise', en: 'Discount' },

  // Auth
  'auth.login': { fr: 'Se connecter', en: 'Sign In' },
  'auth.register': { fr: "S'inscrire", en: 'Sign Up' },
  'auth.logout': { fr: 'Déconnexion', en: 'Sign Out' },
  'auth.email': { fr: 'Email', en: 'Email' },
  'auth.password': { fr: 'Mot de passe', en: 'Password' },
  'auth.name': { fr: 'Nom complet', en: 'Full Name' },
  'auth.forgotPassword': { fr: 'Mot de passe oublié ?', en: 'Forgot password?' },
  'auth.demoMode': { fr: 'Mode démo (sans inscription)', en: 'Demo mode (no sign up)' },
  'auth.googleLogin': { fr: 'Continuer avec Google', en: 'Continue with Google' },

  // Dashboard
  'dashboard.title': { fr: 'Tableau de bord', en: 'Dashboard' },
  'dashboard.totalSales': { fr: 'Ventes totales', en: 'Total Sales' },
  'dashboard.monthlySales': { fr: 'Ventes du mois', en: 'Monthly Sales' },
  'dashboard.totalClients': { fr: 'Total clients', en: 'Total Clients' },
  'dashboard.totalProducts': { fr: 'Total produits', en: 'Total Products' },
  'dashboard.pendingQuotes': { fr: 'Devis en attente', en: 'Pending Quotes' },
  'dashboard.pendingOrders': { fr: 'Commandes en attente', en: 'Pending Orders' },
  'dashboard.overdueInvoices': { fr: 'Factures en retard', en: 'Overdue Invoices' },
  'dashboard.pendingDeliveries': { fr: 'Livraisons en attente', en: 'Pending Deliveries' },

  // Products
  'products.title': { fr: 'Produits', en: 'Products' },
  'products.name': { fr: 'Nom', en: 'Name' },
  'products.reference': { fr: 'Référence', en: 'Reference' },
  'products.price': { fr: 'Prix', en: 'Price' },
  'products.stock': { fr: 'Stock', en: 'Stock' },
  'products.add': { fr: 'Ajouter un produit', en: 'Add Product' },

  // Clients
  'clients.title': { fr: 'Clients', en: 'Clients' },
  'clients.name': { fr: 'Nom', en: 'Name' },
  'clients.email': { fr: 'Email', en: 'Email' },
  'clients.phone': { fr: 'Téléphone', en: 'Phone' },
  'clients.address': { fr: 'Adresse', en: 'Address' },
  'clients.add': { fr: 'Ajouter un client', en: 'Add Client' },

  // Invoices
  'invoices.title': { fr: 'Factures', en: 'Invoices' },
  'invoices.reference': { fr: 'Référence', en: 'Reference' },
  'invoices.client': { fr: 'Client', en: 'Client' },
  'invoices.amount': { fr: 'Montant', en: 'Amount' },
  'invoices.dueDate': { fr: "Date d'échéance", en: 'Due Date' },
  'invoices.status': { fr: 'Statut', en: 'Status' },
  'invoices.paid': { fr: 'Payée', en: 'Paid' },
  'invoices.pending': { fr: 'En attente', en: 'Pending' },
  'invoices.overdue': { fr: 'En retard', en: 'Overdue' },

  // Quotes
  'quotes.title': { fr: 'Devis', en: 'Quotes' },
  'quotes.reference': { fr: 'Référence', en: 'Reference' },
  'quotes.client': { fr: 'Client', en: 'Client' },
  'quotes.amount': { fr: 'Montant', en: 'Amount' },
  'quotes.validUntil': { fr: 'Valide jusqu\'au', en: 'Valid Until' },
  'quotes.add': { fr: 'Créer un devis', en: 'Create Quote' },

  // Orders
  'orders.title': { fr: 'Commandes', en: 'Orders' },
  'orders.reference': { fr: 'Référence', en: 'Reference' },
  'orders.client': { fr: 'Client', en: 'Client' },
  'orders.amount': { fr: 'Montant', en: 'Amount' },
  'orders.add': { fr: 'Créer une commande', en: 'Create Order' },

  // Deliveries
  'deliveries.title': { fr: 'Livraisons', en: 'Deliveries' },
  'deliveries.date': { fr: 'Date', en: 'Date' },
  'deliveries.client': { fr: 'Client', en: 'Client' },
  'deliveries.address': { fr: 'Adresse', en: 'Address' },
  'deliveries.add': { fr: 'Créer une livraison', en: 'Create Delivery' },

  // Suppliers
  'suppliers.title': { fr: 'Fournisseurs', en: 'Suppliers' },
  'suppliers.name': { fr: 'Nom', en: 'Name' },
  'suppliers.category': { fr: 'Catégorie', en: 'Category' },
  'suppliers.add': { fr: 'Ajouter un fournisseur', en: 'Add Supplier' },

  // Settings
  'settings.title': { fr: 'Paramètres', en: 'Settings' },
  'settings.language': { fr: 'Langue', en: 'Language' },
  'settings.theme': { fr: 'Thème', en: 'Theme' },
  'settings.notifications': { fr: 'Notifications', en: 'Notifications' },

  // Empty States
  'empty.noProducts': { fr: 'Aucun produit', en: 'No products' },
  'empty.noClients': { fr: 'Aucun client', en: 'No clients' },
  'empty.noInvoices': { fr: 'Aucune facture', en: 'No invoices' },
  'empty.noQuotes': { fr: 'Aucun devis', en: 'No quotes' },
  'empty.noOrders': { fr: 'Aucune commande', en: 'No orders' },
  'empty.noSuppliers': { fr: 'Aucun fournisseur', en: 'No suppliers' },
  'empty.addFirst': { fr: 'Ajoutez le premier', en: 'Add the first' },
};

// ============================================
// 🌐 Service i18n
// ============================================

let currentLocale: Locale = (localStorage.getItem('tradelink_locale') as Locale) || 'fr';

export const setLocale = (locale: Locale): void => {
  currentLocale = locale;
  localStorage.setItem('tradelink_locale', locale);
  document.documentElement.lang = locale;
  window.dispatchEvent(new CustomEvent('locale-change', { detail: { locale } }));
};

export const getLocale = (): Locale => currentLocale;

export const t = (key: string): string => {
  const entry = translations[key];
  if (!entry) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }
  return entry[currentLocale] || entry.fr || key;
};

export const getLocaleLabel = (locale: Locale): string => {
  return locale === 'fr' ? 'Français' : 'English';
};

export const getAvailableLocales = (): { value: Locale; label: string }[] => [
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'en', label: '🇬🇧 English' },
];

export default { t, setLocale, getLocale, getAvailableLocales };
