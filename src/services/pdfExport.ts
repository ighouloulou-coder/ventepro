import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, DeliveryNote } from '../types';
import { drawCompanyHeader, drawCompanyFooter } from './pdfCompany';
import {
  formatMoney,
  formatQty,
  formatDatePdf,
  isoDate,
  ensureRoom,
  drawSignatureZone,
} from './pdfUtils';

// Largeur utile A4 portrait : 210 - 2*14 = 182 mm
const MARGIN = 14;

/** Extrait un n° de BL (BL + chiffres) des notes, ex. « BL26001164 ». */
const extractBlNumber = (notes?: string): string | null => {
  if (!notes) return null;
  const m = notes.match(/BL\d{4,}/);
  return m ? m[0] : null;
};

/** Notes sans le n° de BL (déjà affiché dans le bloc d'infos). */
const notesWithoutBl = (notes?: string): string => {
  if (!notes) return '';
  return notes.replace(/BL\d{4,}/, '').replace(/^\s*[·,;-]\s*/, '').trim();
};

export const exportInvoiceToPDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('FACTURE', MARGIN, 25);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise, ou valeurs par défaut)
  drawCompanyHeader(doc);

  // Informations de la facture — numéro COMPLET (l'id EST le numéro INV2600xxxx)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  let y = 35;
  doc.text(`Facture #: ${invoice.id}`, MARGIN, y);
  y += 7;
  doc.text(`Date: ${formatDatePdf(invoice.createdAt)}`, MARGIN, y);
  y += 7;
  doc.text(`Échéance: ${formatDatePdf(invoice.dueDate)}`, MARGIN, y);
  y += 7;

  const blNumber = extractBlNumber(invoice.notes);
  const infos: string[] = [];
  if (blNumber) infos.push(`Bon de livraison : ${blNumber}`);
  if (invoice.paymentTerms) infos.push(`Paiement : ${invoice.paymentTerms} jours nets`);
  infos.push(`TVA : ${invoice.taxRate} %`);
  if (infos.length) {
    doc.text(infos.join('  ·  '), MARGIN, y);
    y += 7;
  }

  // Statut avec couleur
  const statusColors: Record<string, [number, number, number]> = {
    'payée': [22, 163, 74],
    'envoyée': [37, 99, 235],
    'brouillon': [107, 114, 128],
    'annulée': [220, 38, 38],
  };
  const statusColor = statusColors[invoice.status] || [100, 100, 100];
  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`Statut: ${invoice.status.toUpperCase()}`, MARGIN, y);
  y += 7;

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 10;

  // Informations client
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Client', MARGIN, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(invoice.clientName, MARGIN, y);
  y += 10;

  // Tableau des produits
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Détails', MARGIN, y);
  y += 5;

  const tableData = invoice.items.map(item => [
    item.productName,
    formatQty(item.quantity),
    formatMoney(item.unitPrice),
    formatMoney(item.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
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
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 34, halign: 'right' },
      3: { cellWidth: 36, halign: 'right' },
    },
  });

  // Totaux (avec garde de place : jamais coupés hors page)
  let totalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  totalY = ensureRoom(doc, totalY, 30);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  doc.text('Sous-total:', pageWidth - 85, totalY);
  doc.text(formatMoney(invoice.subtotal), pageWidth - MARGIN, totalY, { align: 'right' });

  doc.text(`TVA (${invoice.taxRate}%):`, pageWidth - 85, totalY + 8);
  doc.text(formatMoney(invoice.tax), pageWidth - MARGIN, totalY + 8, { align: 'right' });

  // Ligne de séparation totaux
  doc.setDrawColor(229, 231, 235);
  doc.line(pageWidth - 95, totalY + 12, pageWidth - MARGIN, totalY + 12);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('TOTAL :', pageWidth - 85, totalY + 22);
  doc.text(formatMoney(invoice.total), pageWidth - MARGIN, totalY + 22, { align: 'right' });

  let endY = totalY + 22;

  // Notes (ex. « Lignes non détaillées — total vérifié »), sans le n° de BL déjà affiché
  const notes = notesWithoutBl(invoice.notes);
  if (notes) {
    endY += 12;
    endY = ensureRoom(doc, endY, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * MARGIN);
    doc.text(splitNotes, MARGIN, endY);
    endY += splitNotes.length * 5;
  }

  // Zone cachet et signature
  endY += 8;
  endY = ensureRoom(doc, endY, 38);
  drawSignatureZone(doc, endY);

  // Pied de page (entreprise + siège + identifiants fiscaux)
  drawCompanyFooter(doc);

  // Sauvegarder — numéro complet (deux factures ne s'écrasent plus)
  doc.save(`facture-${invoice.id}.pdf`);
};

