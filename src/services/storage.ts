import { Product, Client, Invoice, Quote, Order, DeliveryNote, PriceTier, DashboardStats, Currency } from '../types';
import { db, saveDocument, deleteDocument, loadCollection, COLLECTIONS } from './firebase';

const STORAGE_KEYS = {
  PRODUCTS: 'tradelink_products',
  CLIENTS: 'tradelink_clients',
  INVOICES: 'tradelink_invoices',
  QUOTES: 'tradelink_quotes',
  ORDERS: 'tradelink_orders',
  DELIVERIES: 'tradelink_deliveries',
  PRICE_TIERS: 'tradelink_price_tiers',
};

// ============================================
// 🗄️ localStorage cache
// ============================================
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function dispatchSyncEvent(col: string) {
  window.dispatchEvent(new CustomEvent('data-sync', { detail: { collection: col } }));
}

// ============================================
// ☁️ CRITIQUE : Charger depuis Firestore
// ============================================
async function loadFromFirestore(colName: string, storageKey: string): Promise<boolean> {
  if (!db) {
    console.error(`❌ [${colName}] Firebase db est null !`);
    return false;
  }
  try {
    const data = await loadCollection<any>(colName);
    saveToStorage(storageKey, data);
    console.log(`✅ [${colName}] ${data.length} documents chargés depuis Firestore`);
    return true;
  } catch (e: any) {
    console.error(`❌ [${colName}] Erreur chargement:`, e.message || e);
    return false;
  }
}

async function loadAllFromFirestore(): Promise<void> {
  console.log('☁️ === CHARGEMENT DEPUIS FIRESTORE ===');
  const cols: [string, string][] = [
    [COLLECTIONS.PRODUCTS, STORAGE_KEYS.PRODUCTS],
    [COLLECTIONS.CLIENTS, STORAGE_KEYS.CLIENTS],
    [COLLECTIONS.INVOICES, STORAGE_KEYS.INVOICES],
    [COLLECTIONS.QUOTES, STORAGE_KEYS.QUOTES],
    [COLLECTIONS.ORDERS, STORAGE_KEYS.ORDERS],
    [COLLECTIONS.DELIVERIES, STORAGE_KEYS.DELIVERIES],
    [COLLECTIONS.PRICE_TIERS, STORAGE_KEYS.PRICE_TIERS],
  ];

  let ok = 0;
  for (const [col, key] of cols) {
    if (await loadFromFirestore(col, key)) ok++;
  }
  console.log(`☁️ === TERMINÉ : ${ok}/${cols.length} collections OK ===`);
}

// ============================================
// 🔄 CRITIQUE : Écriture vers Firestore
// ============================================
async function syncSave<T extends { id: string }>(collectionName: string, data: T): Promise<void> {
  if (!db) {
    console.error(`❌ [SAVE] Firebase db null ! Impossible de sauvegarder ${collectionName}`);
    return;
  }
  try {
    await saveDocument(collectionName, data);
    console.log(`✅ [SAVE] ${collectionName}/${data.id} sauvegardé dans Firestore`);
  } catch (e: any) {
    console.error(`❌ [SAVE] Erreur ${collectionName}:`, e.message || e);
  }
}

async function syncDelete(collectionName: string, id: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDocument(collectionName, id);
    console.log(`✅ [DELETE] ${collectionName}/${id} supprimé de Firestore`);
  } catch (e: any) {
    console.error(`❌ [DELETE] Erreur ${collectionName}:`, e.message || e);
  }
}

// ============================================
// 🔄 Polling : recharge toutes les 30s
// ============================================
let polling = false;

