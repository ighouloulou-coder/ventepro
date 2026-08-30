import { Product, Client, Invoice, Quote, Order, DeliveryNote, PriceTier, DashboardStats, Currency } from '../types';
import { saveDocument, deleteDocument, COLLECTIONS } from './firebase';

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
// 🗄️ Generic storage functions
// ============================================
function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================
// 🔄 Sync helpers — sauvegarde locale + Firebase
// ============================================
async function syncSave<T extends { id: string }>(collectionName: string, data: T): Promise<void> {
  try {
    await saveDocument(collectionName, data);
  } catch (e) {
    // Offline: la donnée reste en localStorage, sync plus tard
  }
}

async function syncDelete(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDocument(collectionName, id);
  } catch (e) {
    // Offline: suppression locale suffit
  }
}

// ============================================
// 📦 Products
// ============================================
export const productStorage = {
  getAll: (): Product[] => getFromStorage<Product>(STORAGE_KEYS.PRODUCTS),
  getById: (id: string): Product | undefined => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    return products.find(p => p.id === id);
  },
  create: (product: Product): Product => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    products.push(product);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    syncSave(COLLECTIONS.PRODUCTS, product);
    return product;
  },
  update: (id: string, updates: Partial<Product>): Product | null => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    syncSave(COLLECTIONS.PRODUCTS, products[index]);
    return products[index];
  },
  delete: (id: string): boolean => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    saveToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    syncDelete(COLLECTIONS.PRODUCTS, id);
    return true;
  },
  updateStock: (id: string, quantityChange: number): Product | null => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index].stock = Math.max(0, products[index].stock + quantityChange);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    syncSave(COLLECTIONS.PRODUCTS, products[index]);
    return products[index];
  },
};

// ============================================
// 👥 Clients
// ============================================
export const clientStorage = {
  getAll: (): Client[] => getFromStorage<Client>(STORAGE_KEYS.CLIENTS),
  getById: (id: string): Client | undefined => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    return clients.find(c => c.id === id);
  },
  create: (client: Client): Client => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    clients.push(client);
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    syncSave(COLLECTIONS.CLIENTS, client);
    return client;
  },
  update: (id: string, updates: Partial<Client>): Client | null => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;
    clients[index] = { ...clients[index], ...updates };
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    syncSave(COLLECTIONS.CLIENTS, clients[index]);
    return clients[index];
  },
  delete: (id: string): boolean => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;
    saveToStorage(STORAGE_KEYS.CLIENTS, clients.filter(c => c.id !== id));
    syncDelete(COLLECTIONS.CLIENTS, id);
    return true;
  },
};

// ============================================
// 💲 Price Tiers (Tarification par client)
// ============================================
export const priceTierStorage = {
  getAll: (): PriceTier[] => getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS),
  getClientPrices: (clientId: string): PriceTier[] => {
    const tiers = getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS);
    return tiers.filter(t => t.clientId === clientId);
  },
  getProductPrice: (clientId: string, productId: string, quantity: number): number | null => {
    const tiers = getFromStorage<PriceTier>(STORAGE_KEYS.PRICE_TIERS);
    const matching = tiers
      .filter(t => t.clientId === clientId && t.productId === productId && quantity >= t.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity);
    return matching.length > 0 ? matching[0].price : null;
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
    const index = tiers.findIndex(t => t.id === id);
    if (index === -1) return null;
    tiers[index] = { ...tiers[index], ...updates };
    saveToStorage(STORAGE_KEYS.PRICE_TIERS, tiers);
    syncSave(COLLECTIONS.PRICE_TIERS, tiers[index]);
    return tiers[index];
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
// 📄 Quotes (Devis)
// ============================================
export const quoteStorage = {
  getAll: (): Quote[] => getFromStorage<Quote>(STORAGE_KEYS.QUOTES),
  getById: (id: string): Quote | undefined => {
    const quotes = getFromStorage<Quote>(STORAGE_KEYS.QUOTES);
    return quotes.find(q => q.id === id);
  },
  create: (quote: Quote): Quote => {
    const quotes = getFromStorage<Quote>(STORAGE_KEYS.QUOTES);
    quotes.push(quote);
    saveToStorage(STORAGE_KEYS.QUOTES, quotes);
    syncSave(COLLECTIONS.QUOTES, quote);
    return quote;
  },
  update: (id: string, updates: Partial<Quote>): Quote | null => {
    const quotes = getFromStorage<Quote>(STORAGE_KEYS.QUOTES);
    const index = quotes.findIndex(q => q.id === id);
    if (index === -1) return null;
    quotes[index] = { ...quotes[index], ...updates };
    saveToStorage(STORAGE_KEYS.QUOTES, quotes);
    syncSave(COLLECTIONS.QUOTES, quotes[index]);
    return quotes[index];
  },
  delete: (id: string): boolean => {
    const quotes = getFromStorage<Quote>(STORAGE_KEYS.QUOTES);
    const filtered = quotes.filter(q => q.id !== id);
    if (filtered.length === quotes.length) return false;
    saveToStorage(STORAGE_KEYS.QUOTES, filtered);
    syncDelete(COLLECTIONS.QUOTES, id);
    return true;
  },
};

// ============================================
// 📋 Orders (Bons de commande)
// ============================================
export const orderStorage = {
  getAll: (): Order[] => getFromStorage<Order>(STORAGE_KEYS.ORDERS),
  getById: (id: string): Order | undefined => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    return orders.find(o => o.id === id);
  },
  create: (order: Order): Order => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    orders.push(order);
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    syncSave(COLLECTIONS.ORDERS, order);
    return order;
  },
  update: (id: string, updates: Partial<Order>): Order | null => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    orders[index] = { ...orders[index], ...updates };
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    syncSave(COLLECTIONS.ORDERS, orders[index]);
    return orders[index];
  },
  delete: (id: string): boolean => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;
    saveToStorage(STORAGE_KEYS.ORDERS, orders.filter(o => o.id !== id));
    syncDelete(COLLECTIONS.ORDERS, id);
    return true;
  },
};

