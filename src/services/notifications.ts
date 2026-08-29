/**
 * Service de notifications WhatsApp et relances automatiques
 * Permet d'envoyer des messages de relance via WhatsApp Web
 */

import { Invoice, Client } from '../types';

// ============================================
// 📱 WhatsApp
// ============================================

/**
 * Générer un message de relance pour une facture impayée
 */
export const generateReminderMessage = (invoice: Invoice, client: Client): string => {
  const daysOverdue = Math.max(0, Math.floor(
    (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const baseMessage = `Bonjour ${client.name},\n\n` +
    `Je me permets de vous contacter au sujet de la facture #${invoice.id.slice(0, 8)}.\n\n` +
    `📋 Détails :\n` +
    `- Montant : ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)}\n` +
    `- Date d'échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}\n`;

  if (daysOverdue > 0) {
    return baseMessage +
      `⚠️ Retard : ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}\n\n` +
      `Merci de procéder au règlement dans les meilleurs délais.\n\n` +
      `Cordialement,\nVentePro`;
  }

  return baseMessage +
    `📅 Échéance dans quelques jours.\n\n` +
    `Merci de votre attention.\n\n` +
    `Cordialement,\nVentePro`;
};

/**
 * Générer un message de confirmation de paiement
 */
export const generatePaymentConfirmation = (invoice: Invoice): string => {
  return `Bonjour ${invoice.clientName},\n\n` +
    `✅ Paiement confirmé pour la facture #${invoice.id.slice(0, 8)}.\n` +
    `Montant : ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)}\n\n` +
    `Merci pour votre confiance !\n\n` +
    `VentePro`;
};

/**
 * Ouvrir WhatsApp Web avec un message pré-rempli
 */
export const sendWhatsAppMessage = (phone: string, message: string): void => {
  // Nettoyer le numéro de téléphone
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  if (!cleanPhone) {
    alert('Numéro de téléphone non disponible pour ce client');
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

/**
 * Envoyer une relance WhatsApp pour une facture
 */
export const sendInvoiceReminder = (invoice: Invoice, client: Client): void => {
  const message = generateReminderMessage(invoice, client);
  sendWhatsAppMessage(client.phone, message);
};

// ============================================
// ⏰ Relances automatiques
// ============================================

export interface Reminder {
  id: string;
  invoiceId: string;
  clientId: string;
  type: '3_days_before' | 'on_due_date' | 'overdue_1' | 'overdue_7' | 'overdue_15' | 'overdue_30';
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
}

const REMINDERS_KEY = 'sales_reminders';

/**
 * Calculer les relances nécessaires pour une facture
 */
export const calculateRemindersNeeded = (invoice: Invoice): Reminder['type'][] => {
  if (invoice.status === 'payée' || invoice.status === 'annulée') return [];

  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const remindersNeeded: Reminder['type'][] = [];

  if (daysUntilDue === 3) remindersNeeded.push('3_days_before');
  if (daysUntilDue === 0) remindersNeeded.push('on_due_date');
  if (daysUntilDue === -1) remindersNeeded.push('overdue_1');
  if (daysUntilDue === -7) remindersNeeded.push('overdue_7');
  if (daysUntilDue === -15) remindersNeeded.push('overdue_15');
  if (daysUntilDue === -30) remindersNeeded.push('overdue_30');

  return remindersNeeded;
};

/**
 * Vérifier quelles relances ont déjà été envoyées
 */
export const getSentReminders = (invoiceId: string): Reminder[] => {
  const reminders: Reminder[] = JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
  return reminders.filter(r => r.invoiceId === invoiceId);
};

/**
 * Enregistrer une relance envoyée
 */
export const saveReminder = (reminder: Reminder): void => {
  const reminders: Reminder[] = JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
  reminders.push(reminder);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

/**
 * Obtenir les factures nécessitant une relance aujourd'hui
 */
export const getInvoicesNeedingReminder = (
  invoices: Invoice[],
  clients: Client[]
): Array<{ invoice: Invoice; client: Client; type: Reminder['type'] }> => {
  const results: Array<{ invoice: Invoice; client: Client; type: Reminder['type'] }> = [];

  invoices
    .filter(i => i.status !== 'payée' && i.status !== 'annulée')
    .forEach(invoice => {
      const needed = calculateRemindersNeeded(invoice);
      const sent = getSentReminders(invoice.id);
      const sentTypes = sent.map(s => s.type);

      needed
        .filter(type => !sentTypes.includes(type))
        .forEach(type => {
          const client = clients.find(c => c.id === invoice.clientId);
          if (client) {
            results.push({ invoice, client, type });
          }
        });
    });

  return results;
};

/**
 * Obtenir le label du type de relance
 */
export const getReminderTypeLabel = (type: Reminder['type']): string => {
  const labels: Record<Reminder['type'], string> = {
    '3_days_before': '📅 Rappel 3 jours avant échéance',
    'on_due_date': '⏰ Jour de l\'échéance',
    'overdue_1': '⚠️ Retard 1 jour',
    'overdue_7': '🔴 Retard 7 jours',
    'overdue_15': '🔴🔴 Retard 15 jours',
    'overdue_30': '🚨 Retard 30 jours - URGENT',
  };
  return labels[type];
};

/**
 * Obtenir le message de relance selon le type
 */
export const getReminderMessage = (type: Reminder['type'], invoice: Invoice, client: Client): string => {
  switch (type) {
    case '3_days_before':
      return `Bonjour ${client.name}, rappel : la facture #${invoice.id.slice(0, 8)} de ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)} est due dans 3 jours. Merci !`;
    case 'on_due_date':
      return `Bonjour ${client.name}, la facture #${invoice.id.slice(0, 8)} de ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)} arrive à échéance aujourd'hui. Merci de votre règlement.`;
    case 'overdue_1':
      return `Bonjour ${client.name}, la facture #${invoice.id.slice(0, 8)} de ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)} est en retard d'1 jour. Merci de procéder au paiement.`;
    case 'overdue_7':
      return `Bonjour ${client.name}, la facture #${invoice.id.slice(0, 8)} de ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)} est en retard de 7 jours. Merci de régulariser.`;
    case 'overdue_15':
      return `Bonjour ${client.name}, la facture #${invoice.id.slice(0, 8)} de ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)} est en retard de 15 jours. Contactez-nous pour un arrangement.`;
    case 'overdue_30':
      return `Bonjour ${client.name}, la facture #${invoice.id.slice(0, 8)} de ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: invoice.currency || 'MAD' }).format(invoice.total)} est en retard de 30 jours. Merci de régulariser dans les meilleurs délais.`;
    default:
      return `Bonjour ${client.name}, rappel pour la facture #${invoice.id.slice(0, 8)}.`;
  }
};
