/**
 * Service de génération automatique de devis PDF
 * Utilise jsPDF pour créer des devis professionnels
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, Client, Currency } from '../types';

const formatCurrency = (amount: number, currency: Currency = 'MAD'): string => {
  const locale = currency === 'MAD' ? 'fr-MA' : currency === 'EUR' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

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
  doc.text('DEVIS', 14, 25);

  // Statut avec fond coloré
  const statusColors: Record<string, [number, number, number]> = {
    'brouillon': [107, 114, 128],
    'envoyé': [37, 99, 235],
    'accepté': [22, 163, 74],
    'refusé': [220, 38, 38],
    'expiré': [245, 158, 11],
  };
  const statusColor = statusColors[quote.status] || [100, 100, 100];

  // Badge statut
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 60, 15, 45, 10, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(quote.status.toUpperCase(), pageWidth - 37.5, 22, { align: 'center' });

  // ============================================
  // INFORMATIONS DEVIS
  // ============================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const infoStartY = 40;
  doc.text(`Devis #: ${quote.id.slice(0, 8).toUpperCase()}`, 14, infoStartY);
  doc.text(`Date: ${formatDate(quote.createdAt)}`, 14, infoStartY + 7);
  doc.text(`Valide jusqu'au: ${formatDate(quote.validUntil)}`, 14, infoStartY + 14);
  doc.text(`Devise: ${quote.currency}`, 14, infoStartY + 21);

  // ============================================
  // INFORMATIONS CLIENT
  // ============================================
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageWidth / 2 + 5, infoStartY - 5, pageWidth / 2 - 19, 40, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Client', pageWidth / 2 + 10, infoStartY + 2);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(quote.clientName, pageWidth / 2 + 10, infoStartY + 12);

  if (client) {
    if (client.email) doc.text(client.email, pageWidth / 2 + 10, infoStartY + 19);
    if (client.phone) doc.text(client.phone, pageWidth / 2 + 10, infoStartY + 26);
    if (client.address) doc.text(client.address, pageWidth / 2 + 10, infoStartY + 33);
  }

  // ============================================
  // LIGNE DE SÉPARATION
  // ============================================
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, infoStartY + 48, pageWidth - 14, infoStartY + 48);

  // ============================================
  // TABLEAU DES PRODUITS
  // ============================================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Détails', 14, infoStartY + 60);

  const tableData = quote.items.map(item => [
    item.productName,
    item.quantity.toString(),
    item.unit || 'pièce',
    formatCurrency(item.unitPrice, quote.currency),
    formatCurrency(item.total, quote.currency),
  ]);

  autoTable(doc, {
    startY: infoStartY + 65,
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
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  // ============================================
  // TOTAUX
  // ============================================
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  // Sous-total
  doc.text('Sous-total:', pageWidth - 80, finalY);
  doc.text(formatCurrency(quote.subtotal, quote.currency), pageWidth - 14, finalY, { align: 'right' });

  // TVA
  doc.text(`TVA (${quote.taxRate}%):`, pageWidth - 80, finalY + 8);
  doc.text(formatCurrency(quote.tax, quote.currency), pageWidth - 14, finalY + 8, { align: 'right' });

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.line(pageWidth - 90, finalY + 12, pageWidth - 14, finalY + 12);

  // TOTAL
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('TOTAL:', pageWidth - 80, finalY + 22);
  doc.text(formatCurrency(quote.total, quote.currency), pageWidth - 14, finalY + 22, { align: 'right' });

  // ============================================
  // CONDITIONS
  // ============================================
  const conditionsY = finalY + 35;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Conditions', 14, conditionsY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  const conditions = [
    `• Ce devis est valable jusqu'au ${formatDate(quote.validUntil)}`,
    `• Paiement à réception de facture`,
    `• TVA non comprise dans le prix hors Taxes`,
    `• Référence: ${quote.id.slice(0, 8).toUpperCase()}`,
  ];

  conditions.forEach((condition, index) => {
    doc.text(condition, 14, conditionsY + 8 + (index * 6));
  });

  // ============================================
  // NOTES
  // ============================================
  if (quote.notes) {
    const notesY = conditionsY + 35;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Notes', 14, notesY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);

    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - 28);
    doc.text(splitNotes, 14, notesY + 7);
  }

  // ============================================
  // PIED DE PAGE
  // ============================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(
    'Généré par VentePro - Application de Gestion des Ventes',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // ============================================
  // SAUVEGARDER
  // ============================================
  doc.save(`devis-${quote.id.slice(0, 8)}.pdf`);
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
  doc.text('RÉCAPITULATIF DES DEVIS', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Exporté le ${formatDate(new Date().toISOString())}`, 14, 28);

  // Stats
  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepté').length;
  const totalAmount = quotes.reduce((sum, q) => sum + q.total, 0);
  const acceptedAmount = quotes.filter(q => q.status === 'accepté').reduce((sum, q) => sum + q.total, 0);

  doc.text(`Total devis: ${totalQuotes} | Acceptés: ${acceptedQuotes} | Montant total: ${formatCurrency(totalAmount)}`, 14, 36);

  // Tableau
  const tableData = quotes.map(quote => [
    quote.id.slice(0, 8).toUpperCase(),
    quote.clientName,
    formatDate(quote.createdAt),
    formatDate(quote.validUntil),
    formatCurrency(quote.subtotal),
    `${quote.taxRate}%`,
    formatCurrency(quote.total),
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
    styles: { fontSize: 8, cellPadding: 4 },
  });

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Généré par VentePro | Total: ${formatCurrency(totalAmount)} | Acceptés: ${formatCurrency(acceptedAmount)}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  doc.save(`recapitulatif-devis-${formatDate(new Date().toISOString())}.pdf`);
};
