// Report Export Service - PDF and Excel
import { invoiceStorage, productStorage, clientStorage, orderStorage, quoteStorage } from './storage';

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function fmt(n: number) { return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(n); }

export function exportDashboardPDF() {
  const invoices = invoiceStorage.getAll();
  const clients = clientStorage.getAll();
  const products = productStorage.getAll();
  const paid = invoices.filter(i => i.status === 'payee');
  const total = paid.reduce((s, i) => s + i.total, 0);
  
  const html = \`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport Dashboard</title>
  <style>body{font-family:system-ui;padding:40px;color:#1f2937}h1{color:#2563eb}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:13px}th{background:#f3f4f6;font-weight:600}.stat{display:inline-block;margin:10px 20px;padding:15px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb}.stat h3{margin:0;font-size:12px;color:#6b7280}.stat p{margin:4px 0 0;font-size:20px;font-weight:700}</style></head><body>
  <h1>Rapport Dashboard - TRADE LINK</h1>
  <p>Date: \${new Date().toLocaleDateString('fr-FR')}</p>
  <div class="stat"><h3>Ventes Totales</h3><p>\${fmt(total)}</p></div>
  <div class="stat"><h3>Clients</h3><p>\${clients.length}</p></div>
  <div class="stat"><h3>Produits</h3><p>\${products.length}</p></div>
  <div class="stat"><h3>Factures Payees</h3><p>\${paid.length}</p></div>
  <h2>Factures Recentes</h2>
  <table><tr><th>#</th><th>Client</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
  \${invoices.slice(0, 20).map(i => '<tr><td>#'+i.id.slice(0,8)+'</td><td>'+i.clientName+'</td><td>'+fmt(i.total)+'</td><td>'+i.status+'</td><td>'+new Date(i.createdAt).toLocaleDateString('fr-FR')+'</td></tr>').join('')}
  </table></body></html>\`;
  
  const blob = new Blob([html], { type: 'text/html' });
  downloadFile(blob, 'rapport-dashboard-' + Date.now() + '.html');
}

export function exportInvoicesCSV() {
  const invoices = invoiceStorage.getAll();
  const rows = [['ID', 'Client', 'Montant', 'Statut', 'Date', 'Devise']];
  invoices.forEach(i => rows.push([i.id.slice(0,8), i.clientName, String(i.total), i.status, new Date(i.createdAt).toLocaleDateString('fr-FR'), i.currency || 'MAD']));
  const csv = rows.map(r => r.map(c => '"' + c.replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadFile(blob, 'factures-' + Date.now() + '.csv');
}

export function exportProductsCSV() {
  const products = productStorage.getAll();
  const rows = [['Nom', 'Prix', 'Stock', 'Categorie', 'Description']];
  products.forEach(p => rows.push([p.name, String(p.price), String(p.stock), p.category || '', p.description || '']));
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadFile(blob, 'produits-' + Date.now() + '.csv');
}

export function exportClientsCSV() {
  const clients = clientStorage.getAll();
  const rows = [['Nom', 'Email', 'Telephone', 'Adresse', 'Notes']];
  clients.forEach(c => rows.push([c.name, c.email || '', c.phone || '', c.address || '', c.notes || '']));
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadFile(blob, 'clients-' + Date.now() + '.csv');
}

export function exportSalesReport() {
  const invoices = invoiceStorage.getAll().filter(i => i.status === 'payee');
  const byMonth: Record<string, number> = {};
  const months = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];
  invoices.forEach(i => {
    const d = new Date(i.createdAt);
    const key = months[d.getMonth()] + ' ' + d.getFullYear();
    byMonth[key] = (byMonth[key] || 0) + i.total;
  });
  const rows = [['Mois', 'Ventes']];
  Object.entries(byMonth).forEach(([k, v]) => rows.push([k, fmt(v)]));
  const csv = rows.map(r => r.map(c => '"' + c.replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadFile(blob, 'rapport-ventes-' + Date.now() + '.csv');
}
