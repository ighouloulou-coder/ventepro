/**
 * Utilitaires partagés pour les PDF téléchargeables (facture, BL, devis, récapitulatifs).
 *
 * Points d'attention (constatés sur les rendus du 05/11/2026) :
 * - `Intl.NumberFormat('fr-FR')` utilise U+202F (espace fine insécable) comme
 *   séparateur de milliers ; les polices standard de jsPDF (WinAnsi) ne
 *   connaissent pas ce caractère et l'affichent « / » (« 1 /620,00 MAD »).
 *   On le remplace par U+00A0 (espace insécable WinAnsi, rendu correct).
 * - Les numéros de documents doivent être affichés en entier (INV26001118,
 *   BL26001164) : l'id Firestore EST le numéro pour les factures/BL importés.
 * - Les noms de fichiers ne doivent jamais contenir de « / » (la date fr-FR
 *   « 05/11/2026 » en produisait) : date ISO AAAA-MM-JJ.
 */
import jsPDF from 'jspdf';

/** Remplace les espaces fines insécables par des espaces insécables WinAnsi. */
export const sanitizeForPdf = (s: string): string => s.replace(/[\u202F\u2009]/g, '\u00A0');

/** Montant monétaire, ex. « 1 620,00 MAD » (espaces insécables, rendu jsPDF OK). */
export const formatMoney = (amount: number, currency = 'MAD'): string => {
  const locale = currency === 'USD' ? 'en-US' : 'fr-FR';
  return sanitizeForPdf(
    new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount),
  );
};

/** Quantité en nombre simple, sans séparateur de milliers (jamais en devise),
 *  ex. « 3000 » — les groupes de chiffres coupent la colonne étroite « Qté ». */
export const formatQty = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(2);

/** Date d'affichage jj/mm/aaaa. */
export const formatDatePdf = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('fr-FR');

/** Date ISO AAAA-MM-JJ, pour les noms de fichiers. */
export const isoDate = (d: Date = new Date()): string => d.toISOString().slice(0, 10);

/** Numéro de document complet (l'id Firestore EST le numéro INV/BL). */
export const displayDocNumber = (id: string): string => id;

/**
 * Si la hauteur restante sur la page est insuffisante, saute une page.
 * Retourne le Y à utiliser.
 */
export const ensureRoom = (doc: jsPDF, y: number, needed: number, topY = 25): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return topY;
  }
  return y;
};

/**
 * Zone de signature en bas de document : deux cadres,
 * « Cachet et signature » (entreprise) et « Signature du client ».
 * Retourne le Y sous la zone.
 */
export const drawSignatureZone = (doc: jsPDF, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxH = 24;
  const boxW = (pageWidth - 28 - 10) / 2;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Cachet et signature', 14, y);
  doc.text('Signature du client', 14 + boxW + 10, y);

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.4);
  doc.rect(14, y + 3, boxW, boxH);
  doc.rect(14 + boxW + 10, y + 3, boxW, boxH);

  return y + 3 + boxH;
};
