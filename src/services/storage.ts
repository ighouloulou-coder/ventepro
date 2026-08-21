import { Product, Client, Invoice, DashboardStats } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'sales_products',
  CLIENTS: 'sales_clients',
  INVOICES: 'sales_invoices',
};

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Products
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
    return product;
  },
  update: (id: string, updates: Partial<Product>): Product | null => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },
  delete: (id: string): boolean => {
    const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    saveToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },
};

// Clients
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
    return client;
  },
  update: (id: string, updates: Partial<Client>): Client | null => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;
    clients[index] = { ...clients[index], ...updates };
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    return clients[index];
  },
  delete: (id: string): boolean => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;
    saveToStorage(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  },
};

// Invoices
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
    return invoice;
  },
  update: (id: string, updates: Partial<Invoice>): Invoice | null => {
    const invoices = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return null;
    invoices[index] = { ...invoices[index], ...updates };
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    return invoices[index];
  },
  delete: (id: string): boolean => {
    const invoices = getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    const filtered = invoices.filter(i => i.id !== id);
    if (filtered.length === invoices.length) return false;
    saveToStorage(STORAGE_KEYS.INVOICES, filtered);
    return true;
  },
};

// Dashboard stats
export const getDashboardStats = (): DashboardStats => {
  const products = productStorage.getAll();
  const clients = clientStorage.getAll();
  const invoices = invoiceStorage.getAll();
  
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

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalSales,
    monthlySales,
    totalClients: clients.length,
    totalProducts: products.length,
    pendingInvoices,
    recentInvoices,
  };
};
