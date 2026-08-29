import { Currency, Incoterm } from './index';

// ============================================
// 🏭 Types Fournisseurs
// ============================================
export interface SupplierContact {
  id: string;
  name: string;
  role: string; // "Directeur", "Commercial", "Comptable"...
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface SupplierAddress {
  id: string;
  label: string; // "Siège", "Entrepôt", "Usine"
  address: string;
  city: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface SupplierBankInfo {
  bankName: string;
  iban: string;
  swift: string;
  currency: Currency;
}

export interface SupplierDocument {
  id: string;
  name: string;
  type: 'contrat' | 'qualification' | 'certificat' | 'autre';
  fileName: string;
  fileData: string; // Base64
  expiresAt?: string;
  createdAt: string;
}

export interface SupplierRating {
  id: string;
  supplierId: string;
  quality: number; // 1-5
  delivery: number; // 1-5 (ponctualité)
  price: number; // 1-5 (compétitivité)
  service: number; // 1-5 (réactivité)
  comment: string;
  ratedAt: string;
}

export type SupplierStatus = 'actif' | 'inactif' | 'en_evaluation' | 'blacklisté';
export type SupplierCategory = 'matières_premières' | 'équipements' | 'services' | 'emballage' | 'logistique' | 'technologie' | 'autre';

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  en_evaluation: 'En Évaluation',
  blacklisté: 'Blacklisté',
};

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  matières_premières: 'Matières Premières',
  équipements: 'Équipements',
  services: 'Services',
  emballage: 'Emballage',
  logistique: 'Logistique',
  technologie: 'Technologie',
  autre: 'Autre',
};

export interface Supplier {
  id: string;
  name: string;
  tradeName: string; // Nom commercial
  registrationNumber: string; // RC / IF / ICE
  category: SupplierCategory;
  status: SupplierStatus;
  contacts: SupplierContact[];
  addresses: SupplierAddress[];
  bankInfo: SupplierBankInfo;
  currency: Currency;
  paymentTerms: number; // jours
  creditLimit: number; // Crédit autorisé
  incoterm: Incoterm;
  products: string[]; // IDs des produits fournis
  documents: SupplierDocument[];
  ratings: SupplierRating[];
  notes: string;
  website: string;
  createdAt: string;
}

// ============================================
// 📋 Types Commande Fournisseur (Purchase Order)
// ============================================
export interface SupplierOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit: string;
}

export type SupplierOrderStatus = 'brouillon' | 'envoyée' | 'confirmée' | 'en_production' | 'expédiée' | 'réceptionnée' | 'annulée';

export const SUPPLIER_ORDER_STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  brouillon: 'Brouillon',
  envoyée: 'Envoyée',
  confirmée: 'Confirmée',
  en_production: 'En Production',
  expédiée: 'Expédiée',
  réceptionnée: 'Réceptionnée',
  annulée: 'Annulée',
};

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: SupplierOrderItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: Currency;
  status: SupplierOrderStatus;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  deliveryAddress: string;
  incoterm: Incoterm;
  paymentStatus: 'non_payé' | 'acompte' | 'payé' | 'en_retard';
  paidAmount: number;
  notes: string;
  createdAt: string;
}

// ============================================
// 📄 Types Facture Fournisseur
// ============================================
export interface SupplierInvoice {
  id: string;
  supplierOrderId?: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string; // Numéro de facture du fournisseur
  items: SupplierOrderItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: Currency;
  status: 'brouillon' | 'envoyée' | 'payée' | 'partiellement_payée' | 'en_retard' | 'annulée';
  dueDate: string;
  paidAmount: number;
  paymentTerms: number;
  notes: string;
  createdAt: string;
}

// ============================================
// 🚚 Types Livraison Fournisseur
// ============================================
export interface SupplierDeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  received: number;
  rejected: number;
  reason?: string; // Raison du rejet
}

export type SupplierDeliveryStatus = 'en_route' | 'arrivée' | 'en_déchargement' | 'inspectée' | 'acceptée' | 'rejetée_partiellement' | 'rejetée_complètement';

export const SUPPLIER_DELIVERY_STATUS_LABELS: Record<SupplierDeliveryStatus, string> = {
  en_route: 'En Route',
  arrivée: 'Arrivée',
  en_déchargement: 'En Déchargement',
  inspectée: 'Inspectée',
  acceptée: 'Acceptée',
  rejetée_partiellement: 'Rejet Partiel',
  rejetée_complètement: 'Rejet Complet',
};

export interface SupplierDelivery {
  id: string;
  supplierOrderId: string;
  supplierId: string;
  supplierName: string;
  items: SupplierDeliveryItem[];
  deliveryDate: string;
  status: SupplierDeliveryStatus;
  transporterName: string;
  vehiclePlate: string;
  waybillNumber: string; // Bon de transport
  warehouse: string; // Entrepôt de réception
  inspectedBy?: string;
  inspectionNotes?: string;
  photos: string[]; // Photos de réception (Base64)
  notes: string;
  createdAt: string;
}

// ============================================
// 📊 Types Dashboard Fournisseurs
// ============================================
export interface SupplierDashboardStats {
  totalSuppliers: number;
  activeSuppliers: number;
  pendingOrders: number;
  pendingInvoices: number;
  pendingDeliveries: number;
  totalPurchases: number;
  monthlyPurchases: number;
  overduePayments: number;
  averageRating: number;
  topSuppliers: { name: string; total: number; rating: number }[];
  recentOrders: SupplierOrder[];
  currency: Currency;
}

// ============================================
// 🏷️ Types Réception de Stock (lié aux fournisseurs)
// ============================================
export interface StockReception {
  id: string;
  supplierDeliveryId: string;
  supplierId: string;
  supplierName: string;
  items: SupplierDeliveryItem[];
  receivedAt: string;
  warehouseId: string;
  receivedBy: string;
  notes: string;
}
