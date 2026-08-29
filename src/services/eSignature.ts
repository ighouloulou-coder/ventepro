/**
 * Service de signatures électroniques pour les devis
 * Permet aux clients de signer électroniquement leurs devis
 */

import { Quote } from '../types';

// ============================================
// ✍️ Types
// ============================================

export interface Signature {
  id: string;
  quoteId: string;
  signerName: string;
  signerEmail: string;
  signerPhone: string;
  signatureData: string; // Base64 de l'image de signature
  ipAddress: string;
  timestamp: string;
  location?: string;
  notes?: string;
}

export interface SignatureRequest {
  quoteId: string;
  clientEmail: string;
  clientName: string;
  message?: string;
}

// ============================================
// 🗄️ Stockage
// ============================================

const SIGNATURES_KEY = 'sales_signatures';

export const saveSignature = (signature: Signature): void => {
  const signatures: Signature[] = JSON.parse(localStorage.getItem(SIGNATURES_KEY) || '[]');
  signatures.push(signature);
  localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures));
};

export const getSignatureByQuote = (quoteId: string): Signature | undefined => {
  const signatures: Signature[] = JSON.parse(localStorage.getItem(SIGNATURES_KEY) || '[]');
  return signatures.find(s => s.quoteId === quoteId);
};

export const getAllSignatures = (): Signature[] => {
  return JSON.parse(localStorage.getItem(SIGNATURES_KEY) || '[]');
};

export const deleteSignature = (id: string): boolean => {
  const signatures: Signature[] = JSON.parse(localStorage.getItem(SIGNATURES_KEY) || '[]');
  const filtered = signatures.filter(s => s.id !== id);
  if (filtered.length === signatures.length) return false;
  localStorage.setItem(SIGNATURES_KEY, JSON.stringify(filtered));
  return true;
};

// ============================================
// 📝 Génération du lien de signature
// ============================================

/**
 * Générer un lien de signature unique
 */
export const generateSignatureLink = (quoteId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/sign?quote=${quoteId}`;
};

/**
 * Générer le contenu HTML pour la page de signature
 */
export const generateSignaturePageHTML = (quote: Quote): string => {
  const items = quote.items.map(item =>
    `<tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb">${item.productName}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: quote.currency }).format(item.unitPrice)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: quote.currency }).format(item.total)}</td>
    </tr>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Signature Devis #${quote.id.slice(0, 8)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f9fafb; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f9fafb; padding: 10px; text-align: left; font-size: 0.8rem; text-transform: uppercase; color: #6b7280; }
        .total-row td { border-top: 2px solid #e5e7eb; font-size: 1.1rem; color: #2563eb; }
        .signature-area { margin-top: 30px; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; }
        .btn-sign { background: #16a34a; color: white; border: none; padding: 15px 40px; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; margin-top: 20px; }
        .btn-sign:hover { background: #15803d; }
        .btn-sign:disabled { background: #d1d5db; cursor: not-allowed; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Devis #${quote.id.slice(0, 8).toUpperCase()}</h1>
          <p style="opacity:0.9;margin-top:8px">Veuillez signer pour accepter ce devis</p>
        </div>
        <div class="content">
          <div style="display:flex;justify-content:space-between;margin-bottom:20px">
            <div>
              <p style="color:#6b7280;font-size:0.85rem">Client</p>
              <p style="font-weight:600">${quote.clientName}</p>
            </div>
            <div style="text-align:right">
              <p style="color:#6b7280;font-size:0.85rem">Date</p>
              <p style="font-weight:600">${new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <table>
            <thead><tr><th>Produit</th><th style="text-align:center">Qté</th><th style="text-align:right">Prix</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${items}</tbody>
            <tfoot>
              <tr><td colspan="3" style="padding:10px;text-align:right">Sous-total</td><td style="padding:10px;text-align:right">${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: quote.currency }).format(quote.subtotal)}</td></tr>
              <tr><td colspan="3" style="padding:10px;text-align:right">TVA (${quote.taxRate}%)</td><td style="padding:10px;text-align:right">${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: quote.currency }).format(quote.tax)}</td></tr>
              <tr class="total-row"><td colspan="3" style="padding:10px;text-align:right;font-weight:700">TOTAL</td><td style="padding:10px;text-align:right;font-weight:700">${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: quote.currency }).format(quote.total)}</td></tr>
            </tfoot>
          </table>
          <p style="color:#6b7280;margin-top:10px;font-size:0.85rem">Valide jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ============================================
// 📧 Demande de signature
// ============================================

/**
 * Envoyer une demande de signature par email
 */
export const sendSignatureRequest = async (
  request: SignatureRequest
): Promise<{ success: boolean; error?: string }> => {
  // En mode dev, on génère juste le lien
  const link = generateSignatureLink(request.quoteId);

  console.log(`[Signature Request] To: ${request.clientEmail}\nLink: ${link}`);

  return { success: true };
};
