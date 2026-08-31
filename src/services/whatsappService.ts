// WhatsApp Business Integration
import { invoiceStorage, clientStorage } from './storage';

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) cleaned = '+212' + cleaned.slice(1);
    else cleaned = '+212' + cleaned;
  }
  return cleaned;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(n);
}

export function sendWhatsAppMessage(phone: string, message: string): void {
  const encoded = encodeURIComponent(message);
  const url = 'https://wa.me/' + formatPhone(phone).replace('+', '') + '?text=' + encoded;
  window.open(url, '_blank');
}

export function sendInvoiceWhatsApp(invoiceId: string): void {
  const invoice = invoiceStorage.getAll().find(i => i.id === invoiceId);
  if (!invoice) return;
  const client = clientStorage.getAll().find(c => c.id === invoice.clientId);
  if (!client || !client.phone) { alert('Pas de numero de telephone pour ce client'); return; }
  
  let msg = '*Facture TRADE LINK*\n';
  msg += '-------------------\n';
  msg += 'N°: #' + invoice.id.slice(0, 8) + '\n';
  msg += 'Client: ' + invoice.clientName + '\n';
  msg += 'Date: ' + new Date(invoice.createdAt).toLocaleDateString('fr-FR') + '\n';
  msg += '-------------------\n';
  invoice.items.forEach(item => {
    msg += item.productName + ' x' + item.quantity + ' = ' + fmt(item.total) + '\n';
  });
  msg += '-------------------\n';
  msg += '*TOTAL: ' + fmt(invoice.total) + '*\n';
  msg += 'Statut: ' + invoice.status + '\n';
  msg += '\nMerci pour votre confiance ! - TRADE LINK';
  
  sendWhatsAppMessage(client.phone, msg);
}

export function sendQuoteWhatsApp(quoteId: string): void {
  const { quoteStorage } = require('./storage');
  const quote = quoteStorage.getAll().find((q: any) => q.id === quoteId);
  if (!quote) return;
  const client = clientStorage.getAll().find(c => c.id === quote.clientId);
  if (!client || !client.phone) { alert('Pas de numero de telephone pour ce client'); return; }
  
  let msg = '*Devis TRADE LINK*\n';
  msg += '-------------------\n';
  msg += 'N°: #' + quote.id.slice(0, 8) + '\n';
  msg += 'Client: ' + quote.clientName + '\n';
  msg += 'Date: ' + new Date(quote.createdAt).toLocaleDateString('fr-FR') + '\n';
  msg += '-------------------\n';
  quote.items.forEach((item: any) => {
    msg += item.productName + ' x' + item.quantity + ' = ' + fmt(item.total) + '\n';
  });
  msg += '-------------------\n';
  msg += '*TOTAL: ' + fmt(quote.total) + '*\n';
  msg += '\nValide 30 jours - TRADE LINK';
  
  sendWhatsAppMessage(client.phone, msg);
}

export function sendOrderWhatsApp(orderId: string): void {
  const { orderStorage } = require('./storage');
  const order = orderStorage.getAll().find((o: any) => o.id === orderId);
  if (!order) return;
  const client = clientStorage.getAll().find(c => c.id === order.clientId);
  if (!client || !client.phone) { alert('Pas de numero de telephone pour ce client'); return; }
  
  let msg = '*Commande TRADE LINK*\n';
  msg += '-------------------\n';
  msg += 'N°: #' + order.id.slice(0, 8) + '\n';
  msg += 'Client: ' + order.clientName + '\n';
  msg += 'Statut: ' + order.status + '\n';
  msg += 'Total: ' + fmt(order.total || 0) + '\n';
  msg += '\nMerci ! - TRADE LINK';
  
  sendWhatsAppMessage(client.phone, msg);
}

export function sendDeliveryReminder(phone: string, clientName: string, deliveryDate: string): void {
  const msg = '*Rappel Livraison*\n\nBonjour ' + clientName + ',\n\nVotre livraison est prevue le ' + new Date(deliveryDate).toLocaleDateString('fr-FR') + '.\n\nCordialement,\nTRADE LINK';
  sendWhatsAppMessage(phone, msg);
}

export function sendPaymentReminder(phone: string, clientName: string, amount: number, invoiceId: string): void {
  const msg = '*Rappel Paiement*\n\nBonjour ' + clientName + ',\n\nNous vous rappelons le reglement de la facture #' + invoiceId.slice(0, 8) + ' d un montant de ' + fmt(amount) + '.\n\nMerci,\nTRADE LINK';
  sendWhatsAppMessage(phone, msg);
}
