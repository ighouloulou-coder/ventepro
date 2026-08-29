// ============================================
// 📦 Types Produits
// ============================================
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Prix de vente
  purchasePrice: number; // Prix d'achat
  margin: number; // Marge en %
  stock: number;
  category: string;
  unit: string; // kg, L, pièce, carton, palette...
  sku: string; // Code article / référence
  photo: string; // Base64 de la photo ou URL
  createdAt: string;
}

// ============================================
// 👥 Types Clients
// ============================================
export interface DeliveryAddress {
  id: string;
  label: string; // "Usine", "Entrepôt", "Zone franche"
  address: string;
  city: string;
  postalCode: string;
  contactName: string;
  contactPhone: string;
  isDefault: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  deliveryAddresses: DeliveryAddress[];
  paymentTerms: number; // jours (30, 60, 90...)
  currency: Currency;
  createdAt: string;
}

// ============================================
// 💰 Types Devises
// ============================================
export type Currency = 'MAD' | 'EUR' | 'USD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  MAD: 'MAD',
  EUR: '€',
  USD: '$',
};

export const CURRENCY_LOCALES: Record<Currency, string> = {
  MAD: 'fr-MA',
  EUR: 'fr-FR',
  USD: 'en-US',
};

// ============================================
// 💲 Types Tarification
// ============================================
export interface PriceTier {
  id: string;
  clientId: string;
  productId: string;
  price: number; // Prix spécial pour ce client
  minQuantity: number; // Quantité minimum pour ce prix
  createdAt: string;
}

// ============================================
// 📄 Types Devis (Quotes)
// ============================================
export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit: string;
}

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: Currency;
  status: 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'expiré';
  validUntil: string; // Date d'expiration du devis
  notes: string;
  createdAt: string;
}

// ============================================
// 📋 Types Bon de Commande (Orders)
// ============================================
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit: string;
}

export interface Order {
  id: string;
  quoteId?: string; // Lien vers le devis d'origine
  clientId: string;
  clientName: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: Currency;
  status: 'en_attente' | 'confirmée' | 'en_cours' | 'expédiée' | 'livrée' | 'annulée';
  deliveryDate: string; // Date prévue de livraison
  deliveryAddress: string;
  incoterm: Incoterm;
  notes: string;
  createdAt: string;
}

// ============================================
// 🚚 Types Incoterms
// ============================================
export type Incoterm =
  | 'EXW' // Ex Works - Usine
  | 'FCA' // Free Carrier
  | 'FAS' // Free Alongside Ship
  | 'FOB' // Free On Board
  | 'CFR' // Cost and Freight
  | 'CIF' // Cost, Insurance and Freight
  | 'CPT' // Carriage Paid To
  | 'CIP' // Carriage and Insurance Paid To
  | 'DAP' // Delivered at Place
  | 'DPU' // Delivered at Place Unloaded
  | 'DDP' // Delivered Duty Paid
  | 'DPU_FRANCHE' // Zone franche spécifique
  | 'LIVRAISON_USINE'; // Livraison à l'usine

export const INCOTERM_LABELS: Record<Incoterm, string> = {
  EXW: 'Ex Works (Usine)',
  FCA: 'Free Carrier',
  FAS: 'Free Alongside Ship',
  FOB: 'Free On Board',
  CFR: 'Cost and Freight',
  CIF: 'Cost, Insurance and Freight',
  CPT: 'Carriage Paid To',
  CIP: 'Carriage and Insurance Paid To',
  DAP: 'Delivered at Place',
  DPU: 'Delivered at Place Unloaded',
  DDP: 'Delivered Duty Paid',
  DPU_FRANCHE: 'Zone Franche',
  LIVRAISON_USINE: 'Livraison Usine',
};

// ============================================
// 📦 Types Bon de Livraison (Delivery)
// ============================================
export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  delivered: number; // Quantité livrée
  returned: number; // Quantité retournée
}

export interface DeliveryNote {
  id: string;
  orderId: string; // Lien vers la commande
  clientId: string;
  clientName: string;
  items: DeliveryItem[];
  deliveryAddress: string;
  deliveryDate: string;
  status: 'préparation' | 'en_cours' | 'livré' | 'retour_partiel' | 'retour_complet';
  driverName: string;
  vehiclePlate: string;
  signatureReceived: boolean;
  notes: string;
  createdAt: string;
}

// ============================================
// 🧾 Types Facture (Invoices)
// ============================================
export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit: string;
}

export interface Invoice {
  id: string;
  orderId?: string; // Lien vers la commande
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: Currency;
  status: 'brouillon' | 'envoyée' | 'payée' | 'partiellement_payée' | 'en_retard' | 'annulée';
  paymentTerms: number;
  dueDate: string;
  notes: string;
  createdAt: string;
}

// ============================================
// 📊 Types Dashboard
// ============================================
export interface DashboardStats {
  totalSales: number;
  monthlySales: number;
  totalClients: number;
  totalProducts: number;
  pendingInvoices: number;
  pendingOrders: number;
  pendingQuotes: number;
  pendingDeliveries: number;
  recentInvoices: Invoice[];
  recentOrders: Order[];
  totalQuotesAmount: number;
  totalOrdersAmount: number;
  currency: Currency;
}
