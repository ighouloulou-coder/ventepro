/**
 * Service de génération automatique de devis PDF
 * Utilise jsPDF pour créer des devis professionnels
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, Client } from '../types';
import { drawCompanyHeader, drawCompanyFooter } from './pdfCompany';
import {
  formatMoney,
  formatDatePdf,
  isoDate,
  ensureRoom,
  drawSignatureZone,
} from './pdfUtils';

// Largeur utile A4 portrait : 210 - 2*14 = 182 mm
const MARGIN = 14;

/**
 * Générer un devis PDF professionnel
 */
export const generateQuotePDF = (quote: Quote, client?: Client): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ============================================
  // EN-TÊTE
  // ============================================
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('DEVIS', MARGIN, 25);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise, ou valeurs par défaut)
  // Retourne le bas du bloc : le badge statut se place EN DESSOUS, sans le recouvrir.
  const headerBottom = drawCompanyHeader(doc);

  // Statut avec fond coloré (sous l'en-tête entreprise, jamais dessus)
  const statusColors: Record<string, [number, number, number]> = {
    'brouillon': [107, 114, 128],
    'envoyé': [37, 99, 235],
    'accepté': [22, 163, 74],
    'refusé': [220, 38, 38],
    'expiré': [245, 158, 11],
  };
  const statusColor = statusColors[quote.status] || [100, 100, 100];

  // Badge statut
  const badgeY = headerBottom + 4;
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 60, badgeY, 45, 9, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(quote.status.toUpperCase(), pageWidth - 37.5, badgeY + 6.5, { align: 'center' });

  // ============================================
  // INFORMATIONS DEVIS
  // ============================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const infoStartY = Math.max(40, headerBottom + 22);
  doc.text(`Devis #: ${quote.id}`, MARGIN, infoStartY);
  doc.text(`Date: ${formatDatePdf(quote.createdAt)}`, MARGIN, infoStartY + 7);
  doc.text(`Valide jusqu'au: ${formatDatePdf(quote.validUntil)}`, MARGIN, infoStartY + 14);
  doc.text(`Devise: ${quote.currency}`, MARGIN, infoStartY + 21);

  // ============================================
  // INFORMATIONS CLIENT (cadre ajusté au contenu réel)
  // ============================================
  const clientLines: string[] = [];
  if (client?.email) clientLines.push(client.email);
  if (client?.phone) clientLines.push(client.phone);
  if (client?.address) clientLines.push(client.address);
  const boxH = 18 + Math.max(0, clientLines.length - 1) * 7 + 6;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageWidth / 2 + 5, infoStartY - 5, pageWidth / 2 - 19, boxH, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Client', pageWidth / 2 + 10, infoStartY + 2);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(quote.clientName, pageWidth / 2 + 10, infoStartY + 12);

  clientLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2 + 10, infoStartY + 19 + i * 7);
  });

  // ============================================
  // LIGNE DE SÉPARATION
  // ============================================
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, infoStartY + 40, pageWidth - MARGIN, infoStartY + 40);

  // ============================================
  // TABLEAU DES PRODUITS
  // ============================================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Détails', MARGIN, infoStartY + 50);

  const tableData = quote.items.map(item => [
    item.productName,
    item.quantity.toString(),
    item.unit || 'pièce',
    formatMoney(item.unitPrice, quote.currency),
    formatMoney(item.total, quote.currency),
  ]);

  autoTable(doc, {
    startY: infoStartY + 55,
    head: [['Produit', 'Qté', 'Unité', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      // Produit en « auto » : seule colonne redimensionnable, elle absorbe
      // l'écart de largeur (sinon autotable signale « could not fit page »)
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 38, halign: 'right' },
      4: { cellWidth: 38, halign: 'right' },
    },
  });

  // ============================================
  // TOTAUX (avec garde de place : jamais coupés hors page)
  // ============================================
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  finalY = ensureRoom(doc, finalY, 30);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  // Sous-total
  doc.text('Sous-total:', pageWidth - 80, finalY);
  doc.text(formatMoney(quote.subtotal, quote.currency), pageWidth - MARGIN, finalY, { align: 'right' });

  // TVA
  doc.text(`TVA (${quote.taxRate}%):`, pageWidth - 80, finalY + 8);
  doc.text(formatMoney(quote.tax, quote.currency), pageWidth - MARGIN, finalY + 8, { align: 'right' });

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.line(pageWidth - 90, finalY + 12, pageWidth - MARGIN, finalY + 12);

  // TOTAL
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('TOTAL :', pageWidth - 80, finalY + 22);
  doc.text(formatMoney(quote.total, quote.currency), pageWidth - MARGIN, finalY + 22, { align: 'right' });

  // ============================================
  // CONDITIONS
  // ============================================
  let conditionsY = ensureRoom(doc, finalY + 28, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Conditions', MARGIN, conditionsY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  const conditions = [
    `• Ce devis est valable jusqu'au ${formatDatePdf(quote.validUntil)}`,
    `• Paiement à réception de facture`,
    `• TVA non comprise dans le prix hors Taxes`,
    `• Référence: ${quote.id}`,
  ];

  conditions.forEach((condition, index) => {
    doc.text(condition, MARGIN, conditionsY + 8 + (index * 6));
  });

  let endY = conditionsY + 8 + conditions.length * 6;

  // ============================================
  // NOTES
  // ============================================
  if (quote.notes) {
    endY = ensureRoom(doc, endY + 8, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Notes', MARGIN, endY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);

    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - 28);
    doc.text(splitNotes, MARGIN, endY + 7);
    endY += 7 + splitNotes.length * 5;
  }

  // ============================================
  // ZONE CACHET ET SIGNATURE
  // ============================================
  endY = ensureRoom(doc, endY + 8, 38);
  drawSignatureZone(doc, endY);

  // ============================================
  // PIED DE PAGE (entreprise + siège + identifiants fiscaux)
  // ============================================
  drawCompanyFooter(doc);

  // ============================================
  // SAUVEGARDER — numéro complet
  // ============================================
  doc.save(`devis-${quote.id}.pdf`);
};