async function pollSync(): Promise<void> {
  if (polling) return;
  polling = true;
  try {
    const cols: [string, string][] = [
      [COLLECTIONS.PRODUCTS, STORAGE_KEYS.PRODUCTS],
      [COLLECTIONS.CLIENTS, STORAGE_KEYS.CLIENTS],
      [COLLECTIONS.INVOICES, STORAGE_KEYS.INVOICES],
      [COLLECTIONS.QUOTES, STORAGE_KEYS.QUOTES],
      [COLLECTIONS.ORDERS, STORAGE_KEYS.ORDERS],
      [COLLECTIONS.DELIVERIES, STORAGE_KEYS.DELIVERIES],
      [COLLECTIONS.PRICE_TIERS, STORAGE_KEYS.PRICE_TIERS],
    ];
    for (const [col, key] of cols) {
      if (await loadFromFirestore(col, key)) dispatchSyncEvent(col);
    }
  } finally { polling = false; }
}

// ============================================
// 🚀 INIT
// ============================================
(async () => {
  console.log('🚀 Démarrage de la synchronisation...');
  console.log('🔥 Firebase db:', db ? 'OK' : 'NULL !');

  await loadAllFromFirestore();

  // Polling toutes les 30 secondes
  setInterval(pollSync, 30000);
  console.log('⏰ Polling démarré (30s)');
})();

// ============================================
// 📦 Products
// ============================================
export const productStorage = {
  getAll: (): Product[] => getFromStorage<Product>(STORAGE_KEYS.PRODUCTS),
  getById: (id: string): Product | undefined => getFromStorage<Product>(STORAGE_KEYS.PRODUCTS).find(p => p.id === id),
  create: (product: Product): Product => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    products.push(product);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    syncSave(COLLECTIONS.PRODUCTS, product);
    return product;
  },
  update: (id: string, updates: Partial<Product>): Product | null => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const i = products.findIndex(p => p.id === id);
    if (i === -1) return null;
    products[i] = { ...products[i], ...updates };
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    syncSave(COLLECTIONS.PRODUCTS, products[i]);
    return products[i];
  },
  delete: (id: string): boolean => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    saveToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    syncDelete(COLLECTIONS.PRODUCTS, id);
    return true;
  },
  updateStock: (id: string, qty: number): Product | null => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const i = products.findIndex(p => p.id === id);
    if (i === -1) return null;
    products[i].stock = Math.max(0, products[i].stock + qty);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    syncSave(COLLECTIONS.PRODUCTS, products[i]);
    return products[i];
  },
};

// ============================================
// 👥 Clients
// ============================================
export const clientStorage = {
  getAll: (): Client[] => getFromStorage<Client>(STORAGE_KEYS.CLIENTS),
  getById: (id: string): Client | undefined => getFromStorage<Client>(STORAGE_KEYS.CLIENTS).find(c => c.id === id),
  create: (client: Client): Client => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    clients.push(client);
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    syncSave(COLLECTIONS.CLIENTS, client);
    return client;
  },
  update: (id: string, updates: Partial<Client>): Client | null => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const i = clients.findIndex(c => c.id === id);
    if (i === -1) return null;
    clients[i] = { ...clients[i], ...updates };
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    syncSave(COLLECTIONS.CLIENTS, clients[i]);
    return clients[i];
  },
  delete: (id: string): boolean => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;
    saveToStorage(STORAGE_KEYS.CLIENTS, filtered);
    syncDelete(COLLECTIONS.CLIENTS, id);
    return true;
  },
};

// ============================================
// 💲 Price Tiers
// ============================================
export const priceTierStorage = {
  getAll: (): PriceTier[] => getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS),
  getClientPrices: (clientId: string) => getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS).filter(t => t.clientId === clientId),
  getProductPrice: (clientId: string, productId: string, qty: number): number | null => {
    const tiers = getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS);
    const m = tiers.filter(t => t.clientId === clientId && t.productId === productId && qty >= t.minQuantity).sort((a, b) => b.minQuantity - a.minQuantity);
    return m.length > 0 ? m[0].price : null;
  },
  create: (tier: PriceTier): PriceTier => {
    const tiers = getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS);
    tiers.push(tier);
    saveToStorage(STORAGE_KEYS.PRICE_TIERS, tiers);
    syncSave(COLLECTIONS.PRICE_TIERS, tier);
    return tier;
  },
  update: (id: string, updates: Partial<PriceTier>): PriceTier | null => {
    const tiers = getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS);
    const i = tiers.findIndex(t => t.id === id);
    if (i === -1) return null;
    tiers[i] = { ...tiers[i], ...updates };
    saveToStorage(STORAGE_KEYS.PRICE_TIERS, tiers);
    syncSave(COLLECTIONS.PRICE_TIERS, tiers[i]);
    return tiers[i];
  },
  delete: (id: string): boolean => {
    const tiers = getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS);
    const filtered = tiers.filter(t => t.id !== id);
    if (filtered.length === tiers.length) return false;
    saveToStorage(STORAGE_KEYS.PRICE_TIERS, filtered);
    syncDelete(COLLECTIONS.PRICE_TIERS, id);
    return true;
  },
};

