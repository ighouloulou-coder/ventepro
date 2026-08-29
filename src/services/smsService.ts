/**
 * Service de notifications SMS via Twilio
 * Permet d'envoyer des relances par SMS
 *
 * Configuration requise dans .env :
 * TWILIO_ACCOUNT_SID=your_account_sid
 * TWILIO_AUTH_TOKEN=your_auth_token
 * TWILIO_PHONE_NUMBER=+1234567890
 */

import { Invoice, Client } from '../types';

// ============================================
// 📱 Configuration
// ============================================

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  apiEndpoint: string; // URL du serveur proxy Twilio
}

const getConfig = (): TwilioConfig => ({
  accountSid: (import.meta as any).env?.VITE_TWILIO_ACCOUNT_SID || '',
  authToken: (import.meta as any).env?.VITE_TWILIO_AUTH_TOKEN || '',
  phoneNumber: (import.meta as any).env?.VITE_TWILIO_PHONE_NUMBER || '',
  apiEndpoint: (import.meta as any).env?.VITE_TWILIO_API_ENDPOINT || '/api/send-sms',
});

// ============================================
// 💬 Messages SMS
// ============================================

const formatAmount = (amount: number, currency: string = 'MAD'): string => {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(amount);
};

export const generateReminderSMS = (invoice: Invoice, _client: Client): string => {
  const daysOverdue = Math.max(0, Math.floor(
    (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  if (daysOverdue > 0) {
    return `TRADE LINK: Retard ${daysOverdue}j - Facture #${invoice.id.slice(0, 8)} - ${formatAmount(invoice.total, invoice.currency)} due le ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}. Merci de régulariser.`;
  }

  return `TRADE LINK: Rappel - Facture #${invoice.id.slice(0, 8)} - ${formatAmount(invoice.total, invoice.currency)} due le ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}. Merci !`;
};

export const generatePaymentSMS = (invoice: Invoice): string => {
  return `TRADE LINK: Paiement confirmé - Facture #${invoice.id.slice(0, 8)} - ${formatAmount(invoice.total, invoice.currency)}. Merci !`;
};

export const generateOrderConfirmationSMS = (orderId: string, total: number, currency: string): string => {
  return `TRADE LINK: Commande #${orderId.slice(0, 8)} confirmée - Total: ${formatAmount(total, currency)}. Livraison prévue prochainement.`;
};

export const generateDeliverySMS = (orderId: string, status: string): string => {
  return `TRADE LINK: Commande #${orderId.slice(0, 8)} - ${status}. Merci de votre confiance !`;
};

export const generateGenericReminderSMS = (clientName: string, message: string): string => {
  return `TRADE LINK: ${clientName} - ${message}`;
};

// ============================================
// 📤 Envoi SMS
// ============================================

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoyer un SMS via l'API Twilio (nécessite un backend proxy)
 * En mode développement, simule l'envoi
 */
export const sendSMS = async (to: string, body: string): Promise<SMSResult> => {
  const config = getConfig();
  const cleanPhone = to.replace(/[^0-9+]/g, '');

  if (!cleanPhone) {
    return { success: false, error: 'Numéro de téléphone invalide' };
  }

  // Mode développement : simulation
  if (!config.accountSid || !config.authToken) {
    console.log(`[SMS Simulation] To: ${cleanPhone}\nMessage: ${body}`);
    return {
      success: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  // Mode production : appel API
  try {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: cleanPhone,
        from: config.phoneNumber,
        body,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageId: data.sid };
    } else {
      return { success: false, error: data.error || 'Erreur inconnue' };
    }
  } catch (error) {
    return { success: false, error: `Erreur réseau: ${error}` };
  }
};

/**
 * Envoyer une relance SMS pour une facture
 */
export const sendInvoiceReminderSMS = async (invoice: Invoice, client: Client): Promise<SMSResult> => {
  if (!client.phone) {
    return { success: false, error: 'Pas de numéro de téléphone pour ce client' };
  }

  const message = generateReminderSMS(invoice, client);
  return sendSMS(client.phone, message);
};

/**
 * Envoyer une confirmation de paiement par SMS
 */
export const sendPaymentConfirmationSMS = async (invoice: Invoice, client: Client): Promise<SMSResult> => {
  if (!client.phone) {
    return { success: false, error: 'Pas de numéro de téléphone pour ce client' };
  }

  const message = generatePaymentSMS(invoice);
  return sendSMS(client.phone, message);
};

// ============================================
// 📊 Historique SMS
// ============================================

export interface SMSLog {
  id: string;
  to: string;
  message: string;
  type: 'reminder' | 'confirmation' | 'order' | 'delivery';
  invoiceId?: string;
  orderId?: string;
  status: 'sent' | 'failed' | 'simulated';
  timestamp: string;
}

const SMS_LOG_KEY = 'sales_sms_log';

export const logSMS = (log: Omit<SMSLog, 'id' | 'timestamp'>): void => {
  const logs: SMSLog[] = JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
  logs.push({
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  });
  // Garder les 100 derniers logs
  if (logs.length > 100) logs.splice(0, logs.length - 100);
  localStorage.setItem(SMS_LOG_KEY, JSON.stringify(logs));
};

export const getSMSLogs = (): SMSLog[] => {
  return JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
};
