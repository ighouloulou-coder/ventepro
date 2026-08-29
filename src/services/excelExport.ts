/**
 * Service d'export Excel pour les factures et rapports
 * Utilise une génération CSV simple (compatible Excel)
 */

import { Invoice, Order, Quote } from '../types';

// ============================================
// 📊 Utilitaires CSV
// ============================================

/**
 * Échapper une valeur CSV
 */
const escapeCSV = (value: string | number | boolean): string => {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Convertir un tableau de données en CSV
 */
const toCSV = (headers: string[], rows: (string | number)[][]): string => {
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n');

  return csvContent;
};

/**
 * Télécharger un fichier CSV
 */
const downloadCSV = (content: string, filename: string): void => {
  // Ajouter le BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// ============================================
// 🧾 Export Factures
// ============================================

/**
 * Exporter toutes les factures en CSV
 */
export const exportInvoicesToExcel = (invoices: Invoice[]): void => {
  const headers = [
    '#Facture',
    'Client',
    'Sous-total',
    'TVA (%)',
    'Montant TVA',
    'Total',
    'Devise',
    'Statut',
    'Date création',
    'Date échéance',
    'Jours restants',
    'Notes',
  ];

  const rows = invoices.map(invoice => {
    const dueDate = new Date(invoice.dueDate);
    const now = new Date();
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return [
      invoice.id.slice(0, 8).toUpperCase(),
      invoice.clientName,
      invoice.subtotal.toFixed(2),
      invoice.taxRate,
      invoice.tax.toFixed(2),
      invoice.total.toFixed(2),
      invoice.currency,
      invoice.status,
      new Date(invoice.createdAt).toLocaleDateString('fr-FR'),
      dueDate.toLocaleDateString('fr-FR'),
      daysRemaining,
      invoice.notes || '',
    ];
  });

  // Ajouter les totaux
  const totalAll = invoices.reduce((sum, i) => sum + i.total, 0);
  const paidTotal = invoices.filter(i => i.status === 'payée').reduce((sum, i) => sum + i.total, 0);
  const pendingTotal = invoices.filter(i => i.status !== 'payée' && i.status !== 'annulée').reduce((sum, i) => sum + i.total, 0);

  rows.push([]);
  rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', 'RÉSUMÉ', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', `Total: ${totalAll.toFixed(2)}`, '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', `Payées: ${paidTotal.toFixed(2)}`, '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', `En attente: ${pendingTotal.toFixed(2)}`, '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', `Nb factures: ${invoices.length}`, '', '', '', '', '', '']);

  const csv = toCSV(headers, rows);
  downloadCSV(csv, `factures-${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Exporter une seule facture détaillée
 */
export const exportSingleInvoice = (invoice: Invoice): void => {
  const headers = ['Produit', 'Quantité', 'Prix unitaire', 'Total'];

  const rows = invoice.items.map(item => [
    item.productName,
    item.quantity,
    item.unitPrice.toFixed(2),
    item.total.toFixed(2),
  ]);

  // Totaux
  rows.push([]);
  rows.push(['', '', 'Sous-total:', invoice.subtotal.toFixed(2)]);
  rows.push(['', '', `TVA (${invoice.taxRate}%):`, invoice.tax.toFixed(2)]);
  rows.push(['', '', 'TOTAL:', invoice.total.toFixed(2)]);

  const csv = toCSV(headers, rows);
  downloadCSV(csv, `facture-${invoice.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`);
};

// ============================================
// 📋 Export Commandes
// ============================================

export const exportOrdersToExcel = (orders: Order[]): void => {
  const headers = [
    '#Commande',
    'Client',
    'Sous-total',
    'Total',
    'Devise',
    'Statut',
    'Date création',
    'Date livraison prévue',
    'Adresse livraison',
    'Notes',
  ];

  const rows = orders.map(order => [
    order.id.slice(0, 8).toUpperCase(),
    order.clientName,
    order.subtotal.toFixed(2),
    order.total.toFixed(2),
    order.currency,
    order.status,
    new Date(order.createdAt).toLocaleDateString('fr-FR'),
    new Date(order.deliveryDate).toLocaleDateString('fr-FR'),
    order.deliveryAddress || '',
    order.notes || '',
  ]);

  const totalAll = orders.reduce((sum, o) => sum + o.total, 0);
  rows.push([]);
  rows.push(['', '', '', `Total: ${totalAll.toFixed(2)}`, '', '', '', '', '', '', '']);
  rows.push(['', '', '', `Nb commandes: ${orders.length}`, '', '', '', '', '', '', '']);

  const csv = toCSV(headers, rows);
  downloadCSV(csv, `commandes-${new Date().toISOString().split('T')[0]}.csv`);
};

// ============================================
// 📄 Export Devis
// ============================================

export const exportQuotesToExcel = (quotes: Quote[]): void => {
  const headers = [
    '#Devis',
    'Client',
    'Sous-total',
    'Total',
    'Devise',
    'Statut',
    'Date création',
    'Valide jusqu\'au',
    'Notes',
  ];

  const rows = quotes.map(quote => [
    quote.id.slice(0, 8).toUpperCase(),
    quote.clientName,
    quote.subtotal.toFixed(2),
    quote.total.toFixed(2),
    quote.currency,
    quote.status,
    new Date(quote.createdAt).toLocaleDateString('fr-FR'),
    new Date(quote.validUntil).toLocaleDateString('fr-FR'),
    quote.notes || '',
  ]);

  const totalAccepted = quotes.filter(q => q.status === 'accepté').reduce((sum, q) => sum + q.total, 0);
  rows.push([]);
  rows.push(['', '', '', `Total devis acceptés: ${totalAccepted.toFixed(2)}`, '', '', '', '', '']);
  rows.push(['', '', '', `Nb devis: ${quotes.length}`, '', '', '', '', '']);

  const csv = toCSV(headers, rows);
  downloadCSV(csv, `devis-${new Date().toISOString().split('T')[0]}.csv`);
};

// ============================================
// 📊 Rapport Chiffre d'Affaires
// ============================================

export const exportSalesReport = (invoices: Invoice[]): void => {
  const headers = ['Mois', 'Nb factures', 'Total vendu', 'Moyenne/facture'];

  // Grouper par mois
  const monthlyData: Record<string, { count: number; total: number }> = {};

  invoices
    .filter(i => i.status === 'payée')
    .forEach(invoice => {
      const date = new Date(invoice.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { count: 0, total: 0 };
      monthlyData[key].count++;
      monthlyData[key].total += invoice.total;
    });

  const rows = Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data]) => [
      month,
      data.count,
      data.total.toFixed(2),
      (data.total / data.count).toFixed(2),
    ]);

  // Totaux
  const totalInvoices = invoices.filter(i => i.status === 'payée').length;
  const totalSales = invoices.filter(i => i.status === 'payée').reduce((sum, i) => sum + i.total, 0);

  rows.push([]);
  rows.push(['TOTAUX', totalInvoices, totalSales.toFixed(2), totalInvoices > 0 ? (totalSales / totalInvoices).toFixed(2) : '0']);

  const csv = toCSV(headers, rows);
  downloadCSV(csv, `rapport-ventes-${new Date().toISOString().split('T')[0]}.csv`);
};
