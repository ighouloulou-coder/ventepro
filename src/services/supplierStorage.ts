import {
  Supplier,
  SupplierOrder,
  SupplierInvoice,
  SupplierDelivery,
  SupplierRating,
  SupplierDashboardStats,
  Currency,
} from '../types';
import { saveDocument, deleteDocument, COLLECTIONS, db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const STORAGE_KEYS = {
  SUPPLIERS: 'tradelink_suppliers',
  SUPPLIER_ORDERS: 'tradelink_supplier_orders',
  SUPPLIER_INVOICES: 'tradelink_supplier_invoices',
  SUPPLIER_DELIVERIES: 'tradelink_supplier_deliveries',
  SUPPLIER_RATINGS: 'tradelink_supplier_ratings',
};

// ============================================
// 🗄️ Generic storage functions
// ============================================
function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

async function syncSave<T extends { id: string }>(collectionName: string, data: T): Promise<void> {
  try { await saveDocument(collectionName, data); } catch (e) { console.warn('⚠️ Firestore save failed:', e); }
}

async function syncDelete(collectionName: string, id: string): Promise<void> {
  try { await deleteDocument(collectionName, id); } catch (e) { console.warn('⚠️ Firestore delete failed:', e); }
}

// ============================================
// ☁️ Load from Firestore + Real-time sync
// ============================================
async function loadSupplierCollections(): Promise<void> {
  if (!db) { console.warn('⚠️ Firebase non initialisé pour fournisseurs'); return; }
  console.log('☁️ Chargement des données fournisseurs depuis Firestore...');
  const cols: [string, string][] = [
    [COLLECTIONS.SUPPLIERS, STORAGE_KEYS.SUPPLIERS],
    [COLLECTIONS.SUPPLIER_ORDERS, STORAGE_KEYS.SUPPLIER_ORDERS],
    [COLLECTIONS.SUPPLIER_INVOICES, STORAGE_KEYS.SUPPLIER_INVOICES],
    [COLLECTIONS.SUPPLIER_DELIVERIES, STORAGE_KEYS.SUPPLIER_DELIVERIES],
  ];
  for (const [col, key] of cols) {
    try {
      const snap = await getDocs(collection(db, col));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      saveToStorage(key, data);
      console.log(`✅ ${col}: ${data.length} documents`);
    } catch (e: any) {
      console.error(`❌ Erreur chargement ${col}:`, e.message);
    }
  }
}

let supplierPolling = false;
async function pollSupplierSync(): Promise<void> {
  if (supplierPolling) return;
  supplierPolling = true;
  try {
    const cols: [string, string][] = [
      [COLLECTIONS.SUPPLIERS, STORAGE_KEYS.SUPPLIERS],
      [COLLECTIONS.SUPPLIER_ORDERS, STORAGE_KEYS.SUPPLIER_ORDERS],
      [COLLECTIONS.SUPPLIER_INVOICES, STORAGE_KEYS.SUPPLIER_INVOICES],
      [COLLECTIONS.SUPPLIER_DELIVERIES, STORAGE_KEYS.SUPPLIER_DELIVERIES],
    ];
    for (const [col, key] of cols) {
      try {
        const snap = await getDocs(collection(db, col));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        saveToStorage(key, data);
        window.dispatchEvent(new CustomEvent('data-sync', { detail: { collection: col } }));
      } catch (e: any) { console.error(`❌ Polling ${col}:`, e.message); }
    }
  } finally { supplierPolling = false; }
}

(async () => {
  try {
    await loadSupplierCollections();
    setInterval(pollSupplierSync, 30000);
    console.log('🚀 Sync fournisseurs initialisée !');
  } catch (e) { console.error('❌ Erreur init sync fournisseurs:', e); }
})();

// ============================================
// 🏭 Suppliers
// ============================================
export const supplierStorage = {
  getAll: (): Supplier[] => getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS),
  
  getById: (id: string): Supplier | undefined => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    return suppliers.find(s => s.id === id);
  },

  getByStatus: (status: Supplier['status']): Supplier[] => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    return suppliers.filter(s => s.status === status);
  },

  getByCategory: (category: Supplier['category']): Supplier[] => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    return suppliers.filter(s => s.category === category);
  },

  search: (query: string): Supplier[] => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    const q = query.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.tradeName.toLowerCase().includes(q) ||
      s.registrationNumber.toLowerCase().includes(q) ||
      s.notes.toLowerCase().includes(q)
    );
  },

  create: (supplier: Supplier): Supplier => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    suppliers.push(supplier);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
    syncSave(COLLECTIONS.SUPPLIERS, supplier);
    return supplier;
  },

  update: (id: string, updates: Partial<Supplier>): Supplier | null => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    suppliers[index] = { ...suppliers[index], ...updates };
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
    syncSave(COLLECTIONS.SUPPLIERS, suppliers[index]);
    return suppliers[index];
  },

  delete: (id: string): boolean => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    const filtered = suppliers.filter(s => s.id !== id);
    if (filtered.length === suppliers.length) return false;
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers.filter(s => s.id !== id));
    syncDelete(COLLECTIONS.SUPPLIERS, id);
    return true;
  },

  addRating: (supplierId: string, rating: SupplierRating): Supplier | null => {
    const suppliers = getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    const index = suppliers.findIndex(s => s.id === supplierId);
    if (index === -1) return null;
    suppliers[index].ratings.push(rating);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
    syncSave(COLLECTIONS.SUPPLIERS, suppliers[index]);
    return suppliers[index];
  },

  getAverageRating: (supplierId: string): number => {
    const supplier = supplierStorage.getById(supplierId);
    if (!supplier || supplier.ratings.length === 0) return 0;
    const total = supplier.ratings.reduce((sum, r) => {
      return sum + (r.quality + r.delivery + r.price + r.service) / 4;
    }, 0);
    return Math.round((total / supplier.ratings.length) * 10) / 10;
  },
};