export const exportDeliveryToPDF = (delivery: DeliveryNote) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('BON DE LIVRAISON', MARGIN, 25);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise, ou valeurs par défaut)
  drawCompanyHeader(doc);

  // Informations du bon — numéro COMPLET (l'id EST le numéro BL2600xxxx)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  let y = 35;
  doc.text(`Bon #: ${delivery.id}`, MARGIN, y);
  y += 7;
  doc.text(`Client: ${delivery.clientName}`, MARGIN, y);
  y += 7;
  doc.text(`Date: ${formatDatePdf(delivery.deliveryDate)}`, MARGIN, y);
  y += 7;
  if (delivery.deliveryAddress) {
    doc.text(`Adresse de livraison: ${delivery.deliveryAddress}`, MARGIN, y);
    y += 7;
  }
  const linkedInvoice = delivery.transferredToInvoice || extractBlNumber(delivery.notes);
  if (linkedInvoice) {
    doc.text(`Facture liée: ${linkedInvoice}`, MARGIN, y);
    y += 7;
  }
  doc.text(`Statut: ${delivery.status.replace('_', ' ')}`, MARGIN, y);
  y += 7;

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 10;

  // Tableau des produits (titre décalé du tableau : plus de chevauchement)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Articles', MARGIN, y);
  y += 6;

  const tableData = delivery.items.map(item => [
    item.productName,
    formatQty(item.quantity),
    formatQty(item.delivered > 0 ? item.delivered : item.quantity), // qté livrée (nombre, pas une devise)
    item.unit,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Produit', 'Qté', 'Qté livrée', 'Unité']],
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
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
    },
  });

  // Totaux
  const totalExpected = delivery.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalDelivered = delivery.items.reduce((sum, item) => sum + item.delivered, 0);
  let totalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  totalY = ensureRoom(doc, totalY, 30);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  doc.text('Total attendu:', pageWidth - 85, totalY);
  doc.text(formatQty(totalExpected), pageWidth - MARGIN, totalY, { align: 'right' });

  doc.text('Total livré:', pageWidth - 85, totalY + 8);
  doc.text(formatQty(totalDelivered), pageWidth - MARGIN, totalY + 8, { align: 'right' });

  // Ligne de séparation totaux
  doc.setDrawColor(229, 231, 235);
  doc.line(pageWidth - 95, totalY + 12, pageWidth - MARGIN, totalY + 12);

  let endY = totalY + 12;

  // Transport (chauffeur / matricule) — affichés seulement s'ils existent
  const transport: string[] = [];
  if (delivery.driverName) transport.push(`Chauffeur : ${delivery.driverName}`);
  if (delivery.vehiclePlate) transport.push(`Matricule : ${delivery.vehiclePlate}`);
  if (transport.length) {
    endY += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(transport.join('  ·  '), MARGIN, endY);
  }

  // Zone cachet et signature
  endY += 8;
  endY = ensureRoom(doc, endY, 38);
  drawSignatureZone(doc, endY);

  // Pied de page (entreprise + siège + identifiants fiscaux)
  drawCompanyFooter(doc);

  // Sauvegarder — numéro complet
  doc.save(`bon-livraison-${delivery.id}.pdf`);
};

export const exportAllInvoicesToPDF = (invoices: Invoice[]) => {
  const doc = new jsPDF('landscape');

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('RÉCAPITULATIF DES FACTURES', MARGIN, 20);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise, ou valeurs par défaut)
  drawCompanyHeader(doc);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Exporté le ${formatDatePdf(new Date().toISOString())}`, MARGIN, 28);

  // Statistiques rapides
  const totalVentes = invoices.filter(i => i.status === 'payée').reduce((sum, i) => sum + i.total, 0);
  const facturesEnAttente = invoices.filter(i => i.status === 'envoyée').length;
  const facturesPayees = invoices.filter(i => i.status === 'payée').length;

  doc.setFontSize(10);
  doc.text(`Total ventes payées: ${formatMoney(totalVentes)}`, MARGIN, 36);
  doc.text(`Factures payées: ${facturesPayees}`, MARGIN, 42);
  doc.text(`Factures en attente: ${facturesEnAttente}`, MARGIN, 48);

  // Tableau — numéros de facture COMPLETS
  const tableData = invoices.map(invoice => [
    invoice.id,
    invoice.clientName,
    formatDatePdf(invoice.createdAt),
    formatMoney(invoice.subtotal),
    `${invoice.taxRate}%`,
    formatMoney(invoice.total),
    invoice.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['#Facture', 'Client', 'Date', 'Sous-total', 'TVA', 'Total', 'Statut']],
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
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26 },
      3: { cellWidth: 34, halign: 'right' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 36, halign: 'right' },
      6: { cellWidth: 26 },
    },
  });

  // Pied de page (entreprise + siège + identifiants fiscaux)
  drawCompanyFooter(doc);

  // Nom de fichier sans « / » (date ISO)
  doc.save(`recapitulatif-factures-${isoDate()}.pdf`);
};
