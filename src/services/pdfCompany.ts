/**
 * En-tête et pied de page entreprise pour les documents PDF.
 * Lit les informations saisies dans Paramètres → « Paramétrage de l'entreprise »
 * (companyStorage) et les affiche en haut de chaque document :
 * logo, raison sociale, adresse, ville, contacts, site web,
 * puis une ligne d'identifiants fiscaux (ICE, IF, RC, TP, CNSS).
 */
import jsPDF from 'jspdf';
import { companyStorage } from './storage';
import { CompanyInfo } from '../types';

const detectImageFormat = (dataUrl: string): 'PNG' | 'JPEG' | null => {
  const match = /^data:image\/(png|jpe?g)/i.exec(dataUrl);
  if (!match) return null;
  return match[1].toLowerCase() === 'png' ? 'PNG' : 'JPEG';
};

/**
 * Dessine le bloc entreprise en haut du document.
 * Le titre du document est toujours dessiné en (14, 25) ; les coordonnées
 * de l'entreprise occupent la zone à droite. Retourne la hauteur utilisée.
 */
export const drawCompanyHeader = (doc: jsPDF): number => {
  const company: CompanyInfo = companyStorage.get();
  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - 14;
  let y = 12;

  // Logo (base64 ou URL data:) — si présent et lisible, en haut à droite
  if (company.logo) {
    const format = detectImageFormat(company.logo);
    if (format) {
      try {
        doc.addImage(company.logo, format, pageWidth - 44, 8, 30, 15);
        y = 27;
      } catch { /* logo illisible : on l'ignore */ }
    }
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(company.name || 'TRADE LINK INTERNATIONALE', right, y, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  const lines: string[] = [];
  const addressLine = [company.address, company.city].filter(Boolean).join(' - ');
  if (addressLine) lines.push(addressLine);
  const contactLine = [company.phone, company.email].filter(Boolean).join(' · ');
  if (contactLine) lines.push(contactLine);
  if (company.website) lines.push(company.website);

  lines.forEach((line) => {
    y += 4.5;
    doc.text(line, right, y, { align: 'right' });
  });

  return y;
};

/** Ligne d'identifiants fiscaux (affichée seulement si au moins un identifiant est rempli). */
export const fiscalLine = (company: CompanyInfo): string => {
  const parts: string[] = [];
  if (company.ice) parts.push(`ICE : ${company.ice}`);
  if (company.ifFiscal) parts.push(`IF : ${company.ifFiscal}`);
  if (company.rc) parts.push(`RC : ${company.rc}`);
  if (company.taxePro) parts.push(`TP : ${company.taxePro}`);
  if (company.cnss) parts.push(`CNSS : ${company.cnss}`);
  return parts.join(' · ');
};

/** Pied de page : nom de l'entreprise + identifiants fiscaux, centré en bas de page. */
export const drawCompanyFooter = (doc: jsPDF): void => {
  const company: CompanyInfo = companyStorage.get();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);

  const fisc = fiscalLine(company);
  if (fisc) {
    doc.text(fisc, pageWidth / 2, pageHeight - 15, { align: 'center' });
  }
  doc.text(
    `Généré par ${company.name || 'TRADE LINK INTERNATIONALE'} - Application de Gestion des Ventes`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
};