// ============================================
// 📄 Quotes
// ============================================
export const quoteStorage = {
  getAll: (): Quote[] => getFromStorage<Quote>(STORAGE_KEYS.QUOTES),
  getById: (id: string) => getFromStorage<Quote>(STORAGE_KEYS.QUOTES).find(q => q.id === id),
  create: (quote: Quote): Quote => {
    const q = getFromStorage<Quote>(STORAGE_KEYS.QUOTES);
    q.push(quote);
    saveToStorage(STORAGE_KEYS.QUOTES, q);
    syncSave(COLLECTIONS.QUOTES, quote);
    return quote;
  },
  update: (id: string, updates: Partial<Quote>): Quote | null => {
    const q = getFromStorage<Quote>(STORAGE_KEYS.QUOTES);
    const i = q.findIndex(x => x.id === id);
    if (i === -1) return null;
    q[i] = { ...q[i], ...updates };
    saveToStorage(STORAGE_KEYS.QUOTES, q);
    syncSave(COLLECTIONS.QUOTES, q[i]);
    return q[i];
  },
  delete: (id: string): boolean => {
    const q = getFromStorage<Quote>(STORAGE_KEYS.QUOTES);
    const f = q.filter(x => x.id !== id);
    if (f.length === q.length) return false;
    saveToStorage(STORAGE_KEYS.QUOTES, f);
    syncDelete(COLLECTIONS.QUOTES, id);
    return true;
  },
};

// ============================================
// 📋 Orders
// ============================================
export const orderStorage = {
  getAll: (): Order[] => getFromStorage<Order>(STORAGE_KEYS.ORDERS),
  getById: (id: string) => getFromStorage<Order>(STORAGE_KEYS.ORDERS).find(o => o.id === id),
  create: (order: Order): Order => {
    const o = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    o.push(order);
    saveToStorage(STORAGE_KEYS.ORDERS, o);
    syncSave(COLLECTIONS.ORDERS, order);
    return order;
  },
  update: (id: string, updates: Partial<Order>): Order | null => {
    const o = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    const i = o.findIndex(x => x.id === id);
    if (i === -1) return null;
    o[i] = { ...o[i], ...updates };
    saveToStorage(STORAGE_KEYS.ORDERS, o);
    syncSave(COLLECTIONS.ORDERS, o[i]);
    return o[i];
  },
  delete: (id: string): boolean => {
    const o = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    const f = o.filter(x => x.id !== id);
    if (f.length === o.length) return false;
    saveToStorage(STORAGE_KEYS.ORDERS, f);
    syncDelete(COLLECTIONS.ORDERS, id);
    return true;
  },
};

