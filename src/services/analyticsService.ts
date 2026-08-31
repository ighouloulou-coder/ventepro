// Analytics & KPI Service
import { invoiceStorage, clientStorage, productStorage, orderStorage, quoteStorage, deliveryStorage } from './storage';

export interface KPI {
  label: string;
  value: string;
  trend: number;
  icon: string;
  color: string;
}

export interface Forecast {
  month: string;
  predicted: number;
  actual?: number;
}

export function getKPIs(): KPI[] {
  const invoices = invoiceStorage.getAll();
  const clients = clientStorage.getAll();
  const products = productStorage.getAll();
  const orders = orderStorage.getAll();
  const now = new Date();
  const thisMonth = invoices.filter(i => {
    const d = new Date(i.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = invoices.filter(i => {
    const d = new Date(i.createdAt);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const thisMonthPaid = thisMonth.filter(i => i.status === 'payee');
  const lastMonthPaid = lastMonth.filter(i => i.status === 'payee');
  const thisTotal = thisMonthPaid.reduce((s, i) => s + i.total, 0);
  const lastTotal = lastMonthPaid.reduce((s, i) => s + i.total, 0);
  const trend = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal * 100) : 0;
  const avgOrder = orders.length > 0 ? orders.reduce((s, o) => s + (o.total || 0), 0) / orders.length : 0;
  const unpaid = invoices.filter(i => i.status !== 'payee' && i.status !== 'annulee');
  const unpaidTotal = unpaid.reduce((s, i) => s + i.total, 0);
  const lowStock = products.filter(p => p.stock < 10).length;
  const conversionRate = quoteStorage.getAll().length > 0 ? (orders.length / quoteStorage.getAll().length * 100) : 0;

  return [
    { label: 'CA du Mois', value: new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(thisTotal), trend, icon: '💰', color: '#3b82f6' },
    { label: 'Panier Moyen', value: new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(avgOrder), trend: 0, icon: '🛒', color: '#8b5cf6' },
    { label: 'Impayes', value: new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(unpaidTotal), trend: 0, icon: '⏳', color: '#f59e0b' },
    { label: 'Taux Conversion', value: conversionRate.toFixed(1) + '%', trend: 0, icon: '📈', color: '#10b981' },
    { label: 'Clients Actifs', value: String(clients.length), trend: 0, icon: '👥', color: '#06b6d4' },
    { label: 'Stock Bas', value: String(lowStock), trend: 0, icon: '⚠️', color: '#dc2626' },
    { label: 'Commandes en Cours', value: String(orders.filter(o => o.status !== 'livree').length), trend: 0, icon: '📋', color: '#8b5cf6' },
    { label: 'Factures Payees', value: String(thisMonthPaid.length), trend: 0, icon: '✅', color: '#16a34a' },
  ];
}

export function getSalesForecast(): Forecast[] {
  const invoices = invoiceStorage.getAll().filter(i => i.status === 'payee');
  const months = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const monthlyData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const total = invoices.filter(inv => {
      const id = new Date(inv.createdAt);
      return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
    }).reduce((s, inv) => s + inv.total, 0);
    monthlyData.push(total);
  }
  const avg = monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length;
  const growth = monthlyData.length > 1 ? (monthlyData[monthlyData.length - 1] - monthlyData[0]) / monthlyData.length : 0;
  const result: Forecast[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const predicted = Math.max(0, avg + growth * (i + 1));
    result.push({ month: months[d.getMonth()], predicted: Math.round(predicted), actual: i === 0 ? monthlyData[monthlyData.length - 1] : undefined });
  }
  return result;
}

export function getProductPerformance() {
  const invoices = invoiceStorage.getAll().filter(i => i.status === 'payee');
  const perf: Record<string, { name: string; revenue: number; quantity: number }> = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!perf[item.productId]) perf[item.productId] = { name: item.productName, revenue: 0, quantity: 0 };
      perf[item.productId].revenue += item.total;
      perf[item.productId].quantity += item.quantity;
    });
  });
  return Object.values(perf).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
}

export function getClientAnalytics() {
  const invoices = invoiceStorage.getAll().filter(i => i.status === 'payee');
  const analytics: Record<string, { name: string; total: number; orders: number; lastOrder: string }> = {};
  invoices.forEach(inv => {
    if (!analytics[inv.clientId]) analytics[inv.clientId] = { name: inv.clientName, total: 0, orders: 0, lastOrder: inv.createdAt };
    analytics[inv.clientId].total += inv.total;
    analytics[inv.clientId].orders++;
    if (inv.createdAt > analytics[inv.clientId].lastOrder) analytics[inv.clientId].lastOrder = inv.createdAt;
  });
  return Object.values(analytics).sort((a, b) => b.total - a.total);
}

export function getCashFlowData() {
  const invoices = invoiceStorage.getAll();
  const months = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const paid = invoices.filter(inv => {
      const id = new Date(inv.createdAt);
      return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear() && inv.status === 'payee';
    }).reduce((s, inv) => s + inv.total, 0);
    const pending = invoices.filter(inv => {
      const id = new Date(inv.createdAt);
      return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear() && inv.status !== 'payee' && inv.status !== 'annulee';
    }).reduce((s, inv) => s + inv.total, 0);
    return { mois: months[d.getMonth()], encaisse: paid, attente: pending };
  }).reverse();
}