// ============================================
// 📋 Supplier Orders (Bons de commande fournisseur)
// ============================================
export const supplierOrderStorage = {
  getAll: (): SupplierOrder[] => getFromStorage<SupplierOrder>(STORAGE_KEYS.SUPPLIER_ORDERS),
  
  getById: (id: string): SupplierOrder | undefined => {
    const orders = getFromStorage<SupplierOrder>(STORAGE_KEYS.SUPPLIER_ORDERS);
    return orders.find(o => o.id === id);
  },

  getBySupplier: (supplierId: string): SupplierOrder[] => {
    const orders = getFromStorage<SupplierOrder>(STORAGE_KEYS.SUPPLIER_ORDERS);
    return orders.filter(o => o.supplierId === supplierId);
  },

  getByStatus: (status: SupplierOrder['status']): SupplierOrder[] => {
    const orders = getFromStorage<SupplierOrder>(STORAGE_KEYS.SUPPLIER_ORDERS);
    return orders.filter(o => o.status === status);
  },

  create: (order: SupplierOrder): SupplierOrder => {
    const orders = getFromStorage<SupplierOrder>(STORAGE_KEYS.SUPPLIER_ORDERS);
    orders.push(order);
    saveToStorage(STORAGE_KEYS.SUPPLIER_ORDERS, orders);
    syncSave(COLLECTIONS.SUPPLIER_ORDERS, order);
    return order;
  },

  update: (id: string, updates: Partial<SupplierOrder>): SupplierOrder | null => {
    const orders = getFromStorage<SupplierOrder>(STORAGE_KEYS.SUPPLIER_ORDERS);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    orders[index] = { ...orders[index], ...updates };
    saveToStorage(STORAGE_KEYS.SUPPLIER_ORDERS, orders);
    syncSave(COLLECTIONS.SUPPLIER_ORDERS, orders[index]);
    return orders[index];
  },

  delete: (id: string): boolean => {
    const orders = getFromStorage<SupplierOrder>(STORAGE_KEYS.SUPPLIER_ORDERS);
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;
    saveToStorage(STORAGE_KEYS.SUPPLIER_ORDERS, orders.filter(o => o.id !== id));
    syncDelete(COLLECTIONS.SUPPLIER_ORDERS, id);
    return true;
  },
};