// ============================================
// 🚚 Deliveries (Bons de livraison)
// ============================================
export const deliveryStorage = {
  getAll: (): DeliveryNote[] => getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES),
  getById: (id: string): DeliveryNote | undefined => {
    const deliveries = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    return deliveries.find(d => d.id === id);
  },
  getByOrder: (orderId: string): DeliveryNote[] => {
    const deliveries = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    return deliveries.filter(d => d.orderId === orderId);
  },
  create: (delivery: DeliveryNote): DeliveryNote => {
    const deliveries = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    deliveries.push(delivery);
    saveToStorage(STORAGE_KEYS.DELIVERIES, deliveries);
    syncSave(COLLECTIONS.DELIVERIES, delivery);
    return delivery;
  },
  update: (id: string, updates: Partial<DeliveryNote>): DeliveryNote | null => {
    const deliveries = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    const index = deliveries.findIndex(d => d.id === id);
    if (index === -1) return null;
    deliveries[index] = { ...deliveries[index], ...updates };
    saveToStorage(STORAGE_KEYS.DELIVERIES, deliveries);
    syncSave(COLLECTIONS.DELIVERIES, deliveries[index]);
    return deliveries[index];
  },
  delete: (id: string): boolean => {
    const deliveries = getFromStorage<DeliveryNote>(STORAGE_KEYS.DELIVERIES);
    const filtered = deliveries.filter(d => d.id !== id);
    if (filtered.length === deliveries.length) return false;
    saveToStorage(STORAGE_KEYS.DELIVERIES, deliveries.filter(d => d.id !== id));
    syncDelete(COLLECTIONS.DELIVERIES, id);
    return true;
  },
};

// ============================================
// 🧾 Invoices
// ============================================
export const invoiceStorage = {
  getAll: (): Invoice[] => getFromStorage<Invoice>(STORAGE_KEYS.INVOICES),
  getById: (id: string): Invoice | undefined => {
    const invoices = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    return invoices.find(i => i.id === id);
  },
  create: (invoice: Invoice): Invoice => {
    const invoices = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    invoices.push(invoice);
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    syncSave(COLLECTIONS.INVOICES, invoice);
    return invoice;
  },
  update: (id: string, updates: Partial<Invoice>): Invoice | null => {
    const invoices = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return null;
    invoices[index] = { ...invoices[index], ...updates };
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    syncSave(COLLECTIONS.INVOICES, invoices[index]);
    return invoices[index];
  },
  delete: (id: string): boolean => {
    const invoices = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    const filtered = invoices.filter(i => i.id !== id);
    if (filtered.length === invoices.length) return false;
    saveToStorage(STORAGE_KEYS.INVOICES, invoices.filter(i => i.id !== id));
    syncDelete(COLLECTIONS.INVOICES, id);
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
// 📊 Dashboard stats
// ============================================
export const getDashboardStats = (): DashboardStats => {
  const products = productStorage.getAll();
  const clients = clientStorage.getAll();
  const invoices = invoiceStorage.getAll();
  const quotes = quoteStorage.getAll();
  const orders = orderStorage.getAll();
  const deliveries = deliveryStorage.getAll();

  const paidInvoices = invoices.filter(i => i.status === 'payée');
  const totalSales = paidInvoices.reduce((sum, i) => sum + i.total, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyInvoices = paidInvoices.filter(i => {
    const date = new Date(i.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const monthlySales = monthlyInvoices.reduce((sum, i) => sum + i.total, 0);

  const pendingInvoices = invoices.filter(i =>
    i.status === 'brouillon' || i.status === 'envoyée'
  ).length;

  const pendingOrders = orders.filter(o =>
    o.status === 'en_attente' || o.status === 'confirmée' || o.status === 'en_cours'
  ).length;

  const pendingQuotes = quotes.filter(q =>
    q.status === 'brouillon' || q.status === 'envoyé'
  ).length;

  const pendingDeliveries = deliveries.filter(d =>
    d.status === 'préparation' || d.status === 'en_cours'
  ).length;

  const totalQuotesAmount = quotes
    .filter(q => q.status === 'accepté')
    .reduce((sum, q) => sum + q.total, 0);

  const totalOrdersAmount = orders
    .filter(o => o.status !== 'annulée')
    .reduce((sum, o) => sum + o.total, 0);

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalSales,
    monthlySales,
    totalClients: clients.length,
    totalProducts: products.length,
    pendingInvoices,
    pendingOrders,
    pendingQuotes,
    pendingDeliveries,
    recentInvoices,
    recentOrders,
    totalQuotesAmount,
    totalOrdersAmount,
    currency: 'MAD',
  };
};