/**
 * Générer un récapitulatif de tous les devis en PDF
 */
export const generateAllQuotesPDF = (quotes: Quote[]): void => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('RÉCAPITULATIF DES DEVIS', MARGIN, 20);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise, ou valeurs par défaut)
  drawCompanyHeader(doc);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Exporté le ${formatDatePdf(new Date().toISOString())}`, MARGIN, 28);

  // Stats
  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepté').length;
  const totalAmount = quotes.reduce((sum, q) => sum + q.total, 0);
  const acceptedAmount = quotes.filter(q => q.status === 'accepté').reduce((sum, q) => sum + q.total, 0);

  doc.text(`Total devis: ${totalQuotes} | Acceptés: ${acceptedQuotes} | Montant total: ${formatMoney(totalAmount)}`, MARGIN, 36);

  // Tableau — numéros de devis COMPLETS
  const tableData = quotes.map(quote => [
    quote.id,
    quote.clientName,
    formatDatePdf(quote.createdAt),
    formatDatePdf(quote.validUntil),
    formatMoney(quote.subtotal),
    `${quote.taxRate}%`,
    formatMoney(quote.total),
    quote.currency,
    quote.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['#Devis', 'Client', 'Créé le', 'Validité', 'Sous-total', 'TVA', 'Total', 'Devise', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 24 },
      3: { cellWidth: 24 },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 34, halign: 'right' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 22 },
    },
  });

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Généré par TRADE LINK INTERNATIONALE | Total: ${formatMoney(totalAmount)} | Acceptés: ${formatMoney(acceptedAmount)}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Nom de fichier sans « / » (date ISO)
  doc.save(`recapitulatif-devis-${isoDate()}.pdf`);
};