// ============================================
// 📄 Supplier Invoices
// ============================================
export const supplierInvoiceStorage = {
  getAll: (): SupplierInvoice[] => getFromStorage<SupplierInvoice>(STORAGE_KEYS.SUPPLIER_INVOICES),
  
  getById: (id: string): SupplierInvoice | undefined => {
    const invoices = getFromStorage<SupplierInvoice>(STORAGE_KEYS.SUPPLIER_INVOICES);
    return invoices.find(i => i.id === id);
  },

  getBySupplier: (supplierId: string): SupplierInvoice[] => {
    const invoices = getFromStorage<SupplierInvoice>(STORAGE_KEYS.SUPPLIER_INVOICES);
    return invoices.filter(i => i.supplierId === supplierId);
  },

  getByStatus: (status: SupplierInvoice['status']): SupplierInvoice[] => {
    const invoices = getFromStorage<SupplierInvoice>(STORAGE_KEYS.SUPPLIER_INVOICES);
    return invoices.filter(i => i.status === status);
  },

  create: (invoice: SupplierInvoice): SupplierInvoice => {
    const invoices = getFromStorage<SupplierInvoice>(STORAGE_KEYS.SUPPLIER_INVOICES);
    invoices.push(invoice);
    saveToStorage(STORAGE_KEYS.SUPPLIER_INVOICES, invoices);
    syncSave(COLLECTIONS.SUPPLIER_INVOICES, invoice);
    return invoice;
  },

  update: (id: string, updates: Partial<SupplierInvoice>): SupplierInvoice | null => {
    const invoices = getFromStorage<SupplierInvoice>(STORAGE_KEYS.SUPPLIER_INVOICES);
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return null;
    invoices[index] = { ...invoices[index], ...updates };
    saveToStorage(STORAGE_KEYS.SUPPLIER_INVOICES, invoices);
    syncSave(COLLECTIONS.SUPPLIER_INVOICES, invoices[index]);
    return invoices[index];
  },

  delete: (id: string): boolean => {
    const invoices = getFromStorage<SupplierInvoice>(STORAGE_KEYS.SUPPLIER_INVOICES);
    const filtered = invoices.filter(i => i.id !== id);
    if (filtered.length === invoices.length) return false;
    saveToStorage(STORAGE_KEYS.SUPPLIER_INVOICES, invoices.filter(i => i.id !== id));
    syncDelete(COLLECTIONS.SUPPLIER_INVOICES, id);
    return true;
  },
};

// ============================================
// 🚚 Supplier Deliveries
// ============================================
export const supplierDeliveryStorage = {
  getAll: (): SupplierDelivery[] => getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES),
  
  getById: (id: string): SupplierDelivery | undefined => {
    const deliveries = getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES);
    return deliveries.find(d => d.id === id);
  },

  getBySupplier: (supplierId: string): SupplierDelivery[] => {
    const deliveries = getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES);
    return deliveries.filter(d => d.supplierId === supplierId);
  },

  getByOrder: (orderId: string): SupplierDelivery[] => {
    const deliveries = getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES);
    return deliveries.filter(d => d.supplierOrderId === orderId);
  },

  getByStatus: (status: SupplierDelivery['status']): SupplierDelivery[] => {
    const deliveries = getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES);
    return deliveries.filter(d => d.status === status);
  },

  create: (delivery: SupplierDelivery): SupplierDelivery => {
    const deliveries = getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES);
    deliveries.push(delivery);
    saveToStorage(STORAGE_KEYS.SUPPLIER_DELIVERIES, deliveries);
    syncSave(COLLECTIONS.SUPPLIER_DELIVERIES, delivery);
    return delivery;
  },

  update: (id: string, updates: Partial<SupplierDelivery>): SupplierDelivery | null => {
    const deliveries = getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES);
    const index = deliveries.findIndex(d => d.id === id);
    if (index === -1) return null;
    deliveries[index] = { ...deliveries[index], ...updates };
    saveToStorage(STORAGE_KEYS.SUPPLIER_DELIVERIES, deliveries);
    syncSave(COLLECTIONS.SUPPLIER_DELIVERIES, deliveries[index]);
    return deliveries[index];
  },

  delete: (id: string): boolean => {
    const deliveries = getFromStorage<SupplierDelivery>(STORAGE_KEYS.SUPPLIER_DELIVERIES);
    const filtered = deliveries.filter(d => d.id !== id);
    if (filtered.length === deliveries.length) return false;
    saveToStorage(STORAGE_KEYS.SUPPLIER_DELIVERIES, deliveries.filter(d => d.id !== id));
    syncDelete(COLLECTIONS.SUPPLIER_DELIVERIES, id);
    return true;
  },
};

