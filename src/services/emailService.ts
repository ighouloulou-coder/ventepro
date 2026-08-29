/**
 * Service d'envoi d'emails via SendGrid
 * Permet d'envoyer des relances, confirmations et devis par email
 */

import { Invoice, Client, Quote } from '../types';

// ============================================
// 📧 Configuration
// ============================================

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  apiEndpoint: string;
}

const getConfig = (): EmailConfig => ({
  apiKey: (import.meta as any).env?.VITE_SENDGRID_API_KEY || '',
  fromEmail: (import.meta as any).env?.VITE_SENDGRID_FROM_EMAIL || 'noreply@traidelink.com',
  fromName: (import.meta as any).env?.VITE_SENDGRID_FROM_NAME || 'TRADE LINK INTERNATIONALE',
  apiEndpoint: (import.meta as any).env?.VITE_EMAIL_API_ENDPOINT || '/api/send-email',
});

const formatAmount = (amount: number, currency: string = 'MAD'): string => {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

// ============================================
// 📝 Templates d'emails
// ============================================

const generateInvoiceReminderHTML = (invoice: Invoice, client: Client): string => {
  const daysOverdue = Math.max(0, Math.floor(
    (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const urgencyColor = daysOverdue > 15 ? '#dc2626' : daysOverdue > 7 ? '#f59e0b' : '#2563eb';
  const urgencyText = daysOverdue > 0 ? `${daysOverdue} jour${daysOverdue > 1 ? 's' : ''} de retard` : 'Échéance proche';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: ${urgencyColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📄 Rappel de Facture</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${urgencyText}</p>
        </div>
        <div style="padding: 30px;">
          <p>Bonjour <strong>${client.name}</strong>,</p>
          <p>Nous nous permettons de vous contacter concernant la facture suivante :</p>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Facture #</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${invoice.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Montant</td>
                <td style="padding: 8px 0; font-weight: 700; font-size: 18px; color: ${urgencyColor}; text-align: right;">${formatAmount(invoice.total, invoice.currency)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Date d'échéance</td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(invoice.dueDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Statut</td>
                <td style="padding: 8px 0; text-align: right;"><span style="background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${urgencyText}</span></td>
              </tr>
            </table>
          </div>
          
          <p>Merci de procéder au règlement dans les meilleurs délais.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${getConfig().fromEmail}?subject=Règlement facture ${invoice.id.slice(0, 8)}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Contacter nous
            </a>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Généré par <strong>TRADE LINK INTERNATIONALE</strong> - Application de Gestion des Ventes</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePaymentConfirmationHTML = (invoice: Invoice): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Paiement Confirmé</h1>
        </div>
        <div style="padding: 30px;">
          <p>Bonjour <strong>${invoice.clientName}</strong>,</p>
          <p>Nous confirmons la réception de votre paiement :</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Facture #</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${invoice.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Montant payé</td>
                <td style="padding: 8px 0; font-weight: 700; font-size: 18px; color: #16a34a; text-align: right;">${formatAmount(invoice.total, invoice.currency)}</td>
              </tr>
            </table>
          </div>
          
          <p>Merci pour votre confiance !</p>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">TRADE LINK INTERNATIONALE</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateQuoteEmailHTML = (quote: Quote, client: Client): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📄 Nouveau Devis</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Devis #${quote.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div style="padding: 30px;">
          <p>Bonjour <strong>${client.name}</strong>,</p>
          <p>Vous trouverez ci-joint votre devis :</p>
          
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Devis #</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${quote.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Montant Total</td>
                <td style="padding: 8px 0; font-weight: 700; font-size: 18px; color: #2563eb; text-align: right;">${formatAmount(quote.total, quote.currency)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Valide jusqu'au</td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(quote.validUntil)}</td>
              </tr>
            </table>
          </div>
          
          <p>Pour accepter ce devis, merci de nous contacter.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${getConfig().fromEmail}?subject=Acceptation devis ${quote.id.slice(0, 8)}" 
               style="background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              ✅ Accepter le devis
            </a>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">TRADE LINK INTERNATIONALE</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ============================================
// 📤 Envoi d'emails
// ============================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoyer un email via SendGrid (nécessite un backend proxy)
 * En mode développement, simule l'envoi
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<EmailResult> => {
  const config = getConfig();

  // Mode développement : simulation
  if (!config.apiKey) {
    console.log(`[Email Simulation]\nTo: ${to}\nSubject: ${subject}\n---`);
    return { success: true, messageId: `sim_${Date.now()}` };
  }

  // Mode production : appel API
  try {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        from: { email: config.fromEmail, name: config.fromName },
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, messageId: data.messageId };
    }
    return { success: false, error: data.error || 'Erreur inconnue' };
  } catch (error) {
    return { success: false, error: `Erreur réseau: ${error}` };
  }
};

/**
 * Envoyer une relance email pour une facture
 */
export const sendInvoiceReminderEmail = async (invoice: Invoice, client: Client): Promise<EmailResult> => {
  if (!client.email) {
    return { success: false, error: 'Pas d\'email pour ce client' };
  }

  const html = generateInvoiceReminderHTML(invoice, client);
  const daysOverdue = Math.max(0, Math.floor(
    (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const subject = daysOverdue > 0
    ? `⚠️ Retard ${daysOverdue}j - Facture #${invoice.id.slice(0, 8)}`
    : `📄 Rappel - Facture #${invoice.id.slice(0, 8)}`;

  return sendEmail(client.email, subject, html);
};

/**
 * Envoyer un devis par email
 */
export const sendQuoteByEmail = async (quote: Quote, client: Client): Promise<EmailResult> => {
  if (!client.email) {
    return { success: false, error: 'Pas d\'email pour ce client' };
  }

  const html = generateQuoteEmailHTML(quote, client);
  const subject = `📄 Devis #${quote.id.slice(0, 8).toUpperCase()} - ${formatAmount(quote.total, quote.currency)}`;

  return sendEmail(client.email, subject, html);
};

/**
 * Envoyer une confirmation de paiement par email
 */
export const sendPaymentConfirmationEmail = async (invoice: Invoice, client: Client): Promise<EmailResult> => {
  if (!client.email) {
    return { success: false, error: 'Pas d\'email pour ce client' };
  }

  const html = generatePaymentConfirmationHTML(invoice);
  const subject = `✅ Paiement confirmé - Facture #${invoice.id.slice(0, 8)}`;

  return sendEmail(client.email, subject, html);
};

// ============================================
// 📊 Historique emails
// ============================================

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: 'reminder' | 'quote' | 'confirmation' | 'delivery';
  invoiceId?: string;
  quoteId?: string;
  status: 'sent' | 'failed' | 'simulated';
  timestamp: string;
}

const EMAIL_LOG_KEY = 'sales_email_log';

export const logEmail = (log: Omit<EmailLog, 'id' | 'timestamp'>): void => {
  const logs: EmailLog[] = JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]');
  logs.push({ ...log, id: Date.now().toString(), timestamp: new Date().toISOString() });
  if (logs.length > 100) logs.splice(0, logs.length - 100);
  localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(logs));
};

export const getEmailLogs = (): EmailLog[] => {
  return JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]');
};
