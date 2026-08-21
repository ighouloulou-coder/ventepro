export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  status: 'brouillon' | 'envoyée' | 'payée' | 'annulée';
  createdAt: string;
  dueDate: string;
}

export interface DashboardStats {
  totalSales: number;
  monthlySales: number;
  totalClients: number;
  totalProducts: number;
  pendingInvoices: number;
  recentInvoices: Invoice[];
}