// ============================================
// 💱 Currency utilities
// ============================================
export const formatCurrencyAmount = (amount: number, currency: Currency = 'MAD'): string => {
  const locale = currency === 'MAD' ? 'fr-MA' : currency === 'EUR' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// ============================================
// 📊 Supplier Dashboard stats
// ============================================
export const getSupplierDashboardStats = (): SupplierDashboardStats => {
  const suppliers = supplierStorage.getAll();
  const orders = supplierOrderStorage.getAll();
  const invoices = supplierInvoiceStorage.getAll();
  const deliveries = supplierDeliveryStorage.getAll();

  const activeSuppliers = suppliers.filter(s => s.status === 'actif').length;

  const pendingOrders = orders.filter(o =>
    o.status === 'brouillon' || o.status === 'envoyée' || o.status === 'confirmée' || o.status === 'en_production'
  ).length;

  const pendingInvoices = invoices.filter(i =>
    i.status === 'brouillon' || i.status === 'envoyée' || i.status === 'en_retard'
  ).length;

  const pendingDeliveries = deliveries.filter(d =>
    d.status === 'en_route' || d.status === 'arrivée' || d.status === 'en_déchargement'
  ).length;

  const totalPurchases = orders
    .filter(o => o.status !== 'annulée')
    .reduce((sum, o) => sum + o.total, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyPurchases = orders
    .filter(o => {
      const date = new Date(o.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && o.status !== 'annulée';
    })
    .reduce((sum, o) => sum + o.total, 0);

  const overduePayments = invoices
    .filter(i => i.status === 'en_retard' || (i.status !== 'payée' && i.status !== 'annulée' && new Date(i.dueDate) < new Date()))
    .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

  const suppliersWithRatings = suppliers.filter(s => s.ratings.length > 0);
  const averageRating = suppliersWithRatings.length > 0
    ? suppliersWithRatings.reduce((sum, s) => {
        const avg = s.ratings.reduce((rSum, r) => rSum + (r.quality + r.delivery + r.price + r.service) / 4, 0) / s.ratings.length;
        return sum + avg;
      }, 0) / suppliersWithRatings.length
    : 0;

  // Top suppliers by total orders
  const supplierTotals: { [key: string]: { name: string; total: number; rating: number } } = {};
  orders.filter(o => o.status !== 'annulée').forEach(o => {
    if (!supplierTotals[o.supplierId]) {
      const supplier = supplierStorage.getById(o.supplierId);
      supplierTotals[o.supplierId] = {
        name: o.supplierName,
        total: 0,
        rating: supplier ? supplierStorage.getAverageRating(supplier.id) : 0,
      };
    }
    supplierTotals[o.supplierId].total += o.total;
  });

  const topSuppliers = Object.values(supplierTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalSuppliers: suppliers.length,
    activeSuppliers,
    pendingOrders,
    pendingInvoices,
    pendingDeliveries,
    totalPurchases,
    monthlyPurchases,
    overduePayments,
    averageRating: Math.round(averageRating * 10) / 10,
    topSuppliers,
    recentOrders,
    currency: 'MAD',
  };
};