// ============================================
// 🚚 Deliveries
// ============================================
export const deliveryStorage = {
  getAll: (): DeliveryNote[] => getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES),
  getById: (id: string) => getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES).find(d => d.id === id),
  getByOrder: (orderId: string) => getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES).filter(d => d.orderId === orderId),
  create: (delivery: DeliveryNote): DeliveryNote => {
    const d = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    d.push(delivery);
    saveToStorage(STORAGE_KEYS.DELIVERIES, d);
    syncSave(COLLECTIONS.DELIVERIES, delivery);
    return delivery;
  },
  update: (id: string, updates: Partial<DeliveryNote>): DeliveryNote | null => {
    const d = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    const i = d.findIndex(x => x.id === id);
    if (i === -1) return null;
    d[i] = { ...d[i], ...updates };
    saveToStorage(STORAGE_KEYS.DELIVERIES, d);
    syncSave(COLLECTIONS.DELIVERIES, d[i]);
    return d[i];
  },
  delete: (id: string): boolean => {
    const d = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    const f = d.filter(x => x.id !== id);
    if (f.length === d.length) return false;
    saveToStorage(STORAGE_KEYS.DELIVERIES, f);
    syncDelete(COLLECTIONS.DELIVERIES, id);
    return true;
  },
};

// ============================================
// 🧾 Invoices
// ============================================
export const invoiceStorage = {
  getAll: (): Invoice[] => getFromStorage<Invoice>(STORAGE_KEYS.INVOICES),
  getById: (id: string) => getFromStorage<Invoice>(STORAGE_KEYS.INVOICES).find(i => i.id === id),
  create: (invoice: Invoice): Invoice => {
    const inv = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    inv.push(invoice);
    saveToStorage(STORAGE_KEYS.INVOICES, inv);
    syncSave(COLLECTIONS.INVOICES, invoice);
    return invoice;
  },
  update: (id: string, updates: Partial<Invoice>): Invoice | null => {
    const inv = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    const i = inv.findIndex(x => x.id === id);
    if (i === -1) return null;
    inv[i] = { ...inv[i], ...updates };
    saveToStorage(STORAGE_KEYS.INVOICES, inv);
    syncSave(COLLECTIONS.INVOICES, inv[i]);
    return inv[i];
  },
  delete: (id: string): boolean => {
    const inv = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    const f = inv.filter(x => x.id !== id);
    if (f.length === inv.length) return false;
    saveToStorage(STORAGE_KEYS.INVOICES, f);
    syncDelete(COLLECTIONS.INVOICES, id);
    return true;
  },
};

// ============================================
// 💱 Currency
// ============================================
export const formatCurrencyAmount = (amount: number, currency: Currency = 'MAD'): string => {
  const locale = currency === 'MAD' ? 'fr-MA' : currency === 'EUR' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

// ============================================
// 📊 Dashboard
// ============================================
export const getDashboardStats = (): DashboardStats => {
  const products = productStorage.getAll();
  const clients = clientStorage.getAll();
  const invoices = invoiceStorage.getAll();
  const quotes = quoteStorage.getAll();
  const orders = orderStorage.getAll();
  const deliveries = deliveryStorage.getAll();
  const paid = invoices.filter(i => i.status === 'payée');
  const totalSales = paid.reduce((s, i) => s + i.total, 0);
  const cm = new Date().getMonth(), cy = new Date().getFullYear();
  const mi = paid.filter(i => { const d = new Date(i.createdAt); return d.getMonth() === cm && d.getFullYear() === cy; });
  const ms = mi.reduce((s, i) => s + i.total, 0);
  const ri = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const ro = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  return {
    totalSales, monthlySales: ms, totalClients: clients.length, totalProducts: products.length,
    pendingInvoices: invoices.filter(i => i.status === 'brouillon' || i.status === 'envoyée').length,
    pendingOrders: orders.filter(o => o.status === 'en_attente' || o.status === 'confirmée' || o.status === 'en_cours').length,
    pendingQuotes: quotes.filter(q => q.status === 'brouillon' || q.status === 'envoyé').length,
    pendingDeliveries: deliveries.filter(d => d.status === 'préparation' || d.status === 'en_cours').length,
    recentInvoices: ri, recentOrders: ro,
    totalQuotesAmount: quotes.filter(q => q.status === 'accepté').reduce((s, q) => s + q.total, 0),
    totalOrdersAmount: orders.filter(o => o.status !== 'annulée').reduce((s, o) => s + o.total, 0),
    currency: 'MAD',
  };
};
